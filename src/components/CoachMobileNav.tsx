"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function CoachMobileNav() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  return (
    <>
      <div className="coachMobileNav">
        <Link className={`cBtn ${isActive("/coach/calendar") ? "active" : ""}`} href="/coach/calendar">
          <div className="cIcon">📅</div>
          <div className="cLabel">Calendar</div>
        </Link>

        <Link className={`cBtn ${isActive("/coach/players") ? "active" : ""}`} href="/coach/players">
          <div className="cIcon">📈</div>
          <div className="cLabel">Players</div>
        </Link>

        <Link className={`cBtn ${isActive("/coach/money") ? "active" : ""}`} href="/coach/money">
          <div className="cIcon">💵</div>
          <div className="cLabel">Money</div>
        </Link>
      </div>

      <style>{`
        .coachMobileNav { display: none; }

        @media (max-width: 820px) {
          .coachMobileNav {
            position: fixed;
            left: 12px;
            right: 12px;
            bottom: 12px;
            height: 66px;
            border-radius: 18px;
            border: 1px solid #e5e7eb;
            background: rgba(255,255,255,0.92);
            backdrop-filter: blur(10px);
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
            padding: 8px;
            box-shadow: 0 18px 40px rgba(15,23,42,0.18);
            z-index: 9999;
          }

          .cBtn {
            text-decoration: none;
            border-radius: 14px;
            display: grid;
            place-items: center;
            gap: 2px;
            padding: 6px 4px;
            color: #111827;
            font-weight: 900;
          }

          .cBtn.active {
            background: #111827;
            color: #fff;
          }

          .cIcon { font-size: 18px; line-height: 1; }
          .cLabel { font-size: 11px; line-height: 1; opacity: 0.9; }
        }
      `}</style>
    </>
  );
}
