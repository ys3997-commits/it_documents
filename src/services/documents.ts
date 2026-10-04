import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError, mapQueryError, mapWriteError } from "@/lib/errors";
import { isAllowedExtension, isAllowedMime, storagePath } from "@/lib/files";
import { toIlikePattern } from "@/lib/filters";
import { requireUser } from "@/services/session";
import { cleanText, uniqueTagNames } from "@/lib/validation";
import type {
  DocumentFilters,
  DocumentRecord,
  DocumentTag,
  EntityType,
  SaveDocumentInput,
} from "@/types/records";

type SearchRow = {
  id: string;
  document_name: string;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  file_extension: string;
  file_size: number | string;
  financial_year_start: number;
  document_date: string | null;
  purpose: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  entity_id: string;
  entity_name: string;
  entity_type: EntityType;
  category_id: string;
  category_name: string;
  tags: unknown;
};

function asNumber(value: unknown): number {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
}

function parseTags(value: unknown): DocumentTag[] {
  const source = typeof value === "string" ? JSON.parse(value) : value;
  if (!Array.isArray(source)) return [];
  return source.flatMap((tag) => {
    if (!tag || typeof tag !== "object") return [];
    const record = tag as { id?: unknown; name?: unknown };
    if (typeof record.id !== "string" || typeof record.name !== "string") return [];
    return [{ id: record.id, name: record.name }];
  });
}

function mapRow(row: SearchRow): DocumentRecord {
  return {
    ...row,
    file_size: asNumber(row.file_size),
    tags: parseTags(row.tags),
  };
}

export async function searchDocuments(
  filters: DocumentFilters,
): Promise<DocumentRecord[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("search_documents", {
    p_pattern: toIlikePattern(filters.query),
    p_financial_year_start: filters.financialYearStart ?? null,
    p_entity_type: filters.entityType ?? null,
    p_entity_id: filters.entityId ?? null,
    p_category_id: filters.categoryId ?? null,
    p_date_from: filters.dateFrom ?? null,
    p_date_to: filters.dateTo ?? null,
    p_tag_ids: filters.tagIds?.length ? filters.tagIds : null,
  });

  if (error) throw mapQueryError(error);
  return ((data ?? []) as SearchRow[]).map(mapRow);
}

export async function getDocument(id: string): Promise<DocumentRecord | null> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("documents")
    .select(
      `
      id,
      document_name,
      storage_path,
      original_filename,
      mime_type,
      file_extension,
      file_size,
      financial_year_start,
      document_date,
      purpose,
      notes,
      created_at,
      updated_at,
      entity:entities!inner(id, name, entity_type),
      category:categories!inner(id, name),
      document_tags(tag:tags(id, name))
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw mapQueryError(error);
  if (!data) return null;

  const entity = one(data.entity);
  const category = one(data.category);
  if (!entity || !category) return null;

  const tags = (data.document_tags ?? []).flatMap((link) => {
    const tag = one(link.tag);
    return tag ? [tag] : [];
  });

  return {
    id: data.id,
    document_name: data.document_name,
    storage_path: data.storage_path,
    original_filename: data.original_filename,
    mime_type: data.mime_type,
    file_extension: data.file_extension,
    file_size: asNumber(data.file_size),
    financial_year_start: data.financial_year_start,
    document_date: data.document_date,
    purpose: data.purpose,
    notes: data.notes,
    created_at: data.created_at,
    updated_at: data.updated_at,
    entity_id: entity.id,
    entity_name: entity.name,
    entity_type: entity.entity_type,
    category_id: category.id,
    category_name: category.name,
    tags,
  };
}

function one<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function createSignedDocumentUrl(
  id: string,
  download: boolean,
): Promise<string | null> {
  const { supabase } = await requireUser();
  const { data: document, error } = await supabase
    .from("documents")
    .select("storage_path, original_filename")
    .eq("id", id)
    .maybeSingle();

  if (error) throw mapQueryError(error);
  if (!document) return null;

  const { data, error: signError } = await supabase.storage
    .from("documents")
    .createSignedUrl(
      document.storage_path,
      download ? 60 : 600,
      download ? { download: document.original_filename } : undefined,
    );

  if (signError || !data?.signedUrl) return null;
  return data.signedUrl;
}

async function ownedId(
  supabase: SupabaseClient,
  table: "entities" | "categories",
  id: string,
): Promise<boolean> {
  const { data } = await supabase.from(table).select("id").eq("id", id).maybeSingle();
  return Boolean(data);
}

async function resolveEntityId(
  supabase: SupabaseClient,
  userId: string,
  input: SaveDocumentInput,
): Promise<string> {
  const name = cleanText(input.newEntityName, 120);
  if (!name) return input.entityId;

  const { data, error } = await supabase
    .from("entities")
    .insert({
      user_id: userId,
      name,
      entity_type: input.newEntityType,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new AppError(mapWriteError(error ?? { message: "entity" }, "Could not add that person or company."));
  }
  return data.id;
}

async function resolveTagIds(
  supabase: SupabaseClient,
  userId: string,
  names: string[],
): Promise<string[]> {
  const parsed = uniqueTagNames(names);
  if ("error" in parsed) throw new AppError(parsed.error);
  if (parsed.tags.length === 0) return [];

  const { data, error } = await supabase.from("tags").select("id, name");
  if (error) throw new AppError(mapWriteError(error, "Could not save tags."));

  const byName = new Map(
    (data ?? []).map((tag) => [tag.name.toLowerCase(), tag.id as string]),
  );
  const ids: string[] = [];

  for (const name of parsed.tags) {
    const existing = byName.get(name.toLowerCase());
    if (existing) {
      ids.push(existing);
      continue;
    }

    const { data: created, error: insertError } = await supabase
      .from("tags")
      .insert({ user_id: userId, name })
      .select("id")
      .single();

    if (insertError || !created) {
      throw new AppError(mapWriteError(insertError ?? { message: "tag" }, "Could not save tags."));
    }
    byName.set(name.toLowerCase(), created.id);
    ids.push(created.id);
  }

  return ids;
}

async function linkTags(
  supabase: SupabaseClient,
  documentId: string,
  tagIds: string[],
) {
  const { data, error: readError } = await supabase
    .from("document_tags")
    .select("tag_id")
    .eq("document_id", documentId);
  if (readError) throw new AppError("Could not save tags.");

  const existing = new Set((data ?? []).map((link) => link.tag_id as string));
  const next = new Set(tagIds);
  const toAdd = tagIds.filter((id) => !existing.has(id));
  const toRemove = [...existing].filter((id) => !next.has(id));

  if (toAdd.length > 0) {
    const { error } = await supabase.from("document_tags").insert(
      toAdd.map((tagId) => ({ document_id: documentId, tag_id: tagId })),
    );
    if (error) throw new AppError("Could not save tags.");
  }

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from("document_tags")
      .delete()
      .eq("document_id", documentId)
      .in("tag_id", toRemove);
    if (error) throw new AppError("Could not save tags.");
  }
}

type StoredFile = {
  path: string;
  originalFilename: string;
  mimeType: string;
  extension: string;
  size: number;
};

async function readStoredFile(
  supabase: SupabaseClient,
  userId: string,
  documentId: string,
  file: NonNullable<SaveDocumentInput["file"]>,
): Promise<StoredFile> {
  const path = storagePath(userId, documentId, file.originalFilename);
  const folder = `${userId}/${documentId}`;
  const filename = path.slice(folder.length + 1);
  const { data, error } = await supabase.storage.from("documents").list(folder);
  if (error) throw new AppError("The uploaded file could not be found. Try again.");

  const stored = data?.find((item) => item.name === filename);
  const size = asNumber(stored?.metadata?.size) || file.size;
  if (!stored || size <= 0 || size > 20 * 1024 * 1024) {
    throw new AppError("The uploaded file could not be found. Try again.");
  }

  const storedMime =
    stored.metadata && typeof stored.metadata.mimetype === "string"
      ? stored.metadata.mimetype
      : file.mimeType;

  if (!isAllowedMime(storedMime) || !isAllowedExtension(file.extension)) {
    throw new AppError("Use a PDF, image, Word, or Excel file.");
  }

  return {
    path,
    originalFilename: file.originalFilename.split(/[/\\]/).pop() || "document",
    mimeType: storedMime,
    extension: file.extension,
    size,
  };
}

async function removeStoredFile(supabase: SupabaseClient, path: string) {
  await supabase.storage.from("documents").remove([path]);
}

export async function saveDocument(
  input: SaveDocumentInput,
  mode: "create" | "edit",
): Promise<void> {
  const { supabase, user } = await requireUser();
  const uploadedPath = input.file
    ? storagePath(user.id, input.documentId, input.file.originalFilename)
    : null;

  try {
    const categoryOk = await ownedId(supabase, "categories", input.categoryId);
    if (!categoryOk) throw new AppError("Choose a category.");

    const entityId = await resolveEntityId(supabase, user.id, input);
    if (!input.newEntityName.trim()) {
      const entityOk = await ownedId(supabase, "entities", entityId);
      if (!entityOk) throw new AppError("Choose a person or company.");
    }

    const tagIds = await resolveTagIds(supabase, user.id, input.tagNames);
    const stored = input.file
      ? await readStoredFile(supabase, user.id, input.documentId, input.file)
      : null;

    const fields = {
      entity_id: entityId,
      category_id: input.categoryId,
      document_name: cleanText(input.documentName, 200),
      financial_year_start: input.financialYearStart,
      document_date: input.documentDate || null,
      purpose: cleanText(input.purpose, 500) || null,
      notes: input.notes.trim() || null,
    };

    if (mode === "create") {
      if (!stored) throw new AppError("Choose a file to upload.");
      const { error } = await supabase.from("documents").insert({
        id: input.documentId,
        user_id: user.id,
        ...fields,
        storage_path: stored.path,
        original_filename: stored.originalFilename,
        mime_type: stored.mimeType,
        file_extension: stored.extension,
        file_size: stored.size,
      });
      if (error) throw new AppError(mapWriteError(error, "Could not save the document."));
    } else {
      const existing = await getDocument(input.documentId);
      if (!existing) throw new AppError("This document no longer exists.");

      const { error } = await supabase
        .from("documents")
        .update({
          ...fields,
          ...(stored
            ? {
                storage_path: stored.path,
                original_filename: stored.originalFilename,
                mime_type: stored.mimeType,
                file_extension: stored.extension,
                file_size: stored.size,
              }
            : {}),
        })
        .eq("id", input.documentId);

      if (error) throw new AppError(mapWriteError(error, "Could not save the document."));

      if (stored && stored.path !== existing.storage_path) {
        await removeStoredFile(supabase, existing.storage_path);
      }
    }

    await linkTags(supabase, input.documentId, tagIds);
  } catch (error) {
    if (uploadedPath) {
      const { data } = await supabase
        .from("documents")
        .select("storage_path")
        .eq("id", input.documentId)
        .maybeSingle();

      const rowUsesUpload = data?.storage_path === uploadedPath;
      if (!rowUsesUpload) await removeStoredFile(supabase, uploadedPath);
      if (mode === "create" && data) {
        await supabase.from("documents").delete().eq("id", input.documentId);
        await removeStoredFile(supabase, uploadedPath);
      }
    }
    throw error;
  }
}

export async function deleteDocument(id: string): Promise<void> {
  const { supabase } = await requireUser();
  const document = await getDocument(id);
  if (!document) throw new AppError("This document no longer exists.");

  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw new AppError("Could not delete the document.");
  await removeStoredFile(supabase, document.storage_path);
}
