"use client";
import { useState } from "react";

export default function PlayerTabs({ children }: { children: any }) {
  const tabs = ["Profile", "Metrics", "Sessions", "Bookings", "Account"];
  const [active, setActive] = useState("Profile");

  return (
    <div>
      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          overflowX: "auto",
          gap: 8,
          paddingBottom: 8,
          marginBottom: 16,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            style={{
              padding: "8px 16px",
              borderRadius: 9999,
              border: active === tab ? "2px solid #2563eb" : "1px solid #e5e7eb",
              background: active === tab ? "#2563eb" : "#ffffff",
              color: active === tab ? "#ffffff" : "#111827",
              whiteSpace: "nowrap",
              fontSize: 14,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {children(active)}
      </div>
    </div>
  );
}
