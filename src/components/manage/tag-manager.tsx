"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteTagAction, renameTagAction } from "@/actions/catalog";
import { DeleteRow } from "@/components/manage/entity-manager";
import type { Tag } from "@/types/records";

export function TagManager({ tags }: { tags: Tag[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (tags.length === 0) {
    return (
      <div className="card px-6 py-16 text-center">
        <h2 className="text-lg font-semibold">No tags yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
          Tags are added when you upload a document. They make later searches faster.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {tags.map((tag) => (
        <li key={tag.id} className="card p-4">
          {editingId === tag.id ? (
            <form
              className="flex flex-col gap-3 sm:flex-row"
              onSubmit={async (event) => {
                event.preventDefault();
                const result = await renameTagAction(tag.id, new FormData(event.currentTarget));
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                setError(null);
                setEditingId(null);
                router.refresh();
              }}
            >
              <input className="field" name="name" defaultValue={tag.name} required />
              <button className="btn btn-primary" type="submit">
                Save
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => setEditingId(null)}>
                Cancel
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{tag.name}</p>
                <p className="text-sm text-muted">
                  {tag.document_count} document{tag.document_count === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn btn-secondary h-8" onClick={() => setEditingId(tag.id)}>
                  Rename
                </button>
                <DeleteRow label="Delete" onDelete={() => deleteTagAction(tag.id)} />
              </div>
            </div>
          )}
        </li>
      ))}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </ul>
  );
}
