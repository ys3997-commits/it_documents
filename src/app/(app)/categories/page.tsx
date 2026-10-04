import { CategoryManager } from "@/components/manage/category-manager";
import { PageHeader } from "@/components/page-header";
import { listCategories } from "@/services/catalog";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const categories = await listCategories();

  return (
    <div>
      <PageHeader
        title="Categories"
        description="These belong to your account. Rename them, or add new ones, whenever you need to."
      />
      <CategoryManager categories={categories} />
    </div>
  );
}
