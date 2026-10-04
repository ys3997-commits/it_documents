import type { EntityType, SaveDocumentInput } from "@/types/records";
import { isAllowedExtension, isAllowedMime } from "@/lib/files";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID.test(value);
}

export function cleanText(value: string, max: number): string {
  return value.trim().replace(/\s+/g, " ").slice(0, max);
}

export function uniqueTagNames(names: string[]): { tags: string[] } | { error: string } {
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const raw of names) {
    const name = raw.trim().replace(/\s+/g, " ");
    if (!name) continue;
    if (name.length > 40) return { error: "Tags must be 40 characters or fewer." };
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(name);
    if (tags.length > 15) return { error: "Add up to 15 tags." };
  }

  return { tags };
}

export function parsePan(
  value: string,
): { pan: string | null } | { error: string } {
  const pan = value.trim().toUpperCase();
  if (!pan) return { pan: null };
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
    return { error: "Enter a valid PAN, or leave it blank." };
  }
  return { pan };
}

export function validateEntityFields(input: {
  name: string;
  entityType: string;
  pan: string;
  description: string;
}):
  | { error: string }
  | {
      name: string;
      entityType: EntityType;
      pan: string | null;
      description: string | null;
    } {
  const name = cleanText(input.name, 120);
  if (!name) return { error: "Enter a name." };
  if (input.entityType !== "individual" && input.entityType !== "company") {
    return { error: "Choose individual or company." };
  }

  const pan = parsePan(input.pan);
  if ("error" in pan) return pan;

  const description = cleanText(input.description, 500);
  return {
    name,
    entityType: input.entityType,
    pan: pan.pan,
    description: description || null,
  };
}

export function validateCategoryFields(input: {
  name: string;
  description: string;
}): { error: string } | { name: string; description: string | null } {
  const name = cleanText(input.name, 80);
  if (!name) return { error: "Enter a category name." };
  const description = cleanText(input.description, 500);
  return { name, description: description || null };
}

export function validateTagName(value: string): { error: string } | { name: string } {
  const name = value.trim().replace(/\s+/g, " ");
  if (!name) return { error: "Enter a tag name." };
  if (name.length > 40) return { error: "Tags must be 40 characters or fewer." };
  return { name };
}

export function validateDocumentInput(
  input: SaveDocumentInput,
  mode: "create" | "edit",
): string | null {
  if (!isUuid(input.documentId)) return "The document could not be saved.";
  if (!isUuid(input.categoryId)) return "Choose a category.";

  const name = input.documentName.trim();
  if (!name || name.length > 200) {
    return "Enter a document name under 200 characters.";
  }
  if (input.purpose.trim().length > 500) {
    return "Purpose must be 500 characters or fewer.";
  }
  if (input.notes.trim().length > 5000) {
    return "Notes must be 5,000 characters or fewer.";
  }
  if (
    !Number.isInteger(input.financialYearStart) ||
    input.financialYearStart < 1990 ||
    input.financialYearStart > 2100
  ) {
    return "Choose a financial year.";
  }
  if (input.documentDate && !/^\d{4}-\d{2}-\d{2}$/.test(input.documentDate)) {
    return "Enter a valid document date.";
  }

  const hasNewEntity = input.newEntityName.trim().length > 0;
  if (hasNewEntity) {
    if (input.newEntityName.trim().length > 120) return "Enter a shorter name.";
    if (
      input.newEntityType !== "individual" &&
      input.newEntityType !== "company"
    ) {
      return "Choose individual or company.";
    }
  } else if (!isUuid(input.entityId)) {
    return "Choose a person or company.";
  }

  const tags = uniqueTagNames(input.tagNames);
  if ("error" in tags) return tags.error;

  if (mode === "create" && !input.file) return "Choose a file to upload.";
  if (input.file) {
    if (
      !isAllowedExtension(input.file.extension) ||
      !isAllowedMime(input.file.mimeType) ||
      !input.file.originalFilename.trim() ||
      input.file.size <= 0 ||
      input.file.size > 20 * 1024 * 1024
    ) {
      return "Use a PDF, image, Word, or Excel file up to 20 MB.";
    }
  }

  return null;
}
