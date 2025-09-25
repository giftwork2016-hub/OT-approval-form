"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { BottomNav } from "@/components/BottomNav";
import { StickySubmitBar } from "@/components/StickySubmitBar";
import { formatHours } from "@/lib/utils";
import type { OTRequest } from "@/lib/types";
import { CheckCircle2, Loader2, MapPin, ShieldCheck, TriangleAlert, XCircle } from "lucide-react";
import clsx from "clsx";

interface ApproveClientProps {
  requestId?: string | undefined;
  token?: string | undefined;
}

type ActionState = {
  status: "idle" | "loading" | "success" | "error";
  message?: string;
};

export default function ApproveClient({ requestId, token }: ApproveClientProps) {
  const [request, setRequest] = useState<OTRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [actionState, setActionState] = useState<ActionState>({ status: "idle" });
  const [activeAction, setActiveAction] = useState<"approve" | "reject" | "request-info">("approve");

  useEffect(() => {
    if (!requestId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/public/ot-requests/${requestId}`)
      .then((res) => res.json())
      .then((data) => setRequest(data.data))
      .catch(() => setActionState({ status: "error", message: "ไม่พบคำขอ" }))
      .finally(() => setLoading(false));
  }, [requestId]);

  const handleAction = async (action: "approve" | "reject" | "request-info") => {
    if (!requestId || !token) {
      setActionState({ status: "error", message: "ลิงก์ไม่ถูกต้อง" });
      return;
    }
    setActionState({ status: "loading" });
    setActiveAction(action);
    try {
      const response = await fetch("/api/approve/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          token,
          action,
          reason: reason.trim() || undefined,
        }),
      });
      if (!response.ok) {
        const message = await response.json().catch(() => ({ message: "ไม่สามารถดำเนินการได้" }));
        throw new Error(message.message ?? "ไม่สามารถดำเนินการได้");
      }
      const data = await response.json();
      setRequest(data.data);
      setActionState({ status: "success", message: "บันทึกผลเรียบร้อย" });
    } catch (error) {
      setActionState({ status: "error", message: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-100">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-100 px-6 text-center">
        <TriangleAlert className="h-10 w-10 text-danger" />
        <p className="text-lg font-semibold text-danger">ไม่พบคำขอหรืออาจหมดอายุ</p>
      </div>
    );
  }

  const startEvidence = request.evidences.find((evidence) => evidence.type === "start");

  const formatPeriod = `${format(new Date(request.startAt), "yyyy-MM-dd HH:mm", { locale: th })} – ${format(new Date(request.endAt), "HH:mm", { locale: th })}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 via-white to-surface-100 pb-36">
      <header className="mx-auto flex w-full max-w-xl flex-col items-center gap-2 px-6 pb-6 pt-8 text-center">
        <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow">
          <ShieldCheck className="h-4 w-4 text-primary-400" />
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-500">OT Approval</span>
        </div>
        <h1 className="text-2xl font-bold text-primary-700">OT Request Action</h1>
        <p className="text-sm text-slate-500">ตรวจสอบรายละเอียดและยืนยันผลการอนุมัติได้จากลิงก์นี้</p>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6">
        <section className="card space-y-6 p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Request Details</h2>
            <dl className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex justify-between">
                <dt className="font-medium text-slate-500">Employee</dt>
                <dd className="font-semibold text-slate-800">{request.employeeName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-slate-500">Date</dt>
                <dd>{formatPeriod}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-slate-500">Hours</dt>
                <dd>{formatHours(request.hours)} hours</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-slate-500">HR Email</dt>
                <dd className="text-slate-600">{request.hrEmail}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-slate-500">Proof Capture</dt>
                <dd className="text-slate-600">{request.proofEnabled ? "Enabled" : "Not attached"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-slate-500">Reason</dt>
                <dd className="max-w-[200px] text-right text-slate-600">{request.note ?? "N/A"}</dd>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1 text-slate-400"><MapPin className="h-3.5 w-3.5" /> Geofence</span>
                <span>
                  {request.proofEnabled && startEvidence?.inGeofence !== undefined
                    ? startEvidence.inGeofence
                      ? "Inside"
                      : "Outside"
                    : "Unknown"}
                </span>
              </div>
            </dl>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-800">Your Action</h2>
            <textarea
              placeholder="ระบุเหตุผลหากปฏิเสธหรือขอข้อมูลเพิ่ม..."
              className="input mt-3 min-h-[90px] resize-y"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>

          {actionState.status !== "idle" ? (
            <div
              className={clsx(
                "rounded-2xl px-4 py-3 text-sm",
                actionState.status === "success" ? "bg-success/10 text-success" : actionState.status === "error" ? "bg-danger/10 text-danger" : "bg-primary-50 text-primary-600",
              )}
            >
              {actionState.status === "loading" ? "กำลังบันทึก..." : actionState.message}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => handleAction("reject")}
              className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger shadow-sm shadow-danger/20 transition hover:bg-danger/20"
            >
              <XCircle className="mr-2 inline-block h-4 w-4" /> Reject
            </button>
            <button
              type="button"
              onClick={() => handleAction("approve")}
              className="rounded-2xl bg-success px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-success/40 transition hover:bg-success/90"
            >
              <CheckCircle2 className="mr-2 inline-block h-4 w-4" /> Approve
            </button>
            <button
              type="button"
              onClick={() => handleAction("request-info")}
              className="rounded-2xl bg-warning/20 px-4 py-3 text-sm font-semibold text-warning shadow-sm shadow-warning/30 transition hover:bg-warning/30"
            >
              ขอข้อมูลเพิ่ม
            </button>
          </div>
        </section>

        <BottomNav active="requests" />
      </main>

      <StickySubmitBar
        hours={request.hours}
        onSubmit={() => handleAction(activeAction)}
        disabled={actionState.status === "loading"}
        submitting={actionState.status === "loading"}
        summaryText={`OT ${formatHours(request.hours)} ชม.`}
        ctaText={activeAction === "approve" ? "ยืนยันการอนุมัติ" : activeAction === "reject" ? "บันทึกผลปฏิเสธ" : "ส่งคำขอข้อมูลเพิ่ม"}
      />
    </div>
  );
}
