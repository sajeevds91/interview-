import Link from "next/link";

export function PublicHeader() {
  return (
    <header className="topbar">
      <div className="inner">
        <Link href="/" className="brand">Divide</Link>
        <span className="muted small">Careers</span>
      </div>
    </header>
  );
}
