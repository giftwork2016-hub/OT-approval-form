import { NextResponse } from "next/server";
import { db } from "@/lib/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("company_id");
  if (!companyId) {
    return NextResponse.json({ data: [] });
  }
  const sites = db.getSitesByCompany(companyId);
  return NextResponse.json({ data: sites });
}
