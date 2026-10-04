import { notFound } from "next/navigation";
import { DocumentForm } from "@/components/documents/document-form";
import { PageHeader } from "@/components/page-header";
import { listCategories, listEntities, listTags } from "@/services/catalog";
import { getDocument } from "@/services/documents";
import { requireUser } from "@/services/session";

export const metadata = { title: "Edit document" };

export default async function EditDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user } = await requireUser();
  const [document, entities, categories, tags] = await Promise.all([
    getDocument(id),
    listEntities(),
    listCategories(),
    listTags(),
  ]);

  if (!document) notFound();

  return (
    <div>
      <PageHeader
        title="Edit details"
        description="Update the information used to find this document. You can also replace the file."
      />
      <DocumentForm
        mode="edit"
        userId={user.id}
        entities={entities}
        categories={categories}
        tags={tags}
        document={document}
      />
    </div>
  );
}
