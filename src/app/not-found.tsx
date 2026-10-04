import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-full items-center justify-center px-4">
      <div className="card max-w-md px-6 py-12 text-center">
        <h1 className="text-lg font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-muted">That link does not match a page in Records.</p>
        <Link href="/" className="btn btn-primary mt-6">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
