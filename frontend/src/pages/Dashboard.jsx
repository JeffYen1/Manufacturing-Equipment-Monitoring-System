import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchEquipment, fetchHealth } from "../api";

function badgeStyle(level) {
    const base = { padding: "2px 10px", borderRadius: 999, border: "1px solid #555", fontWeight: 700};
    if (level === "HIGH") return { ...base, borderColor: "#c33" };
    if (level === "MED") return { ...base, borderColor: "#cc3" };
    return { ...base, borderColor: "#3c3" };
}   

export default function Dashboard() {
  const [tools, setTools] = useState([]);
  const [rows, setRows] = useState([]); // merged tool + health
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const equipment = await fetchEquipment();
        setTools(equipment);

        // Fetch health for each tool in parallel
        const healthList = await Promise.all(
          equipment.map((eq) => fetchHealth(eq.id, 50).catch((e) => ({ equipment_id: eq.id, level: "UNKNOWN", error: e.message })))
        );

        // Merge tool metadata + health response
        const merged = equipment.map((eq) => {
          const h = healthList.find((x) => x.equipment_id === eq.id) || {};
          return { ...eq, health: h };
        });

        setRows(merged);
      } catch (e) {
        setErr(e.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const summary = useMemo(() => {
    const total = rows.length;

    const failureTools = rows.filter((r) => (r.health?.failure_count ?? 0) > 0 || r.health?.level === "HIGH").length;
    const warningTools = rows.filter(
      (r) => (r.health?.failure_count ?? 0) === 0 && ((r.health?.warning_count ?? 0) > 0 || r.health?.level === "MED")
    ).length;

    const okTools = rows.filter((r) => (r.health?.failure_count ?? 0) === 0 && (r.health?.warning_count ?? 0) === 0 && r.health?.level === "LOW").length;

    return { total, failureTools, warningTools, okTools };
  }, [rows]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 18 }}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <Link to="/" style={{ textDecoration: "none" }}>Equipment</Link>
          <span style={{ opacity: 0.5 }}>|</span>
          <Link to="/dashboard" style={{ textDecoration: "none", fontWeight: 700 }}>Dashboard</Link>
        </div>
      </div>

      {loading && <div>Loading dashboard…</div>}
      {err && (
        <div style={{ padding: 12, border: "1px solid #999", borderRadius: 8 }}>
          <b>Error:</b> {err}
          <div style={{ marginTop: 8, opacity: 0.8 }}>
            Tip: confirm backend is running and <code>GET /equipment/{{id}}/health</code> works in docs.
          </div>
        </div>
      )}

      {!loading && !err && (
        <>
          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, marginBottom: 18 }}>
            <div style={{ border: "1px solid #444", borderRadius: 10, padding: 14 }}>
              <div style={{ opacity: 0.8 }}>Total tools</div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>{summary.total}</div>
            </div>
            <div style={{ border: "1px solid #444", borderRadius: 10, padding: 14 }}>
              <div style={{ opacity: 0.8 }}>Tools w/ FAILURE</div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>{summary.failureTools}</div>
            </div>
            <div style={{ border: "1px solid #444", borderRadius: 10, padding: 14 }}>
              <div style={{ opacity: 0.8 }}>Tools w/ WARNING</div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>{summary.warningTools}</div>
            </div>
            <div style={{ border: "1px solid #444", borderRadius: 10, padding: 14 }}>
              <div style={{ opacity: 0.8 }}>Tools OK</div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>{summary.okTools}</div>
            </div>
          </div>

          {/* Tool table */}
          {rows.length === 0 ? (
            <div style={{ opacity: 0.8 }}>
              No equipment found. Create one via <code>POST /equipment</code>.
            </div>
          ) : (
            <div style={{ overflowX: "auto", border: "1px solid #444", borderRadius: 10 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left" }}>
                    <th style={{ padding: 10, borderBottom: "1px solid #444" }}>Tool</th>
                    <th style={{ padding: 10, borderBottom: "1px solid #444" }}>Type</th>
                    <th style={{ padding: 10, borderBottom: "1px solid #444" }}>Location</th>
                    <th style={{ padding: 10, borderBottom: "1px solid #444" }}>Health</th>
                    <th style={{ padding: 10, borderBottom: "1px solid #444" }}>Warnings</th>
                    <th style={{ padding: 10, borderBottom: "1px solid #444" }}>Failures</th>
                    <th style={{ padding: 10, borderBottom: "1px solid #444" }}>Open</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td style={{ padding: 10, borderBottom: "1px solid #333" }}>{r.name}</td>
                      <td style={{ padding: 10, borderBottom: "1px solid #333" }}>{r.tool_type}</td>
                      <td style={{ padding: 10, borderBottom: "1px solid #333" }}>{r.location}</td>
                      <td style={{ padding: 10, borderBottom: "1px solid #333" }}>
                        <span style={badgeStyle(r.health?.level)}>{r.health?.level ?? "UNKNOWN"}</span>
                      </td>
                      <td style={{ padding: 10, borderBottom: "1px solid #333" }}>{r.health?.warning_count ?? "-"}</td>
                      <td style={{ padding: 10, borderBottom: "1px solid #333" }}>{r.health?.failure_count ?? "-"}</td>
                      <td style={{ padding: 10, borderBottom: "1px solid #333" }}>
                        <Link to={`/equipment/${r.id}`}>Details</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}