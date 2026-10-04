import type { DocumentFilters, EntityType } from "@/types/records";

function first(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

function isEntityType(value: string | undefined): value is EntityType {
  return value === "individual" || value === "company";
}

function isDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function parseDocumentFilters(
  searchParams: Record<string, string | string[] | undefined>,
): DocumentFilters {
  const query = first(searchParams.q)?.slice(0, 100);
  const year = Number(first(searchParams.fy));
  const entityType = first(searchParams.type);
  const tagIds = first(searchParams.tags)
    ?.split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  return {
    query,
    financialYearStart:
      Number.isInteger(year) && year >= 1990 && year <= 2100 ? year : undefined,
    entityType: isEntityType(entityType) ? entityType : undefined,
    entityId: first(searchParams.entity),
    categoryId: first(searchParams.category),
    dateFrom: isDate(first(searchParams.from)) ? first(searchParams.from) : undefined,
    dateTo: isDate(first(searchParams.to)) ? first(searchParams.to) : undefined,
    tagIds: tagIds && tagIds.length > 0 ? tagIds : undefined,
  };
}

export function toIlikePattern(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const escaped = trimmed.replace(/[\\%_]/g, (char) => `\\${char}`);
  return `%${escaped}%`;
}

export function hasActiveFilters(filters: DocumentFilters): boolean {
  return Boolean(
    filters.query ||
      filters.financialYearStart ||
      filters.entityType ||
      filters.entityId ||
      filters.categoryId ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.tagIds?.length,
  );
}
