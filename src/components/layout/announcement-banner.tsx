"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Info, AlertTriangle, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { AnnouncementType } from "@/lib/validation/enums";

interface ActiveAnnouncement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
}

export function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState<string[]>([]);

  const { data } = useQuery<{ announcements: ActiveAnnouncement[] }>({
    queryKey: ["announcements", "active"],
    queryFn: () => apiFetch("/api/announcements/active"),
    staleTime: 60_000,
  });

  const visible = (data?.announcements ?? []).filter(
    (a) => !dismissed.includes(a.id),
  );
  if (visible.length === 0) return null;

  return (
    <div className="space-y-px">
      {visible.map((a) => {
        const warning = a.type === "WARNING";
        return (
          <div
            key={a.id}
            role="status"
            className={cn(
              "flex items-start gap-3 px-4 py-2.5 text-sm lg:px-8",
              warning
                ? "bg-amber-50 text-amber-800"
                : "bg-blue-50 text-blue-800",
            )}
          >
            {warning ? (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <p className="min-w-0 flex-1">
              <span className="font-semibold">{a.title}</span>{" "}
              <span className="opacity-90">{a.message}</span>
            </p>
            <button
              type="button"
              onClick={() => setDismissed((d) => [...d, a.id])}
              aria-label="Dispensar anúncio"
              className="shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
