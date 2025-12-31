/**
 * Equipment List page
 *
 * Purpose:
 * - show the operator a list of all registered tools
 * - allow navigation to a tool's detail page (/equipment/:id)
 *
 * Data source:
 * - GET /equipment (via frontend proxy /api/equipment)
 */


import { use, useEffect, useMemo, useState } from "react";
import {Link, useParams } from "react-router-dom";
import { fetchEquipmentById, fetchReadings } from "../api";
import Nav from "../components/Nav";
import Loading from "../components/Loading";
import ErrorBox from "../components/ErrorBox";
import EmptyState from "../components/EmptyState";

// Keep the UI readable: sensor values do not need full floating-point precision.
function fmt(n) {
    if (typeof n !== "number") return n;
    return Number(n.toFixed(3));
}

export default function EquipmentDetail() {
    const { id } = useParams();
    const equipmentId = useMemo(() => Number(id), [id]);

    const [eq, setEq] = useState(null);
    const [readings, setReadings] = useState([]);
    const [limit, setLimit] = useState(50);

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const load = async () => {
    if (!Number.isFinite(equipmentId)) {
      setErr(`Invalid equipment id: ${id}`);
      return;
    }

    setLoading(true);
    setErr("");
    try {
      const [eqData, readingsData] = await Promise.all([
        fetchEquipmentById(equipmentId),
        fetchReadings(equipmentId, limit),
      ]);
      setEq(eqData);
      setReadings(readingsData);
    } catch (e) {
      setErr(e?.message || "Failed to load equipment detail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [equipmentId, limit]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <Nav />

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <Link to="/" style={{ textDecoration: "none" }}>← Back</Link>

        <label style={{ marginLeft: "auto" }}>
          Limit:&nbsp;
          <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>

        <button
          onClick={load}
          style={{
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

      {loading && <Loading label="Loading equipment detail..." />}

      {!loading && err && (
        <ErrorBox title="Could not load equipment detail" message={err} onRetry={load} />
      )}

      {!loading && !err && eq && (
        <>
          <h1 style={{ marginBottom: 6 }}>
            {eq.name} <span style={{ opacity: 0.7 }}>#{eq.id}</span>
          </h1>
          <div style={{ opacity: 0.85, marginBottom: 18 }}>
            <b>Tool Type:</b> {eq.tool_type} &nbsp;•&nbsp; <b>Location:</b> {eq.location}
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontWeight: 800 }}>Recent readings</div>
            <div style={{ opacity: 0.7 }}>(latest first)</div>
          </div>

          {readings.length === 0 ? (
            <EmptyState message="No readings yet. Run simulator.py or POST /readings." />
          ) : (
            <div style={{ overflowX: "auto", border: "1px solid #444", borderRadius: 10 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left" }}>
                    <th style={{ padding: 10, borderBottom: "1px solid #444" }}>Time</th>
                    <th style={{ padding: 10, borderBottom: "1px solid #444" }}>Temp</th>
                    <th style={{ padding: 10, borderBottom: "1px solid #444" }}>Pressure</th>
                    <th style={{ padding: 10, borderBottom: "1px solid #444" }}>Vibration</th>
                  </tr>
                </thead>
                <tbody>
                  {readings.map((r) => (
                    <tr key={r.id}>
                      <td style={{ padding: 10, borderBottom: "1px solid #333" }}>{r.timestamp}</td>
                      <td style={{ padding: 10, borderBottom: "1px solid #333" }}>{fmt(r.temperature)}</td>
                      <td style={{ padding: 10, borderBottom: "1px solid #333" }}>{fmt(r.pressure)}</td>
                      <td style={{ padding: 10, borderBottom: "1px solid #333" }}>{fmt(r.vibration)}</td>
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