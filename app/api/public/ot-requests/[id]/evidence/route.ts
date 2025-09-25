import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/data";
import type { EvidenceRecord } from "@/lib/types";

const payloadSchema = z.object({
  type: z.enum(["start", "end"]),
  photo: z
    .object({
      url: z.string().url(),
      hash: z.string(),
      size: z.number(),
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
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const requestRecord = db.getRequest(params.id);
    if (!requestRecord) {
      return NextResponse.json({ message: "Request not found" }, { status: 404 });
    }
    const body = await request.json();
    const parsed = payloadSchema.parse(body);
    const nextEntry: EvidenceRecord = {
      type: parsed.type,
      inGeofence: Boolean(parsed.location),
      siteId: null,
    };

    if (parsed.location) {
      nextEntry.location = parsed.location;
    }
    if (parsed.photo) {
      nextEntry.photo = parsed.photo;
    }

    requestRecord.evidences = requestRecord.evidences
      .filter((item) => item.type !== parsed.type)
      .concat(nextEntry);
    return NextResponse.json({ data: requestRecord });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation failed", issues: error.issues }, { status: 422 });
    }
    return NextResponse.json({ message: "Unable to save evidence" }, { status: 500 });
  }
}
