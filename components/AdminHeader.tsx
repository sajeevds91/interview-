import Link from "next/link";
import { redirect } from "next/navigation";
import { endSession } from "@/lib/auth";

async function logout() {
  "use server";
  await endSession();
  redirect("/login");
}

export function AdminHeader() {
  return (
    <header className="topbar">
      <div className="inner">
        <Link href="/admin" className="brand">Divide</Link>
        <span className="muted small">Hiring</span>
        <nav>
          <Link href="/admin">Candidates</Link>
          <Link href="/admin/settings">Settings</Link>
          <Link href="/" target="_blank">Careers site ↗</Link>
          <form action={logout}><button className="btn sm" type="submit">Log out</button></form>
        </nav>
      </div>
    </header>
  );
}
