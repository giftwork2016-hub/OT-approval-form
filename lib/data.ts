import type { AutocompleteOption, Company, CompanySite, Job, OTRequest, OTRequestInput } from "./types";
import { calculateOtHours, generateDocumentNumber } from "./utils";

const companies: Company[] = [
  {
    id: "c-acme",
    code: "ACM",
    name: "Acme Corp",
    logoUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d",
    hrEmail: "hr@acme.test",
  },
  {
    id: "c-sun",
    code: "SUN",
    name: "Sunshine Industrial",
    logoUrl: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a",
    hrEmail: "people@sunshine.test",
  },
  {
    id: "c-nova",
    code: "NOV",
    name: "Nova Tech Labs",
    logoUrl: "https://images.unsplash.com/photo-1454165205744-3b78555e5572",
    hrEmail: "talent@novatech.test",
  },
];

const jobs: Job[] = [
  {
    id: "j-acme-engi",
    companyId: "c-acme",
    jobCode: "ENG-2024",
    jobName: "Software Engineer",
    active: true,
  },
  {
    id: "j-acme-ops",
    companyId: "c-acme",
    jobCode: "OPS-010",
    jobName: "Operations Specialist",
    active: true,
  },
  {
    id: "j-sun-site",
    companyId: "c-sun",
    jobCode: "PLT-778",
    jobName: "Plant Technician",
    active: true,
  },
  {
    id: "j-nova-rd",
    companyId: "c-nova",
    jobCode: "RND-555",
    jobName: "R&D Scientist",
    active: true,
  },
];

const companySites: CompanySite[] = [
  {
    id: "site-acme-bkk",
    companyId: "c-acme",
    name: "Acme HQ Bangkok",
    geofenceType: "circle",
    centerLat: 13.7563,
    centerLng: 100.5018,
    radiusM: 120,
  },
  {
    id: "site-sun-rayong",
    companyId: "c-sun",
    name: "Sunshine Plant Rayong",
    geofenceType: "circle",
    centerLat: 12.7074,
    centerLng: 101.1474,
    radiusM: 200,
  },
  {
    id: "site-nova-chiangmai",
    companyId: "c-nova",
    name: "Nova Research Center",
    geofenceType: "circle",
    centerLat: 18.7883,
    centerLng: 98.9853,
    radiusM: 150,
  },
];

let requests = new Map<string, OTRequest>();

export const db = {
  getCompanies(): Company[] {
    return companies;
  },
  getJobsByCompany(companyId?: string): Job[] {
    if (!companyId) return jobs;
    return jobs.filter((job) => job.companyId === companyId && job.active);
  },
  searchCompanies(query: string): AutocompleteOption[] {
    const normalized = query.trim().toLowerCase();
    return companies
      .filter((company) =>
        !normalized
          ? true
          : company.name.toLowerCase().includes(normalized) || company.code.toLowerCase().includes(normalized),
      )
      .slice(0, 8)
      .map((company) => ({
        id: company.id,
        label: company.name,
        description: company.code,
        code: company.code,
      }));
  },
  searchJobs(companyId: string | undefined, query: string): AutocompleteOption[] {
    const normalized = query.trim().toLowerCase();
    return jobs
      .filter((job) => (!companyId ? true : job.companyId === companyId) && job.active)
      .filter((job) =>
        !normalized
          ? true
          : job.jobCode.toLowerCase().includes(normalized) || job.jobName.toLowerCase().includes(normalized),
      )
      .slice(0, 8)
      .map((job) => ({
        id: job.id,
        label: job.jobCode,
        description: job.jobName,
        code: job.jobCode,
      }));
  },
  createRequest(input: OTRequestInput): OTRequest {
    const company = companies.find((c) => c.id === input.companyId);
    const job = jobs.find((j) => j.id === input.jobId);

    if (!company || !job) {
      throw new Error("Invalid company or job selection");
    }

    const id = crypto.randomUUID();
    const docNo = generateDocumentNumber(company.code, job.jobCode);
    const hours = calculateOtHours(input.startAt, input.endAt);
    const createdAt = new Date().toISOString();

    const request: OTRequest = {
      id,
      docNo,
      company,
      job,
      hours,
      status: "submitted",
      createdAt,
      auditLog: [
        {
          id: crypto.randomUUID(),
          actor: input.employeeEmail,
          action: "submitted",
          meta: {
            managerEmail: input.managerEmail,
            noteLength: input.note?.length ?? 0,
            evidences: input.evidences.length,
          },
          createdAt,
        },
      ],
      ...input,
    };

    requests.set(id, request);

    return request;
  },
  listRequests(): OTRequest[] {
    return Array.from(requests.values());
  },
  getRequest(id: string): OTRequest | undefined {
    return requests.get(id);
  },
  updateRequestStatus(id: string, status: OTRequest["status"], actor: string, reason?: string): OTRequest {
    const request = requests.get(id);
    if (!request) {
      throw new Error("Request not found");
    }

    request.status = status;
    request.auditLog = [
      ...request.auditLog,
      {
        id: crypto.randomUUID(),
        actor,
        action: status,
        meta: { reason },
        createdAt: new Date().toISOString(),
      },
    ];

    requests.set(id, request);
    return request;
  },
  getSitesByCompany(companyId: string): CompanySite[] {
    return companySites.filter((site) => site.companyId === companyId);
  },
};

export function seedSampleRequest() {
  if (requests.size > 0) return;
  const now = new Date();
  const start = new Date(now.getTime() - 4 * 3600 * 1000);
  const end = now;
  const request = db.createRequest({
    companyId: "c-acme",
    jobId: "j-acme-engi",
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    employeeName: "Ethan Carter",
    employeeTitle: "Engineer",
    employeeEmail: "ethan@acme.test",
    managerName: "Alicia Keys",
    managerTitle: "Project Lead",
    managerEmail: "alicia@acme.test",
    note: "Project deadline",
    attachmentName: undefined,
    attachmentSize: undefined,
    attachmentType: undefined,
    consent: true,
    proofConsent: true,
    evidences: [
      {
        type: "start",
        location: {
          lat: 13.7563,
          lng: 100.5018,
          accuracyM: 18,
          timestamp: start.toISOString(),
          source: "gps",
        },
      },
      {
        type: "end",
        location: {
          lat: 13.7565,
          lng: 100.502,
          accuracyM: 22,
          timestamp: end.toISOString(),
          source: "gps",
        },
      },
    ],
  });

  db.updateRequestStatus(request.id, "approved", "alicia@acme.test");
}
