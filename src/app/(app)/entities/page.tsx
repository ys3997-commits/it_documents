import { EntityManager } from "@/components/manage/entity-manager";
import { PageHeader } from "@/components/page-header";
import { listEntities } from "@/services/catalog";

export const metadata = { title: "Entities" };

export default async function EntitiesPage() {
  const entities = await listEntities();

  return (
    <div>
      <PageHeader
        title="Entities"
        description="People and companies that documents belong to. You can add more at any time."
      />
      <EntityManager entities={entities} />
    </div>
  );
}
