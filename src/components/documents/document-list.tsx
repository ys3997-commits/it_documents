import Link from "next/link";
import { DeleteDocumentButton } from "@/components/documents/delete-document-button";
import { EmptyState } from "@/components/empty-state";
import { formatFinancialYear } from "@/lib/financial-year";
import { formatDate, formatTimestamp } from "@/lib/format";
import type { DocumentRecord } from "@/types/records";

export function DocumentList({
  documents,
  filtered,
}: {
  documents: DocumentRecord[];
  filtered: boolean;
}) {
  if (documents.length === 0) {
    return filtered ? (
      <EmptyState
        title="No matching documents"
        body="Try another name, year, or tag. Filters apply together."
      />
    ) : (
      <EmptyState
        title="No documents yet"
        body="Upload your first tax document to start building your tax records."
        actionHref="/documents/new"
        actionLabel="Upload document"
      />
    );
  }

  return (
    <>
      <div className="card hidden overflow-x-auto md:block">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="text-xs tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Document</th>
              <th className="px-4 py-3 font-medium">Entity</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Year</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Tags</th>
              <th className="px-4 py-3 font-medium">Uploaded</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => (
              <tr key={document.id} className="border-t border-line">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/documents/${document.id}`} className="hover:text-accent">
                    {document.document_name}
                  </Link>
                </td>
                <td className="px-4 py-3">{document.entity_name}</td>
                <td className="px-4 py-3">{document.category_name}</td>
                <td className="px-4 py-3">{formatFinancialYear(document.financial_year_start)}</td>
                <td className="px-4 py-3">{formatDate(document.document_date)}</td>
                <td className="px-4 py-3 text-muted">
                  {document.tags.map((tag) => tag.name).join(", ") || "—"}
                </td>
                <td className="px-4 py-3">{formatTimestamp(document.created_at)}</td>
                <td className="px-4 py-3">
                  <RowActions id={document.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {documents.map((document) => (
          <article key={document.id} className="card p-4">
            <Link href={`/documents/${document.id}`} className="font-medium hover:text-accent">
              {document.document_name}
            </Link>
            <p className="mt-1 text-sm text-muted">
              {document.entity_name} · {document.category_name} ·{" "}
              {formatFinancialYear(document.financial_year_start)}
            </p>
            <p className="mt-2 text-sm text-muted">
              {document.tags.map((tag) => tag.name).join(", ") || "No tags"}
            </p>
            <div className="mt-3">
              <RowActions id={document.id} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function RowActions({ id }: { id: string }) {
  return (
    <div className="flex flex-wrap items-center">
      <Link href={`/documents/${id}`} className="btn btn-ghost h-8 px-2">
        View
      </Link>
      <a href={`/documents/${id}/download`} className="btn btn-ghost h-8 px-2">
        Download
      </a>
      <Link href={`/documents/${id}/edit`} className="btn btn-ghost h-8 px-2">
        Edit
      </Link>
      <DeleteDocumentButton id={id} />
    </div>
  );
}
