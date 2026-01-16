
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
}

export type BRDPriority = 'Good To Have' | 'Must To Have';
export type BRDCategory = 'Cost Saving' | 'Man Days Saving' | 'Compliance';

export interface Stakeholder {
  role: string;
  responsibility: string;
}

export interface BRDContent {
  purpose: string;
  objectives: string[];
  scopeIncluded: string[];
  scopeExcluded: string[];
  stakeholders: Stakeholder[];
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

export interface BRDAudit {
  overallScore: number; // 1-100
  summary: string;
  pros: string[];
  cons: string[];
  suggestions: BRDAuditItem[];
  risks: string[];
  recommendations: string[];
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
