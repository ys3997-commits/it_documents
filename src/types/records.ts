export type EntityType = "individual" | "company";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; tone?: "info" };

export type Entity = {
  id: string;
  name: string;
  entity_type: EntityType;
  pan: string | null;
  description: string | null;
  document_count: number;
};

export type Category = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  document_count: number;
};

export type Tag = {
  id: string;
  name: string;
  document_count: number;
};

export type DocumentTag = {
  id: string;
  name: string;
};

export type DocumentRecord = {
  id: string;
  document_name: string;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  file_extension: string;
  file_size: number;
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
  tags: DocumentTag[];
};

export type DocumentFilters = {
  query?: string;
  financialYearStart?: number;
  entityType?: EntityType;
  entityId?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  tagIds?: string[];
};

export type SaveDocumentInput = {
  documentId: string;
  documentName: string;
  categoryId: string;
  entityId: string;
  newEntityName: string;
  newEntityType: EntityType;
  financialYearStart: number;
  documentDate: string;
  purpose: string;
  notes: string;
  tagNames: string[];
  file: null | {
    originalFilename: string;
    mimeType: string;
    extension: string;
    size: number;
  };
};
