import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { AppError } from "@/lib/errors";
import { formatFinancialYear } from "@/lib/financial-year";
import { formatTimestamp } from "@/lib/format";
import { searchDocuments } from "@/services/documents";
import type { DocumentRecord } from "@/types/records";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  let documents: DocumentRecord[];
  try {
    documents = await searchDocuments({});
  } catch (error) {
    if (error instanceof AppError) {
      return (
        <EmptyState title="Setup still needed" body={error.message} />
      );
    }
    throw error;
  }

  const individual = documents.filter((document) => document.entity_type === "individual").length;
  const company = documents.length - individual;
  const years = countBy(documents, (document) => String(document.financial_year_start));
  const categories = countBy(documents, (document) => document.category_id)
    .map(([id, count]) => ({
      id,
      name: documents.find((document) => document.category_id === id)?.category_name ?? "Category",
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const maxYear = Math.max(1, ...years.map(([, count]) => count));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="A private library for the tax documents you need to find again."
        action={
          <Link href="/documents/new" className="btn btn-primary">
            Upload document
          </Link>
        }
      />

      {documents.length === 0 ? (
        <EmptyState
          title="No documents yet"
          body="Upload your first tax document to start building your tax records."
          actionHref="/documents/new"
          actionLabel="Upload document"
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat href="/documents" label="Total documents" value={documents.length} />
            <Stat href="/documents?type=individual" label="Individual" value={individual} />
            <Stat href="/documents?type=company" label="Company" value={company} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="card p-5">
              <h2 className="font-medium">By financial year</h2>
              <ul className="mt-4 space-y-3">
                {years
                  .sort((a, b) => Number(b[0]) - Number(a[0]))
                  .map(([year, count]) => (
                    <li key={year}>
                      <Link href={`/documents?fy=${year}`} className="block">
                        <div className="mb-1 flex justify-between text-sm">
                          <span>{formatFinancialYear(Number(year))}</span>
                          <span className="text-muted">{count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-zinc-100">
                          <div
                            className="h-1.5 rounded-full bg-accent"
                            style={{ width: `${(count / maxYear) * 100}%` }}
                          />
                        </div>
                      </Link>
                    </li>
                  ))}
              </ul>
            </section>

            <section className="card p-5">
              <h2 className="font-medium">Frequent categories</h2>
              <ul className="mt-4 divide-y divide-line">
                {categories.map((category) => (
                  <li key={category.id} className="flex items-center justify-between py-3 text-sm">
                    <Link href={`/documents?category=${category.id}`} className="hover:text-accent">
                      {category.name}
                    </Link>
                    <span className="text-muted">{category.count}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="card p-5">
            <h2 className="font-medium">Recently uploaded</h2>
            <ul className="mt-2 divide-y divide-line">
              {documents.slice(0, 6).map((document) => (
                <li key={document.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <Link href={`/documents/${document.id}`} className="font-medium hover:text-accent">
                      {document.document_name}
                    </Link>
                    <p className="truncate text-sm text-muted">
                      {document.entity_name} · {document.category_name}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm text-muted">
                    {formatTimestamp(document.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}

function Stat({ href, label, value }: { href: string; label: string; value: number }) {
  return (
    <Link href={href} className="card p-5 transition-colors hover:bg-zinc-50">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
    </Link>
  );
}

function countBy(documents: DocumentRecord[], key: (document: DocumentRecord) => string) {
  const counts = new Map<string, number>();
  for (const document of documents) {
    const value = key(document);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()];
}
