import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchEquipment, fetchHealth } from "../api";
import Nav from "../components/Nav";
import Loading from "../components/Loading";
import ErrorBox from "../components/ErrorBox";
import EmptyState from "../components/EmptyState";

function badgeStyle(level) {
    const base = { padding: "2px 10px", borderRadius: 999, border: "1px solid #555", fontWeight: 700, display: "inline-block",};
    if (level === "HIGH") return { ...base, borderColor: "#c33" };
    if (level === "MED") return { ...base, borderColor: "#cc3" };
    if (level === "LOW") return {...base, borderColor: "#3c3"};
    return base;
}   

export default function Dashboard() {
  const [rows, setRows] = useState([]); // merged tool + health
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const equipment = await fetchEquipment();

      // Fetch health in parallel; if one fails, keep dashboard alive.
      const healthList = await Promise.all(
        // equipment.map(async (eq, i) => {
        //   const idToUse = i === 0 ? 999999 : eq.id;
        //   return await fetchHealth(idToUse, 50);
        // }),
        equipment.map(async (eq) => {
          try {
            return await fetchHealth(eq.id, 50);
          } catch (e) {
            return { equipment_id: eq.id, level: "UNKNOWN", warning_count: null, failure_count: null, error: e?.message };
          }
        })
      );

      const merged = equipment.map((eq) => {
        const h = healthList.find((x) => x.equipment_id === eq.id);
        return { ...eq, health: h };
      });

      setRows(merged);
    } catch (e) {
      setErr(e?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(() => {
    const total = rows.length;

    const downTools = rows.filter((r) => r.status === "DOWN").length;

    const failureTools = rows.filter((r) => (r.health?.failure_count ?? 0) > 0 || r.health?.level === "HIGH").length;
    const warningTools = rows.filter(
      (r) => (r.health?.failure_count ?? 0) === 0 && ((r.health?.warning_count ?? 0) > 0 || r.health?.level === "MED")
    ).length;

    const okTools = rows.filter((r) => (r.health?.failure_count ?? 0) === 0 && (r.health?.warning_count ?? 0) === 0 && r.health?.level === "LOW").length;

    return { total, downTools, failureTools, warningTools, okTools };
  }, [rows]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <Nav />

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <button
          onClick={load}
          style={{
            marginLeft: "auto",
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid #444",
            background: "transparent",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Refresh
        </button>
      </div>

      {loading && <Loading label="Loading dashboard..." />}

      {!loading && err && (
        <ErrorBox title="Could not load dashboard" message={err} onRetry={load} />
      )}

      {!loading && !err && rows.length === 0 && (
        <EmptyState message="No equipment found yet. Create one via POST /equipment." />
      )}

      {!loading && !err && rows.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 12, marginBottom: 18 }}>
            <div style={{ border: "1px solid #444", borderRadius: 10, padding: 14 }}>
              <div style={{ opacity: 0.8 }}>Total tools</div>
              <div style={{ fontSize: 26, fontWeight: 900 }}>{summary.total}</div>
            </div>
            <div style={{ border: "1px solid #444", borderRadius: 10, padding: 14 }}>
              <div style={{ opacity: 0.8 }}>Total tools</div>
              <div style={{ fontSize: 26, fontWeight: 900 }}>{summary.total}</div>
            </div>
            <div style={{ border: "1px solid #444", borderRadius: 10, padding: 14 }}>
              <div style={{ opacity: 0.8 }}>Tools DOWN</div>
              <div style={{ fontSize: 26, fontWeight: 900 }}>{summary.downTools}</div>
            </div>
            <div style={{ border: "1px solid #444", borderRadius: 10, padding: 14 }}>
              <div style={{ opacity: 0.8 }}>Tools w/ FAILURE</div>
              <div style={{ fontSize: 26, fontWeight: 900 }}>{summary.failureTools}</div>
            </div>
            <div style={{ border: "1px solid #444", borderRadius: 10, padding: 14 }}>
              <div style={{ opacity: 0.8 }}>Tools w/ WARNING</div>
              <div style={{ fontSize: 26, fontWeight: 900 }}>{summary.warningTools}</div>
            </div>
            <div style={{ border: "1px solid #444", borderRadius: 10, padding: 14 }}>
              <div style={{ opacity: 0.8 }}>Tools OK</div>
              <div style={{ fontSize: 26, fontWeight: 900 }}>{summary.okTools}</div>
            </div>
          </div>

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
                      {r.health?.error && (
                        <div style={{ marginTop: 6, opacity: 0.7, fontSize: 12 }}>
                          health fetch failed
                        </div>
                      )}
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
        </>
      )}
    </div>
  );
}