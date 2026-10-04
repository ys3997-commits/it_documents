"use client";

import { useState } from "react";

const messages: Record<string, string> = {
  saved: "Document saved.",
  deleted: "Document deleted.",
  profile: "Settings saved.",
};

export function Notice({ notice }: { notice?: string }) {
  const message = notice ? messages[notice] : undefined;
  const [open, setOpen] = useState(Boolean(message));
  if (!message || !open) return null;

  return (
    <div
      role="status"
      className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
    >
      <p>{message}</p>
      <button type="button" className="btn btn-ghost h-8" onClick={() => setOpen(false)}>
        Dismiss
      </button>
    </div>
  );
}
