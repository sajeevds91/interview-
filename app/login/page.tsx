import { redirect } from "next/navigation";
import { PublicHeader } from "@/components/PublicHeader";
import { checkPassword, startSession } from "@/lib/auth";

async function login(formData: FormData) {
  "use server";
  if (!checkPassword(String(formData.get("password") ?? ""))) redirect("/login?e=1");
  await startSession();
  redirect("/admin");
}

export default async function Login({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  return (
    <>
      <PublicHeader />
      <main className="wrap" style={{ maxWidth: 400 }}>
        <form action={login} className="card stack">
          <h2>Hiring dashboard</h2>
          {!process.env.ADMIN_PASSWORD && <div className="notice">Set ADMIN_PASSWORD in your environment to enable sign-in.</div>}
          <label className={`field ${e ? "has-err" : ""}`}>
            <span className="lbl">Password</span>
            <input type="password" name="password" autoFocus required autoComplete="current-password" />
            {e && <div className="err">Incorrect password</div>}
          </label>
          <button className="btn primary" type="submit">Sign in</button>
        </form>
      </main>
    </>
  );
}
