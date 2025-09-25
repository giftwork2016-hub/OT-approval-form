import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/data";
import type { EvidenceType } from "@/lib/types";
import { createApprovalTokens } from "@/lib/tokens";

const evidenceSchema = z.object({
  type: z.enum(["start", "end"] as [EvidenceType, EvidenceType]),
  photo: z
    .object({
      url: z.string().url(),
      hash: z.string(),
      size: z.number().int().nonnegative(),
      width: z.number().int().optional(),
      height: z.number().int().optional(),
      capturedAt: z.string(),
      mimeType: z.string(),
    })
    .optional(),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
      accuracyM: z.number(),
      timestamp: z.string(),
      source: z.enum(["gps", "manual"]),
    })
    .optional(),
  inGeofence: z.boolean().optional(),
  lowAccuracy: z.boolean().optional(),
  riskOutOfBounds: z.boolean().optional(),
  siteId: z.string().nullable().optional(),
});

const requestSchema = z.object({
  companyId: z.string().min(1),
  jobId: z.string().min(1),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  employeeName: z.string().min(1),
  employeeTitle: z.string().min(1),
  employeeEmail: z.string().email(),
  managerName: z.string().min(1),
  managerTitle: z.string().min(1),
  managerEmail: z.string().email(),
  hrEmail: z.string().email(),
  note: z.string().optional(),
  attachmentName: z.string().optional(),
  attachmentSize: z.number().optional(),
  attachmentType: z.string().optional(),
  consent: z.boolean(),
  proofEnabled: z.boolean(),
  proofConsent: z.boolean(),
  evidences: z.array(evidenceSchema),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.parse(body);
    if (!parsed.consent) {
      return NextResponse.json({ message: "Consent is required" }, { status: 400 });
    }
    if (parsed.proofEnabled && !parsed.proofConsent) {
      return NextResponse.json({ message: "Proof consent is required when proof capture is enabled" }, { status: 400 });
    }
    const created = db.createRequest(parsed);
    const tokens = createApprovalTokens(created.id);
    return NextResponse.json({ data: created, tokens });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation failed", issues: error.issues }, { status: 422 });
    }
    return NextResponse.json({ message: "Unable to create request" }, { status: 500 });
  }
}
