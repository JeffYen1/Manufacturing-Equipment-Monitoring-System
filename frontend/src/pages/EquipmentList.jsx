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


import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchEquipment } from "../api";

export default function EquipmentList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchEquipment();
        setItems(data);
      } catch (e) {
        setErr(e.message || "Failed to load equipment");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1 style={{ marginBottom: 12 }}>Equipment</h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Link
          to="/dashboard"
          style={{
            display: "inline-block",
            padding: "8px 12px",
            border: "1px solid #444",
            borderRadius: 10,
            textDecoration: "none",
            color: "inherit",
            fontWeight: 700,
          }}
        >
          Go to Dashboard →
        </Link>
      </div>

      {loading && <div>Loading...</div>}
      {err && <div style={{ padding: 12, border: "1px solid #999" }}><b>Error:</b> {err}</div>}

      {!loading && !err && (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((eq) => (
            /* Clicking a card navigate to the detail page where readings/alerts are shown */
            <Link
              key={eq.id}
              to={`/equipment/${eq.id}`}
              style={{
                textDecoration: "none",
                color: "inherit",
                border: "1px solid #444",
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                {eq.name} <span style={{ opacity: 0.7 }}>#{eq.id}</span>
              </div>
              <div style={{ marginTop: 6 }}>
                <b>Tool Type:</b> {eq.tool_type}
              </div>
              <div>
                <b>Location:</b> {eq.location}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
