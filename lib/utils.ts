import { differenceInMinutes, parseISO } from "date-fns";

function getGlobalCrypto(): Crypto | undefined {
  if (typeof globalThis === "undefined") {
    return undefined;
  }
  return (globalThis.crypto as Crypto | undefined) ?? undefined;
}

function getRandomInt(max: number): number {
  const cryptoObj = getGlobalCrypto();
  if (cryptoObj && "getRandomValues" in cryptoObj) {
    const buffer = new Uint32Array(1);
    cryptoObj.getRandomValues(buffer);
    const value = buffer[0];
    if (typeof value === "number") {
      return value % max;
    }
  }
  return Math.floor(Math.random() * max);
}

export function generateDocumentNumber(companyCode: string, jobCode: string): string {
  const base = `${companyCode}-${jobCode}`.replace(/\s+/g, "");
  const random = getRandomInt(1_000_000).toString().padStart(6, "0");
  return `${base}-${random}`;
}

function createUuidFallback(): string {
  const randomBytes = new Uint8Array(16);
  const cryptoObj = getGlobalCrypto();

  if (cryptoObj?.getRandomValues) {
    cryptoObj.getRandomValues(randomBytes);
  } else {
    for (let index = 0; index < randomBytes.length; index += 1) {
      randomBytes[index] = Math.floor(Math.random() * 256);
    }
  }

  const byte6 = randomBytes[6] ?? 0;
  randomBytes[6] = (byte6 & 0x0f) | 0x40;
  const byte8 = randomBytes[8] ?? 0;
  randomBytes[8] = (byte8 & 0x3f) | 0x80;

  const hex = Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex
    .slice(10, 16)
    .join("")}`;
}

export function safeRandomUUID(): string {
  const cryptoObj = getGlobalCrypto();
  if (typeof cryptoObj?.randomUUID === "function") {
    try {
      return cryptoObj.randomUUID();
    } catch (error) {
      // fall back to manual generation below
    }
  }
  return createUuidFallback();
}

export function calculateOtHours(startISO: string, endISO: string): number {
  const start = parseISO(startISO);
  let end = parseISO(endISO);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  if (end < start) {
    end = new Date(end.getTime() + 24 * 3600 * 1000);
  }
  const minutes = differenceInMinutes(end, start);
  if (minutes <= 0) return 0;
  const rawHours = minutes / 60;
  return roundUpToQuarter(rawHours);
}

export function roundUpToQuarter(hours: number): number {
  return Math.ceil(hours * 4) / 4;
}

export function formatDateForInput(date: Date): string {
  const tzOffset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - tzOffset * 60000);
  return local.toISOString().slice(0, 16);
}

export function toBangkokISOString(date: Date): string {
  const bangkokOffsetMinutes = -420; // UTC+7
  const utcDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  const bangkokTime = new Date(utcDate.getTime() + bangkokOffsetMinutes * 60000);
  return bangkokTime.toISOString();
}

export async function hashBinary(data: ArrayBuffer): Promise<string> {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
  // Fallback: lightweight non-cryptographic hash for legacy environments
  const view = new Uint8Array(data);
  let hash = 0;
  for (let i = 0; i < view.length; i += 1) {
    const byte = view[i] ?? 0;
    hash = (hash << 5) - hash + byte;
    hash |= 0;
  }
  return hash.toString(16);
}

export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return hashBinary(buffer);
}

export function formatHours(hours: number): string {
  return new Intl.NumberFormat("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(hours);
}

export function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return `${startDate.toLocaleString("th-TH")} – ${endDate.toLocaleString("th-TH")}`;
}
