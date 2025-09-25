import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/data";
import { markTokenUsed, verifyApprovalToken } from "@/lib/tokens";

const payloadSchema = z.object({
  requestId: z.string().min(1),
  action: z.enum(["approve", "reject", "request-info"]),
  token: z.string().min(1),
  reason: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = payloadSchema.parse(body);
    const token = verifyApprovalToken(parsed.token, parsed.action);
    if (token.requestId !== parsed.requestId) {
      return NextResponse.json({ message: "Token does not match request" }, { status: 400 });
    }
    const updated = db.updateRequestStatus(parsed.requestId, mapActionToStatus(parsed.action), "manager");
    markTokenUsed(parsed.token);
    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation failed", issues: error.issues }, { status: 422 });
    }
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to update request" }, { status: 400 });
  }
}

function mapActionToStatus(action: "approve" | "reject" | "request-info") {
  switch (action) {
    case "approve":
      return "approved" as const;
    case "reject":
      return "rejected" as const;
    default:
      return "needs_info" as const;
  }
}
