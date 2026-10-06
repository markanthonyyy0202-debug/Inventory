'use client';
import Link from 'next/link';
export default function Nav() {
  return (
    <header><div className="in">
      <h1>ITS MAINTENANCE REPORT SYSTEM</h1>
      <nav>
        <Link href="/">New report</Link>
        <Link href="/history">History</Link>
        <Link href="/admin">Manage actions &amp; RCA</Link>
      </nav>
    </div></header>
  );
}
