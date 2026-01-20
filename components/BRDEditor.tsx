
import React, { useState, useEffect, useRef } from 'react';
import { BRD, BRDStatus, UserRole, BRDContent, BRDPriority, BRDCategory, AppUser, BRDAudit } from '../types';
import { refineFieldContent, auditBRD } from '../services/geminiService';
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
  onDelete: () => void;
  currentUser: AppUser;
}

const BRDEditor: React.FC<BRDEditorProps> = ({ brd, onUpdate, onUpdateBRD, onAction, onRevise, onDelete, currentUser }) => {
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
      const audit = await auditBRD(brd.projectName, brd.content);
      onUpdateBRD({ audit });
    } catch (err) {
      setAuditError(err instanceof Error ? err.message : "Failed to generate audit");
    } finally {
      setIsAuditLoading(false);
    }
  };

  const handleProceedAfterAudit = () => {
    // User wants to proceed - move to approval workflow
    onUpdateBRD({
      isVerified: true,
      status: BRDStatus.VERIFIED
    });
  };

  const handleDeleteBRD = () => {
    onDelete();
  };

  const handleSubmitForApproval = () => {
    // Move from VERIFIED to BUSINESS_REVIEW
    onAction("Submitted for Approval", BRDStatus.BUSINESS_REVIEW);
  };

  const handleSave = () => {
    onUpdate(editContent);
    // If BRD was verified, reset to draft since edits invalidate verification
    if (brd.status === BRDStatus.VERIFIED) {
      onUpdateBRD({ status: BRDStatus.DRAFT, isVerified: false, audit: undefined });
    }
    setIsEditing(false);
  };

  const handleDownloadPDF = () => {
    if (!brdDocRef.current) return;
    
    const element = brdDocRef.current;
    const opt = {
      margin: [8, 8, 8, 8] as [number, number, number, number],
      filename: `${brd.projectName.replace(/[^a-zA-Z0-9]/g, '_')}_BRD_v${brd.version}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.95 },
      html2canvas: { 
        scale: 1.5,
        useCORS: true,
        letterRendering: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: { 
        unit: 'mm' as const, 
        format: 'a4' as const, 
        orientation: 'portrait' as const
      },
      pagebreak: { mode: 'avoid-all' as const }
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

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 md:space-y-8 pb-16 sm:pb-24">
      {/* Dynamic Status Dashboard */}
      <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4 sm:gap-6 no-print">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
          <div className={`${statusInfo.color} p-2.5 sm:p-4 rounded-lg sm:rounded-xl text-white shadow-lg flex-shrink-0`}>
            <svg className="w-5 h-5 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
              <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[10px] font-bold text-white uppercase ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
              <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">v{brd.version}</span>
            </div>
            <h2 className="text-base sm:text-xl font-bold text-slate-800 tracking-tight truncate">{brd.projectName}</h2>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">Currently: {statusInfo.next}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
          {brd.status === BRDStatus.APPROVED && (
            <button 
              onClick={handleDownloadPDF}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold transition-all shadow-md flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none justify-center"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden xs:inline">Download</span> PDF
            </button>
          )}

          {/* Draft state - Start Verification or Skip */}
          {brd.status === BRDStatus.DRAFT && !isEditing && (
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              <button 
                onClick={() => onUpdateBRD({ status: BRDStatus.PENDING_VERIFICATION })}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold transition-all shadow-md flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none justify-center"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                AI Verify
              </button>
              <button 
                onClick={() => {
                  onUpdateBRD({ isVerified: false });
                  onAction("Submitted for Approval (without audit)", BRDStatus.BUSINESS_REVIEW);
                }}
                className="bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none justify-center"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
                Skip
              </button>
            </div>
          )}

          {/* Verified state - Submit for Approval */}
          {brd.status === BRDStatus.VERIFIED && (
            <button 
              onClick={handleSubmitForApproval}
              className="bg-teal-600 hover:bg-teal-700 text-white px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold transition-all shadow-md flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none justify-center"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Submit
            </button>
          )}

          {brd.status === BRDStatus.REJECTED ? (
            <button 
              onClick={onRevise}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold transition-all shadow-md hover:shadow-indigo-100 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none justify-center"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Revise
            </button>
          ) : (
            <>
              {!isEditing && (brd.status !== BRDStatus.APPROVED) && (brd.status !== BRDStatus.PENDING_VERIFICATION) && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="bg-white border-2 border-slate-100 hover:border-slate-200 text-slate-700 px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold transition-all text-xs sm:text-sm"
                >
                  Edit
                </button>
              )}
              {isEditing && (
                <button 
                  onClick={handleSave}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold transition-all shadow-md text-xs sm:text-sm"
                >
                  Save
                </button>
              )}
              {canApprove && !isEditing && (
                <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                  <button 
                    onClick={() => setRejectionModalOpen(true)}
                    className="bg-white border-2 border-rose-100 text-rose-600 hover:bg-rose-50 px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold transition-all text-xs sm:text-sm flex-1 sm:flex-none"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => onAction("Approved Phase", nextStatus(brd.status))}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold transition-all shadow-md text-xs sm:text-sm flex-1 sm:flex-none"
                  >
                    Approve
                  </button>
                </div>
              )}
              {!canApprove && !isEditing && brd.status !== BRDStatus.APPROVED && brd.status !== BRDStatus.REJECTED && brd.status !== BRDStatus.DRAFT && brd.status !== BRDStatus.PENDING_VERIFICATION && brd.status !== BRDStatus.VERIFIED && (
                <div className="flex items-center px-2 sm:px-4 py-1.5 sm:py-2 bg-slate-100 text-slate-400 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold italic border border-slate-200 cursor-help" title="Only the assigned stakeholder role can approve this phase. Switch user identity to proceed.">
                  Waiting for {statusInfo.label.replace('PENDING ', '')}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Rejection Alert */}
      {brd.status === BRDStatus.REJECTED && (
        <div className="bg-rose-50 border-2 border-rose-100 p-4 sm:p-6 rounded-xl sm:rounded-2xl flex gap-3 sm:gap-5 animate-in slide-in-from-top-4 duration-300 no-print">
          <div className="bg-rose-100 text-rose-600 p-2 sm:p-3 rounded-lg sm:rounded-xl h-fit flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h4 className="text-rose-800 font-bold text-base sm:text-lg mb-1">BRD Requires Changes</h4>
            <p className="text-rose-700 text-xs sm:text-sm leading-relaxed font-medium break-words">Feedback: "{brd.rejectionComment}"</p>
            <button onClick={onRevise} className="mt-2 sm:mt-3 text-rose-800 text-[10px] sm:text-xs font-bold underline hover:no-underline">CREATE NEW VERSION</button>
          </div>
        </div>
      )}

      {/* Progress Tracker */}
      <div className="bg-white p-4 sm:p-6 md:p-10 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 no-print overflow-hidden">
        <h3 className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 sm:mb-6 md:mb-10 text-center">Progress Tracker</h3>
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
          
          {(brd.audit || isAuditLoading) && brd.status === BRDStatus.PENDING_VERIFICATION && (
            <BRDAuditPanel
              audit={brd.audit!}
              isLoading={isAuditLoading}
              onDelete={handleDeleteBRD}
              onProceed={handleProceedAfterAudit}
            />
          )}
        </div>
      )}

      {/* Verified Success Banner */}
      {brd.status === BRDStatus.VERIFIED && (
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border-2 border-teal-100 p-4 sm:p-6 rounded-xl sm:rounded-2xl flex gap-3 sm:gap-5 no-print">
          <div className="bg-teal-100 text-teal-600 p-2 sm:p-3 rounded-lg sm:rounded-xl h-fit flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h4 className="text-teal-800 font-bold text-base sm:text-lg mb-1">BRD Verified & Ready</h4>
            <p className="text-teal-700 text-xs sm:text-sm leading-relaxed font-medium">
              Click "Submit" above to begin approval workflow.
            </p>
          </div>
        </div>
      )}

      {/* The BRD Document */}
      <div ref={brdDocRef} className="bg-white p-6 sm:p-10 rounded-xl shadow-lg border border-slate-200 min-h-[600px] relative brd-doc-container">
        {/* Document Title */}
        <div className="mb-6 text-center border-b-2 border-indigo-200 pb-4">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">{brd.projectName}</h1>
          <p className="text-sm text-indigo-600 font-semibold mt-1">BUSINESS REQUIREMENTS DOCUMENT</p>
        </div>

        {/* Document Info Bar */}
        <div className="mb-6 flex flex-wrap justify-between items-center text-xs bg-slate-50 px-4 py-2 rounded-lg border">
          <div className="flex gap-4">
            <span><b>Version:</b> {brd.version}.0</span>
            <span><b>Date:</b> {brd.date}</span>
            <span><b>Author:</b> {brd.preparedBy}</span>
          </div>
          <div className="flex gap-3">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              brd.content.priority === 'Must Have' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
            }`}>{brd.content.priority}</span>
            <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold uppercase">{brd.content.category}</span>
          </div>
        </div>

        {/* 1. Executive Summary */}
        <div className="mb-5">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-2 mb-3">1. Executive Summary</h2>
          {isEditing ? (
            <textarea
              className="w-full text-sm text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 rounded-lg p-3 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={editContent.executiveSummary}
              onChange={(e) => setEditContent({...editContent, executiveSummary: e.target.value})}
            />
          ) : (
            <p className="text-sm text-slate-700 leading-relaxed">{brd.content.executiveSummary}</p>
          )}
        </div>

        {/* 2. Problem Statement */}
        <div className="mb-5">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-2 mb-3">2. Problem Statement</h2>
          {isEditing ? (
            <textarea
              className="w-full text-sm text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 rounded-lg p-3 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={editContent.problemStatement}
              onChange={(e) => setEditContent({...editContent, problemStatement: e.target.value})}
            />
          ) : (
            <p className="text-sm text-slate-700 leading-relaxed">{brd.content.problemStatement}</p>
          )}
        </div>

        {/* 3. Proposed Solution */}
        <div className="mb-5">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-2 mb-3">3. Proposed Solution</h2>
          {isEditing ? (
            <textarea
              className="w-full text-sm text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 rounded-lg p-3 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={editContent.proposedSolution}
              onChange={(e) => setEditContent({...editContent, proposedSolution: e.target.value})}
            />
          ) : (
            <p className="text-sm text-slate-700 leading-relaxed">{brd.content.proposedSolution}</p>
          )}
        </div>

        {/* 4. Purpose */}
        <div className="mb-5">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-2 mb-3">4. Purpose</h2>
          {isEditing ? (
            <textarea
              className="w-full text-sm text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 rounded-lg p-3 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={editContent.purpose}
              onChange={(e) => setEditContent({...editContent, purpose: e.target.value})}
            />
          ) : (
            <p className="text-sm text-slate-700 leading-relaxed">{brd.content.purpose}</p>
          )}
        </div>

        {/* 5. Objectives */}
        <div className="mb-5">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-2 mb-3">5. Objectives</h2>
          {isEditing ? (
            <div className="space-y-2">
              {editContent.objectives.map((obj, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="bg-indigo-100 text-indigo-700 font-bold text-xs w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-2">{i+1}</span>
                  <input
                    className="flex-1 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={obj}
                    onChange={(e) => {
                      const newObjectives = [...editContent.objectives];
                      newObjectives[i] = e.target.value;
                      setEditContent({...editContent, objectives: newObjectives});
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <ul className="space-y-2">
              {brd.content.objectives.map((obj, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-start gap-3">
                  <span className="bg-indigo-100 text-indigo-700 font-bold text-xs w-5 h-5 rounded flex items-center justify-center flex-shrink-0">{i+1}</span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 6. Scope */}
        <div className="mb-5">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-2 mb-3">6. Scope</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-bold text-emerald-700 uppercase mb-2">In Scope</h4>
              {isEditing ? (
                <div className="space-y-1">
                  {editContent.scopeIncluded.map((s, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <span className="text-emerald-500">•</span>
                      <input
                        className="flex-1 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={s}
                        onChange={(e) => {
                          const newScope = [...editContent.scopeIncluded];
                          newScope[i] = e.target.value;
                          setEditContent({...editContent, scopeIncluded: newScope});
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="space-y-1">
                  {brd.content.scopeIncluded.map((s, i) => (
                    <li key={i} className="text-sm text-slate-700 flex gap-2">
                      <span className="text-emerald-500">•</span> {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Out of Scope</h4>
              {isEditing ? (
                <div className="space-y-1">
                  {editContent.scopeExcluded.map((s, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <span>•</span>
                      <input
                        className="flex-1 text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={s}
                        onChange={(e) => {
                          const newScope = [...editContent.scopeExcluded];
                          newScope[i] = e.target.value;
                          setEditContent({...editContent, scopeExcluded: newScope});
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="space-y-1">
                  {brd.content.scopeExcluded.map((s, i) => (
                    <li key={i} className="text-sm text-slate-500 flex gap-2">
                      <span>•</span> {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* 7. Key Requirements */}
        {(brd.content.keyRequirements?.length > 0 || isEditing) && (
          <div className="mb-5">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-2 mb-3">7. Key Requirements</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left py-2 px-3 text-xs font-bold text-slate-600 uppercase">Requirement</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-slate-600 uppercase">Description</th>
                </tr>
              </thead>
              <tbody>
                {isEditing ? (
                  editContent.keyRequirements?.map((req, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-2 px-3">
                        <input
                          className="w-full font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={req.title}
                          onChange={(e) => {
                            const newReqs = [...(editContent.keyRequirements || [])];
                            newReqs[i] = { ...newReqs[i], title: e.target.value };
                            setEditContent({...editContent, keyRequirements: newReqs});
                          }}
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          className="w-full text-slate-600 bg-slate-50 border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={req.description}
                          onChange={(e) => {
                            const newReqs = [...(editContent.keyRequirements || [])];
                            newReqs[i] = { ...newReqs[i], description: e.target.value };
                            setEditContent({...editContent, keyRequirements: newReqs});
                          }}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  brd.content.keyRequirements?.map((req, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-2 px-3 font-semibold text-slate-800">{req.title}</td>
                      <td className="py-2 px-3 text-slate-600">{req.description}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 8. Success Criteria */}
        {(brd.content.successCriteria?.length > 0 || isEditing) && (
          <div className="mb-5">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-2 mb-3">8. Success Criteria</h2>
            {isEditing ? (
              <div className="space-y-2">
                {editContent.successCriteria?.map((c, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <input
                      className="flex-1 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={c}
                      onChange={(e) => {
                        const newCriteria = [...(editContent.successCriteria || [])];
                        newCriteria[i] = e.target.value;
                        setEditContent({...editContent, successCriteria: newCriteria});
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-2">
                {brd.content.successCriteria?.map((c, i) => (
                  <li key={i} className="text-sm text-slate-700 flex gap-2">
                    <span className="text-emerald-600 font-bold">✓</span> {c}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 9. Stakeholders */}
        <div className="mb-5">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-2 mb-3">9. Stakeholders</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left py-2 px-3 text-xs font-bold text-slate-600 uppercase">Role</th>
                <th className="text-left py-2 px-3 text-xs font-bold text-slate-600 uppercase">Responsibility</th>
              </tr>
            </thead>
            <tbody>
              {isEditing ? (
                editContent.stakeholders.map((s, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2 px-3">
                      <input
                        className="w-full font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={s.role}
                        onChange={(e) => {
                          const newStakeholders = [...editContent.stakeholders];
                          newStakeholders[i] = { ...newStakeholders[i], role: e.target.value };
                          setEditContent({...editContent, stakeholders: newStakeholders});
                        }}
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        className="w-full text-slate-600 bg-slate-50 border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={s.responsibility}
                        onChange={(e) => {
                          const newStakeholders = [...editContent.stakeholders];
                          newStakeholders[i] = { ...newStakeholders[i], responsibility: e.target.value };
                          setEditContent({...editContent, stakeholders: newStakeholders});
                        }}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                brd.content.stakeholders.map((s, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2 px-3 font-semibold text-slate-800">{s.role}</td>
                    <td className="py-2 px-3 text-slate-600">{s.responsibility}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 10. Key Risks */}
        {(brd.content.keyRisks?.length > 0 || isEditing) && (
          <div className="mb-5">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-2 mb-3">10. Key Risks & Mitigation</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-amber-50">
                  <th className="text-left py-2 px-3 text-xs font-bold text-amber-700 uppercase">Risk</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-amber-700 uppercase">Mitigation Strategy</th>
                </tr>
              </thead>
              <tbody>
                {isEditing ? (
                  editContent.keyRisks?.map((r, i) => (
                    <tr key={i} className="border-b border-amber-100">
                      <td className="py-2 px-3">
                        <input
                          className="w-full font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={r.risk}
                          onChange={(e) => {
                            const newRisks = [...(editContent.keyRisks || [])];
                            newRisks[i] = { ...newRisks[i], risk: e.target.value };
                            setEditContent({...editContent, keyRisks: newRisks});
                          }}
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          className="w-full text-slate-600 bg-slate-50 border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={r.mitigation}
                          onChange={(e) => {
                            const newRisks = [...(editContent.keyRisks || [])];
                            newRisks[i] = { ...newRisks[i], mitigation: e.target.value };
                            setEditContent({...editContent, keyRisks: newRisks});
                          }}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  brd.content.keyRisks?.map((r, i) => (
                    <tr key={i} className="border-b border-amber-100">
                      <td className="py-2 px-3 font-semibold text-slate-800">{r.risk}</td>
                      <td className="py-2 px-3 text-slate-600">{r.mitigation}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 11. Timeline */}
        <div className="mb-5">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-2 mb-3">11. Estimated Timeline</h2>
          <p className="text-sm font-semibold text-indigo-700 bg-indigo-50 inline-block px-4 py-2 rounded">{brd.content.estimatedTimeline}</p>
        </div>
      </div>

      <div className="action-log-container no-print">
        <ActionLog logs={brd.logs} />
      </div>

      {/* Rejection Modal */}
      {rejectionModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 no-print">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full p-5 sm:p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="bg-rose-100 p-1.5 sm:p-2 rounded-lg text-rose-600">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800">Reject this Phase?</h3>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm mb-4 sm:mb-6">Please provide constructive feedback so the initiator can correct the requirements.</p>
            <textarea 
              autoFocus
              className="w-full p-3 sm:p-4 border-2 border-slate-100 rounded-xl sm:rounded-2xl h-24 sm:h-32 mb-4 sm:mb-6 focus:border-rose-200 outline-none text-xs sm:text-sm transition-all"
              placeholder="e.g. Stakeholders missing for DevOps phase..."
              value={rejectionComment}
              onChange={(e) => setRejectionComment(e.target.value)}
            />
            <div className="flex gap-2 sm:gap-4">
              <button onClick={() => setRejectionModalOpen(false)} className="flex-1 py-2.5 sm:py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-lg sm:rounded-xl transition-colors text-sm">Go Back</button>
              <button 
                disabled={!rejectionComment} 
                onClick={handleReject} 
                className="flex-1 py-2.5 sm:py-3 bg-rose-600 text-white font-bold rounded-lg sm:rounded-xl hover:bg-rose-700 disabled:bg-rose-200 disabled:cursor-not-allowed shadow-lg shadow-rose-100 transition-all text-sm"
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
  <section className="space-y-3 sm:space-y-4 md:space-y-6">
    <div className="flex items-center justify-between border-b-2 border-slate-50 pb-2 gap-2">
      <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-900 tracking-tight">{title}</h2>
      {onAIRefine && (
        <button 
          onClick={onAIRefine}
          disabled={isLoading}
          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-[9px] sm:text-[10px] font-black hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm disabled:opacity-50 no-print flex-shrink-0"
        >
          {isLoading ? (
            <span className="animate-spin rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 border-2 border-indigo-600 border-t-transparent" />
          ) : (
            <>
              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="hidden xs:inline">AI</span> REFINE
            </>
          )}
        </button>
      )}
    </div>
    <div className="pl-0 sm:pl-2">
      {children}
    </div>
  </section>
);

export default BRDEditor;
