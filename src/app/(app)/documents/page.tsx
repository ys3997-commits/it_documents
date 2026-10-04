import Link from "next/link";
import { Suspense } from "react";
import { DocumentFilters } from "@/components/documents/document-filters";
import { DocumentList } from "@/components/documents/document-list";
import { EmptyState } from "@/components/empty-state";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { AppError } from "@/lib/errors";
import { hasActiveFilters, parseDocumentFilters } from "@/lib/filters";
import { listCategories, listEntities, listTags } from "@/services/catalog";
import { searchDocuments } from "@/services/documents";

export const metadata = { title: "Documents" };

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseDocumentFilters(params);
  const notice = typeof params.notice === "string" ? params.notice : undefined;

  let documents;
  let entities;
  let categories;
  let tags;
  try {
    [documents, entities, categories, tags] = await Promise.all([
      searchDocuments(filters),
      listEntities(),
      listCategories(),
      listTags(),
    ]);
  } catch (error) {
    if (error instanceof AppError) {
      return <EmptyState title="Setup still needed" body={error.message} />;
    }
    throw error;
  }

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Search by name, person, company, year, or tag."
        action={
          <Link href="/documents/new" className="btn btn-primary">
            Upload document
          </Link>
        }
      />
      <Notice notice={notice} />
      <Suspense fallback={<div className="card mb-4 h-40 animate-pulse bg-zinc-100" />}>
        <DocumentFilters entities={entities} categories={categories} tags={tags} />
      </Suspense>
      <DocumentList documents={documents} filtered={hasActiveFilters(filters)} />
    </div>
  );
}
