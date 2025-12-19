"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddPlayerForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [classYear, setClassYear] = useState("");
  const [age, setAge] = useState("");
  const [position, setPosition] = useState("");
  const [bats, setBats] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [travelOrg, setTravelOrg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Player name is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          school,
          classYear,
          age,
          position,
          bats,
          height,
          weight,
          travelOrg,
        }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        setError(data.error || "Failed to create player.");
        setLoading(false);
        return;
      }

      const newPlayerId: string | undefined = data?.player?.id;

      // Clear the form
      setName("");
      setSchool("");
      setClassYear("");
      setAge("");
      setPosition("");
      setBats("");
      setHeight("");
      setWeight("");
      setTravelOrg("");

      // If we got an id back, go straight to the player profile page
     router.push("/dashboard");
    router.refresh();

    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
router.push("/dashboard");
router.refresh();

    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "grid",
        gap: 10,
        marginTop: 12,
      }}
    >
      {error && (
        <div
          style={{
            fontSize: 12,
            color: "#b91c1c",
            background: "#fee2e2",
            borderRadius: 8,
            padding: "6px 10px",
            border: "1px solid #fecaca",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "grid", gap: 4 }}>
        <label style={{ fontSize: 12, fontWeight: 500 }}>Player Name *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ethan Riley"
          style={{
            borderRadius: 8,
            border: "1px solid #d1d5db",
            padding: "6px 10px",
            fontSize: 13,
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: 8,
        }}
      >
        <div style={{ display: "grid", gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 500 }}>School</label>
          <input
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="McAdory High School"
            style={{
              borderRadius: 8,
              border: "1px solid #d1d5db",
              padding: "6px 10px",
              fontSize: 13,
            }}
          />
        </div>

        <div style={{ display: "grid", gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 500 }}>Class Year</label>
          <select
            value={classYear}
            onChange={(e) => setClassYear(e.target.value)}
            style={{
              borderRadius: 8,
              border: "1px solid #d1d5db",
              padding: "6px 10px",
              fontSize: 13,
              backgroundColor: "#fff",
            }}
          >
            <option value="">Select...</option>
            <option value="Freshman">Freshman</option>
            <option value="Sophomore">Sophomore</option>
            <option value="Junior">Junior</option>
            <option value="Senior">Senior</option>
            <option value="College">College</option>
          </select>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
        }}
      >
        <div style={{ display: "grid", gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 500 }}>Age</label>
          <input
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="14"
            inputMode="numeric"
            style={{
              borderRadius: 8,
              border: "1px solid #d1d5db",
              padding: "6px 10px",
              fontSize: 13,
            }}
          />
        </div>

        <div style={{ display: "grid", gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 500 }}>Position</label>
          <input
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="1B / P"
            style={{
              borderRadius: 8,
              border: "1px solid #d1d5db",
              padding: "6px 10px",
              fontSize: 13,
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
        }}
      >
        <div style={{ display: "grid", gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 500 }}>Bats</label>
          <select
            value={bats}
            onChange={(e) => setBats(e.target.value)}
            style={{
              borderRadius: 8,
              border: "1px solid #d1d5db",
              padding: "6px 10px",
              fontSize: 13,
              backgroundColor: "#fff",
            }}
          >
            <option value="">Select...</option>
            <option value="Right">Right</option>
            <option value="Left">Left</option>
            <option value="Switch">Switch</option>
          </select>
        </div>

        <div style={{ display: "grid", gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 500 }}>Height</label>
          <input
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder={`6'0"`}
            style={{
              borderRadius: 8,
              border: "1px solid #d1d5db",
              padding: "6px 10px",
              fontSize: 13,
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
        }}
      >
        <div style={{ display: "grid", gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 500 }}>Weight (lbs)</label>
          <input
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="160"
            inputMode="numeric"
            style={{
              borderRadius: 8,
              border: "1px solid #d1d5db",
              padding: "6px 10px",
              fontSize: 13,
            }}
          />
        </div>

        <div style={{ display: "grid", gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 500 }}>Travel Org</label>
          <input
            value={travelOrg}
            onChange={(e) => setTravelOrg(e.target.value)}
            placeholder="Birmingham Giants"
            style={{
              borderRadius: 8,
              border: "1px solid #d1d5db",
              padding: "6px 10px",
              fontSize: 13,
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          marginTop: 6,
          borderRadius: 9999,
          border: "none",
          padding: "9px 12px",
          fontSize: 13,
          fontWeight: 600,
          background:
            "linear-gradient(135deg, rgba(56,189,248,1), rgba(59,130,246,1))",
          color: "#020617",
          cursor: loading ? "default" : "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Adding player..." : "Add Player"}
      </button>
    </form>
  );
}
