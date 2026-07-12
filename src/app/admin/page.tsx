import { AdminDashboard } from "@/components/admin-dashboard";
import { getAdminOverview } from "@/lib/data";

export default async function AdminOverviewPage() {
  const data = await getAdminOverview();
  return <AdminDashboard data={data} />;
}
