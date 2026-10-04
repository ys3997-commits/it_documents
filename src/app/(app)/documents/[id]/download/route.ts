import { NextResponse } from "next/server";
import { createSignedDocumentUrl } from "@/services/documents";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const url = await createSignedDocumentUrl(id, true);
  if (!url) return new NextResponse("Document not found", { status: 404 });
  return NextResponse.redirect(url);
}
