
import React, { useState } from 'react';
import { BRD, BRDStatus } from '../types';
import { generateClarifyingQuestions } from '../services/geminiService';

interface BRDListProps {
  brds: BRD[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string, questions: string[], answers: string[], remarks?: string) => Promise<boolean>;
  isLoading: boolean;
}

type WizardStep = 'NAME' | 'QUESTIONS' | 'GENERATING';

const BRDList: React.FC<BRDListProps> = ({ brds, activeId, onSelect, onCreate, isLoading }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState<WizardStep>('NAME');
  const [newName, setNewName] = useState("");
  const [remarks, setRemarks] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isFetchingQuestions, setIsFetchingQuestions] = useState(false);

  const handleStartQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsFetchingQuestions(true);
    try {
      const q = await generateClarifyingQuestions(newName);
      setQuestions(q);
      setAnswers(new Array(q.length).fill(""));
      setStep('QUESTIONS');
    } catch (err) {
      console.error("Failed to get questions", err);
      // Use fallback questions if API fails
      const fallbackQuestions = [
        "What is the main thing you want this project to do at Indira IVF?",
        "Who are the people that will use this most often (patients, doctors, staff)?",
        "Which Indira IVF centers or departments will benefit from this?",
        "What specific problems are you trying to solve with this project, or what are your must-have requirements?"
      ];
      setQuestions(fallbackQuestions);
      setAnswers(new Array(fallbackQuestions.length).fill(""));
      setStep('QUESTIONS');
    } finally {
      setIsFetchingQuestions(false);
    }
  };

  const handleSubmitFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    const allAnswered = answers.every(a => a.trim().length > 0);
    if (!allAnswered) return;

    setStep('GENERATING');
    const success = await onCreate(newName, questions, answers, remarks.trim() || undefined);
    if (success) {
      resetForm();
    } else {
      setStep('QUESTIONS');
    }
  };

  const resetForm = () => {
    setIsCreating(false);
    setStep('NAME');
    setNewName("");
    setRemarks("");
    setQuestions([]);
    setAnswers([]);
  };

  const getStatusColor = (status: BRDStatus) => {
    switch (status) {
      case BRDStatus.APPROVED: return 'bg-emerald-100 text-emerald-700';
      case BRDStatus.REJECTED: return 'bg-rose-100 text-rose-700';
      case BRDStatus.DRAFT: return 'bg-slate-100 text-slate-700';
      case BRDStatus.PENDING_VERIFICATION: return 'bg-purple-100 text-purple-700';
      case BRDStatus.VERIFIED: return 'bg-teal-100 text-teal-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  const answeredCount = answers.filter(a => a.trim().length > 0).length;
  const isComplete = questions.length > 0 && answeredCount === questions.length;
  const progressPercentage = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  return (
    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
      {!isCreating && (
        <button 
          onClick={() => setIsCreating(true)}
          disabled={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md text-sm"
        >
          {isLoading ? (
            <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          )}
          New BRD
        </button>
      )}

      {isCreating && (
        <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 border-indigo-500 shadow-xl space-y-3 sm:space-y-4 animate-in zoom-in-95 duration-200">
          {step === 'NAME' && (
            <form onSubmit={handleStartQuestions} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Step 1: Project Identity</h3>
                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">START</span>
              </div>
              <div>
                <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">Project Name</label>
                <input 
                  autoFocus
                  required
                  disabled={isFetchingQuestions}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Sales Analytics Dashboard"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Custom Instructions</label>
                  <span className="text-[8px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full font-medium">OPTIONAL</span>
                </div>
                <textarea 
                  disabled={isFetchingQuestions}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-20"
                  placeholder="Add any specific requirements, preferences, or context to customize your BRD... (e.g., 'Focus on mobile-first design', 'Include integration with Salesforce', 'Target audience is healthcare professionals')"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
                <p className="text-[9px] text-slate-400 mt-1 italic">These instructions will be used to tailor the generated BRD to your specific needs.</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  type="submit"
                  disabled={isFetchingQuestions || !newName.trim()}
                  className="flex-1 bg-indigo-600 text-white text-sm py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isFetchingQuestions ? (
                    <>
                      <span className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                      Analyzing...
                    </>
                  ) : (
                    "Next: Define Scope"
                  )}
                </button>
                <button type="button" onClick={resetForm} className="px-4 text-slate-500 text-sm font-semibold">Cancel</button>
              </div>
            </form>
          )}

          {step === 'QUESTIONS' && (
            <form onSubmit={handleSubmitFinal} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 tracking-tight">Requirement Interview</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {answeredCount} / {questions.length} COMPLETE
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {questions.map((q, idx) => {
                  const isAnswered = answers[idx]?.trim().length > 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <label className="text-[11px] font-bold text-slate-600 block leading-tight">{q}</label>
                        {!isAnswered && <span className="text-[8px] font-black text-rose-500 uppercase whitespace-nowrap pt-0.5">Required</span>}
                      </div>
                      <textarea 
                        required
                        className={`w-full bg-slate-50 border transition-all rounded-lg px-3 py-2 text-sm h-24 resize-none focus:outline-none focus:ring-2 ${
                          isAnswered ? 'border-emerald-200 focus:ring-emerald-500' : 'border-slate-200 focus:ring-indigo-500'
                        }`}
                        placeholder="Please provide your answer here..."
                        value={answers[idx]}
                        onChange={(e) => {
                          const newAns = [...answers];
                          newAns[idx] = e.target.value;
                          setAnswers(newAns);
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3 pt-2 border-t mt-4">
                <button 
                  type="submit"
                  disabled={isLoading || !isComplete}
                  className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
                    isComplete 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Generating BRD...
                    </>
                  ) : (
                    <>
                      <svg className={`w-4 h-4 ${!isComplete && 'opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {isComplete ? "Generate Professional BRD" : "Complete All Answers to Proceed"}
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={() => setStep('NAME')} 
                  className="text-xs text-slate-500 font-bold hover:text-slate-800 transition-colors uppercase tracking-widest text-center"
                >
                  Go Back to Step 1
                </button>
              </div>
            </form>
          )}

          {step === 'GENERATING' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-black text-slate-800 text-lg">Architecting Document...</h4>
                <p className="text-xs text-slate-500 px-8 leading-relaxed italic">"Transforming your rough ideas into professional business requirements..."</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2 pt-2">
        <h2 className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Project Registry</h2>
        {brds.length === 0 && !isCreating && (
          <div className="p-6 sm:p-8 text-center bg-slate-50/50 rounded-xl sm:rounded-2xl border-2 border-dashed border-slate-100">
             <p className="text-[10px] sm:text-xs text-slate-400 font-medium">No projects found. Click "New BRD" to begin.</p>
          </div>
        )}
        {brds.map(brd => (
          <button
            key={brd.id}
            disabled={isLoading}
            onClick={() => onSelect(brd.id)}
            className={`w-full text-left p-3 sm:p-4 rounded-lg sm:rounded-xl transition-all border ${
              activeId === brd.id 
                ? 'bg-white border-indigo-200 shadow-md ring-1 ring-indigo-50' 
                : 'hover:bg-white hover:border-slate-200 border-transparent'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex justify-between items-start mb-1 gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <h3 className="font-bold text-slate-800 line-clamp-1 text-xs sm:text-sm">{brd.projectName}</h3>
                {brd.isVerified && (
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" title="AI Verified">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 bg-slate-100 px-1 sm:px-1.5 py-0.5 rounded flex-shrink-0">v{brd.version}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className={`text-[8px] sm:text-[9px] uppercase font-bold px-1.5 sm:px-2 py-0.5 rounded-md whitespace-nowrap ${getStatusColor(brd.status)}`}>
                  {brd.status}
                </span>
                {brd.audit && (
                  <span className={`text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                    (brd.audit.overallScore || brd.audit.businessValueScore) >= 75 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : (brd.audit.overallScore || brd.audit.businessValueScore) >= 50 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-rose-100 text-rose-700'
                  }`}>
                    {brd.audit.overallScore || brd.audit.businessValueScore}/100
                  </span>
                )}
              </div>
              <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium flex-shrink-0">
                {new Date(brd.lastModified).toLocaleDateString()}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BRDList;
