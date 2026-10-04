import { DocumentForm } from "@/components/documents/document-form";
import { PageHeader } from "@/components/page-header";
import { listCategories, listEntities, listTags } from "@/services/catalog";
import { requireUser } from "@/services/session";

export const metadata = { title: "Upload document" };

export default async function NewDocumentPage() {
  const { user } = await requireUser();
  const [entities, categories, tags] = await Promise.all([
    listEntities(),
    listCategories(),
    listTags(),
  ]);

  return (
    <div>
      <PageHeader
        title="Upload document"
        description="Add the file, then a few details so you can find it later."
      />
      <DocumentForm
        mode="create"
        userId={user.id}
        entities={entities}
        categories={categories}
        tags={tags}
      />
    </div>
  );
}
