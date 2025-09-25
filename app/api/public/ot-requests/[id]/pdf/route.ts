import { NextResponse } from "next/server";
import { db } from "@/lib/data";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const request = db.getRequest(params.id);
  if (!request) {
    return NextResponse.json({ message: "Request not found" }, { status: 404 });
  }
  // Placeholder PDF payload
  const pdfSummary = `OT Request ${request.docNo}\nEmployee: ${request.employeeName}\nHours: ${request.hours}`;
  return new NextResponse(pdfSummary, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${request.docNo}.pdf"`,
    },
  });
}
