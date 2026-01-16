
import React, { useState } from 'react';
import { BRDAudit, MarketInsight } from '../types';

interface BRDAuditPanelProps {
  audit: BRDAudit;
  isLoading: boolean;
  onDelete: () => void;
  onProceed: () => void;
}

const BRDAuditPanel: React.FC<BRDAuditPanelProps> = ({ 
  audit, 
  isLoading, 
  onDelete, 
  onProceed 
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('verdict');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getVerdictStyle = (verdict: string) => {
    switch (verdict) {
      case 'strong_go':
        return { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50', border: 'border-emerald-200', label: 'STRONG GO', icon: '🚀' };
      case 'go_with_caution':
        return { bg: 'bg-amber-500', text: 'text-amber-700', light: 'bg-amber-50', border: 'border-amber-200', label: 'GO WITH CAUTION', icon: '⚠️' };
      case 'needs_work':
        return { bg: 'bg-orange-500', text: 'text-orange-700', light: 'bg-orange-50', border: 'border-orange-200', label: 'NEEDS WORK', icon: '🔧' };
      case 'no_go':
        return { bg: 'bg-rose-500', text: 'text-rose-700', light: 'bg-rose-50', border: 'border-rose-200', label: 'NO GO', icon: '🛑' };
      default:
        return { bg: 'bg-slate-500', text: 'text-slate-700', light: 'bg-slate-50', border: 'border-slate-200', label: 'PENDING', icon: '⏳' };
    }
  };

  const getMarketTimingStyle = (timing: string) => {
    switch (timing) {
      case 'excellent': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'good': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'fair': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'poor': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getInsightVerdictStyle = (verdict: string) => {
    switch (verdict) {
      case 'positive': return 'bg-emerald-100 text-emerald-700';
      case 'neutral': return 'bg-slate-100 text-slate-600';
      case 'negative': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-rose-600';
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-2xl border-2 border-indigo-100 shadow-lg">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-200 rounded-full animate-spin border-t-indigo-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">🧠</span>
            </div>
          </div>
          <h3 className="mt-6 text-xl font-bold text-indigo-900">Deep Business Analysis</h3>
          <p className="mt-2 text-sm text-indigo-600 text-center max-w-md">
            AI Pro model is analyzing market viability, business value, competitive landscape, and providing real insights...
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {['Market Analysis', 'ROI Estimation', 'Risk Assessment', 'Feasibility Check'].map((step, i) => (
              <span 
                key={step} 
                className="px-3 py-1 bg-white/80 rounded-full text-[10px] font-bold text-indigo-600 border border-indigo-100 animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              >
                {step}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const verdictStyle = getVerdictStyle(audit.overallVerdict);

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden">
      {/* Verdict Header */}
      <div className={`${verdictStyle.bg} p-8 text-white relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{verdictStyle.icon}</span>
              <div>
                <p className="text-white/80 text-sm font-medium mb-1">AI Business Analysis Verdict</p>
                <h2 className="text-3xl font-black tracking-tight">{verdictStyle.label}</h2>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl">
                <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider mb-1">Business Value</p>
                <p className="text-4xl font-black">{audit.businessValueScore}<span className="text-lg font-medium">/100</span></p>
              </div>
            </div>
          </div>
          <p className="mt-6 text-white/90 text-sm leading-relaxed max-w-3xl">{audit.verdictSummary}</p>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
        <div className="p-5 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Est. ROI</p>
          <p className="text-lg font-black text-slate-800">{audit.estimatedROI}</p>
        </div>
        <div className="p-5 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Time to Value</p>
          <p className="text-lg font-black text-slate-800">{audit.timeToValue}</p>
        </div>
        <div className="p-5 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Market Timing</p>
          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${getMarketTimingStyle(audit.marketTiming)}`}>
            {audit.marketTiming.toUpperCase()}
          </span>
        </div>
        <div className="p-5 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Feasibility</p>
          <p className={`text-lg font-black ${getScoreColor(audit.feasibilityScore)}`}>{audit.feasibilityScore}%</p>
        </div>
      </div>

      {/* Business Value Summary */}
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/30">
        <p className="text-slate-700 leading-relaxed text-sm">{audit.businessValueSummary}</p>
      </div>

      {/* Market Insights Section */}
      <div className="p-6 border-b border-slate-100">
        <button 
          onClick={() => toggleSection('market')}
          className="w-full flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2.5 rounded-xl">
              <span className="text-lg">📊</span>
            </div>
            <div className="text-left">
              <h4 className="font-bold text-slate-800">Market Analysis</h4>
              <p className="text-xs text-slate-500">{audit.marketInsights.length} insights • {audit.marketTiming} timing</p>
            </div>
          </div>
          <svg className={`w-5 h-5 text-slate-400 transition-transform ${expandedSection === 'market' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedSection === 'market' && (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
            {/* Market Insights */}
            <div className="grid gap-3">
              {audit.marketInsights.map((insight, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-slate-800">{insight.aspect}</span>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${getInsightVerdictStyle(insight.verdict)}`}>
                          {insight.verdict}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{insight.analysis}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Competitor Landscape */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Competitive Landscape</p>
              <p className="text-sm text-slate-700">{audit.competitorLandscape}</p>
            </div>

            {/* Market Timing */}
            <div className={`p-4 rounded-xl border ${getMarketTimingStyle(audit.marketTiming)}`}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2">Market Timing: {audit.marketTiming}</p>
              <p className="text-sm leading-relaxed">{audit.marketTimingReason}</p>
            </div>
          </div>
        )}
      </div>

      {/* Pros and Cons Grid */}
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        {/* Pros */}
        <div className="p-6">
          <button 
            onClick={() => toggleSection('pros')}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-2">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <span className="text-sm">👍</span>
              </div>
              <h4 className="font-bold text-emerald-800">What's Good ({audit.pros.length})</h4>
            </div>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedSection === 'pros' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === 'pros' && (
            <ul className="space-y-3 animate-in slide-in-from-top-2 duration-200">
              {audit.pros.map((pro, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-700 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                  <span className="text-emerald-500 font-bold">✓</span>
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
                <span className="text-sm">👎</span>
              </div>
              <h4 className="font-bold text-rose-800">What's Concerning ({audit.cons.length})</h4>
            </div>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedSection === 'cons' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === 'cons' && (
            <ul className="space-y-3 animate-in slide-in-from-top-2 duration-200">
              {audit.cons.map((con, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-700 bg-rose-50 p-3 rounded-lg border border-rose-100">
                  <span className="text-rose-500 font-bold">✗</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* What Needs to Improve */}
      <div className="p-6 border-t border-slate-100">
        <button 
          onClick={() => toggleSection('improvements')}
          className="w-full flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2.5 rounded-xl">
              <span className="text-lg">🔧</span>
            </div>
            <div className="text-left">
              <h4 className="font-bold text-amber-800">What Needs to Improve</h4>
              <p className="text-xs text-slate-500">
                {audit.criticalImprovements.length} critical • {audit.niceToHaveImprovements.length} nice-to-have
              </p>
            </div>
          </div>
          <svg className={`w-5 h-5 text-slate-400 transition-transform ${expandedSection === 'improvements' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedSection === 'improvements' && (
          <div className="space-y-6 animate-in slide-in-from-top-2 duration-200">
            {audit.criticalImprovements.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                  Critical - Must Address Before Proceeding
                </p>
                <ul className="space-y-2">
                  {audit.criticalImprovements.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm text-slate-700 bg-rose-50 p-3 rounded-lg border-2 border-rose-200">
                      <span className="text-rose-600 font-black">{i + 1}.</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {audit.niceToHaveImprovements.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                  Nice to Have - Would Strengthen Proposal
                </p>
                <ul className="space-y-2">
                  {audit.niceToHaveImprovements.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm text-slate-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                      <span className="text-amber-600">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Risks Section */}
      {audit.risks.length > 0 && (
        <div className="p-6 border-t border-slate-100">
          <button 
            onClick={() => toggleSection('risks')}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2.5 rounded-xl">
                <span className="text-lg">⚠️</span>
              </div>
              <div className="text-left">
                <h4 className="font-bold text-orange-800">Risks to Consider</h4>
                <p className="text-xs text-slate-500">{audit.risks.length} identified risks</p>
              </div>
            </div>
            <svg className={`w-5 h-5 text-slate-400 transition-transform ${expandedSection === 'risks' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === 'risks' && (
            <ul className="space-y-2 animate-in slide-in-from-top-2 duration-200">
              {audit.risks.map((risk, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-700 bg-orange-50 p-3 rounded-lg border border-orange-100">
                  <span className="text-orange-500">⚡</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Feasibility */}
      <div className="p-6 border-t border-slate-100 bg-slate-50">
        <div className="flex items-center gap-4 mb-3">
          <span className="text-2xl">🎯</span>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-700">Feasibility Assessment</span>
              <span className={`text-lg font-black ${getScoreColor(audit.feasibilityScore)}`}>{audit.feasibilityScore}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  audit.feasibilityScore >= 75 ? 'bg-emerald-500' : 
                  audit.feasibilityScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${audit.feasibilityScore}%` }}
              ></div>
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">{audit.feasibilityReason}</p>
      </div>

      {/* Action Buttons */}
      <div className="p-6 bg-gradient-to-r from-slate-100 to-slate-50 border-t-2 border-slate-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-50 hover:border-rose-300 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Delete BRD</span>
          </button>
          <button
            onClick={onProceed}
            className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 font-bold rounded-xl transition-all shadow-lg ${
              audit.overallVerdict === 'no_go' 
                ? 'bg-slate-400 text-white cursor-not-allowed'
                : audit.overallVerdict === 'strong_go'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-emerald-100'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-amber-100'
            }`}
            disabled={audit.overallVerdict === 'no_go'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span>
              {audit.overallVerdict === 'no_go' 
                ? 'Cannot Proceed' 
                : audit.overallVerdict === 'strong_go'
                ? 'Proceed to Approval'
                : 'Proceed Anyway'}
            </span>
          </button>
        </div>
        
        <p className="mt-4 text-center text-xs text-slate-500">
          {audit.overallVerdict === 'strong_go' && "This project has strong business value. Recommended to proceed."}
          {audit.overallVerdict === 'go_with_caution' && "Consider addressing critical improvements before proceeding."}
          {audit.overallVerdict === 'needs_work' && "Significant improvements recommended. Proceed at your own risk."}
          {audit.overallVerdict === 'no_go' && "This project is not recommended. Consider deleting and rethinking the approach."}
        </p>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-rose-100 p-3 rounded-xl text-rose-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Delete this BRD?</h3>
                <p className="text-slate-500 text-sm">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Are you sure you want to delete this BRD? All data including the AI analysis will be permanently removed.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowDeleteConfirm(false)} 
                className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete();
                }}
                className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all"
              >
                Yes, Delete BRD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BRDAuditPanel;
