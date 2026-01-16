
import React, { useState } from 'react';
import { BRDAudit, BRDAuditItem } from '../types';

interface BRDAuditPanelProps {
  audit: BRDAudit;
  isLoading: boolean;
  iterationCount: number;
  isVerified?: boolean;
  onKeep: () => void;
  onRefine: () => void;
}

const BRDAuditPanel: React.FC<BRDAuditPanelProps> = ({ 
  audit, 
  isLoading, 
  iterationCount,
  isVerified = false,
  onKeep, 
  onRefine 
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('summary');

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Improvement';
    return 'Requires Significant Changes';
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-2xl border-2 border-indigo-100 shadow-lg">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 rounded-full animate-spin border-t-indigo-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
          <h3 className="mt-6 text-lg font-bold text-indigo-900">AI Verification in Progress</h3>
          <p className="mt-2 text-sm text-indigo-600 text-center max-w-xs">
            Analyzing your BRD for completeness, clarity, and potential improvements...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-2xl border-2 border-indigo-100 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold">AI Verification Report</h3>
              <p className="text-indigo-200 text-sm">Iteration #{iterationCount}</p>
            </div>
          </div>
          <div className={`px-6 py-3 rounded-xl border-2 ${getScoreColor(audit.overallScore)}`}>
            <div className="text-center">
              <div className="text-3xl font-black">{audit.overallScore}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">{getScoreLabel(audit.overallScore)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="p-6 border-b border-indigo-100">
        <p className="text-slate-700 leading-relaxed">{audit.summary}</p>
      </div>

      {/* Pros and Cons Grid */}
      <div className="grid md:grid-cols-2 divide-x divide-indigo-100">
        {/* Pros */}
        <div className="p-6">
          <button 
            onClick={() => toggleSection('pros')}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-2">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="font-bold text-emerald-800">Strengths ({audit.pros.length})</h4>
            </div>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedSection === 'pros' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === 'pros' && (
            <ul className="space-y-3 animate-in slide-in-from-top-2 duration-200">
              {audit.pros.map((pro, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-700 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                  <span className="text-emerald-500 font-bold">+</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Cons */}
        <div className="p-6">
          <button 
            onClick={() => toggleSection('cons')}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-2">
              <div className="bg-rose-100 p-2 rounded-lg">
                <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h4 className="font-bold text-rose-800">Weaknesses ({audit.cons.length})</h4>
            </div>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedSection === 'cons' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === 'cons' && (
            <ul className="space-y-3 animate-in slide-in-from-top-2 duration-200">
              {audit.cons.map((con, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-700 bg-rose-50 p-3 rounded-lg border border-rose-100">
                  <span className="text-rose-500 font-bold">-</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Detailed Suggestions */}
      <div className="p-6 border-t border-indigo-100">
        <button 
          onClick={() => toggleSection('suggestions')}
          className="w-full flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-2">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h4 className="font-bold text-indigo-800">Improvement Suggestions ({audit.suggestions.length})</h4>
          </div>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedSection === 'suggestions' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSection === 'suggestions' && (
          <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
            {audit.suggestions.map((suggestion, i) => (
              <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded">
                        {suggestion.category}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getImpactBadge(suggestion.impact)}`}>
                        {suggestion.impact} impact
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">{suggestion.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Risks */}
      {audit.risks.length > 0 && (
        <div className="p-6 border-t border-indigo-100">
          <button 
            onClick={() => toggleSection('risks')}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-2">
              <div className="bg-amber-100 p-2 rounded-lg">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h4 className="font-bold text-amber-800">Potential Risks ({audit.risks.length})</h4>
            </div>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedSection === 'risks' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === 'risks' && (
            <ul className="space-y-2 animate-in slide-in-from-top-2 duration-200">
              {audit.risks.map((risk, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-700 bg-amber-50 p-3 rounded-lg border border-amber-100">
                  <span className="text-amber-500">⚠</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Recommendations */}
      <div className="p-6 border-t border-indigo-100">
        <button 
          onClick={() => toggleSection('recommendations')}
          className="w-full flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-2">
            <div className="bg-purple-100 p-2 rounded-lg">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h4 className="font-bold text-purple-800">Recommendations ({audit.recommendations.length})</h4>
          </div>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedSection === 'recommendations' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSection === 'recommendations' && (
          <ul className="space-y-2 animate-in slide-in-from-top-2 duration-200">
            {audit.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-700 bg-purple-50 p-3 rounded-lg border border-purple-100">
                <span className="text-purple-500 font-bold">{i + 1}.</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Action Buttons - Only show when not yet verified */}
      {!isVerified && (
        <div className="p-6 bg-gradient-to-r from-slate-50 to-indigo-50 border-t-2 border-indigo-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onRefine}
              className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-indigo-200 text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refine BRD</span>
              <span className="text-xs opacity-60">(Apply Suggestions)</span>
            </button>
            <button
              onClick={onKeep}
              className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Finalize & Submit</span>
              <span className="text-xs opacity-80">(Proceed to Approval)</span>
            </button>
          </div>
          <p className="mt-4 text-center text-xs text-slate-500">
            {audit.overallScore >= 80 
              ? "This BRD looks great! You can finalize it or continue refining."
              : audit.overallScore >= 60
              ? "Consider refining to address the identified weaknesses before finalizing."
              : "We recommend refining this BRD to address the significant issues identified."}
          </p>
        </div>
      )}

      {/* Verified state indicator */}
      {isVerified && (
        <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-t-2 border-emerald-100">
          <div className="flex items-center justify-center gap-3 text-emerald-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-bold">BRD Verified & Finalized</span>
          </div>
          <p className="mt-2 text-center text-xs text-emerald-600">
            Click "Submit for Approval" in the header to begin the stakeholder review process.
          </p>
        </div>
      )}
    </div>
  );
};

export default BRDAuditPanel;
