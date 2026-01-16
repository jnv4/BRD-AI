
import React, { useState, useEffect, useRef } from 'react';
import { BRD, BRDStatus, UserRole, BRDContent, BRDPriority, BRDCategory, AppUser, BRDAudit } from '../types';
import { refineFieldContent, auditBRD, refineBRDWithSuggestions } from '../services/geminiService';
import WorkflowTimeline from './WorkflowTimeline';
import ActionLog from './ActionLog';
import BRDAuditPanel from './BRDAuditPanel';
import html2pdf from 'html2pdf.js';

interface BRDEditorProps {
  brd: BRD;
  onUpdate: (content: BRDContent) => void;
  onUpdateBRD: (updates: Partial<BRD>) => void;
  onAction: (action: string, nextStatus: BRDStatus, comment?: string) => void;
  onRevise: () => void;
  currentUser: AppUser;
}

const BRDEditor: React.FC<BRDEditorProps> = ({ brd, onUpdate, onUpdateBRD, onAction, onRevise, currentUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState<BRDContent>(brd.content);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionComment, setRejectionComment] = useState("");
  const [fieldLoading, setFieldLoading] = useState<string | null>(null);
  const brdDocRef = useRef<HTMLDivElement>(null);

  // Sync editContent when brd.content changes (e.g., after AI refinement)
  useEffect(() => {
    setEditContent(brd.content);
  }, [brd.content]);
  
  // Verification/Audit state
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const iterationCount = (brd.verificationHistory?.length || 0) + 1;

  // Auto-trigger audit when BRD is in PENDING_VERIFICATION status and no audit exists
  useEffect(() => {
    if (brd.status === BRDStatus.PENDING_VERIFICATION && !brd.audit && !isAuditLoading) {
      handleGenerateAudit();
    }
  }, [brd.status, brd.audit]);

  const handleGenerateAudit = async () => {
    setIsAuditLoading(true);
    setAuditError(null);
    try {
      // For initial audit, pass iteration count (no previous audit)
      const audit = await auditBRD(brd.projectName, brd.content, undefined, iterationCount);
      onUpdateBRD({ audit });
    } catch (err) {
      setAuditError(err instanceof Error ? err.message : "Failed to generate audit");
    } finally {
      setIsAuditLoading(false);
    }
  };

  const handleKeepBRD = () => {
    // User is satisfied - finalize and move to approval workflow
    const history = brd.verificationHistory || [];
    onUpdateBRD({
      isVerified: true,
      status: BRDStatus.VERIFIED,
      verificationHistory: [
        ...history,
        {
          iteration: iterationCount,
          timestamp: Date.now(),
          action: 'kept',
          previousAudit: brd.audit
        }
      ]
    });
  };

  const handleRefineBRD = async () => {
    if (!brd.audit) return;
    
    const previousAudit = brd.audit; // Store reference to previous audit
    const newIterationCount = iterationCount + 1;
    
    setIsAuditLoading(true);
    setAuditError(null);
    try {
      // Generate refined content based on audit suggestions
      const refinedContent = await refineBRDWithSuggestions(
        brd.projectName,
        brd.content,
        previousAudit
      );

      // Save history and update content
      const history = brd.verificationHistory || [];
      onUpdateBRD({
        content: refinedContent,
        audit: undefined, // Clear old audit temporarily
        verificationHistory: [
          ...history,
          {
            iteration: iterationCount,
            timestamp: Date.now(),
            action: 'refined',
            previousAudit: previousAudit
          }
        ]
      });

      // Generate new audit for the refined content, passing previous audit for comparison
      const newAudit = await auditBRD(
        brd.projectName, 
        refinedContent, 
        previousAudit, 
        newIterationCount
      );
      onUpdateBRD({ audit: newAudit });
      
      // Update local edit content
      setEditContent(refinedContent);
    } catch (err) {
      setAuditError(err instanceof Error ? err.message : "Failed to refine BRD");
    } finally {
      setIsAuditLoading(false);
    }
  };

  const handleSubmitForApproval = () => {
    // Move from VERIFIED to BUSINESS_REVIEW
    onAction("Submitted for Approval", BRDStatus.BUSINESS_REVIEW);
  };

  const handleSave = () => {
    onUpdate(editContent);
    setIsEditing(false);
  };

  const handleDownloadPDF = () => {
    if (!brdDocRef.current) return;
    
    const element = brdDocRef.current;
    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: `${brd.projectName.replace(/[^a-zA-Z0-9]/g, '_')}_BRD_v${brd.version}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: { 
        unit: 'mm' as const, 
        format: 'a4' as const, 
        orientation: 'portrait' as const
      }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  const handleAIRefine = async (fieldName: string, type: 'text' | 'list' | 'stakeholders') => {
    setFieldLoading(fieldName);
    try {
      let currentVal: any;
      switch(fieldName) {
        case 'purpose': currentVal = editContent.purpose; break;
        case 'objectives': currentVal = editContent.objectives; break;
        case 'scopeIncluded': currentVal = editContent.scopeIncluded; break;
        case 'scopeExcluded': currentVal = editContent.scopeExcluded; break;
        case 'stakeholders': currentVal = editContent.stakeholders; break;
      }

      const refined = await refineFieldContent(brd.projectName, fieldName, currentVal, type);
      
      setEditContent(prev => ({
        ...prev,
        [fieldName]: refined
      }));
    } catch (err) {
      console.error("AI Refinement failed", err);
    } finally {
      setFieldLoading(null);
    }
  };

  const handleReject = () => {
    if (!rejectionComment) return;
    onAction("Rejected", BRDStatus.REJECTED, rejectionComment);
    setRejectionModalOpen(false);
    setRejectionComment("");
  };

  // STRICT WORKFLOW LOGIC: Only specific roles can approve specific statuses.
  // Note: DRAFT status now goes through AI verification first, not directly to approval
  const canApprove = (
    (brd.status === BRDStatus.BUSINESS_REVIEW && (currentUser.role === UserRole.BUSINESS || currentUser.role === UserRole.ADMIN)) ||
    (brd.status === BRDStatus.LEAD_PM_REVIEW && (currentUser.role === UserRole.PROJECT_MANAGER || currentUser.role === UserRole.TEAM_LEAD || currentUser.role === UserRole.ADMIN)) ||
    (brd.status === BRDStatus.CTO_APPROVAL && (currentUser.role === UserRole.CTO || currentUser.role === UserRole.ADMIN))
  );

  const nextStatus = (current: BRDStatus): BRDStatus => {
    switch (current) {
      case BRDStatus.DRAFT: return BRDStatus.PENDING_VERIFICATION;
      case BRDStatus.PENDING_VERIFICATION: return BRDStatus.VERIFIED;
      case BRDStatus.VERIFIED: return BRDStatus.BUSINESS_REVIEW;
      case BRDStatus.BUSINESS_REVIEW: return BRDStatus.LEAD_PM_REVIEW;
      case BRDStatus.LEAD_PM_REVIEW: return BRDStatus.CTO_APPROVAL;
      case BRDStatus.CTO_APPROVAL: return BRDStatus.APPROVED;
      default: return BRDStatus.APPROVED;
    }
  };

  const getStatusDisplay = (status: BRDStatus) => {
    switch(status) {
      case BRDStatus.REJECTED: return { label: 'REJECTED', color: 'bg-rose-500', next: 'Revision required' };
      case BRDStatus.APPROVED: return { label: 'APPROVED', color: 'bg-emerald-500', next: 'Workflow completed' };
      case BRDStatus.DRAFT: return { label: 'DRAFT', color: 'bg-indigo-500', next: 'Pending AI Verification' };
      case BRDStatus.PENDING_VERIFICATION: return { label: 'VERIFICATION', color: 'bg-purple-500', next: 'AI Audit in progress' };
      case BRDStatus.VERIFIED: return { label: 'VERIFIED', color: 'bg-teal-500', next: 'Ready for approval workflow' };
      case BRDStatus.BUSINESS_REVIEW: return { label: 'PENDING BUSINESS', color: 'bg-amber-500', next: 'Waiting for Business Lead' };
      case BRDStatus.LEAD_PM_REVIEW: return { label: 'PENDING PM', color: 'bg-amber-500', next: 'Waiting for PM review' };
      case BRDStatus.CTO_APPROVAL: return { label: 'PENDING CTO', color: 'bg-amber-500', next: 'Final approval stage' };
      default: return { label: status, color: 'bg-slate-500', next: '' };
    }
  };

  const statusInfo = getStatusDisplay(brd.status);
  const approvalLogs = brd.logs.filter(log => log.action.toLowerCase().includes('approved'));

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      {/* Dynamic Status Dashboard */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-4">
          <div className={`${statusInfo.color} p-4 rounded-xl text-white shadow-lg`}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">VERSION {brd.version}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">{brd.projectName}</h2>
            <p className="text-xs text-slate-500 font-medium">Currently: {statusInfo.next}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          {brd.status === BRDStatus.APPROVED && (
            <button 
              onClick={handleDownloadPDF}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </button>
          )}

          {/* Draft state - Start Verification or Skip */}
          {brd.status === BRDStatus.DRAFT && !isEditing && (
            <div className="flex gap-3">
              <button 
                onClick={() => onUpdateBRD({ status: BRDStatus.PENDING_VERIFICATION })}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                AI Verification
              </button>
              <button 
                onClick={() => {
                  onUpdateBRD({ isVerified: false });
                  onAction("Submitted for Approval (without audit)", BRDStatus.BUSINESS_REVIEW);
                }}
                className="bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
                Skip & Submit
              </button>
            </div>
          )}

          {/* Verified state - Submit for Approval */}
          {brd.status === BRDStatus.VERIFIED && (
            <button 
              onClick={handleSubmitForApproval}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Submit for Approval
            </button>
          )}

          {brd.status === BRDStatus.REJECTED ? (
            <button 
              onClick={onRevise}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-indigo-100 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Start Revision
            </button>
          ) : (
            <>
              {!isEditing && (brd.status !== BRDStatus.APPROVED) && (brd.status !== BRDStatus.PENDING_VERIFICATION) && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="bg-white border-2 border-slate-100 hover:border-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-bold transition-all"
                >
                  Edit Content
                </button>
              )}
              {isEditing && (
                <button 
                  onClick={handleSave}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md"
                >
                  Save Changes
                </button>
              )}
              {canApprove && !isEditing && (
                <div className="flex gap-3">
                  <button 
                    onClick={() => setRejectionModalOpen(true)}
                    className="bg-white border-2 border-rose-100 text-rose-600 hover:bg-rose-50 px-6 py-2.5 rounded-xl font-bold transition-all"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => onAction("Approved Phase", nextStatus(brd.status))}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md"
                  >
                    Approve
                  </button>
                </div>
              )}
              {!canApprove && !isEditing && brd.status !== BRDStatus.APPROVED && brd.status !== BRDStatus.REJECTED && brd.status !== BRDStatus.DRAFT && brd.status !== BRDStatus.PENDING_VERIFICATION && brd.status !== BRDStatus.VERIFIED && (
                <div className="flex items-center px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold italic border border-slate-200 cursor-help" title="Only the assigned stakeholder role can approve this phase. Switch user identity to proceed.">
                  Waiting for {statusInfo.label.replace('PENDING ', '')}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Rejection Alert */}
      {brd.status === BRDStatus.REJECTED && (
        <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-2xl flex gap-5 animate-in slide-in-from-top-4 duration-300 no-print">
          <div className="bg-rose-100 text-rose-600 p-3 rounded-xl h-fit">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h4 className="text-rose-800 font-bold text-lg mb-1">BRD Requires Changes</h4>
            <p className="text-rose-700 text-sm leading-relaxed font-medium">Feedback: "{brd.rejectionComment}"</p>
            <button onClick={onRevise} className="mt-3 text-rose-800 text-xs font-bold underline hover:no-underline">CREATE NEW VERSION NOW</button>
          </div>
        </div>
      )}

      {/* Progress Tracker */}
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 no-print">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-10 text-center">Visual Progress Tracker</h3>
        <WorkflowTimeline currentStatus={brd.status} />
      </div>

      {/* AI Verification Panel - Shows when BRD is pending verification */}
      {(brd.status === BRDStatus.PENDING_VERIFICATION || brd.status === BRDStatus.VERIFIED) && (
        <div className="no-print">
          {auditError && (
            <div className="bg-rose-50 border-2 border-rose-100 p-4 rounded-xl mb-4 flex items-center gap-3">
              <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-rose-700 text-sm font-medium">{auditError}</span>
              <button 
                onClick={handleGenerateAudit}
                className="ml-auto text-rose-600 text-xs font-bold hover:underline"
              >
                Retry
              </button>
            </div>
          )}
          
          {(brd.audit || isAuditLoading) && (
            <BRDAuditPanel
              audit={brd.audit!}
              isLoading={isAuditLoading}
              iterationCount={iterationCount}
              isVerified={brd.isVerified}
              onKeep={handleKeepBRD}
              onRefine={handleRefineBRD}
            />
          )}

          {/* Verification History */}
          {brd.verificationHistory && brd.verificationHistory.length > 0 && (
            <div className="mt-6 bg-white p-6 rounded-2xl border border-slate-200">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Verification History</h4>
              <div className="space-y-3">
                {brd.verificationHistory.map((entry, i) => (
                  <div key={i} className="flex items-center gap-4 text-sm">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                      entry.action === 'refined' ? 'bg-indigo-500' : 'bg-emerald-500'
                    }`}>
                      {entry.iteration}
                    </div>
                    <div>
                      <span className={`font-bold ${entry.action === 'refined' ? 'text-indigo-600' : 'text-emerald-600'}`}>
                        {entry.action === 'refined' ? 'Refined' : 'Finalized'}
                      </span>
                      <span className="text-slate-400 ml-2">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                      {entry.previousAudit && (
                        <span className="text-slate-500 ml-2">
                          (Score: {entry.previousAudit.overallScore}/100)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Verified Success Banner */}
      {brd.status === BRDStatus.VERIFIED && (
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border-2 border-teal-100 p-6 rounded-2xl flex gap-5 no-print">
          <div className="bg-teal-100 text-teal-600 p-3 rounded-xl h-fit">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-teal-800 font-bold text-lg mb-1">BRD Verified & Ready</h4>
            <p className="text-teal-700 text-sm leading-relaxed font-medium">
              This BRD has been verified through {iterationCount - 1} AI audit iteration(s). 
              Click "Submit for Approval" above to begin the stakeholder approval workflow.
            </p>
          </div>
        </div>
      )}

      {/* The BRD Document */}
      <div ref={brdDocRef} className="bg-white p-12 rounded-2xl shadow-lg border border-slate-100 space-y-12 min-h-[1000px] relative overflow-hidden brd-doc-container">
        {/* Document Header */}
        <div className="border-b-4 border-indigo-600 pb-8 relative z-10">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Business Requirements</h1>
              <p className="text-indigo-600 font-bold uppercase tracking-[0.2em] text-xs">Official Project Documentation</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Prepared By</p>
              <p className="text-sm font-bold text-slate-800">{brd.preparedBy}</p>
              <p className="text-xs text-slate-500">{brd.date}</p>
            </div>
          </div>
        </div>

        {/* Classification Section */}
        <Section title="Classification & Priority">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Project Priority</label>
              {isEditing ? (
                <select 
                  className="w-full p-3 border rounded-xl bg-slate-50 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                  value={editContent.priority}
                  onChange={(e) => setEditContent({...editContent, priority: e.target.value as BRDPriority})}
                >
                  <option value="Must To Have">Must To Have</option>
                  <option value="Good To Have">Good To Have</option>
                </select>
              ) : (
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-black text-xs uppercase ${
                  brd.content.priority === 'Must To Have' 
                    ? 'bg-rose-50 border-rose-100 text-rose-600' 
                    : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${brd.content.priority === 'Must To Have' ? 'bg-rose-500' : 'bg-indigo-500'}`} />
                  {brd.content.priority}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Primary Benefit Category</label>
              {isEditing ? (
                <select 
                  className="w-full p-3 border rounded-xl bg-slate-50 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                  value={editContent.category}
                  onChange={(e) => setEditContent({...editContent, category: e.target.value as BRDCategory})}
                >
                  <option value="Cost Saving">Cost Saving</option>
                  <option value="Man Days Saving">Man Days Saving</option>
                  <option value="Compliance">Compliance</option>
                </select>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 border-2 border-slate-200 font-bold text-xs text-slate-700 uppercase">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  {brd.content.category}
                </div>
              )}
            </div>
          </div>
        </Section>

        <Section 
          title="1. Purpose" 
          onAIRefine={isEditing ? () => handleAIRefine('purpose', 'text') : undefined}
          isLoading={fieldLoading === 'purpose'}
        >
          {isEditing ? (
            <textarea 
              className="w-full p-4 border rounded-xl min-h-[150px] focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 leading-relaxed text-sm"
              value={editContent.purpose}
              onChange={(e) => setEditContent({...editContent, purpose: e.target.value})}
              placeholder="Explain the 'Why' behind this project..."
            />
          ) : (
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">{brd.content.purpose}</p>
          )}
        </Section>

        <Section 
          title="2. Key Objectives"
          onAIRefine={isEditing ? () => handleAIRefine('objectives', 'list') : undefined}
          isLoading={fieldLoading === 'objectives'}
        >
          {isEditing ? (
            <div className="space-y-2">
              {editContent.objectives.map((obj, i) => (
                <div key={i} className="flex gap-2">
                  <input 
                    className="flex-1 p-3 border rounded-lg text-sm"
                    value={obj}
                    onChange={(e) => {
                      const newObjs = [...editContent.objectives];
                      newObjs[i] = e.target.value;
                      setEditContent({...editContent, objectives: newObjs});
                    }}
                  />
                  <button onClick={() => {
                    const newObjs = editContent.objectives.filter((_, idx) => idx !== i);
                    setEditContent({...editContent, objectives: newObjs});
                  }} className="text-rose-500 px-2 transition-transform hover:scale-125">✕</button>
                </div>
              ))}
              <button 
                onClick={() => setEditContent({...editContent, objectives: [...editContent.objectives, ""]})}
                className="text-[10px] text-indigo-600 font-black hover:bg-indigo-50 px-3 py-1 rounded-full transition-colors"
              >
                + ADD OBJECTIVE
              </button>
            </div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {brd.content.objectives.map((obj, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-indigo-600 font-black">0{i+1}</span>
                  {obj}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="3. Project Scope">
          <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">In Scope</h4>
                {isEditing && (
                  <button 
                    disabled={fieldLoading === 'scopeIncluded'}
                    onClick={() => handleAIRefine('scopeIncluded', 'list')}
                    className="text-[9px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    ✨ AUTO-FILL
                  </button>
                )}
              </div>
              {isEditing ? (
                <textarea 
                  className="w-full p-4 border rounded-xl text-sm min-h-[140px] focus:ring-2 focus:ring-emerald-500"
                  value={editContent.scopeIncluded.join('\n')}
                  onChange={(e) => setEditContent({...editContent, scopeIncluded: e.target.value.split('\n')})}
                  placeholder="What is included? (one per line)"
                />
              ) : (
                <ul className="space-y-2 text-xs">
                  {brd.content.scopeIncluded.map((s, i) => (
                    <li key={i} className="flex gap-2 text-slate-600">
                      <span className="text-emerald-500">✔</span> {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                <h4 className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Out of Scope</h4>
                {isEditing && (
                  <button 
                    disabled={fieldLoading === 'scopeExcluded'}
                    onClick={() => handleAIRefine('scopeExcluded', 'list')}
                    className="text-[9px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    ✨ AUTO-FILL
                  </button>
                )}
              </div>
              {isEditing ? (
                <textarea 
                  className="w-full p-4 border rounded-xl text-sm min-h-[140px] focus:ring-2 focus:ring-rose-500"
                  value={editContent.scopeExcluded.join('\n')}
                  onChange={(e) => setEditContent({...editContent, scopeExcluded: e.target.value.split('\n')})}
                  placeholder="What is excluded? (one per line)"
                />
              ) : (
                <ul className="space-y-2 text-xs">
                  {brd.content.scopeExcluded.map((s, i) => (
                    <li key={i} className="flex gap-2 text-slate-500">
                      <span className="text-rose-300">✖</span> {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Section>

        <Section 
          title="4. Stakeholders & Ownership"
          onAIRefine={isEditing ? () => handleAIRefine('stakeholders', 'stakeholders') : undefined}
          isLoading={fieldLoading === 'stakeholders'}
        >
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
                  <th className="text-left py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Primary Responsibility</th>
                  {isEditing && <th className="w-12 px-6 no-print"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(isEditing ? editContent.stakeholders : brd.content.stakeholders).map((s, i) => (
                  <tr key={i} className="group transition-colors hover:bg-indigo-50/20">
                    <td className="py-4 px-6">
                      {isEditing ? (
                        <input 
                          className="w-full p-2 border rounded text-xs focus:ring-1 focus:ring-indigo-500"
                          value={s.role}
                          onChange={(e) => {
                            const newS = [...editContent.stakeholders];
                            newS[i] = {...newS[i], role: e.target.value};
                            setEditContent({...editContent, stakeholders: newS});
                          }}
                        />
                      ) : (
                        <span className="text-sm font-bold text-slate-700">{s.role}</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {isEditing ? (
                         <input 
                          className="w-full p-2 border rounded text-xs focus:ring-1 focus:ring-indigo-500"
                          value={s.responsibility}
                          onChange={(e) => {
                            const newS = [...editContent.stakeholders];
                            newS[i] = {...newS[i], responsibility: e.target.value};
                            setEditContent({...editContent, stakeholders: newS});
                          }}
                        />
                      ) : (
                        <span className="text-xs text-slate-600">{s.responsibility}</span>
                      )}
                    </td>
                    {isEditing && (
                      <td className="py-4 px-6 text-center no-print">
                        <button 
                          onClick={() => {
                            const newS = editContent.stakeholders.filter((_, idx) => idx !== i);
                            setEditContent({...editContent, stakeholders: newS});
                          }}
                          className="text-rose-400 hover:text-rose-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {isEditing && (
            <button 
              onClick={() => setEditContent({...editContent, stakeholders: [...editContent.stakeholders, {role: "", responsibility: ""}]})}
              className="mt-4 text-[10px] font-black text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-full transition-colors no-print"
            >
              + ADD STAKEHOLDER
            </button>
          )}
        </Section>

        {/* Approval signatures for PDF */}
        {brd.status === BRDStatus.APPROVED && (
          <Section title="5. Official Approvals & Signatures">
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-8 border-t-2 border-slate-50 pt-8">
               {approvalLogs.map((log, idx) => (
                 <div key={idx} className="space-y-4">
                    <div className="flex justify-between items-end border-b border-slate-200 pb-1">
                       <span className="text-xs font-bold text-slate-400">SIGNATORY {idx + 1}</span>
                       <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Electronically Approved</span>
                    </div>
                    <div>
                       <p className="text-lg font-black text-slate-800 tracking-tight italic">{log.user}</p>
                       <p className="text-[10px] text-slate-400 font-bold uppercase">{log.action}</p>
                       <p className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}</p>
                    </div>
                 </div>
               ))}
            </div>
          </Section>
        )}
      </div>

      <div className="action-log-container no-print">
        <ActionLog logs={brd.logs} />
      </div>

      {/* Rejection Modal */}
      {rejectionModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 no-print">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-rose-100 p-2 rounded-lg text-rose-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800">Reject this Phase?</h3>
            </div>
            <p className="text-slate-500 text-sm mb-6">Please provide constructive feedback so the initiator can correct the requirements.</p>
            <textarea 
              autoFocus
              className="w-full p-4 border-2 border-slate-100 rounded-2xl h-32 mb-6 focus:border-rose-200 outline-none text-sm transition-all"
              placeholder="e.g. Stakeholders missing for DevOps phase..."
              value={rejectionComment}
              onChange={(e) => setRejectionComment(e.target.value)}
            />
            <div className="flex gap-4">
              <button onClick={() => setRejectionModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">Go Back</button>
              <button 
                disabled={!rejectionComment} 
                onClick={handleReject} 
                className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 disabled:bg-rose-200 disabled:cursor-not-allowed shadow-lg shadow-rose-100 transition-all"
              >
                Reject BRD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Section: React.FC<{
  title: string, 
  children: React.ReactNode, 
  onAIRefine?: () => void,
  isLoading?: boolean
}> = ({ title, children, onAIRefine, isLoading }) => (
  <section className="space-y-6">
    <div className="flex items-center justify-between border-b-2 border-slate-50 pb-2">
      <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
      {onAIRefine && (
        <button 
          onClick={onAIRefine}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm disabled:opacity-50 no-print"
        >
          {isLoading ? (
            <span className="animate-spin rounded-full h-3 w-3 border-2 border-indigo-600 border-t-transparent" />
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI REFINE
            </>
          )}
        </button>
      )}
    </div>
    <div className="pl-2">
      {children}
    </div>
  </section>
);

export default BRDEditor;
