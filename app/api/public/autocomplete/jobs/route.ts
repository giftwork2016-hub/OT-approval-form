import { NextResponse } from "next/server";
import { db } from "@/lib/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const companyId = searchParams.get("company_id") ?? undefined;
  const results = db.searchJobs(companyId, query);
  return NextResponse.json({ data: results });
}
