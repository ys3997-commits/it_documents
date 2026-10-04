"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  createEntityAction,
  deleteEntityAction,
  updateEntityAction,
} from "@/actions/catalog";
import { formatEntityType } from "@/lib/format";
import type { Entity, EntityType } from "@/types/records";

export function EntityManager({ entities }: { entities: Entity[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <form
        ref={formRef}
        className="card grid gap-4 p-5 sm:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError(null);
          const result = await createEntityAction(new FormData(event.currentTarget));
          setPending(false);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          formRef.current?.reset();
          router.refresh();
        }}
      >
        <label className="block sm:col-span-2">
          <span className="label">Name</span>
          <input className="field" name="name" required />
        </label>
        <label className="block">
          <span className="label">Type</span>
          <select className="field" name="entityType" defaultValue="individual">
            <option value="individual">Individual</option>
            <option value="company">Company</option>
          </select>
        </label>
        <label className="block">
          <span className="label">PAN</span>
          <input className="field" name="pan" placeholder="Optional" />
        </label>
        <label className="block sm:col-span-2">
          <span className="label">Description</span>
          <input className="field" name="description" placeholder="Optional" />
        </label>
        {error ? <p className="text-sm text-danger sm:col-span-2">{error}</p> : null}
        <div>
          <button className="btn btn-primary" type="submit" disabled={pending}>
            {pending ? "Adding…" : "Add"}
          </button>
        </div>
      </form>

      {entities.length === 0 ? (
        <p className="text-sm text-muted">No people or companies yet.</p>
      ) : (
        <ul className="space-y-3">
          {entities.map((entity) => (
            <li key={entity.id} className="card p-4">
              {editingId === entity.id ? (
                <EntityEdit
                  entity={entity}
                  onClose={() => setEditingId(null)}
                  onSaved={() => {
                    setEditingId(null);
                    router.refresh();
                  }}
                />
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium">{entity.name}</p>
                    <p className="mt-1 text-sm text-muted">
                      {formatEntityType(entity.entity_type)}
                      {entity.pan ? ` · ${entity.pan}` : ""}
                      {` · ${entity.document_count} document${entity.document_count === 1 ? "" : "s"}`}
                    </p>
                    {entity.description ? (
                      <p className="mt-2 text-sm text-zinc-700">{entity.description}</p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="btn btn-secondary h-8" onClick={() => setEditingId(entity.id)}>
                      Edit
                    </button>
                    <DeleteRow
                      disabled={entity.document_count > 0}
                      label={
                        entity.document_count > 0
                          ? "Used by documents"
                          : "Delete"
                      }
                      onDelete={() => deleteEntityAction(entity.id)}
                    />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EntityEdit({
  entity,
  onClose,
  onSaved,
}: {
  entity: Entity;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        const result = await updateEntityAction(entity.id, new FormData(event.currentTarget));
        setPending(false);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        onSaved();
      }}
    >
      <input className="field sm:col-span-2" name="name" defaultValue={entity.name} required />
      <select className="field" name="entityType" defaultValue={entity.entity_type as EntityType}>
        <option value="individual">Individual</option>
        <option value="company">Company</option>
      </select>
      <input className="field" name="pan" defaultValue={entity.pan ?? ""} placeholder="PAN" />
      <input
        className="field sm:col-span-2"
        name="description"
        defaultValue={entity.description ?? ""}
        placeholder="Description"
      />
      {error ? <p className="text-sm text-danger sm:col-span-2">{error}</p> : null}
      <div className="flex gap-2">
        <button className="btn btn-primary" disabled={pending} type="submit">
          Save
        </button>
        <button className="btn btn-secondary" type="button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function DeleteRow({
  onDelete,
  disabled,
  label,
}: {
  onDelete: () => Promise<{ ok: boolean; error?: string }>;
  disabled?: boolean;
  label: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        className="btn btn-ghost h-8 px-2 text-danger"
        disabled={disabled}
        onClick={async () => {
          if (!window.confirm("Delete this? This cannot be undone.")) return;
          const result = await onDelete();
          if (!result.ok) {
            setError(result.error ?? "Could not delete that.");
            return;
          }
          router.refresh();
        }}
      >
        {label}
      </button>
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
