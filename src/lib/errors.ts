export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppError";
  }
}

type PostgrestLike = { message: string; code?: string };

export function mapQueryError(error: PostgrestLike): AppError {
  const missing =
    error.code === "PGRST202" ||
    error.code === "42P01" ||
    /search_documents|schema cache|does not exist/i.test(error.message);

  if (missing) {
    return new AppError(
      "The database is not set up yet. Run supabase/migrations/001_init.sql in the Supabase SQL editor, then refresh.",
    );
  }

  console.error(error);
  return new AppError("Something went wrong. Please try again.");
}

export function mapWriteError(error: PostgrestLike, fallback: string): string {
  if (error.code === "23505") return "An item with this name already exists.";
  if (error.code === "23503") {
    return "This is still used by a document, so it cannot be deleted.";
  }
  if (error.code === "23514") return "Check the values and try again.";
  console.error(error);
  return fallback;
}
