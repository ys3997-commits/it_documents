"use server";

import { revalidatePath } from "next/cache";
import {
  createCategory,
  createEntity,
  deleteCategory,
  deleteEntity,
  deleteTag,
  renameTag,
  updateCategory,
  updateEntity,
  updateProfile,
} from "@/services/catalog";
import type { ActionResult } from "@/types/records";

function refresh() {
  revalidatePath("/");
  revalidatePath("/documents");
  revalidatePath("/entities");
  revalidatePath("/categories");
  revalidatePath("/tags");
  revalidatePath("/settings");
}

export async function createEntityAction(formData: FormData): Promise<ActionResult> {
  const result = await createEntity(readEntity(formData));
  if (result.ok) refresh();
  return result;
}

export async function updateEntityAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const result = await updateEntity(id, readEntity(formData));
  if (result.ok) refresh();
  return result;
}

export async function deleteEntityAction(id: string): Promise<ActionResult> {
  const result = await deleteEntity(id);
  if (result.ok) refresh();
  return result;
}

export async function createCategoryAction(formData: FormData): Promise<ActionResult> {
  const result = await createCategory({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
  });
  if (result.ok) refresh();
  return result;
}

export async function updateCategoryAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const result = await updateCategory(id, {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
  });
  if (result.ok) refresh();
  return result;
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  const result = await deleteCategory(id);
  if (result.ok) refresh();
  return result;
}

export async function renameTagAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const result = await renameTag(id, String(formData.get("name") ?? ""));
  if (result.ok) refresh();
  return result;
}

export async function deleteTagAction(id: string): Promise<ActionResult> {
  const result = await deleteTag(id);
  if (result.ok) refresh();
  return result;
}

export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  const result = await updateProfile(String(formData.get("displayName") ?? ""));
  if (result.ok) refresh();
  return result;
}

function readEntity(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    entityType: String(formData.get("entityType") ?? ""),
    pan: String(formData.get("pan") ?? ""),
    description: String(formData.get("description") ?? ""),
  };
}
