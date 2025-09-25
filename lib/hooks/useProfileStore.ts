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
}

interface ProfileState {
  companies: StoredCompany[];
  jobs: StoredJob[];
}

const defaultState: ProfileState = {
  companies: [],
  jobs: [],
};

function parseState(value: unknown): ProfileState {
  if (!value || typeof value !== "object") return defaultState;

  const maybeState = value as Partial<ProfileState>;
  const companies = Array.isArray(maybeState.companies)
    ? maybeState.companies.filter(
        (company): company is StoredCompany =>
          Boolean(company) &&
          typeof company === "object" &&
          typeof (company as StoredCompany).id === "string" &&
          typeof (company as StoredCompany).name === "string" &&
          typeof (company as StoredCompany).code === "string" &&
          typeof (company as StoredCompany).hrEmail === "string",
      )
    : [];

  const jobs = Array.isArray(maybeState.jobs)
    ? maybeState.jobs.filter(
        (job): job is StoredJob =>
          Boolean(job) &&
          typeof job === "object" &&
          typeof (job as StoredJob).id === "string" &&
          typeof (job as StoredJob).code === "string" &&
          typeof (job as StoredJob).name === "string",
      )
    : [];

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
      const existing = previous.companies.find(
        (company) =>
          company.name.toLowerCase() === name.toLowerCase() &&
          company.code.toLowerCase() === code.toLowerCase(),
      );

      const nextCompany: StoredCompany = existing
        ? { ...existing, name, code, hrEmail }
        : { id: safeRandomUUID(), name, code, hrEmail };

      const companies = existing
        ? previous.companies.map((company) =>
            company.id === existing.id ? nextCompany : company,
          )
        : [...previous.companies, nextCompany];

      return {
        ...previous,
        companies,
      };
    });
  }, []);

  const addJob = useCallback((input: Omit<StoredJob, "id">) => {
    const code = input.code.trim();
    const name = input.name.trim();

    setState((previous) => {
      const existing = previous.jobs.find(
        (job) => job.code.toLowerCase() === code.toLowerCase(),
      );

      const nextJob: StoredJob = existing
        ? { ...existing, code, name }
        : { id: safeRandomUUID(), code, name };

      const jobs = existing
        ? previous.jobs.map((job) => (job.id === existing.id ? nextJob : job))
        : [...previous.jobs, nextJob];

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
