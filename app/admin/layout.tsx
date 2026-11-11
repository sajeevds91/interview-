import { AdminHeader } from "@/components/AdminHeader";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <>
      <AdminHeader />
      <main className="wrap">{children}</main>
    </>
  );
}
