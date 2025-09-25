"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Autocomplete } from "@/components/Autocomplete";
import { ProofCapture } from "@/components/ProofCapture";
import type { ProofEntry } from "@/components/ProofCapture";
import { StickySubmitBar } from "@/components/StickySubmitBar";
import { BottomNav } from "@/components/BottomNav";
import { calculateOtHours, formatDateForInput, formatHours, generateDocumentNumber } from "@/lib/utils";
import type { AutocompleteOption, EvidenceRecord, EvidenceType } from "@/lib/types";
import { FileUp, Info, Mail, NotebookPen, ShieldQuestion } from "lucide-react";
import clsx from "clsx";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useProfileStore } from "@/lib/hooks/useProfileStore";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const formSchema = z.object({
  companyId: z.string().min(1, "โปรดเลือกบริษัท"),
  jobId: z.string().min(1, "โปรดเลือกงาน"),
  startAt: z.string().min(1, "ระบุเวลาเริ่ม"),
  endAt: z.string().min(1, "ระบุเวลาสิ้นสุด"),
  employeeName: z.string().min(1, "ระบุชื่อพนักงาน"),
  employeeTitle: z.string().min(1, "ระบุตำแหน่ง"),
  employeeEmail: z.string().email("อีเมลไม่ถูกต้อง"),
  managerName: z.string().min(1, "ระบุชื่อหัวหน้า"),
  managerTitle: z.string().min(1, "ระบุตำแหน่งหัวหน้า"),
  managerEmail: z.string().email("อีเมลหัวหน้าไม่ถูกต้อง"),
  hrEmail: z.string().email("อีเมล HR ไม่ถูกต้อง"),
  note: z.string().optional(),
  consent: z.boolean().refine((value) => value, { message: "จำเป็นต้องยอมรับ" }),
});

const defaultStart = new Date();
const defaultEnd = new Date(defaultStart.getTime() + 2 * 3600 * 1000);

type FormValues = z.infer<typeof formSchema>;

type SubmissionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export default function HomePage() {
  const [selectedCompany, setSelectedCompany] = useState<AutocompleteOption | null>(null);
  const [selectedJob, setSelectedJob] = useState<AutocompleteOption | null>(null);
  const [companyInput, setCompanyInput] = useState("");
  const [jobInput, setJobInput] = useState("");
  const companyQuery = useDebouncedValue(companyInput, 250);
  const jobQuery = useDebouncedValue(jobInput, 250);
  const [docNo, setDocNo] = useState<string>("รอสร้างเมื่อเลือกข้อมูล");
  const [proofEnabled, setProofEnabled] = useState(false);
  const [proofEntries, setProofEntries] = useState<Partial<Record<EvidenceType, ProofEntry>>>({});
  const [proofConsent, setProofConsent] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [submission, setSubmission] = useState<SubmissionState>({ status: "idle" });
  const [submitting, setSubmitting] = useState(false);
  const { companies: savedCompanies, jobs: savedJobs } = useProfileStore();

  useEffect(() => {
    if (!proofEnabled) {
      setProofEntries({});
      setProofConsent(false);
    }
  }, [proofEnabled]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      companyId: "",
      jobId: "",
      startAt: formatDateForInput(defaultStart),
      endAt: formatDateForInput(defaultEnd),
      hrEmail: "",
      consent: false,
    },
  });

  const startAt = watch("startAt");
  const endAt = watch("endAt");

  const otHours = useMemo(() => {
    if (!startAt || !endAt) return 0;
    return calculateOtHours(new Date(startAt).toISOString(), new Date(endAt).toISOString());
  }, [startAt, endAt]);

  const { data: companyResult, isLoading: loadingCompanies } = useSWR(
    `/api/public/autocomplete/companies?q=${encodeURIComponent(companyQuery)}`,
    fetcher,
  );
  const remoteCompanyOptions = companyResult?.data ?? [];
  const savedCompanyOptions = useMemo(
    () =>
      savedCompanies.map<AutocompleteOption>((company) => ({
        id: company.id,
        label: company.name,
        description: company.code,
        code: company.code,
        hrEmail: company.hrEmail,
      })),
    [savedCompanies],
  );
  const companyOptions = useMemo(() => {
    const seen = new Set<string>();
    const combined: AutocompleteOption[] = [];

    for (const option of savedCompanyOptions) {
      if (seen.has(option.id)) continue;
      seen.add(option.id);
      combined.push(option);
    }

    for (const option of remoteCompanyOptions) {
      if (seen.has(option.id)) continue;
      seen.add(option.id);
      combined.push(option);
    }

    return combined;
  }, [savedCompanyOptions, remoteCompanyOptions]);

  const { data: jobResult, isLoading: loadingJobs } = useSWR(
    selectedCompany ? `/api/public/autocomplete/jobs?company_id=${selectedCompany.id}&q=${encodeURIComponent(jobQuery)}` : null,
    fetcher,
  );
  const remoteJobOptions = jobResult?.data ?? [];
  const savedJobOptions = useMemo(
    () =>
      savedJobs.map<AutocompleteOption>((job) => ({
        id: job.id,
        label: job.code,
        description: job.name,
        code: job.code,
      })),
    [savedJobs],
  );
  const jobOptions = useMemo(() => {
    const seen = new Set<string>();
    const combined: AutocompleteOption[] = [];

    for (const option of savedJobOptions) {
      if (seen.has(option.id)) continue;
      seen.add(option.id);
      combined.push(option);
    }

    for (const option of remoteJobOptions) {
      if (seen.has(option.id)) continue;
      seen.add(option.id);
      combined.push(option);
    }

    return combined;
  }, [savedJobOptions, remoteJobOptions]);

  const handleCompanyChange = (option: AutocompleteOption | null) => {
    setSelectedCompany(option);
    setSelectedJob(null);
    setJobInput("");
    if (option) {
      setValue("companyId", option.id, { shouldValidate: true });
      setDocNo(generateDocumentNumber(option.code ?? option.label, "OT"));
      setCompanyInput(option.label);
      setValue("hrEmail", option.hrEmail ?? "", { shouldValidate: true });
    } else {
      setValue("companyId", "", { shouldValidate: true });
      setDocNo("รอสร้างเมื่อเลือกข้อมูล");
      setCompanyInput("");
      setValue("hrEmail", "", { shouldValidate: true });
    }
  };

  const handleJobChange = (option: AutocompleteOption | null) => {
    setSelectedJob(option);
    if (option) {
      setValue("jobId", option.id, { shouldValidate: true });
      setJobInput(option.label);
      if (selectedCompany) {
        setDocNo(generateDocumentNumber(selectedCompany.code ?? selectedCompany.label, option.code ?? option.label));
      }
    } else {
      setValue("jobId", "", { shouldValidate: true });
      setJobInput("");
    }
  };

  const updateProofEntry = (type: EvidenceType, entry: ProofEntry | null) => {
    setProofEntries((prev) => ({
      ...prev,
      [type]: entry ?? undefined,
    }));
  };

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const onSubmit = async (values: FormValues) => {
    if (proofEnabled && !proofConsent) {
      setSubmission({ status: "error", message: "กรุณายืนยันการยินยอมบันทึกข้อมูลพิกัด" });
      return;
    }

    setSubmitting(true);
    setSubmission({ status: "idle" });
    try {
      const resolvedEvidences: (EvidenceRecord | null)[] = proofEnabled
        ? await Promise.all(
            (Object.keys(proofEntries) as EvidenceType[]).map(async (type) => {
              const entry = proofEntries[type];
              if (!entry) return null;
              const photo = entry.photo?.file
                ? {
                    url: await fileToDataUrl(entry.photo.file),
                    hash: entry.photo.hash,
                    size: entry.photo.size,
                    mimeType: entry.photo.mimeType,
                    capturedAt: entry.photo.capturedAt,
                  }
                : undefined;
              const record: EvidenceRecord = {
                type,
                photo,
                location: entry.location,
                inGeofence: entry.inGeofence,
                lowAccuracy: entry.lowAccuracy,
                riskOutOfBounds: entry.riskOutOfBounds,
                siteId: entry.siteId ?? null,
              };
              return record;
            }),
          )
        : [];
      const evidencePayload: EvidenceRecord[] = proofEnabled
        ? resolvedEvidences.filter((record): record is EvidenceRecord => Boolean(record))
        : [];

      const payload = {
        ...values,
        employeeEmail: values.employeeEmail.trim(),
        managerEmail: values.managerEmail.trim(),
        hrEmail: values.hrEmail.trim(),
        companyCode: selectedCompany?.code?.trim() || selectedCompany?.label?.trim(),
        companyName: selectedCompany?.label?.trim(),
        jobCode: selectedJob?.code?.trim() || selectedJob?.label?.trim(),
        jobName: selectedJob?.description?.trim() || selectedJob?.label?.trim(),
        startAt: new Date(values.startAt).toISOString(),
        endAt: new Date(values.endAt).toISOString(),
        attachmentName: attachmentFile?.name,
        attachmentSize: attachmentFile?.size,
        attachmentType: attachmentFile?.type,
        consent: values.consent,
        proofEnabled,
        proofConsent: proofEnabled ? proofConsent : false,
        evidences: evidencePayload,
      };

      const response = await fetch("/api/public/ot-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await response.json().catch(() => ({ message: "ไม่สามารถส่งคำขอ" }));
        throw new Error(message.message ?? "ไม่สามารถส่งคำขอ");
      }

      const result = await response.json();
      setSubmission({ status: "success", message: `ส่งคำขอสำเร็จ เลขที่เอกสาร ${result.data.docNo}` });
    } catch (error) {
      setSubmission({ status: "error", message: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" });
    } finally {
      setSubmitting(false);
    }
  };

  const submitForm = handleSubmit(onSubmit);

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 via-white to-surface-100 pb-40">
      <header className="mx-auto flex w-full max-w-4xl flex-col items-center gap-2 px-6 pb-6 pt-8 text-center">
        <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-md shadow-primary-100/60">
          <span className="h-3 w-3 rounded-full bg-accent-400" />
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-500">OT Request</span>
        </div>
        <h1 className="text-2xl font-bold text-primary-700 sm:text-3xl">ส่งคำขอทำ OT ได้ภายในหน้าเดียว</h1>
        <p className="max-w-xl text-sm text-slate-500">
          ฟอร์มสาธารณะสำหรับพนักงานทุกคน กรอกข้อมูล สแน็ปภาพ และแนบพิกัดเพื่อยืนยันการทำงานนอกเวลา พร้อมส่งให้หัวหน้าอนุมัติทันที
        </p>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6">
        <form className="card space-y-8 p-6 sm:p-8" onSubmit={submitForm}>
          <input type="hidden" {...register("companyId")} />
          <input type="hidden" {...register("jobId")} />
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="pill">Request Details</div>
              <span className="text-xs text-slate-400">เอกสาร: {docNo}</span>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Autocomplete
                label="Company"
                value={selectedCompany}
                inputValue={companyInput}
                onChange={handleCompanyChange}
                onInputValueChange={setCompanyInput}
                options={companyOptions}
                loading={loadingCompanies}
                placeholder="เลือกบริษัท"
                required
                error={errors.companyId?.message}
              />
              <Autocomplete
                label="Job ID"
                value={selectedJob}
                inputValue={jobInput}
                onChange={handleJobChange}
                onInputValueChange={setJobInput}
                options={jobOptions}
                loading={loadingJobs}
                placeholder="ค้นหา Job"
                required
                disabled={!selectedCompany}
                error={errors.jobId?.message}
              />
              <div>
                <label className="label">Job Name</label>
                <input className="input" value={selectedJob?.description ?? "-"} readOnly />
              </div>
              <div>
                <label className="label">Document No.</label>
                <input className="input" value={docNo} readOnly />
              </div>
              <div>
                <label className="label">Start datetime</label>
                <input
                  type="datetime-local"
                  className={clsx("input", errors.startAt && "border-danger focus:ring-danger/40")}
                  {...register("startAt")}
                />
                {errors.startAt ? <p className="mt-1 text-xs text-danger">{errors.startAt.message}</p> : null}
              </div>
              <div>
                <label className="label">End datetime</label>
                <input
                  type="datetime-local"
                  className={clsx("input", errors.endAt && "border-danger focus:ring-danger/40")}
                  {...register("endAt")}
                />
                {errors.endAt ? <p className="mt-1 text-xs text-danger">{errors.endAt.message}</p> : null}
              </div>
              <div>
                <label className="label">OT Hours (calculated)</label>
                <input className="input" value={otHours ? `${formatHours(otHours)} ชั่วโมง` : "-"} readOnly />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="pill">Employee Information</div>
              <Mail className="h-5 w-5 text-primary-400" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="label">Name</label>
                <input className={clsx("input", errors.employeeName && "border-danger focus:ring-danger/40")} {...register("employeeName")} placeholder="ชื่อ-นามสกุล" />
                {errors.employeeName ? <p className="mt-1 text-xs text-danger">{errors.employeeName.message}</p> : null}
              </div>
              <div>
                <label className="label">Title</label>
                <input className={clsx("input", errors.employeeTitle && "border-danger focus:ring-danger/40")} {...register("employeeTitle")} placeholder="ตำแหน่ง" />
                {errors.employeeTitle ? <p className="mt-1 text-xs text-danger">{errors.employeeTitle.message}</p> : null}
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  className={clsx("input", errors.employeeEmail && "border-danger focus:ring-danger/40")}
                  {...register("employeeEmail")}
                  inputMode="email"
                  placeholder="name@example.com"
                />
                {errors.employeeEmail ? <p className="mt-1 text-xs text-danger">{errors.employeeEmail.message}</p> : null}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="pill">Manager Information</div>
              <NotebookPen className="h-5 w-5 text-primary-400" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="label">Name</label>
                <input className={clsx("input", errors.managerName && "border-danger focus:ring-danger/40")} {...register("managerName")} placeholder="ชื่อหัวหน้า" />
                {errors.managerName ? <p className="mt-1 text-xs text-danger">{errors.managerName.message}</p> : null}
              </div>
              <div>
                <label className="label">Title</label>
                <input className={clsx("input", errors.managerTitle && "border-danger focus:ring-danger/40")} {...register("managerTitle")} placeholder="หัวหน้าแผนก" />
                {errors.managerTitle ? <p className="mt-1 text-xs text-danger">{errors.managerTitle.message}</p> : null}
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  className={clsx("input", errors.managerEmail && "border-danger focus:ring-danger/40")}
                  {...register("managerEmail")}
                  inputMode="email"
                  placeholder="manager@example.com"
                />
                {errors.managerEmail ? <p className="mt-1 text-xs text-danger">{errors.managerEmail.message}</p> : null}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="pill">HR Notification</div>
              <Mail className="h-5 w-5 text-primary-400" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">HR Email</label>
                <input
                  className={clsx("input", errors.hrEmail && "border-danger focus:ring-danger/40")}
                  {...register("hrEmail")}
                  inputMode="email"
                  placeholder="hr@example.com"
                />
                {errors.hrEmail ? <p className="mt-1 text-xs text-danger">{errors.hrEmail.message}</p> : null}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="pill">Additional Details</div>
              <Info className="h-5 w-5 text-primary-400" />
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Note (optional)</label>
                <textarea
                  className="input min-h-[90px] resize-y"
                  maxLength={400}
                  placeholder="ระบุเหตุผลหรือรายละเอียดเพิ่มเติม"
                  {...register("note")}
                />
                <p className="mt-1 text-xs text-slate-400">สูงสุด 400 อักขระ</p>
              </div>
              <div>
                <label className="label flex items-center gap-2">
                  <FileUp className="h-4 w-4 text-primary-400" />
                  Attachment (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="input"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setAttachmentFile(file);
                  }}
                />
                {attachmentFile ? (
                  <p className="mt-1 text-xs text-primary-500">{attachmentFile.name} • {Math.round(attachmentFile.size / 1024)} KB</p>
                ) : (
                  <p className="mt-1 text-xs text-slate-400">รองรับไฟล์ภาพ ขนาดไม่เกิน 5MB</p>
                )}
              </div>
            </div>
          </section>

          <ProofCapture
            companyId={selectedCompany?.id}
            value={proofEntries}
            onChange={updateProofEntry}
            enabled={proofEnabled}
            onEnabledChange={setProofEnabled}
            consent={proofConsent}
            onConsentChange={setProofConsent}
          />

          <section className="space-y-3 rounded-3xl bg-white/70 p-5 shadow-inner shadow-primary-100/70">
            <label className="flex items-start gap-3 text-sm text-slate-600">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 rounded border-primary-300 text-primary-500 focus:ring-primary-400"
                {...register("consent")}
              />
              <span>
                ฉันยอมรับข้อกำหนดและนโยบายการคุ้มครองข้อมูลส่วนบุคคลของบริษัท รวมถึงการจัดเก็บข้อมูลเพื่อการจ่ายค่าตอบแทน
              </span>
            </label>
            {errors.consent ? <p className="text-xs text-danger">{errors.consent.message}</p> : null}
          </section>

          {submission.status !== "idle" ? (
            <div
              className={clsx(
                "rounded-2xl px-4 py-3 text-sm",
                submission.status === "success"
                  ? "bg-success/10 text-success"
                  : "bg-danger/10 text-danger",
              )}
            >
              {submission.message}
            </div>
          ) : null}
        </form>

        <BottomNav active="requests" />
      </main>

      <footer className="mx-auto mt-12 flex w-full max-w-4xl flex-col gap-2 px-6 pb-32 text-sm text-slate-400">
        <div className="flex flex-wrap gap-3">
          <a href="#" className="hover:text-primary-500">Privacy Policy</a>
          <a href="#" className="hover:text-primary-500">Data Retention</a>
          <a href="#" className="hover:text-primary-500">ติดต่อแอดมิน</a>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldQuestion className="h-4 w-4" />
          ระบบบันทึกเวลาเป็น Asia/Bangkok และจัดเก็บบนเซิร์ฟเวอร์ที่ปลอดภัย
        </div>
      </footer>

      <StickySubmitBar
        hours={otHours}
        onSubmit={submitForm}
        disabled={!isValid || submitting}
        submitting={submitting}
      />
    </div>
  );
}
