import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "@/components/settings-form";
import { getProfile } from "@/services/catalog";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const profile = await getProfile();

  return (
    <div>
      <PageHeader
        title="Settings"
        description="This account is the only one that can see these documents."
      />
      <div className="card mb-4 max-w-lg p-5">
        <p className="label">Email</p>
        <p className="text-sm">{profile.email}</p>
      </div>
      <SettingsForm displayName={profile.displayName} />
    </div>
  );
}
