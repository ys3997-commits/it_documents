import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteDocumentButton } from "@/components/documents/delete-document-button";
import { Notice } from "@/components/notice";
import { canPreview } from "@/lib/files";
import { formatFinancialYear } from "@/lib/financial-year";
import { formatDate, formatEntityType, formatFileSize, formatTimestamp } from "@/lib/format";
import { createSignedDocumentUrl, getDocument } from "@/services/documents";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const document = await getDocument(id);
  return { title: document?.document_name ?? "Document" };
}

export default async function DocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const document = await getDocument(id);
  if (!document) notFound();

  const preview = canPreview(document.mime_type)
    ? await createSignedDocumentUrl(id, false)
    : null;
  const notice = typeof query.notice === "string" ? query.notice : undefined;

  return (
    <div>
      <Link href="/documents" className="text-sm font-medium text-accent">
        Back to documents
      </Link>
      <div className="mt-4 mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{document.document_name}</h1>
          <p className="mt-1 text-sm text-muted">
            {document.original_filename} · {formatFileSize(document.file_size)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className="btn btn-secondary" href={`/documents/${id}/open`} target="_blank" rel="noreferrer">
            Open
          </a>
          <a className="btn btn-secondary" href={`/documents/${id}/download`}>
            Download
          </a>
          <Link className="btn btn-secondary" href={`/documents/${id}/edit`}>
            Edit details
          </Link>
          <DeleteDocumentButton id={id} redirectTo="/documents?notice=deleted" />
        </div>
      </div>

      <Notice notice={notice} />

      <dl className="card grid gap-5 p-5 sm:grid-cols-2">
        <Detail label="Category" value={document.category_name} />
        <Detail
          label="Entity"
          value={`${document.entity_name} · ${formatEntityType(document.entity_type)}`}
        />
        <Detail label="Financial year" value={formatFinancialYear(document.financial_year_start)} />
        <Detail label="Document date" value={formatDate(document.document_date)} />
        <Detail label="Uploaded" value={formatTimestamp(document.created_at)} />
        <Detail
          label="Tags"
          value={document.tags.map((tag) => tag.name).join(", ") || "—"}
        />
        <Detail label="Purpose" value={document.purpose || "—"} wide />
        <Detail label="Notes" value={document.notes || "—"} wide />
      </dl>

      <section className="card mt-4 overflow-hidden">
        {preview && document.mime_type === "application/pdf" ? (
          <iframe
            title={document.document_name}
            src={preview}
            className="h-[75vh] w-full bg-zinc-100"
            referrerPolicy="no-referrer"
          />
        ) : null}
        {preview && document.mime_type !== "application/pdf" ? (
          // Signed URL is temporary and private. Skip the image optimizer so the file is not copied through the app server.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt={document.document_name}
            className="max-h-[75vh] w-full object-contain bg-zinc-50"
            referrerPolicy="no-referrer"
          />
        ) : null}
        {!preview ? (
          <div className="px-6 py-16 text-center">
            <h2 className="font-medium">Preview is available for PDF and images</h2>
            <p className="mt-2 text-sm text-muted">
              Open or download this {document.file_extension.toUpperCase()} file to view it.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function Detail({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs tracking-wide text-muted uppercase">{label}</dt>
      <dd className="mt-1 text-sm whitespace-pre-wrap">{value}</dd>
    </div>
  );
}
