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

    useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        // Fetch metadata + readings together so the page loads in one pass.
        const [eqData, readingsData] = await Promise.all([
          fetchEquipmentById(equipmentId),
          fetchReadings(equipmentId, limit),
        ]);
        setEq(eqData);
        setReadings(readingsData);
      } catch (e) {
        setErr(e.message || "Failed to load equipment detail");
      } finally {
        setLoading(false);
      }
    })();
  }, [equipmentId, limit]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <div style={{ marginBottom: 12 }}>
        <Link to="/" style={{ textDecoration: "none" }}>← Back</Link>
      </div>

      {loading && <div>Loading...</div>}
      {err && (
        <div style={{ padding: 12, border: "1px solid #999", borderRadius: 8 }}>
          <b>Error:</b> {err}
        </div>
      )}

      {!loading && !err && eq && (
        <>
          <h1 style={{ marginBottom: 6 }}>
            {eq.name} <span style={{ opacity: 0.7 }}>#{eq.id}</span>
          </h1>
          <div style={{ opacity: 0.85, marginBottom: 18 }}>
            <b>Tool Type:</b> {eq.tool_type} &nbsp;•&nbsp; <b>Location:</b> {eq.location}
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
            <div><b>Recent readings</b></div>
            <label style={{ marginLeft: "auto" }}>
              Limit:&nbsp;
              <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>
          </div>

          {readings.length === 0 ? (
            <div style={{ opacity: 0.8 }}>
              No readings yet. Run the simulator or POST readings.
            </div>
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
                      <td style={{ padding: 10, borderBottom: "1px solid #333" }}>
                        {r.timestamp}
                      </td>
                      <td style={{ padding: 10, borderBottom: "1px solid #333" }}>
                        {fmt(r.temperature)}
                      </td>
                      <td style={{ padding: 10, borderBottom: "1px solid #333" }}>
                        {fmt(r.pressure)}
                      </td>
                      <td style={{ padding: 10, borderBottom: "1px solid #333" }}>
                        {fmt(r.vibration)}
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