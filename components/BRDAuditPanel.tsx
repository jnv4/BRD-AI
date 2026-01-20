
import React, { useState } from 'react';
import { BRDAudit, MarketInsight, MarketTrend, CulturalConsideration, FinancialProjection, RiskItem, StakeholderImpact, TechnologyAlignment } from '../types';

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
    if (score >= 60) return 'text-emerald-600';
    if (score >= 40) return 'text-amber-500';
    return 'text-rose-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 60) return 'bg-emerald-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getImpactStyle = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getImportanceStyle = (importance: string) => {
    switch (importance) {
      case 'critical': return 'bg-rose-100 text-rose-700';
      case 'important': return 'bg-amber-100 text-amber-700';
      case 'nice_to_have': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getComplexityStyle = (complexity: string) => {
    switch (complexity) {
      case 'high': return 'bg-rose-100 text-rose-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'low': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border-2 border-indigo-100 shadow-lg">
        <div className="flex flex-col items-center justify-center py-8 sm:py-12">
          <div className="relative">
            <div className="w-14 h-14 sm:w-20 sm:h-20 border-4 border-indigo-200 rounded-full animate-spin border-t-indigo-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl sm:text-2xl">🧠</span>
            </div>
          </div>
          <h3 className="mt-4 sm:mt-6 text-base sm:text-xl font-bold text-indigo-900">Comprehensive Analysis for Indira IVF...</h3>
          <p className="mt-2 text-xs sm:text-sm text-indigo-600 text-center max-w-md px-4">
            AI is performing exhaustive due diligence: market trends, cultural considerations, financial projections, compliance, and more...
          </p>
          <div className="mt-4 sm:mt-6 flex flex-wrap justify-center gap-1.5 sm:gap-2">
            {['Market Trends', 'Cultural', 'Financial', 'Technology', 'Compliance', 'Risks'].map((step, i) => (
              <span 
                key={step} 
                className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/80 rounded-full text-[9px] sm:text-[10px] font-bold text-indigo-600 border border-indigo-100 animate-pulse"
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
      <div className={`${verdictStyle.bg} p-4 sm:p-6 md:p-8 text-white relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="text-3xl sm:text-4xl md:text-5xl">{verdictStyle.icon}</span>
              <div>
                <p className="text-white/80 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">Comprehensive AI Analysis</p>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">{verdictStyle.label}</h2>
              </div>
            </div>
            <div className="text-left sm:text-right flex gap-3">
              <div className="bg-white/20 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl inline-block">
                <p className="text-white/70 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-0.5 sm:mb-1">Overall Score</p>
                <p className="text-2xl sm:text-3xl md:text-4xl font-black">{audit.overallScore || audit.businessValueScore}<span className="text-sm sm:text-lg font-medium">/100</span></p>
              </div>
            </div>
          </div>
          <p className="mt-4 sm:mt-6 text-white/90 text-xs sm:text-sm leading-relaxed max-w-3xl">{audit.verdictSummary}</p>
        </div>
      </div>

      {/* Executive Summary */}
      {audit.executiveSummary && (
        <div className="p-4 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📋</span>
            <h4 className="font-bold text-indigo-900 text-sm">Executive Summary</h4>
          </div>
          <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">{audit.executiveSummary}</p>
          {audit.keyTakeaways && audit.keyTakeaways.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-2">Key Takeaways</p>
              <ul className="space-y-1">
                {audit.keyTakeaways.map((takeaway, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-700">
                    <span className="text-indigo-500 font-bold">→</span>
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Score Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-slate-100 border-b border-slate-100 bg-slate-50/50">
        <div className="p-3 sm:p-4 text-center">
          <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Overall</p>
          <p className={`text-lg sm:text-xl font-black ${getScoreColor(audit.overallScore || audit.businessValueScore)}`}>{audit.overallScore || audit.businessValueScore}</p>
        </div>
        <div className="p-3 sm:p-4 text-center">
          <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Market Value</p>
          <p className={`text-lg sm:text-xl font-black ${getScoreColor(audit.marketValueScore || 0)}`}>{audit.marketValueScore || 0}</p>
        </div>
        <div className="p-3 sm:p-4 text-center">
          <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Feasibility</p>
          <p className={`text-lg sm:text-xl font-black ${getScoreColor(audit.feasibilityScore)}`}>{audit.feasibilityScore}</p>
        </div>
        <div className="p-3 sm:p-4 text-center">
          <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Strategic</p>
          <p className={`text-lg sm:text-xl font-black ${getScoreColor(audit.strategicAlignmentScore || 0)}`}>{audit.strategicAlignmentScore || 0}</p>
        </div>
        <div className="p-3 sm:p-4 text-center">
          <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Innovation</p>
          <p className={`text-lg sm:text-xl font-black ${getScoreColor(audit.innovationScore || 0)}`}>{audit.innovationScore || 0}</p>
        </div>
        <div className="p-3 sm:p-4 text-center">
          <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sustainability</p>
          <p className={`text-lg sm:text-xl font-black ${getScoreColor(audit.sustainabilityScore || 0)}`}>{audit.sustainabilityScore || 0}</p>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100 border-b border-slate-100">
        <div className="p-3 sm:p-5 text-center">
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 sm:mb-1">Est. ROI</p>
          <p className="text-sm sm:text-lg font-black text-slate-800">{audit.estimatedROI}</p>
        </div>
        <div className="p-3 sm:p-5 text-center">
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 sm:mb-1">Time to Value</p>
          <p className="text-sm sm:text-lg font-black text-slate-800">{audit.timeToValue}</p>
        </div>
        <div className="p-3 sm:p-5 text-center">
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 sm:mb-1">Market Timing</p>
          <span className={`inline-flex px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold border ${getMarketTimingStyle(audit.marketTiming)}`}>
            {audit.marketTiming.toUpperCase()}
          </span>
        </div>
        <div className="p-3 sm:p-5 text-center">
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 sm:mb-1">Feasibility</p>
          <p className={`text-sm sm:text-lg font-black ${getScoreColor(audit.feasibilityScore)}`}>{audit.feasibilityScore}%</p>
        </div>
      </div>

      {/* Business Value Summary */}
      <div className="p-4 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/30">
        <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">{audit.businessValueSummary}</p>
      </div>

      {/* Problems Solved Section */}
      <div className="p-4 sm:p-6 border-b border-slate-100">
        <button 
          onClick={() => toggleSection('problems')}
          className="w-full flex items-center justify-between mb-3 sm:mb-4"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-teal-100 p-2 sm:p-2.5 rounded-lg sm:rounded-xl">
              <span className="text-base sm:text-lg">🎯</span>
            </div>
            <div className="text-left">
              <h4 className="font-bold text-slate-800 text-sm sm:text-base">Problems Solved</h4>
              <p className="text-[10px] sm:text-xs text-slate-500">{audit.problemsSolved?.length || 0} problems addressed at Indira IVF</p>
            </div>
          </div>
          <svg className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-400 transition-transform ${expandedSection === 'problems' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedSection === 'problems' && audit.problemsSolved && (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div className="bg-teal-50 p-4 rounded-xl border border-teal-200">
              <p className="text-sm text-teal-800 leading-relaxed">{audit.problemsSolvedSummary}</p>
            </div>
            <ul className="space-y-2">
              {audit.problemsSolved.map((problem, i) => (
                <li key={i} className="flex gap-3 text-xs sm:text-sm text-slate-700 bg-white p-3 rounded-lg border border-teal-100">
                  <span className="text-teal-600 font-bold flex-shrink-0">✓</span>
                  <span>{problem}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Market Value for Indira IVF */}
      <div className="p-4 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-purple-50/50 to-indigo-50/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-purple-100 p-2 rounded-xl">
            <span className="text-lg">💎</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-purple-800 text-sm">Market Value for Indira IVF</h4>
              <span className={`text-lg font-black ${getScoreColor(audit.marketValueScore || 0)}`}>{audit.marketValueScore || 0}/100</span>
            </div>
          </div>
        </div>
        <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">{audit.marketValue}</p>
      </div>

      {/* Business Benefits Section */}
      <div className="p-4 sm:p-6 border-b border-slate-100">
        <button 
          onClick={() => toggleSection('benefits')}
          className="w-full flex items-center justify-between mb-3 sm:mb-4"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-blue-100 p-2 sm:p-2.5 rounded-lg sm:rounded-xl">
              <span className="text-base sm:text-lg">📈</span>
            </div>
            <div className="text-left">
              <h4 className="font-bold text-slate-800 text-sm sm:text-base">Business Benefits</h4>
              <p className="text-[10px] sm:text-xs text-slate-500">{audit.businessBenefits?.length || 0} benefits for Indira IVF</p>
            </div>
          </div>
          <svg className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-400 transition-transform ${expandedSection === 'benefits' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedSection === 'benefits' && audit.businessBenefits && (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <p className="text-sm text-blue-800 leading-relaxed">{audit.businessBenefitsSummary}</p>
            </div>
            <ul className="space-y-2">
              {audit.businessBenefits.map((benefit, i) => (
                <li key={i} className="flex gap-3 text-xs sm:text-sm text-slate-700 bg-white p-3 rounded-lg border border-blue-100">
                  <span className="text-blue-600 font-bold flex-shrink-0">★</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Suggestions Section */}
      <div className="p-4 sm:p-6 border-b border-slate-100">
        <button 
          onClick={() => toggleSection('suggestions')}
          className="w-full flex items-center justify-between mb-3 sm:mb-4"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-cyan-100 p-2 sm:p-2.5 rounded-lg sm:rounded-xl">
              <span className="text-base sm:text-lg">💡</span>
            </div>
            <div className="text-left">
              <h4 className="font-bold text-slate-800 text-sm sm:text-base">Suggestions for Improvement</h4>
              <p className="text-[10px] sm:text-xs text-slate-500">{audit.suggestions?.length || 0} recommendations</p>
            </div>
          </div>
          <svg className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-400 transition-transform ${expandedSection === 'suggestions' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedSection === 'suggestions' && audit.suggestions && (
          <ul className="space-y-2 animate-in slide-in-from-top-2 duration-200">
            {audit.suggestions.map((suggestion, i) => (
              <li key={i} className="flex gap-3 text-xs sm:text-sm text-slate-700 bg-cyan-50 p-3 rounded-lg border border-cyan-100">
                <span className="text-cyan-600 font-bold flex-shrink-0">{i + 1}.</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Market Insights Section */}
      <div className="p-4 sm:p-6 border-b border-slate-100">
        <button 
          onClick={() => toggleSection('market')}
          className="w-full flex items-center justify-between mb-3 sm:mb-4"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-indigo-100 p-2 sm:p-2.5 rounded-lg sm:rounded-xl">
              <span className="text-base sm:text-lg">📊</span>
            </div>
            <div className="text-left">
              <h4 className="font-bold text-slate-800 text-sm sm:text-base">Market Analysis</h4>
              <p className="text-[10px] sm:text-xs text-slate-500">{audit.marketInsights.length} insights • {audit.marketTiming} timing</p>
            </div>
          </div>
          <svg className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-400 transition-transform ${expandedSection === 'market' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        {/* Pros */}
        <div className="p-4 sm:p-6">
          <button 
            onClick={() => toggleSection('pros')}
            className="w-full flex items-center justify-between mb-3 sm:mb-4"
          >
            <div className="flex items-center gap-2">
              <div className="bg-emerald-100 p-1.5 sm:p-2 rounded-lg">
                <span className="text-xs sm:text-sm">👍</span>
              </div>
              <h4 className="font-bold text-emerald-800 text-sm sm:text-base">What's Good ({audit.pros.length})</h4>
            </div>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedSection === 'pros' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === 'pros' && (
            <ul className="space-y-2 sm:space-y-3 animate-in slide-in-from-top-2 duration-200">
              {audit.pros.map((pro, i) => (
                <li key={i} className="flex gap-2 sm:gap-3 text-xs sm:text-sm text-slate-700 bg-emerald-50 p-2 sm:p-3 rounded-lg border border-emerald-100">
                  <span className="text-emerald-500 font-bold flex-shrink-0">✓</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Cons */}
        <div className="p-4 sm:p-6">
          <button 
            onClick={() => toggleSection('cons')}
            className="w-full flex items-center justify-between mb-3 sm:mb-4"
          >
            <div className="flex items-center gap-2">
              <div className="bg-rose-100 p-1.5 sm:p-2 rounded-lg">
                <span className="text-xs sm:text-sm">👎</span>
              </div>
              <h4 className="font-bold text-rose-800 text-sm sm:text-base">Concerning ({audit.cons.length})</h4>
            </div>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedSection === 'cons' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === 'cons' && (
            <ul className="space-y-2 sm:space-y-3 animate-in slide-in-from-top-2 duration-200">
              {audit.cons.map((con, i) => (
                <li key={i} className="flex gap-2 sm:gap-3 text-xs sm:text-sm text-slate-700 bg-rose-50 p-2 sm:p-3 rounded-lg border border-rose-100">
                  <span className="text-rose-500 font-bold flex-shrink-0">✗</span>
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

      {/* Market Trends Section */}
      {audit.marketTrends && audit.marketTrends.length > 0 && (
        <div className="p-4 sm:p-6 border-t border-slate-100">
          <button 
            onClick={() => toggleSection('trends')}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="bg-violet-100 p-2.5 rounded-xl">
                <span className="text-lg">📈</span>
              </div>
              <div className="text-left">
                <h4 className="font-bold text-violet-800">Market Trends & Industry Outlook</h4>
                <p className="text-xs text-slate-500">{audit.marketTrends.length} trends identified</p>
              </div>
            </div>
            <svg className={`w-5 h-5 text-slate-400 transition-transform ${expandedSection === 'trends' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === 'trends' && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="grid gap-3">
                {audit.marketTrends.map((trend, i) => (
                  <div key={i} className="bg-violet-50 p-4 rounded-xl border border-violet-100">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-sm font-bold text-violet-800">{trend.trend}</span>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${getImpactStyle(trend.impact)}`}>
                        {trend.impact} impact
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{trend.relevance}</p>
                    <p className="text-[10px] text-violet-600 font-medium">Timeframe: {trend.timeframe}</p>
                  </div>
                ))}
              </div>
              {audit.healthcareIndustryTrends && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Healthcare Industry Trends</p>
                  <p className="text-sm text-slate-700">{audit.healthcareIndustryTrends}</p>
                </div>
              )}
              {audit.fertilityMarketOutlook && (
                <div className="bg-pink-50 p-4 rounded-xl border border-pink-200">
                  <p className="text-[10px] font-bold text-pink-600 uppercase tracking-wider mb-2">Fertility Market Outlook</p>
                  <p className="text-sm text-slate-700">{audit.fertilityMarketOutlook}</p>
                </div>
              )}
              {audit.digitalHealthTrends && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2">Digital Health Trends</p>
                  <p className="text-sm text-slate-700">{audit.digitalHealthTrends}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cultural Considerations Section */}
      {audit.culturalConsiderations && audit.culturalConsiderations.length > 0 && (
        <div className="p-4 sm:p-6 border-t border-slate-100">
          <button 
            onClick={() => toggleSection('cultural')}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2.5 rounded-xl">
                <span className="text-lg">🇮🇳</span>
              </div>
              <div className="text-left">
                <h4 className="font-bold text-orange-800">Cultural & Regional Considerations</h4>
                <p className="text-xs text-slate-500">{audit.culturalConsiderations.length} considerations for Indian market</p>
              </div>
            </div>
            <svg className={`w-5 h-5 text-slate-400 transition-transform ${expandedSection === 'cultural' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === 'cultural' && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="grid gap-3">
                {audit.culturalConsiderations.map((consideration, i) => (
                  <div key={i} className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-sm font-bold text-orange-800">{consideration.aspect}</span>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${getImportanceStyle(consideration.importance)}`}>
                        {consideration.importance.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{consideration.insight}</p>
                    <div className="bg-white/50 p-2 rounded-lg">
                      <p className="text-[10px] font-bold text-orange-600 mb-1">Recommendation:</p>
                      <p className="text-xs text-slate-700">{consideration.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {audit.indianHealthcareCulture && (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2">Indian Healthcare Culture</p>
                    <p className="text-xs text-slate-700">{audit.indianHealthcareCulture}</p>
                  </div>
                )}
                {audit.patientExpectations && (
                  <div className="bg-rose-50 p-4 rounded-xl border border-rose-200">
                    <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-2">Patient Expectations</p>
                    <p className="text-xs text-slate-700">{audit.patientExpectations}</p>
                  </div>
                )}
                {audit.familyDynamicsImpact && (
                  <div className="bg-pink-50 p-4 rounded-xl border border-pink-200">
                    <p className="text-[10px] font-bold text-pink-600 uppercase tracking-wider mb-2">Family Dynamics Impact</p>
                    <p className="text-xs text-slate-700">{audit.familyDynamicsImpact}</p>
                  </div>
                )}
                {audit.regionalVariations && (
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                    <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-2">Regional Variations</p>
                    <p className="text-xs text-slate-700">{audit.regionalVariations}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Financial Analysis Section */}
      {audit.financialProjections && audit.financialProjections.length > 0 && (
        <div className="p-4 sm:p-6 border-t border-slate-100">
          <button 
            onClick={() => toggleSection('financial')}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2.5 rounded-xl">
                <span className="text-lg">💰</span>
              </div>
              <div className="text-left">
                <h4 className="font-bold text-green-800">Financial Analysis</h4>
                <p className="text-xs text-slate-500">ROI: {audit.estimatedROI} • Payback: {audit.paybackPeriod || 'N/A'}</p>
              </div>
            </div>
            <svg className={`w-5 h-5 text-slate-400 transition-transform ${expandedSection === 'financial' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === 'financial' && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-green-50 p-3 rounded-xl border border-green-200 text-center">
                  <p className="text-[9px] font-bold text-green-600 uppercase mb-1">Est. ROI</p>
                  <p className="text-lg font-black text-green-800">{audit.estimatedROI}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-center">
                  <p className="text-[9px] font-bold text-blue-600 uppercase mb-1">Time to Value</p>
                  <p className="text-lg font-black text-blue-800">{audit.timeToValue}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 text-center">
                  <p className="text-[9px] font-bold text-purple-600 uppercase mb-1">Payback Period</p>
                  <p className="text-lg font-black text-purple-800">{audit.paybackPeriod || 'TBD'}</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-center">
                  <p className="text-[9px] font-bold text-amber-600 uppercase mb-1">Investment</p>
                  <p className="text-sm font-black text-amber-800">{audit.investmentRequired || 'TBD'}</p>
                </div>
              </div>
              <div className="grid gap-3">
                {audit.financialProjections.map((projection, i) => (
                  <div key={i} className="bg-white p-4 rounded-xl border border-green-100 shadow-sm">
                    <p className="text-sm font-bold text-slate-800 mb-2">{projection.metric}</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <p className="text-[9px] text-slate-400 uppercase mb-0.5">Current</p>
                        <p className="text-slate-700 font-medium">{projection.currentState}</p>
                      </div>
                      <div className="bg-green-50 p-2 rounded-lg">
                        <p className="text-[9px] text-green-600 uppercase mb-0.5">Projected</p>
                        <p className="text-green-700 font-medium">{projection.projectedImprovement}</p>
                      </div>
                      <div className="bg-blue-50 p-2 rounded-lg">
                        <p className="text-[9px] text-blue-600 uppercase mb-0.5">Timeframe</p>
                        <p className="text-blue-700 font-medium">{projection.timeframe}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {audit.costBenefitAnalysis && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Cost-Benefit Analysis</p>
                  <p className="text-sm text-slate-700">{audit.costBenefitAnalysis}</p>
                </div>
              )}
              {audit.longTermFinancialImpact && (
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">Long-term Financial Impact</p>
                  <p className="text-sm text-slate-700">{audit.longTermFinancialImpact}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Technology Assessment Section */}
      {audit.technologyAlignment && audit.technologyAlignment.length > 0 && (
        <div className="p-4 sm:p-6 border-t border-slate-100">
          <button 
            onClick={() => toggleSection('technology')}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 p-2.5 rounded-xl">
                <span className="text-lg">⚙️</span>
              </div>
              <div className="text-left">
                <h4 className="font-bold text-slate-800">Technology Assessment</h4>
                <p className="text-xs text-slate-500">Integration: {audit.integrationComplexity || 'N/A'} complexity</p>
              </div>
            </div>
            <svg className={`w-5 h-5 text-slate-400 transition-transform ${expandedSection === 'technology' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === 'technology' && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="grid gap-3">
                {audit.technologyAlignment.map((tech, i) => (
                  <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-sm font-bold text-slate-800">{tech.aspect}</span>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${getComplexityStyle(tech.complexity)}`}>
                        {tech.complexity}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-2 rounded-lg">
                        <p className="text-[9px] text-slate-400 uppercase mb-0.5">Current State</p>
                        <p className="text-slate-700">{tech.currentState}</p>
                      </div>
                      <div className="bg-blue-50 p-2 rounded-lg">
                        <p className="text-[9px] text-blue-600 uppercase mb-0.5">Required Changes</p>
                        <p className="text-slate-700">{tech.requiredChanges}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {audit.techStackCompatibility && (
                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-2">Tech Stack Compatibility</p>
                    <p className="text-xs text-slate-700">{audit.techStackCompatibility}</p>
                  </div>
                )}
                {audit.dataSecurityConsiderations && (
                  <div className="bg-rose-50 p-4 rounded-xl border border-rose-200">
                    <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-2">Data Security</p>
                    <p className="text-xs text-slate-700">{audit.dataSecurityConsiderations}</p>
                  </div>
                )}
                {audit.scalabilityAssessment && (
                  <div className="bg-teal-50 p-4 rounded-xl border border-teal-200">
                    <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wider mb-2">Scalability (130+ Centers)</p>
                    <p className="text-xs text-slate-700">{audit.scalabilityAssessment}</p>
                  </div>
                )}
                {audit.integrationComplexityReason && (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2">Integration Details</p>
                    <p className="text-xs text-slate-700">{audit.integrationComplexityReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stakeholder Impact Section */}
      {audit.stakeholderImpacts && audit.stakeholderImpacts.length > 0 && (
        <div className="p-4 sm:p-6 border-t border-slate-100">
          <button 
            onClick={() => toggleSection('stakeholders')}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="bg-cyan-100 p-2.5 rounded-xl">
                <span className="text-lg">👥</span>
              </div>
              <div className="text-left">
                <h4 className="font-bold text-cyan-800">Stakeholder Impact Analysis</h4>
                <p className="text-xs text-slate-500">{audit.stakeholderImpacts.length} stakeholder groups analyzed</p>
              </div>
            </div>
            <svg className={`w-5 h-5 text-slate-400 transition-transform ${expandedSection === 'stakeholders' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === 'stakeholders' && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="grid gap-3">
                {audit.stakeholderImpacts.map((stakeholder, i) => (
                  <div key={i} className="bg-cyan-50 p-4 rounded-xl border border-cyan-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-cyan-800">{stakeholder.stakeholder}</span>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${getComplexityStyle(stakeholder.adoptionChallenge)}`}>
                        {stakeholder.adoptionChallenge} adoption challenge
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/70 p-3 rounded-lg">
                        <p className="text-[9px] font-bold text-rose-600 uppercase mb-2">Current Pain Points</p>
                        <ul className="space-y-1">
                          {stakeholder.currentPainPoints.map((pain, j) => (
                            <li key={j} className="text-xs text-slate-600 flex gap-1">
                              <span className="text-rose-400">•</span> {pain}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-white/70 p-3 rounded-lg">
                        <p className="text-[9px] font-bold text-emerald-600 uppercase mb-2">Expected Benefits</p>
                        <ul className="space-y-1">
                          {stakeholder.expectedBenefits.map((benefit, j) => (
                            <li key={j} className="text-xs text-slate-600 flex gap-1">
                              <span className="text-emerald-400">✓</span> {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {audit.patientExperienceImpact && (
                  <div className="bg-pink-50 p-3 rounded-xl border border-pink-200">
                    <p className="text-[10px] font-bold text-pink-600 uppercase tracking-wider mb-2">Patient Experience</p>
                    <p className="text-xs text-slate-700">{audit.patientExperienceImpact}</p>
                  </div>
                )}
                {audit.staffWorkflowImpact && (
                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2">Staff Workflow</p>
                    <p className="text-xs text-slate-700">{audit.staffWorkflowImpact}</p>
                  </div>
                )}
                {audit.managementBenefits && (
                  <div className="bg-purple-50 p-3 rounded-xl border border-purple-200">
                    <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-2">Management Benefits</p>
                    <p className="text-xs text-slate-700">{audit.managementBenefits}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Compliance & Regulatory Section */}
      {audit.complianceConsiderations && audit.complianceConsiderations.length > 0 && (
        <div className="p-4 sm:p-6 border-t border-slate-100">
          <button 
            onClick={() => toggleSection('compliance')}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2.5 rounded-xl">
                <span className="text-lg">📜</span>
              </div>
              <div className="text-left">
                <h4 className="font-bold text-red-800">Compliance & Regulatory</h4>
                <p className="text-xs text-slate-500">{audit.complianceConsiderations.length} compliance requirements</p>
              </div>
            </div>
            <svg className={`w-5 h-5 text-slate-400 transition-transform ${expandedSection === 'compliance' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === 'compliance' && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
              <ul className="space-y-2">
                {audit.complianceConsiderations.map((item, i) => (
                  <li key={i} className="flex gap-3 text-xs text-slate-700 bg-red-50 p-3 rounded-lg border border-red-100">
                    <span className="text-red-500 font-bold">⚖️</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {audit.healthcareRegulations && (
                  <div className="bg-rose-50 p-3 rounded-xl border border-rose-200">
                    <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-2">Healthcare Regulations</p>
                    <p className="text-xs text-slate-700">{audit.healthcareRegulations}</p>
                  </div>
                )}
                {audit.dataPrivacyCompliance && (
                  <div className="bg-purple-50 p-3 rounded-xl border border-purple-200">
                    <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-2">Data Privacy</p>
                    <p className="text-xs text-slate-700">{audit.dataPrivacyCompliance}</p>
                  </div>
                )}
                {audit.auditTrailRequirements && (
                  <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Audit Trail</p>
                    <p className="text-xs text-slate-700">{audit.auditTrailRequirements}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Strategic Alignment Section */}
      {(audit.alignmentWithIndiraIVFVision || audit.competitiveAdvantage) && (
        <div className="p-4 sm:p-6 border-t border-slate-100">
          <button 
            onClick={() => toggleSection('strategic')}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-2.5 rounded-xl">
                <span className="text-lg">🎯</span>
              </div>
              <div className="text-left">
                <h4 className="font-bold text-indigo-800">Strategic Alignment & Innovation</h4>
                <p className="text-xs text-slate-500">Alignment: {audit.strategicAlignmentScore || 0}/100 • Innovation: {audit.innovationScore || 0}/100</p>
              </div>
            </div>
            <svg className={`w-5 h-5 text-slate-400 transition-transform ${expandedSection === 'strategic' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === 'strategic' && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-indigo-600 uppercase">Strategic Alignment</p>
                    <span className={`text-lg font-black ${getScoreColor(audit.strategicAlignmentScore || 0)}`}>{audit.strategicAlignmentScore || 0}/100</span>
                  </div>
                  <p className="text-xs text-slate-700">{audit.alignmentWithIndiraIVFVision}</p>
                </div>
                <div className="bg-violet-50 p-4 rounded-xl border border-violet-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-violet-600 uppercase">Innovation Score</p>
                    <span className={`text-lg font-black ${getScoreColor(audit.innovationScore || 0)}`}>{audit.innovationScore || 0}/100</span>
                  </div>
                  <p className="text-xs text-slate-700">{audit.innovationAssessment}</p>
                </div>
              </div>
              {audit.competitiveAdvantage && (
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">Competitive Advantage</p>
                  <p className="text-sm text-slate-700">{audit.competitiveAdvantage}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Implementation Considerations */}
      {(audit.implementationTimeline || audit.resourceRequirements) && (
        <div className="p-4 sm:p-6 border-t border-slate-100">
          <button 
            onClick={() => toggleSection('implementation')}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="bg-sky-100 p-2.5 rounded-xl">
                <span className="text-lg">🚀</span>
              </div>
              <div className="text-left">
                <h4 className="font-bold text-sky-800">Implementation Considerations</h4>
                <p className="text-xs text-slate-500">Complexity: {audit.implementationComplexity || 'N/A'} • Timeline: {audit.implementationTimeline || 'TBD'}</p>
              </div>
            </div>
            <svg className={`w-5 h-5 text-slate-400 transition-transform ${expandedSection === 'implementation' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === 'implementation' && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
              {audit.resourceRequirements && audit.resourceRequirements.length > 0 && (
                <div className="bg-sky-50 p-4 rounded-xl border border-sky-200">
                  <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wider mb-3">Resource Requirements</p>
                  <ul className="grid grid-cols-2 gap-2">
                    {audit.resourceRequirements.map((resource, i) => (
                      <li key={i} className="text-xs text-slate-700 flex gap-2 bg-white p-2 rounded-lg">
                        <span className="text-sky-500">→</span> {resource}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {audit.trainingNeeds && (
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2">Training Needs</p>
                    <p className="text-xs text-slate-700">{audit.trainingNeeds}</p>
                  </div>
                )}
                {audit.changeManagementNeeds && (
                  <div className="bg-purple-50 p-3 rounded-xl border border-purple-200">
                    <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-2">Change Management</p>
                    <p className="text-xs text-slate-700">{audit.changeManagementNeeds}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Long-term Sustainability */}
      {(audit.maintenanceRequirements || audit.futureProofing) && (
        <div className="p-4 sm:p-6 border-t border-slate-100">
          <button 
            onClick={() => toggleSection('sustainability')}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="bg-teal-100 p-2.5 rounded-xl">
                <span className="text-lg">🌱</span>
              </div>
              <div className="text-left">
                <h4 className="font-bold text-teal-800">Long-term Sustainability</h4>
                <p className="text-xs text-slate-500">Sustainability Score: {audit.sustainabilityScore || 0}/100</p>
              </div>
            </div>
            <svg className={`w-5 h-5 text-slate-400 transition-transform ${expandedSection === 'sustainability' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === 'sustainability' && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {audit.maintenanceRequirements && (
                  <div className="bg-teal-50 p-3 rounded-xl border border-teal-200">
                    <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wider mb-2">Maintenance</p>
                    <p className="text-xs text-slate-700">{audit.maintenanceRequirements}</p>
                  </div>
                )}
                {audit.futureProofing && (
                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2">Future-Proofing</p>
                    <p className="text-xs text-slate-700">{audit.futureProofing}</p>
                  </div>
                )}
                {audit.exitStrategy && (
                  <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Exit Strategy</p>
                    <p className="text-xs text-slate-700">{audit.exitStrategy}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Risks Section */}
      {audit.detailedRisks && audit.detailedRisks.length > 0 && (
        <div className="p-4 sm:p-6 border-t border-slate-100">
          <button 
            onClick={() => toggleSection('detailedRisks')}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2.5 rounded-xl">
                <span className="text-lg">⚠️</span>
              </div>
              <div className="text-left">
                <h4 className="font-bold text-orange-800">Detailed Risk Analysis</h4>
                <p className="text-xs text-slate-500">{audit.detailedRisks.length} risks with mitigation strategies</p>
              </div>
            </div>
            <svg className={`w-5 h-5 text-slate-400 transition-transform ${expandedSection === 'detailedRisks' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === 'detailedRisks' && (
            <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
              {audit.detailedRisks.map((risk, i) => (
                <div key={i} className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-sm font-bold text-orange-800">{risk.risk}</span>
                    <div className="flex gap-1">
                      <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full border ${getImpactStyle(risk.likelihood)}`}>
                        {risk.likelihood} likely
                      </span>
                      <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full border ${getImpactStyle(risk.impact)}`}>
                        {risk.impact} impact
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/70 p-3 rounded-lg">
                    <p className="text-[9px] font-bold text-emerald-600 uppercase mb-1">Mitigation Strategy:</p>
                    <p className="text-xs text-slate-700">{risk.mitigation}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Industry Benchmarks */}
      {(audit.industryBenchmarks || audit.bestPracticesAlignment) && (
        <div className="p-4 sm:p-6 border-t border-slate-100">
          <button 
            onClick={() => toggleSection('benchmarks')}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-2.5 rounded-xl">
                <span className="text-lg">📏</span>
              </div>
              <div className="text-left">
                <h4 className="font-bold text-gray-800">Industry Benchmarks</h4>
                <p className="text-xs text-slate-500">Comparison with industry standards</p>
              </div>
            </div>
            <svg className={`w-5 h-5 text-slate-400 transition-transform ${expandedSection === 'benchmarks' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === 'benchmarks' && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
              {audit.industryBenchmarks && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Industry Benchmarks</p>
                  <p className="text-sm text-slate-700">{audit.industryBenchmarks}</p>
                </div>
              )}
              {audit.bestPracticesAlignment && (
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">Best Practices Alignment</p>
                  <p className="text-sm text-slate-700">{audit.bestPracticesAlignment}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Simple Risks Section (fallback) */}
      {audit.risks && audit.risks.length > 0 && (!audit.detailedRisks || audit.detailedRisks.length === 0) && (
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
                  audit.feasibilityScore >= 60 ? 'bg-emerald-500' : 
                  audit.feasibilityScore >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${audit.feasibilityScore}%` }}
              ></div>
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">{audit.feasibilityReason}</p>
      </div>

      {/* Action Buttons */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-100 to-slate-50 border-t-2 border-slate-200">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex-1 flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-white border-2 border-rose-200 text-rose-600 font-bold rounded-lg sm:rounded-xl hover:bg-rose-50 hover:border-rose-300 transition-all shadow-sm text-sm"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Delete</span>
          </button>
          <button
            onClick={onProceed}
            className={`flex-1 flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 font-bold rounded-lg sm:rounded-xl transition-all shadow-lg text-sm ${
              audit.overallVerdict === 'no_go' 
                ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white hover:from-rose-600 hover:to-red-600 shadow-rose-100'
                : audit.overallVerdict === 'strong_go'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-emerald-100'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-amber-100'
            }`}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span>Proceed Anyway</span>
          </button>
        </div>
        
        <p className="mt-3 sm:mt-4 text-center text-[10px] sm:text-xs text-slate-500">
          {audit.overallVerdict === 'strong_go' && "Strong business value. Recommended to proceed."}
          {audit.overallVerdict === 'go_with_caution' && "Consider addressing improvements before proceeding."}
          {audit.overallVerdict === 'needs_work' && "Improvements recommended. Proceed at your own discretion."}
          {audit.overallVerdict === 'no_go' && "Not recommended, but you can still proceed if needed."}
        </p>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full p-5 sm:p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="bg-rose-100 p-2 sm:p-3 rounded-lg sm:rounded-xl text-rose-600">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-800">Delete this BRD?</h3>
                <p className="text-slate-500 text-xs sm:text-sm">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-slate-600 text-xs sm:text-sm mb-4 sm:mb-6 leading-relaxed">
              Are you sure? All data including AI analysis will be permanently removed.
            </p>
            <div className="flex gap-2 sm:gap-4">
              <button 
                onClick={() => setShowDeleteConfirm(false)} 
                className="flex-1 py-2.5 sm:py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-lg sm:rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete();
                }}
                className="flex-1 py-2.5 sm:py-3 bg-rose-600 text-white font-bold rounded-lg sm:rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BRDAuditPanel;
