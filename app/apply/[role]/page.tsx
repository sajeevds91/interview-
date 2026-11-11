import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/PublicHeader";
import { getRole } from "@/lib/roles";
import { NOTICE_OPTIONS } from "@/lib/roles/types";
import { ApplicationForm } from "./ApplicationForm";

export default async function ApplyPage({ params }: { params: Promise<{ role: string }> }) {
  const role = getRole((await params).role);
  if (!role) notFound();
  const { score, ...clientRole } = role; // functions can't be sent to the browser
  return (
    <>
      <PublicHeader />
      <main className="wrap narrow">
        <h1>{role.title}</h1>
        <p className="muted small">{role.team} · {role.location}</p>
        <div className="card" style={{ marginBottom: 20 }}>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {role.about.map((a) => <li key={a} style={{ marginBottom: 4 }}>{a}</li>)}
          </ul>
        </div>
        <ApplicationForm role={clientRole} noticeOptions={NOTICE_OPTIONS.map(({ value, label }) => ({ value, label }))} />
      </main>
    </>
  );
}
