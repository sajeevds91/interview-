import Link from "next/link";
import { Score, Stars, StatusBadge, lkr } from "@/components/ui";
import { listCandidates, STATUSES } from "@/lib/candidates";
import { emailConfigured } from "@/lib/email";
import { ROLES, getRole } from "@/lib/roles";
import { noticeLabel } from "@/lib/roles/types";
import { fmtDateTime } from "@/lib/time";

type SP = { status?: string; band?: string; q?: string; sort?: string; role?: string };

export default async function Dashboard({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const all = await listCandidates();

  let list = all.filter((c) => {
    if (sp.role && c.role !== sp.role) return false;
    if (sp.status === "active" && ["rejected", "hired"].includes(c.status)) return false;
    if (sp.status && sp.status !== "active" && sp.status !== "all" && c.status !== sp.status) return false;
    if (sp.band && c.score.band !== sp.band) return false;
    if (sp.q) {
      const q = sp.q.toLowerCase();
      if (![c.app.name, c.app.email, c.app.phone, c.app.location].some((v) => v?.toLowerCase().includes(q))) return false;
    }
    return true;
  });
  const sort = sp.sort ?? "score";
  list = list.sort((a, b) =>
    sort === "recent"
      ? b.createdAt.localeCompare(a.createdAt)
      : sort === "salary"
        ? a.app.salaryExpectation - b.app.salaryExpectation
        : b.score.total - a.score.total || a.score.flags.length - b.score.flags.length,
  );

  const strong = all.filter((c) => c.score.band === "strong" && c.score.flags.length === 0).length;
  const upcoming = all
    .filter((c) => c.status === "scheduled" && c.interview && c.interview.start > new Date().toISOString())
    .sort((a, b) => a.interview!.start.localeCompare(b.interview!.start));

  return (
    <>
      <div className="row" style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Candidates</h1>
        <span className="spacer" />
        {ROLES.map((r) => (
          <Link key={r.slug} className="btn sm" href={`/apply/${r.slug}`} target="_blank">Open {r.title} form ↗</Link>
        ))}
      </div>

      {!emailConfigured() && (
        <div className="notice" style={{ marginBottom: 16 }}>
          Email isn&apos;t set up yet, so emails are logged on each candidate&apos;s page but not sent. Add SMTP settings to switch on sending (see README).
        </div>
      )}

      <div className="stats">
        <div className="stat"><div className="v">{all.length}</div><div className="l">Applications</div></div>
        <div className="stat"><div className="v">{strong}</div><div className="l">Strong, no flags</div></div>
        <div className="stat"><div className="v">{all.filter((c) => c.status === "invited").length}</div><div className="l">Invite sent</div></div>
        <div className="stat"><div className="v">{upcoming.length}</div><div className="l">Interviews booked</div></div>
      </div>

      {upcoming.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>Upcoming interviews</h3>
          {upcoming.slice(0, 6).map((c) => (
            <div key={c.id} className="row small" style={{ padding: "6px 0" }}>
              <span className="num" style={{ minWidth: 190 }}>{fmtDateTime(c.interview!.start)}</span>
              <Link href={`/admin/candidates/${c.id}`}>{c.app.name}</Link>
              <span className="spacer" />
              <a href={c.interview!.meetingUrl} target="_blank" rel="noreferrer">Join ↗</a>
            </div>
          ))}
        </div>
      )}

      <form className="row" style={{ marginBottom: 12 }}>
        <input type="text" name="q" defaultValue={sp.q} placeholder="Search name, email, phone…" style={{ maxWidth: 260 }} />
        {ROLES.length > 1 && (
          <select name="role" defaultValue={sp.role ?? ""} style={{ width: "auto" }}>
            <option value="">All roles</option>
            {ROLES.map((r) => <option key={r.slug} value={r.slug}>{r.title}</option>)}
          </select>
        )}
        <select name="status" defaultValue={sp.status ?? "active"} style={{ width: "auto" }}>
          <option value="active">Active</option>
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select name="band" defaultValue={sp.band ?? ""} style={{ width: "auto" }}>
          <option value="">Any fit</option>
          <option value="strong">Strong (75+)</option>
          <option value="possible">Possible (60–74)</option>
          <option value="weak">Weak (&lt;60)</option>
        </select>
        <select name="sort" defaultValue={sort} style={{ width: "auto" }}>
          <option value="score">Sort: score</option>
          <option value="recent">Sort: newest</option>
          <option value="salary">Sort: salary (low first)</option>
        </select>
        <button className="btn" type="submit">Filter</button>
      </form>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table className="list">
            <thead>
              <tr>
                <th>Score</th>
                <th>Candidate</th>
                <th>Background</th>
                <th>Red flags</th>
                <th>Notice</th>
                <th>Salary</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Applied</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan={9} className="muted" style={{ textAlign: "center", padding: 40 }}>No candidates match. Share the application link to start receiving applications.</td></tr>
              )}
              {list.map((c) => {
                const role = getRole(c.role);
                const qual = role?.profileSections[0].questions.find((q) => q.id === "qualification")?.options?.find((o) => o.value === c.app.profile.qualification)?.label;
                return (
                  <tr key={c.id}>
                    <td><Score s={c.score} /></td>
                    <td>
                      <Link className="name" href={`/admin/candidates/${c.id}`}>{c.app.name}</Link>
                      <div className="tiny">{c.app.location}{ROLES.length > 1 ? ` · ${role?.title}` : ""}</div>
                    </td>
                    <td className="small">{qual ?? "—"}</td>
                    <td>
                      {c.score.flags.length ? (
                        <span className="badge bad" title={c.score.flags.join("\n")}>{c.score.flags.length} flag{c.score.flags.length > 1 ? "s" : ""}</span>
                      ) : <span className="badge good">None</span>}
                    </td>
                    <td className="small">{noticeLabel(c.app.noticePeriod).replace("Can start ", "")}</td>
                    <td className="small num">{lkr(c.app.salaryExpectation)}</td>
                    <td><Stars n={c.manualRating} /></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td className="tiny num">{c.createdAt.slice(0, 10)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
