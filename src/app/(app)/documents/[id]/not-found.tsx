import Link from "next/link";

export default function DocumentNotFound() {
  return (
    <div className="card px-6 py-16 text-center">
      <h1 className="text-lg font-semibold">Document not found</h1>
      <p className="mt-2 text-sm text-muted">It may have been deleted, or the link is incorrect.</p>
      <Link href="/documents" className="btn btn-primary mt-6">
        Back to documents
      </Link>
    </div>
  );
}
