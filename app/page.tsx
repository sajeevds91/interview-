import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { ROLES } from "@/lib/roles";

export default function Home() {
  return (
    <>
      <PublicHeader />
      <main className="wrap narrow">
        <h1>Work at Divide</h1>
        <p className="muted">Open roles. Each application takes about 10 minutes.</p>
        <div className="stack" style={{ marginTop: 24 }}>
          {ROLES.map((r) => (
            <div className="card" key={r.slug}>
              <div className="row">
                <div>
                  <h2 style={{ marginBottom: 4 }}>{r.title}</h2>
                  <div className="small muted">{r.team} · {r.location}</div>
                </div>
                <div className="spacer" />
                <Link className="btn primary" href={`/apply/${r.slug}`}>Apply</Link>
              </div>
              <p style={{ marginTop: 14, marginBottom: 0 }}>{r.summary}</p>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
