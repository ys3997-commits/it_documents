"use client";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card px-6 py-16 text-center">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        We could not load this page. Your documents are still private.
      </p>
      <button type="button" className="btn btn-primary mt-6" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
