"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import imageCompression from "browser-image-compression";
import { Camera, Crosshair, Loader2, MapPin, RefreshCcw, ShieldCheck } from "lucide-react";
import useSWR from "swr";
import clsx from "clsx";
import type { EvidenceType, ProofLocation } from "@/lib/types";
import { evaluateGeofence } from "@/lib/geofence";
import { hashFile } from "@/lib/utils";

const GeoMap = dynamic(() => import("./GeoMap").then((mod) => mod.GeoMap), { ssr: false });

export interface ProofEntry {
  photo?: {
    file?: File;
    previewUrl: string;
    hash: string;
    capturedAt: string;
    size: number;
    mimeType: string;
  } | null | undefined;
  location?: ProofLocation | undefined;
  inGeofence?: boolean | undefined;
  lowAccuracy?: boolean | undefined;
  riskOutOfBounds?: boolean | undefined;
  siteId?: string | null | undefined;
}

interface ProofCaptureProps {
  companyId?: string | undefined;
  value: Partial<Record<EvidenceType, ProofEntry>>;
  onChange: (type: EvidenceType, entry: ProofEntry | null) => void;
  enabled: boolean;
  onEnabledChange: (value: boolean) => void;
  consent: boolean;
  onConsentChange: (value: boolean) => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ProofCapture({
  companyId,
  value,
  onChange,
  enabled,
  onEnabledChange,
  consent,
  onConsentChange,
}: ProofCaptureProps) {
  const [activeType, setActiveType] = useState<EvidenceType>("start");
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const entry = value[activeType] ?? null;

  const { data: siteData } = useSWR(companyId ? `/api/public/company-sites?company_id=${companyId}` : null, fetcher, {
    revalidateOnFocus: false,
  });
  const sites = siteData?.data ?? [];

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsCapturing(true);
    try {
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 1280,
        maxSizeMB: 2,
        useWebWorker: true,
      });
      const hash = await hashFile(compressed);
      const previewUrl = URL.createObjectURL(compressed);
      onChange(activeType, {
        ...(entry ?? {}),
        photo: {
          file: compressed,
          previewUrl,
          hash,
          size: compressed.size,
          mimeType: compressed.type,
          capturedAt: new Date().toISOString(),
        },
        location: entry?.location,
        inGeofence: entry?.inGeofence,
        lowAccuracy: entry?.lowAccuracy,
        riskOutOfBounds: entry?.riskOutOfBounds,
        siteId: entry?.siteId,
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const acquireLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = position.coords;
        const location: ProofLocation = {
          lat: coords.latitude,
          lng: coords.longitude,
          accuracyM: coords.accuracy,
          timestamp: new Date().toISOString(),
          source: "gps",
        };
        const { inGeofence, siteId } = evaluateGeofence(location, sites);
        const lowAccuracy = (location.accuracyM ?? 1000) > 50;
        onChange(activeType, {
          ...(entry ?? {}),
          location,
          inGeofence,
          siteId,
          lowAccuracy,
          riskOutOfBounds: !inGeofence,
        });
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        alert("Unable to retrieve location.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleMarkerDrag = (position: { lat: number; lng: number }) => {
    if (!entry?.location) return;
    const location = {
      ...entry.location,
      lat: position.lat,
      lng: position.lng,
      source: "manual" as const,
      timestamp: new Date().toISOString(),
    };
    const { inGeofence, siteId } = evaluateGeofence(location, sites);
    const lowAccuracy = (location.accuracyM ?? 1000) > 50;
    onChange(activeType, {
      ...entry,
      location,
      inGeofence,
      siteId,
      lowAccuracy,
      riskOutOfBounds: !inGeofence,
    });
  };

  const locationSummary = entry?.location
    ? `${entry.location.lat.toFixed(5)}, ${entry.location.lng.toFixed(5)} (±${Math.round(entry.location.accuracyM)}m)`
    : "ยังไม่มีพิกัด";

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-title">Proof (Photo + GPS)</p>
          <p className="text-sm text-slate-500">บันทึกภาพและพิกัดเพื่อยืนยันการทำงานในพื้นที่</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-500 shadow">
            <span>{enabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}</span>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-primary-200 text-primary-500 focus:ring-primary-400"
              checked={enabled}
              onChange={(event) => onEnabledChange(event.target.checked)}
            />
          </label>
          <ShieldCheck className="h-6 w-6 text-primary-400" />
        </div>
      </header>

      {!enabled ? (
        <div className="rounded-3xl bg-white/60 p-6 text-sm text-slate-500 shadow-inner shadow-primary-100/60">
          <p className="font-medium text-slate-600">ไม่ต้องการแนบหลักฐาน</p>
          <p className="mt-2 text-xs text-slate-500">
            หากต้องการยืนยันสถานที่และภาพถ่าย ให้เปิดใช้งานส่วน Proof เพื่อบันทึกข้อมูลเพิ่มเติม
          </p>
        </div>
      ) : (
        <>
          <div className="flex gap-2 rounded-full bg-surface-100 p-1 text-sm">
            {(["start", "end"] as EvidenceType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setActiveType(type)}
                className={clsx(
                  "flex-1 rounded-full px-4 py-2 font-semibold capitalize transition",
                  activeType === type ? "bg-white text-primary-600 shadow" : "text-slate-500",
                )}
              >
                {type === "start" ? "เริ่ม OT" : "สิ้นสุด OT"}
              </button>
            ))}
          </div>

          <div className="space-y-3 rounded-3xl bg-white/70 p-4 shadow-inner shadow-primary-100/60">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={triggerFilePicker}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary-500 px-4 py-3 font-semibold text-white shadow-lg shadow-primary-400/30 transition hover:bg-primary-600"
                disabled={isCapturing}
              >
                {isCapturing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-5 w-5" />}
                {entry?.photo ? "บันทึกอีกครั้ง" : "ถ่ายภาพ"}
              </button>
              <button
                type="button"
                onClick={acquireLocation}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-primary-200 bg-white px-4 py-3 font-semibold text-primary-600 shadow-sm shadow-primary-100/40 transition hover:bg-primary-50"
                disabled={isLocating}
              >
                {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-5 w-5" />}
                ดึงพิกัด
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>

            {entry?.photo ? (
              <div className="overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={entry.photo.previewUrl} alt="Proof" className="h-48 w-full object-cover" />
                <div className="flex items-center justify-between bg-primary-50 px-4 py-2 text-xs text-primary-700">
                  <span>{Math.round(entry.photo.size / 1024)} KB</span>
                  <span className="flex items-center gap-1"><RefreshCcw className="h-3.5 w-3.5" /> {entry.photo.hash.slice(0, 8)}</span>
                </div>
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-300 text-sm text-slate-400">
                ยังไม่มีภาพหลักฐาน
              </div>
            )}

            <div className="space-y-2 rounded-2xl bg-surface-100 p-4 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="h-4 w-4 text-primary-400" />
                <span>{locationSummary}</span>
              </div>
              {entry?.location ? (
                <p className="text-xs text-slate-500">
                  อัปเดต {new Date(entry.location.timestamp).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                  {entry.location.source === "manual" ? " (ปรับเอง)" : ""}
                </p>
              ) : null}
              {entry?.lowAccuracy ? (
                <p className="text-xs text-warning">ความแม่นยำสูงกว่า 50m กรุณาขยับพินถ้าจำเป็น</p>
              ) : null}
              {entry?.inGeofence !== undefined ? (
                <p className={clsx("text-xs font-semibold", entry.inGeofence ? "text-success" : "text-danger")}>
                  {entry.inGeofence ? "อยู่ในพื้นที่ที่กำหนด" : "อยู่นอกพื้นที่ที่กำหนด"}
                </p>
              ) : null}
            </div>

            {entry?.location ? (
              <div className="overflow-hidden rounded-3xl border border-slate-100 shadow">
                <GeoMap position={{ lat: entry.location.lat, lng: entry.location.lng }} onDrag={handleMarkerDrag} />
              </div>
            ) : null}
          </div>

          <label className="flex items-start gap-3 rounded-3xl bg-white/60 p-4 shadow">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5 rounded border-primary-300 text-primary-500 focus:ring-primary-400"
              checked={consent}
              onChange={(event) => onConsentChange(event.target.checked)}
            />
            <span className="text-sm text-slate-600">
              ยินยอมให้ระบบบันทึกและประมวลผลภาพถ่ายและข้อมูลพิกัดเพื่อการยืนยันการทำงานล่วงเวลา ตามนโยบายข้อมูลส่วนบุคคล
            </span>
          </label>
        </>
      )}
    </section>
  );
}
