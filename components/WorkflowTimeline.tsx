
import React from 'react';
import { BRDStatus } from '../types';

interface WorkflowTimelineProps {
  currentStatus: BRDStatus;
}

const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({ currentStatus }) => {
  const steps = [
    { key: BRDStatus.DRAFT, label: 'Draft', sub: 'Initiator', color: 'indigo' },
    { key: BRDStatus.PENDING_VERIFICATION, label: 'AI Verification', sub: 'AI Audit', color: 'purple' },
    { key: BRDStatus.VERIFIED, label: 'Verified', sub: 'Ready', color: 'teal' },
    { key: BRDStatus.BUSINESS_REVIEW, label: 'Business Review', sub: 'Business Team', color: 'amber' },
    { key: BRDStatus.LEAD_PM_REVIEW, label: 'PM & Lead', sub: 'PM / Lead', color: 'amber' },
    { key: BRDStatus.CTO_APPROVAL, label: 'CTO Approval', sub: 'CTO', color: 'amber' },
    { key: BRDStatus.APPROVED, label: 'Approved', sub: 'Completed', color: 'emerald' }
  ];

  const getStepIndex = (status: BRDStatus) => {
    if (status === BRDStatus.REJECTED) return -1;
    return steps.findIndex(s => s.key === status);
  };

  const currentIndex = getStepIndex(currentStatus);

  const getStepColor = (step: typeof steps[0], isCompleted: boolean, isActive: boolean) => {
    if (isCompleted) {
      return `bg-${step.color}-600 text-white shadow-lg shadow-${step.color}-200`;
    }
    if (isActive) {
      return `bg-white border-4 border-${step.color}-600 text-${step.color}-600 shadow-lg`;
    }
    return 'bg-white border-2 border-slate-200 text-slate-300';
  };

  return (
    <div className="relative flex justify-between overflow-x-auto pb-2 -mx-2 px-2">
      {/* Background Line */}
      <div className="absolute top-3 sm:top-4 md:top-5 left-0 w-full h-0.5 bg-slate-100 z-0"></div>
      
      {steps.map((step, idx) => {
        const isCompleted = idx < currentIndex || currentStatus === BRDStatus.APPROVED;
        const isActive = idx === currentIndex && currentStatus !== BRDStatus.REJECTED;
        const isVerificationStep = step.key === BRDStatus.PENDING_VERIFICATION || step.key === BRDStatus.VERIFIED;

        return (
          <div key={step.key} className="relative z-10 flex flex-col items-center flex-1 min-w-[50px] sm:min-w-[60px] md:min-w-[80px]">
            <div className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
              isCompleted 
                ? isVerificationStep 
                  ? step.key === BRDStatus.VERIFIED 
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-200'
                    : 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                  : step.key === BRDStatus.APPROVED
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                    : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                : isActive 
                  ? isVerificationStep
                    ? step.key === BRDStatus.VERIFIED
                      ? 'bg-white border-2 sm:border-4 border-teal-600 text-teal-600 shadow-lg'
                      : 'bg-white border-2 sm:border-4 border-purple-600 text-purple-600 shadow-lg'
                    : step.key === BRDStatus.APPROVED
                      ? 'bg-white border-2 sm:border-4 border-emerald-600 text-emerald-600 shadow-lg'
                      : 'bg-white border-2 sm:border-4 border-indigo-600 text-indigo-600 shadow-lg'
                  : 'bg-white border-2 border-slate-200 text-slate-300'
            }`}>
              {isCompleted ? (
                <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : isVerificationStep && isActive ? (
                <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              ) : (
                <span className="text-[9px] sm:text-[10px] md:text-xs font-bold">{idx + 1}</span>
              )}
            </div>
            <div className="mt-2 sm:mt-3 md:mt-4 text-center">
              <p className={`text-[7px] sm:text-[8px] md:text-[10px] font-bold uppercase tracking-wider sm:tracking-widest ${
                isActive 
                  ? isVerificationStep 
                    ? step.key === BRDStatus.VERIFIED ? 'text-teal-600' : 'text-purple-600'
                    : 'text-indigo-600' 
                  : 'text-slate-400'
              }`}>
                {step.label}
              </p>
              <p className="text-[7px] sm:text-[8px] md:text-[10px] text-slate-300 font-medium hidden sm:block">
                {step.sub}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WorkflowTimeline;
