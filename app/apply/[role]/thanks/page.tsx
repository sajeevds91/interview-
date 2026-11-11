import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";

export default function Thanks() {
  return (
    <>
      <PublicHeader />
      <main className="wrap narrow">
        <div className="card">
          <h1>Thank you — application received</h1>
          <p>We&apos;ve sent a confirmation to your email. If your experience matches what we need, we&apos;ll email you a link to book an online interview at a time that suits you.</p>
          <Link href="/" className="btn">Back to careers</Link>
        </div>
      </main>
    </>
  );
}
