import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export default async function AdminPage() {
  // Auth/role guard already runs in this route's layout.tsx — thanks to
  // getCurrentUser() being wrapped in React's cache(), calling it again
  // here to read the admin's name doesn't cost a second DB query.
  const user = await getCurrentUser();

  return <AdminDashboard adminName={user?.fullName ?? null} />;
}
