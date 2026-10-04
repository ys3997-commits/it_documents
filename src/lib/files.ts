export const MAX_FILE_SIZE = 20 * 1024 * 1024;

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

const ACCEPT = ".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx";

export function acceptedFileTypes(): string {
  return ACCEPT;
}

export function extensionOf(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function fileStem(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? filename;
  const dot = base.lastIndexOf(".");
  return (dot > 0 ? base.slice(0, dot) : base).trim();
}

export function safeStorageFileName(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? "document";
  const cleaned = base
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^\.+/, "");
  return (cleaned || "document").slice(0, 120);
}

export function storagePath(
  userId: string,
  documentId: string,
  filename: string,
): string {
  return `${userId}/${documentId}/${safeStorageFileName(filename)}`;
}

export function canPreview(mime: string): boolean {
  return mime === "application/pdf" || mime === "image/jpeg" || mime === "image/png";
}

export function resolveUpload(
  file: File,
): { mime: string; extension: string } | { error: string } {
  if (file.size <= 0) return { error: "This file is empty." };
  if (file.size > MAX_FILE_SIZE) return { error: "This file is larger than 20 MB." };

  const extension = extensionOf(file.name);
  const mime = MIME_BY_EXTENSION[extension];
  if (!mime) return { error: "Use a PDF, image, Word, or Excel file." };

  const browserType = file.type;
  const compatible =
    !browserType ||
    browserType === "application/octet-stream" ||
    browserType === mime ||
    (extension === "jpg" && browserType === "image/jpg");

  if (!compatible) return { error: "This file type is not supported." };
  return { mime, extension };
}

export function isAllowedMime(mime: string): boolean {
  return Object.values(MIME_BY_EXTENSION).includes(mime);
}

export function isAllowedExtension(extension: string): boolean {
  return extension in MIME_BY_EXTENSION;
}
