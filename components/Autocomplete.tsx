"use client";

import { Combobox } from "@headlessui/react";
import { Loader2, Search } from "lucide-react";
import type { AutocompleteOption } from "@/lib/types";
import clsx from "clsx";

interface AutocompleteProps {
  label: string;
  value: AutocompleteOption | null;
  inputValue: string;
  onChange: (value: AutocompleteOption | null) => void;
  onInputValueChange: (query: string) => void;
  options: AutocompleteOption[];
  placeholder?: string;
  loading?: boolean;
  required?: boolean;
  disabled?: boolean;
  error?: string | undefined;
}

export function Autocomplete({
  label,
  value,
  inputValue,
  onChange,
  onInputValueChange,
  options,
  placeholder,
  loading,
  required,
  disabled,
  error,
}: AutocompleteProps) {
  const hasResults = options.length > 0;

  return (
    <div className="space-y-2">
      <label className="label flex items-center justify-between">
        <span>
          {label}
          {required ? <span className="ml-1 text-danger">*</span> : null}
        </span>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary-500" aria-hidden="true" />
        ) : null}
      </label>
      <Combobox value={value} onChange={onChange} disabled={Boolean(disabled)}>
        <div className="relative">
          <Combobox.Input
            className={clsx("input", error && "border-danger focus:ring-danger/40")}
            value={inputValue}
            placeholder={placeholder}
            onChange={(event) => onInputValueChange(event.target.value)}
            autoComplete="off"
          />
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-300" aria-hidden />
        </div>
        <Combobox.Options className="absolute z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-primary-200/40">
          {hasResults ? (
            options.map((option) => (
              <Combobox.Option
                key={option.id}
                value={option}
                className={({ active }) =>
                  clsx(
                    "flex cursor-pointer flex-col rounded-xl px-3 py-2 text-sm transition",
                    active ? "bg-primary-50 text-primary-700" : "text-slate-600",
                  )
                }
              >
                <span className="font-semibold text-slate-800">{option.label}</span>
                {option.description ? (
                  <span className="text-xs text-slate-500">{option.description}</span>
                ) : null}
              </Combobox.Option>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-slate-400">ไม่พบข้อมูลที่ตรงกับคำค้นหา</div>
          )}
        </Combobox.Options>
      </Combobox>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
