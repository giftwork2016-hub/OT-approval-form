import { NextResponse } from "next/server";
import { db } from "@/lib/data";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const request = db.getRequest(params.id);
  if (!request) {
    return NextResponse.json({ message: "Request not found" }, { status: 404 });
  }
  return NextResponse.json({ data: { docNo: request.docNo } });
}
