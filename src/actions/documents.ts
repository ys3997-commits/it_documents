"use server";

import { revalidatePath } from "next/cache";
import { AppError } from "@/lib/errors";
import { validateDocumentInput } from "@/lib/validation";
import { deleteDocument, saveDocument } from "@/services/documents";
import type { ActionResult, SaveDocumentInput } from "@/types/records";

function refreshDocuments(id?: string) {
  revalidatePath("/");
  revalidatePath("/documents");
  revalidatePath("/entities");
  revalidatePath("/categories");
  revalidatePath("/tags");
  if (id) revalidatePath(`/documents/${id}`);
}

export async function saveDocumentAction(
  input: SaveDocumentInput,
  mode: "create" | "edit",
): Promise<ActionResult> {
  const validation = validateDocumentInput(input, mode);
  if (validation) return { ok: false, error: validation };

  try {
    await saveDocument(input, mode);
  } catch (error) {
    if (error instanceof AppError) return { ok: false, error: error.message };
    console.error(error);
    return { ok: false, error: "Could not save the document." };
  }

  refreshDocuments(input.documentId);
  return { ok: true };
}

export async function deleteDocumentAction(id: string): Promise<ActionResult> {
  try {
    await deleteDocument(id);
  } catch (error) {
    if (error instanceof AppError) return { ok: false, error: error.message };
    console.error(error);
    return { ok: false, error: "Could not delete the document." };
  }

  refreshDocuments();
  return { ok: true };
}
