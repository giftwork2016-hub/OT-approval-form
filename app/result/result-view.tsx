import { db, seedSampleRequest } from "@/lib/data";
import { formatDateRange, formatHours } from "@/lib/utils";
import { BottomNav } from "@/components/BottomNav";
import { CheckCircle2, FileText, MapPin, ShieldCheck } from "lucide-react";

export default function ResultView() {
  seedSampleRequest();
  const request = db.listRequests()[0];

  if (!request) {
    return (
      <div className="flex min-h-screen items-center justify-center">No data</div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 via-white to-surface-100 pb-32">
      <header className="mx-auto flex w-full max-w-xl flex-col items-center gap-2 px-6 pb-6 pt-8 text-center">
        <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow">
          <ShieldCheck className="h-4 w-4 text-success" />
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-success">Approved</span>
        </div>
        <h1 className="text-2xl font-bold text-primary-700">OT Request Result</h1>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6">
        <section className="card space-y-6 p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-success" />
            <h2 className="text-lg font-semibold text-slate-800">Request Details</h2>
          </div>
          <dl className="space-y-3 text-sm text-slate-600">
            <div className="flex justify-between">
              <dt className="text-slate-500">Company</dt>
              <dd className="font-semibold text-slate-800">{request.company.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Job ID/Job Name</dt>
              <dd className="max-w-[200px] text-right text-slate-700">{request.job.jobCode} / {request.job.jobName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Time Period</dt>
              <dd>{formatDateRange(request.startAt, request.endAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">OT Hours</dt>
              <dd>{formatHours(request.hours)} hours</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Link/PDF File</dt>
              <dd className="flex items-center gap-2 text-primary-500">
                <FileText className="h-4 w-4" /> View Document
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="flex items-center gap-1 text-slate-500"><MapPin className="h-4 w-4 text-primary-400" /> Location</dt>
              <dd className="max-w-[220px] text-right text-slate-700">
                Lat: {request.evidences[0]?.location?.lat.toFixed(4)}, Lon: {request.evidences[0]?.location?.lng.toFixed(4)}
                <br />
                (Acc: {Math.round(request.evidences[0]?.location?.accuracyM ?? 0)}m, Geofence: Inside)
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Reason</dt>
              <dd>{request.note ?? "N/A"}</dd>
            </div>
          </dl>
        </section>

        <BottomNav active="requests" />
      </main>
    </div>
  );
}
