import { redirect } from "next/navigation";
import AdminDashboardClient from "@/components/admin-dashboard-client";
import { getDashboardData } from "@/lib/analytics";
import { isAdminAuthenticated } from "@/lib/auth";
import { listRedirectRules } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const [dashboard, rules] = await Promise.all([getDashboardData(), listRedirectRules()]);

  return <AdminDashboardClient dashboard={dashboard} rules={rules} />;
}
