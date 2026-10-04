"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { deleteDocumentAction } from "@/actions/documents";

export function DeleteDocumentButton({
  id,
  redirectTo,
}: {
  id: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost h-8 px-2 text-danger"
        onClick={() => dialogRef.current?.showModal()}
      >
        Delete
      </button>
      <dialog ref={dialogRef} className="w-[min(100%,24rem)]">
        <div className="card p-5">
          <h2 className="text-lg font-semibold">Delete this document?</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            The file and its details will be removed. This cannot be undone.
          </p>
          {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => dialogRef.current?.close()}
              disabled={pending}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={pending}
              onClick={async () => {
                setPending(true);
                setError(null);
                const result = await deleteDocumentAction(id);
                if (!result.ok) {
                  setError(result.error);
                  setPending(false);
                  return;
                }
                dialogRef.current?.close();
                router.push(redirectTo ?? "/documents?notice=deleted");
                router.refresh();
              }}
            >
              {pending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
