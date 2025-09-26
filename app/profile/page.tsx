"use client";

import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Building2, Briefcase, CheckCircle2 } from "lucide-react";
import { useProfileStore } from "@/lib/hooks/useProfileStore";

export default function ProfilePage() {
  const [companyName, setCompanyName] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [companyHrEmail, setCompanyHrEmail] = useState("");
  const [jobId, setJobId] = useState("");
  const [jobName, setJobName] = useState("");
  const [jobCompanyId, setJobCompanyId] = useState("");
  const [companySaved, setCompanySaved] = useState(false);
  const [jobSaved, setJobSaved] = useState(false);
  const { companies, jobs, addCompany, addJob } = useProfileStore();

  useEffect(() => {
    if (companies.length === 0) {
      setJobCompanyId("");
      return;
    }

    setJobCompanyId((previous) => {
      const stillExists = companies.some((company) => company.id === previous);
      return stillExists ? previous : companies[0]?.id ?? "";
    });
  }, [companies]);

  const handleCompanySubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addCompany({ name: companyName, code: companyCode, hrEmail: companyHrEmail });
    setCompanyName("");
    setCompanyCode("");
    setCompanyHrEmail("");
    setCompanySaved(true);
    setTimeout(() => setCompanySaved(false), 3000);
  };

  const handleJobSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!jobCompanyId) {
      return;
    }
    addJob({ code: jobId, name: jobName, companyId: jobCompanyId });
    setJobId("");
    setJobName("");
    setJobSaved(true);
    setTimeout(() => setJobSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 via-white to-surface-100 pb-32">
      <header className="mx-auto flex w-full max-w-3xl flex-col items-center gap-2 px-6 pb-6 pt-8 text-center">
        <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-md shadow-primary-100/60">
          <span className="h-3 w-3 rounded-full bg-accent-400" />
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-500">Profile</span>
        </div>
        <h1 className="text-2xl font-bold text-primary-700 sm:text-3xl">ตั้งค่าข้อมูลบริษัทและงาน</h1>
        <p className="max-w-xl text-sm text-slate-500">
          บันทึกข้อมูลพื้นฐานของบริษัทและงานที่ต้องใช้งานบ่อย ๆ เพื่อให้การส่งคำขอ OT รวดเร็วขึ้น
        </p>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6">
        <form className="card space-y-6 p-6 sm:p-8" onSubmit={handleCompanySubmit}>
          <div className="flex items-center gap-3">
            <div className="pill">Company Information</div>
            <Building2 className="h-5 w-5 text-primary-400" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Company Name</label>
              <input
                className="input"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="ระบุชื่อบริษัท"
                required
              />
            </div>
            <div>
              <label className="label">Company Code</label>
              <input
                className="input"
                value={companyCode}
                onChange={(event) => setCompanyCode(event.target.value)}
                placeholder="เช่น ACM"
                required
              />
            </div>
            <div>
              <label className="label">HR Email</label>
              <input
                className="input"
                value={companyHrEmail}
                onChange={(event) => setCompanyHrEmail(event.target.value)}
                placeholder="hr@example.com"
                inputMode="email"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-500 px-4 py-3 font-semibold text-white shadow-lg shadow-primary-400/30 transition hover:bg-primary-600"
          >
            บันทึกข้อมูลบริษัท
          </button>
          {companySaved ? (
            <div className="flex items-center gap-2 rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" /> บันทึกเรียบร้อยแล้ว
            </div>
          ) : null}
        </form>

        <section className="card space-y-6 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="pill">Company Records</div>
            <Building2 className="h-5 w-5 text-primary-400" />
          </div>
          {companies.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3 font-medium">ลำดับ</th>
                    <th className="px-4 py-3 font-medium">ชื่อบริษัท</th>
                    <th className="px-4 py-3 font-medium">Company Code</th>
                    <th className="px-4 py-3 font-medium">HR Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {companies.map((company, index) => (
                    <tr key={`${company.name}-${company.code}-${index}`}>
                      <td className="px-4 py-3 text-slate-400">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">{company.name}</td>
                      <td className="px-4 py-3">{company.code}</td>
                      <td className="px-4 py-3">{company.hrEmail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-400">
              ยังไม่มีข้อมูลบริษัทที่บันทึกไว้
            </p>
          )}
        </section>

        <form className="card space-y-6 p-6 sm:p-8" onSubmit={handleJobSubmit}>
          <div className="flex items-center gap-3">
            <div className="pill">Job Defaults</div>
            <Briefcase className="h-5 w-5 text-primary-400" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label">Job ID</label>
              <input
                className="input"
                value={jobId}
                onChange={(event) => setJobId(event.target.value)}
                placeholder="เช่น OPS-001"
                required
              />
            </div>
            <div>
              <label className="label">Job Name</label>
              <input
                className="input"
                value={jobName}
                onChange={(event) => setJobName(event.target.value)}
                placeholder="ระบุชื่องาน"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">บริษัทที่เป็นเจ้าของงาน</label>
              <select
                className="input"
                value={jobCompanyId}
                onChange={(event) => setJobCompanyId(event.target.value)}
                disabled={companies.length === 0}
                required
              >
                {companies.length === 0 ? (
                  <option value="">กรุณาบันทึกข้อมูลบริษัทก่อน</option>
                ) : null}
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-500 px-4 py-3 font-semibold text-white shadow-lg shadow-primary-400/30 transition hover:bg-primary-600"
            disabled={companies.length === 0}
          >
            บันทึกข้อมูลงาน
          </button>
          {jobSaved ? (
            <div className="flex items-center gap-2 rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" /> บันทึกเรียบร้อยแล้ว
            </div>
          ) : null}
        </form>

        <section className="card space-y-6 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="pill">Job Records</div>
            <Briefcase className="h-5 w-5 text-primary-400" />
          </div>
          {jobs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3 font-medium">ลำดับ</th>
                    <th className="px-4 py-3 font-medium">Job ID</th>
                    <th className="px-4 py-3 font-medium">Job Name</th>
                    <th className="px-4 py-3 font-medium">บริษัท</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.map((job, index) => {
                    const company = companies.find((item) => item.id === job.companyId);
                    return (
                      <tr key={`${job.id}-${job.code}-${index}`}>
                        <td className="px-4 py-3 text-slate-400">{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-slate-700">{job.code}</td>
                        <td className="px-4 py-3">{job.name}</td>
                        <td className="px-4 py-3">{company ? company.name : "ไม่ระบุ"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-400">
              ยังไม่มีข้อมูลงานที่บันทึกไว้
            </p>
          )}
        </section>

        <div className="rounded-3xl bg-white/70 p-6 text-sm text-slate-500 shadow-inner shadow-primary-100/60">
          <p className="font-semibold text-slate-700">Tips</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>ตั้งค่าบริษัทและงานที่ใช้งานบ่อยเพื่อเลือกได้เร็วขึ้นจากเมนู My Requests</li>
            <li>ตรวจสอบอีเมล HR ให้ถูกต้องเพื่อให้ระบบแจ้งเตือนผลอนุมัติได้ทันที</li>
          </ul>
        </div>

        <BottomNav active="profile" />
      </main>
    </div>
  );
}
