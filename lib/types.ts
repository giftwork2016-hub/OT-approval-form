export type EvidenceType = "start" | "end";

export interface Company {
  id: string;
  code: string;
  name: string;
  logoUrl?: string;
  hrEmail: string;
}

export interface Job {
  id: string;
  companyId: string;
  jobCode: string;
  jobName: string;
  active: boolean;
}

export interface CompanySite {
  id: string;
  companyId: string;
  name: string;
  geofenceType: "circle" | "polygon";
  centerLat?: number;
  centerLng?: number;
  radiusM?: number;
  polygon?: [number, number][];
}

export interface ProofLocation {
  lat: number;
  lng: number;
  accuracyM: number;
  timestamp: string;
  source: "gps" | "manual";
}

export interface ProofPhoto {
  url: string;
  hash: string;
  size: number;
  width?: number | undefined;
  height?: number | undefined;
  capturedAt: string;
  mimeType: string;
}

export interface EvidenceRecord {
  type: EvidenceType;
  photo?: ProofPhoto | undefined;
  location?: ProofLocation | undefined;
  inGeofence?: boolean | undefined;
  lowAccuracy?: boolean | undefined;
  riskOutOfBounds?: boolean | undefined;
  siteId?: string | null | undefined;
}

export interface OTRequestInput {
  companyId: string;
  jobId: string;
  startAt: string;
  endAt: string;
  employeeName: string;
  employeeTitle: string;
  employeeEmail: string;
  managerName: string;
  managerTitle: string;
  managerEmail: string;
  note?: string | undefined;
  attachmentName?: string | undefined;
  attachmentSize?: number | undefined;
  attachmentType?: string | undefined;
  consent: boolean;
  proofConsent: boolean;
  evidences: EvidenceRecord[];
}

export interface OTRequest extends OTRequestInput {
  id: string;
  docNo: string;
  company: Company;
  job: Job;
  hours: number;
  status: "submitted" | "approved" | "rejected" | "needs_info";
  createdAt: string;
  auditLog: AuditLog[];
}

export interface ApprovalToken {
  id: string;
  requestId: string;
  token: string;
  action: "approve" | "reject" | "request-info";
  expiresAt: string;
  usedAt?: string | null;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export interface AutocompleteOption {
  id: string;
  label: string;
  description?: string;
  code?: string;
}
