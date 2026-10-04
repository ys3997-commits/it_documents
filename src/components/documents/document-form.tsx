"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { saveDocumentAction } from "@/actions/documents";
import { cx } from "@/lib/cx";
import { acceptedFileTypes, fileStem, resolveUpload, storagePath } from "@/lib/files";
import { formatFileSize } from "@/lib/format";
import {
  currentFinancialYearStart,
  financialYearChoices,
  formatFinancialYear,
} from "@/lib/financial-year";
import { uploadDocumentFile } from "@/lib/upload-client";
import type { Category, DocumentRecord, Entity, EntityType, Tag } from "@/types/records";

export function DocumentForm({
  mode,
  userId,
  entities,
  categories,
  tags,
  document,
}: {
  mode: "create" | "edit";
  userId: string;
  entities: Entity[];
  categories: Category[];
  tags: Tag[];
  document?: DocumentRecord;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [name, setName] = useState(document?.document_name ?? "");
  const [categoryId, setCategoryId] = useState(
    document?.category_id ?? categories[0]?.id ?? "",
  );
  const [entityId, setEntityId] = useState(document?.entity_id ?? entities[0]?.id ?? "");
  const [addingEntity, setAddingEntity] = useState(entities.length === 0);
  const [newEntityName, setNewEntityName] = useState("");
  const [newEntityType, setNewEntityType] = useState<EntityType>("individual");
  const [financialYear, setFinancialYear] = useState(
    document?.financial_year_start ?? currentFinancialYearStart(),
  );
  const [documentDate, setDocumentDate] = useState(document?.document_date ?? "");
  const [purpose, setPurpose] = useState(document?.purpose ?? "");
  const [notes, setNotes] = useState(document?.notes ?? "");
  const [tagNames, setTagNames] = useState(document?.tags.map((tag) => tag.name) ?? []);
  const [progress, setProgress] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const years = useMemo(
    () => financialYearChoices(document?.financial_year_start),
    [document?.financial_year_start],
  );

  function chooseFile(next: File) {
    const resolved = resolveUpload(next);
    if ("error" in resolved) {
      setFile(null);
      setFileError(resolved.error);
      return;
    }
    setFileError(null);
    setFile(next);
    setName((current) => current || fileStem(next.name));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(null);

    if (mode === "create" && !file) {
      setError("Choose a file to upload.");
      return;
    }

    const resolved = file ? resolveUpload(file) : null;
    if (resolved && "error" in resolved) {
      setError(resolved.error);
      return;
    }

    setPending(true);
    const documentId = document?.id ?? crypto.randomUUID();

    try {
      if (file && resolved && !("error" in resolved)) {
        setProgress(0);
        setStatus("Uploading…");
        await uploadDocumentFile({
          path: storagePath(userId, documentId, file.name),
          file,
          contentType: resolved.mime,
          upsert: mode === "edit",
          onProgress: setProgress,
        });
      }

      setStatus("Saving…");
      const result = await saveDocumentAction(
        {
          documentId,
          documentName: name,
          categoryId,
          entityId: addingEntity ? "" : entityId,
          newEntityName: addingEntity ? newEntityName : "",
          newEntityType,
          financialYearStart: financialYear,
          documentDate,
          purpose,
          notes,
          tagNames,
          file:
            file && resolved && !("error" in resolved)
                ? {
                  originalFilename: file.name,
                  mimeType: resolved.mime,
                  extension: resolved.extension,
                  size: file.size,
                }
              : null,
        },
        mode,
      );

      if (!result.ok) {
        setError(result.error);
        setPending(false);
        setProgress(null);
        setStatus(null);
        return;
      }

      router.push(`/documents/${documentId}?notice=saved`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed. Please try again.");
      setPending(false);
      setProgress(null);
      setStatus(null);
    }
  }

  if (categories.length === 0) {
    return (
      <div className="card p-6 text-sm leading-6 text-muted">
        Add a category before uploading. Categories live in your account, so you can
        rename them later.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-6 p-5 sm:p-6">
      <FileDropzone
        file={file}
        existingName={document?.original_filename}
        error={fileError}
        onFile={chooseFile}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="label">Document name</span>
          <input className="field" value={name} onChange={(event) => setName(event.target.value)} required />
        </label>

        <label className="block">
          <span className="label">Category</span>
          <select className="field" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="label">Financial year</span>
          <select
            className="field"
            value={financialYear}
            onChange={(event) => setFinancialYear(Number(event.target.value))}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {formatFinancialYear(year)}
              </option>
            ))}
          </select>
        </label>

        <div className="sm:col-span-2">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="label mb-0">Person or company</span>
            <button
              type="button"
              className="text-sm font-medium text-accent"
              onClick={() => setAddingEntity((current) => !current)}
            >
              {addingEntity ? "Choose existing" : "Add new"}
            </button>
          </div>
          {addingEntity ? (
            <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
              <input
                className="field"
                placeholder="Name"
                value={newEntityName}
                onChange={(event) => setNewEntityName(event.target.value)}
              />
              <select
                className="field"
                value={newEntityType}
                onChange={(event) => setNewEntityType(event.target.value as EntityType)}
              >
                <option value="individual">Individual</option>
                <option value="company">Company</option>
              </select>
            </div>
          ) : (
            <select className="field" value={entityId} onChange={(event) => setEntityId(event.target.value)}>
              {entities.length === 0 ? <option value="">No people or companies yet</option> : null}
              {entities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.name} · {entity.entity_type === "company" ? "Company" : "Individual"}
                </option>
              ))}
            </select>
          )}
        </div>

        <label className="block">
          <span className="label">Document date</span>
          <input
            className="field"
            type="date"
            value={documentDate}
            onChange={(event) => setDocumentDate(event.target.value)}
          />
        </label>

        <label className="block">
          <span className="label">Purpose</span>
          <input
            className="field"
            value={purpose}
            placeholder="What this document is for"
            onChange={(event) => setPurpose(event.target.value)}
          />
        </label>

        <div className="sm:col-span-2">
          <TagField tags={tags} value={tagNames} onChange={setTagNames} />
        </div>

        <label className="block sm:col-span-2">
          <span className="label">Notes</span>
          <textarea className="textarea" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
      </div>

      {progress !== null ? (
        <div>
          <div className="mb-2 flex justify-between text-sm text-muted">
            <span>{status}</span>
            <span>{progress}%</span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-zinc-100"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? status ?? "Saving…" : mode === "create" ? "Save document" : "Save changes"}
        </button>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() => router.back()}
          disabled={pending}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function FileDropzone({
  file,
  existingName,
  error,
  onFile,
}: {
  file: File | null;
  existingName?: string;
  error: string | null;
  onFile: (file: File) => void;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <div>
      <label
        className={cx(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center",
          dragging ? "border-accent bg-zinc-50" : "border-zinc-300 bg-zinc-50/60",
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const next = event.dataTransfer.files[0];
          if (next) onFile(next);
        }}
      >
        <input
          type="file"
          accept={acceptedFileTypes()}
          className="sr-only"
          onChange={(event) => {
            const next = event.target.files?.[0];
            if (next) onFile(next);
          }}
        />
        <span className="text-sm font-medium">
          {file ? file.name : existingName ? "Replace file" : "Drop a file, or browse"}
        </span>
        <span className="mt-1 text-sm text-muted">
          {file
            ? formatFileSize(file.size)
            : existingName
              ? `Current file: ${existingName}`
              : "PDF, JPG, PNG, Word, or Excel. Up to 20 MB."}
        </span>
      </label>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  );
}

function TagField({
  tags,
  value,
  onChange,
}: {
  tags: Tag[];
  value: string[];
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add(name: string) {
    const next = name.trim().replace(/\s+/g, " ");
    if (!next) return;
    if (value.some((tag) => tag.toLowerCase() === next.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...value, next]);
    setDraft("");
  }

  const suggestions = tags.filter((tag) => {
    const selected = value.some((name) => name.toLowerCase() === tag.name.toLowerCase());
    if (selected) return false;
    if (!draft.trim()) return true;
    return tag.name.toLowerCase().includes(draft.trim().toLowerCase());
  });

  return (
    <div>
      <span className="label">Tags</span>
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <button
            key={tag}
            type="button"
            className="chip chip-active"
            onClick={() => onChange(value.filter((name) => name !== tag))}
          >
            {tag}
            <span className="sr-only">Remove</span>
          </button>
        ))}
      </div>
      <input
        className="field mt-2"
        value={draft}
        placeholder="Type a tag and press Enter"
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            add(draft.replace(/,$/, ""));
          }
        }}
      />
      {suggestions.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {suggestions.slice(0, 12).map((tag) => (
            <button key={tag.id} type="button" className="chip" onClick={() => add(tag.name)}>
              {tag.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
