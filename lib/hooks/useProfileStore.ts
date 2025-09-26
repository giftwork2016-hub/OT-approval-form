"use client";

import { useCallback, useEffect, useState } from "react";
import { safeRandomUUID } from "@/lib/utils";

const STORAGE_KEY = "ot-profile-data:v1";

export interface StoredCompany {
  id: string;
  name: string;
  code: string;
  hrEmail: string;
}

export interface StoredJob {
  id: string;
  code: string;
  name: string;
  companyId: string | null;
}

interface ProfileState {
  companies: StoredCompany[];
  jobs: StoredJob[];
}

const defaultState: ProfileState = {
  companies: [],
  jobs: [],
};

function toArray(input: unknown): unknown[] {
  if (Array.isArray(input)) {
    return input;
  }

  if (input && typeof input === "object") {
    return Object.values(input as Record<string, unknown>);
  }

  return [];
}

function isStoredCompany(value: unknown): value is StoredCompany {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as StoredCompany).id === "string" &&
    typeof (value as StoredCompany).name === "string" &&
    typeof (value as StoredCompany).code === "string" &&
    typeof (value as StoredCompany).hrEmail === "string"
  );
}

function parseStoredJob(value: unknown): StoredJob | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const baseJob = value as Partial<StoredJob> & { id?: string; code?: string; name?: string };

  if (
    typeof baseJob.id !== "string" ||
    typeof baseJob.code !== "string" ||
    typeof baseJob.name !== "string"
  ) {
    return null;
  }

  const rawCompanyId = (value as StoredJob).companyId;
  const trimmedCompanyId =
    typeof rawCompanyId === "string" ? rawCompanyId.trim() : "";
  const companyId = trimmedCompanyId.length > 0 ? trimmedCompanyId : null;

  return {
    id: baseJob.id,
    code: baseJob.code,
    name: baseJob.name,
    companyId,
  } satisfies StoredJob;
}

function parseState(value: unknown): ProfileState {
  if (!value || typeof value !== "object") return defaultState;

  const maybeState = value as Partial<ProfileState>;
  const companies = toArray(maybeState.companies).filter(isStoredCompany);

  const jobs = toArray(maybeState.jobs)
    .map(parseStoredJob)
    .filter((job): job is StoredJob => Boolean(job));

  return {
    companies,
    jobs,
  };
}

export function useProfileStore() {
  const [state, setState] = useState<ProfileState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        setState(parseState(parsed));
      }
    } catch (error) {
      console.warn("Failed to parse profile data from storage", error);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const addCompany = useCallback((input: Omit<StoredCompany, "id">) => {
    const name = input.name.trim();
    const code = input.code.trim();
    const hrEmail = input.hrEmail.trim();

    setState((previous) => {
      const previousCompanies = Array.isArray(previous.companies) ? previous.companies : [];

      const existing = previousCompanies.find(
        (company) =>
          company.name.toLowerCase() === name.toLowerCase() &&
          company.code.toLowerCase() === code.toLowerCase(),
      );

      const nextCompany: StoredCompany = existing
        ? { ...existing, name, code, hrEmail }
        : { id: safeRandomUUID(), name, code, hrEmail };

      const companies = existing
        ? previousCompanies.map((company) =>
            company.id === existing.id ? nextCompany : company,
          )
        : [...previousCompanies, nextCompany];

      return {
        ...previous,
        companies,
      };
    });
  }, []);

  const addJob = useCallback((input: Omit<StoredJob, "id">) => {
    const code = input.code.trim();
    const name = input.name.trim();
    const trimmedCompanyId =
      typeof input.companyId === "string" ? input.companyId.trim() : "";
    const companyId = trimmedCompanyId.length > 0 ? trimmedCompanyId : null;

    setState((previous) => {
      const previousJobs = Array.isArray(previous.jobs) ? previous.jobs : [];

      const existing = previousJobs.find(
        (job) => job.code.toLowerCase() === code.toLowerCase(),
      );

      const nextJob: StoredJob = existing
        ? { ...existing, code, name, companyId }
        : { id: safeRandomUUID(), code, name, companyId };

      const jobs = existing
        ? previousJobs.map((job) => (job.id === existing.id ? nextJob : job))
        : [...previousJobs, nextJob];

      return {
        ...previous,
        jobs,
      };
    });
  }, []);

  return {
    companies: state.companies,
    jobs: state.jobs,
    addCompany,
    addJob,
  };
}
