"use client";

import Link from "next/link";
import { Home, ListChecks, UserCircle2 } from "lucide-react";
import clsx from "clsx";

interface BottomNavProps {
  active?: "home" | "requests" | "profile";
}

export function BottomNav({ active = "home" }: BottomNavProps) {
  const items = [
    { key: "home", label: "Home", icon: Home, href: "/result" },
    { key: "requests", label: "My Requests", icon: ListChecks, href: "/" },
    { key: "profile", label: "Profile", icon: UserCircle2, href: "/profile" },
  ] as const;

  return (
    <nav className="mx-auto mt-10 flex max-w-sm items-center justify-around rounded-3xl bg-white/90 p-3 shadow-xl shadow-primary-100/60 backdrop-blur">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.key === active;
        return (
          <Link
            key={item.key}
            href={item.href}
            className={clsx(
              "flex flex-col items-center gap-1 rounded-2xl px-4 py-2 text-xs font-semibold transition",
              isActive ? "bg-primary-50 text-primary-600" : "text-slate-400",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className={clsx("h-5 w-5", isActive ? "text-primary-500" : "text-slate-300")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
