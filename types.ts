
export enum BRDStatus {
  DRAFT = 'Draft',
  PENDING_VERIFICATION = 'Pending Verification',
  VERIFIED = 'Verified',
  BUSINESS_REVIEW = 'Business Review',
  LEAD_PM_REVIEW = 'Lead & PM Review',
  CTO_APPROVAL = 'CTO Approval',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}

export enum UserRole {
  BUSINESS = 'Business',
  PROJECT_MANAGER = 'Project Manager',
  TEAM_LEAD = 'Team Lead',
  CTO = 'CTO',
  ADMIN = 'Admin'
}

export interface AppUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  password: string;
}

export type BRDPriority = 'Good To Have' | 'Must Have';
export type BRDCategory = 'Cost Saving' | 'Man Days Saving' | 'Compliance';

export interface Stakeholder {
  role: string;
  responsibility: string;
}

export interface KeyRequirement {
  title: string;
  description: string;
}

export interface KeyRisk {
  risk: string;
  mitigation: string;
}

export interface BRDContent {
  // Executive Summary (2-3 sentences)
  executiveSummary: string;
  
  // Problem & Solution (concise)
  problemStatement: string;
  proposedSolution: string;
  
  // Core Elements
  purpose: string;
  objectives: string[]; // 3-5 max
  scopeIncluded: string[]; // 4-6 max
  scopeExcluded: string[]; // 3-4 max
  
  // Key Requirements (3-5 critical ones)
  keyRequirements: KeyRequirement[];
  
  // Success Metrics (3-4 max)
  successCriteria: string[];
  
  // Stakeholders (key ones only)
  stakeholders: Stakeholder[];
  
  // Risks (2-3 max)
  keyRisks: KeyRisk[];
  
  // Timeline
  estimatedTimeline: string;
  
  // Classification
  priority: BRDPriority;
  category: BRDCategory;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  user: string;
  action: string;
  details?: string;
  version: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: number;
  isRead: boolean;
}

export interface BRDAuditItem {
  type: 'strength' | 'weakness' | 'suggestion' | 'risk';
  category: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

export interface MarketInsight {
  aspect: string;
  analysis: string;
  verdict: 'positive' | 'neutral' | 'negative';
}

export interface MarketTrend {
  trend: string;
  relevance: string;
  impact: 'high' | 'medium' | 'low';
  timeframe: string;
}

export interface CulturalConsideration {
  aspect: string;
  insight: string;
  recommendation: string;
  importance: 'critical' | 'important' | 'nice_to_have';
}

export interface FinancialProjection {
  metric: string;
  currentState: string;
  projectedImprovement: string;
  timeframe: string;
}

export interface RiskItem {
  risk: string;
  likelihood: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  mitigation: string;
}

export interface StakeholderImpact {
  stakeholder: string;
  currentPainPoints: string[];
  expectedBenefits: string[];
  adoptionChallenge: 'high' | 'medium' | 'low';
}

export interface TechnologyAlignment {
  aspect: string;
  currentState: string;
  requiredChanges: string;
  complexity: 'high' | 'medium' | 'low';
}

export interface BRDAudit {
  // Overall Score (weighted average of all scores - displayed in sidebar)
  overallScore: number; // 1-100
  
  // Problems Solved
  problemsSolved: string[];
  problemsSolvedSummary: string;
  
  // Market Value for Indira IVF
  marketValue: string;
  marketValueScore: number; // 1-100
  
  // Business Benefits
  businessBenefits: string[];
  businessBenefitsSummary: string;
  
  // Suggestions for Improvement
  suggestions: string[];
  
  // Business Value Assessment
  businessValueScore: number; // 1-100
  businessValueSummary: string;
  estimatedROI: string;
  timeToValue: string;
  
  // Market Analysis
  marketInsights: MarketInsight[];
  competitorLandscape: string;
  marketTiming: 'excellent' | 'good' | 'fair' | 'poor';
  marketTimingReason: string;
  
  // === ENHANCED DETAILED ANALYSIS ===
  
  // Market Trends Analysis
  marketTrends: MarketTrend[];
  healthcareIndustryTrends: string;
  fertilityMarketOutlook: string;
  digitalHealthTrends: string;
  
  // Cultural & Regional Considerations
  culturalConsiderations: CulturalConsideration[];
  indianHealthcareCulture: string;
  patientExpectations: string;
  familyDynamicsImpact: string;
  regionalVariations: string;
  
  // Financial Analysis
  financialProjections: FinancialProjection[];
  costBenefitAnalysis: string;
  investmentRequired: string;
  paybackPeriod: string;
  longTermFinancialImpact: string;
  
  // Technology Assessment
  technologyAlignment: TechnologyAlignment[];
  integrationComplexity: 'high' | 'medium' | 'low';
  integrationComplexityReason: string;
  techStackCompatibility: string;
  dataSecurityConsiderations: string;
  scalabilityAssessment: string;
  
  // Stakeholder Impact Analysis
  stakeholderImpacts: StakeholderImpact[];
  patientExperienceImpact: string;
  staffWorkflowImpact: string;
  managementBenefits: string;
  
  // Compliance & Regulatory
  complianceConsiderations: string[];
  healthcareRegulations: string;
  dataPrivacyCompliance: string;
  auditTrailRequirements: string;
  
  // Strategic Alignment
  strategicAlignmentScore: number; // 1-100
  alignmentWithIndiraIVFVision: string;
  competitiveAdvantage: string;
  innovationScore: number; // 1-100
  innovationAssessment: string;
  
  // Implementation Considerations
  implementationComplexity: 'high' | 'medium' | 'low';
  implementationTimeline: string;
  resourceRequirements: string[];
  trainingNeeds: string;
  changeManagementNeeds: string;
  
  // Long-term Sustainability
  sustainabilityScore: number; // 1-100
  maintenanceRequirements: string;
  futureProofing: string;
  exitStrategy: string;
  
  // === END ENHANCED ANALYSIS ===
  
  // Pros & Cons
  pros: string[];
  cons: string[];
  
  // What needs improvement to proceed
  criticalImprovements: string[];
  niceToHaveImprovements: string[];
  
  // Detailed Risks & Feasibility
  detailedRisks: RiskItem[];
  risks: string[];
  feasibilityScore: number; // 1-100
  feasibilityReason: string;
  
  // Industry Benchmarks
  industryBenchmarks: string;
  bestPracticesAlignment: string;
  
  // Final Verdict
  overallVerdict: 'strong_go' | 'go_with_caution' | 'needs_work' | 'no_go';
  verdictSummary: string;
  executiveSummary: string;
  keyTakeaways: string[];
}

export interface BRD {
  id: string;
  projectName: string;
  preparedBy: string;
  date: string;
  version: number;
  status: BRDStatus;
  content: BRDContent;
  rejectionComment?: string;
  logs: LogEntry[];
  lastModified: number;
  // Verification layer fields
  audit?: BRDAudit;
  isVerified: boolean;
  verificationHistory?: {
    iteration: number;
    timestamp: number;
    action: 'refined' | 'kept';
    previousAudit?: BRDAudit;
  }[];
}
