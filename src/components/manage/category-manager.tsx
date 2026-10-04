"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/actions/catalog";
import { DeleteRow } from "@/components/manage/entity-manager";
import type { Category } from "@/types/records";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <form
        ref={formRef}
        className="card grid gap-4 p-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError(null);
          const result = await createCategoryAction(new FormData(event.currentTarget));
          setPending(false);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          formRef.current?.reset();
          router.refresh();
        }}
      >
        <label className="block">
          <span className="label">Name</span>
          <input className="field" name="name" required />
        </label>
        <label className="block">
          <span className="label">Description</span>
          <input className="field" name="description" placeholder="Optional" />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <div>
          <button className="btn btn-primary" disabled={pending} type="submit">
            {pending ? "Adding…" : "Add category"}
          </button>
        </div>
      </form>

      <ul className="space-y-3">
        {categories.map((category) => (
          <li key={category.id} className="card p-4">
            {editingId === category.id ? (
              <form
                className="grid gap-3"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const result = await updateCategoryAction(
                    category.id,
                    new FormData(event.currentTarget),
                  );
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  setError(null);
                  setEditingId(null);
                  router.refresh();
                }}
              >
                <input className="field" name="name" defaultValue={category.name} required />
                <input
                  className="field"
                  name="description"
                  defaultValue={category.description ?? ""}
                  placeholder="Description"
                />
                <div className="flex gap-2">
                  <button className="btn btn-primary" type="submit">
                    Save
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {category.description || "No description"} · {category.document_count}{" "}
                    document{category.document_count === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn btn-secondary h-8" onClick={() => setEditingId(category.id)}>
                    Edit
                  </button>
                  <DeleteRow
                    disabled={category.document_count > 0}
                    label={category.document_count > 0 ? "In use" : "Delete"}
                    onDelete={() => deleteCategoryAction(category.id)}
                  />
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
