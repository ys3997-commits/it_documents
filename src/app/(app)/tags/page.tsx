import { TagManager } from "@/components/manage/tag-manager";
import { PageHeader } from "@/components/page-header";
import { listTags } from "@/services/catalog";

export const metadata = { title: "Tags" };

export default async function TagsPage() {
  const tags = await listTags();

  return (
    <div>
      <PageHeader
        title="Tags"
        description="Short labels such as Property, HDFC, or Salary. Use them while uploading."
      />
      <TagManager tags={tags} />
    </div>
  );
}
