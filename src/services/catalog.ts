import { mapQueryError, mapWriteError } from "@/lib/errors";
import { requireUser } from "@/services/session";
import {
  validateCategoryFields,
  validateEntityFields,
  validateTagName,
} from "@/lib/validation";
import type { Category, Entity, Tag } from "@/types/records";

function countOf(value: unknown): number {
  if (!Array.isArray(value) || !value[0] || typeof value[0] !== "object") return 0;
  const count = (value[0] as { count?: unknown }).count;
  return typeof count === "number" ? count : Number(count) || 0;
}

export async function getProfile() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw mapQueryError(error);
  return {
    email: user.email ?? "",
    displayName: data?.display_name ?? "",
  };
}

export async function updateProfile(displayName: string) {
  const name = displayName.trim().replace(/\s+/g, " ");
  if (name.length < 1 || name.length > 80) {
    return { ok: false as const, error: "Enter a name under 80 characters." };
  }

  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("profiles")
    .update({ display_name: name })
    .eq("id", user.id)
    .select("id");

  if (error || !data?.length) {
    return { ok: false as const, error: "Could not save your name." };
  }
  return { ok: true as const };
}

export async function listEntities(): Promise<Entity[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("entities")
    .select("id, name, entity_type, pan, description, documents(count)")
    .order("name");

  if (error) throw mapQueryError(error);
  return (data ?? []).map((entity) => ({
    id: entity.id,
    name: entity.name,
    entity_type: entity.entity_type,
    pan: entity.pan,
    description: entity.description,
    document_count: countOf(entity.documents),
  }));
}

export async function createEntity(input: {
  name: string;
  entityType: string;
  pan: string;
  description: string;
}) {
  const parsed = validateEntityFields(input);
  if ("error" in parsed) return { ok: false as const, error: parsed.error };

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("entities").insert({
    user_id: user.id,
    name: parsed.name,
    entity_type: parsed.entityType,
    pan: parsed.pan,
    description: parsed.description,
  });

  if (error) {
    return { ok: false as const, error: mapWriteError(error, "Could not add that record.") };
  }
  return { ok: true as const };
}

export async function updateEntity(
  id: string,
  input: { name: string; entityType: string; pan: string; description: string },
) {
  const parsed = validateEntityFields(input);
  if ("error" in parsed) return { ok: false as const, error: parsed.error };

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("entities")
    .update({
      name: parsed.name,
      entity_type: parsed.entityType,
      pan: parsed.pan,
      description: parsed.description,
    })
    .eq("id", id);

  if (error) {
    return { ok: false as const, error: mapWriteError(error, "Could not save those changes.") };
  }
  return { ok: true as const };
}

export async function deleteEntity(id: string) {
  const { supabase } = await requireUser();
  const { count } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("entity_id", id);

  if (count) {
    return {
      ok: false as const,
      error: `Used by ${count} document${count === 1 ? "" : "s"}. Move those documents first.`,
    };
  }

  const { error } = await supabase.from("entities").delete().eq("id", id);
  if (error) {
    return { ok: false as const, error: mapWriteError(error, "Could not delete that record.") };
  }
  return { ok: true as const };
}

export async function listCategories(): Promise<Category[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, description, sort_order, documents(count)")
    .order("sort_order")
    .order("name");

  if (error) throw mapQueryError(error);
  return (data ?? []).map((category) => ({
    id: category.id,
    name: category.name,
    description: category.description,
    sort_order: category.sort_order,
    document_count: countOf(category.documents),
  }));
}

export async function createCategory(input: { name: string; description: string }) {
  const parsed = validateCategoryFields(input);
  if ("error" in parsed) return { ok: false as const, error: parsed.error };

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name: parsed.name,
    description: parsed.description,
    sort_order: 200,
  });

  if (error) {
    return { ok: false as const, error: mapWriteError(error, "Could not add that category.") };
  }
  return { ok: true as const };
}

export async function updateCategory(
  id: string,
  input: { name: string; description: string },
) {
  const parsed = validateCategoryFields(input);
  if ("error" in parsed) return { ok: false as const, error: parsed.error };

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("categories")
    .update({ name: parsed.name, description: parsed.description })
    .eq("id", id);

  if (error) {
    return { ok: false as const, error: mapWriteError(error, "Could not save that category.") };
  }
  return { ok: true as const };
}

export async function deleteCategory(id: string) {
  const { supabase } = await requireUser();
  const { count } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);

  if (count) {
    return {
      ok: false as const,
      error: `Used by ${count} document${count === 1 ? "" : "s"}. Move those documents first.`,
    };
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) {
    return { ok: false as const, error: mapWriteError(error, "Could not delete that category.") };
  }
  return { ok: true as const };
}

export async function listTags(): Promise<Tag[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, document_tags(count)")
    .order("name");

  if (error) throw mapQueryError(error);
  return (data ?? []).map((tag) => ({
    id: tag.id,
    name: tag.name,
    document_count: countOf(tag.document_tags),
  }));
}

export async function renameTag(id: string, name: string) {
  const parsed = validateTagName(name);
  if ("error" in parsed) return { ok: false as const, error: parsed.error };

  const { supabase } = await requireUser();
  const { error } = await supabase.from("tags").update({ name: parsed.name }).eq("id", id);
  if (error) {
    return { ok: false as const, error: mapWriteError(error, "Could not rename that tag.") };
  }
  return { ok: true as const };
}

export async function deleteTag(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) {
    return { ok: false as const, error: mapWriteError(error, "Could not delete that tag.") };
  }
  return { ok: true as const };
}
