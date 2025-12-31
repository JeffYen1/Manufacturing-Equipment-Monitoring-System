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
import Nav from "../components/Nav";
import Loading from "../components/Loading";
import ErrorBox from "../components/ErrorBox";
import EmptyState from "../components/EmptyState";

export default function EquipmentList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await fetchEquipment();
      setItems(data);
    } catch (e) {
      setErr(e?.message || "Failed to load equipment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <Nav />

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <h1 style={{ margin: 0 }}>Equipment</h1>
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

      {loading && <Loading label="Loading equipment..." />}

      {!loading && err && (
        <ErrorBox title="Could not load equipment" message={err} onRetry={load} />
      )}

      {!loading && !err && items.length === 0 && (
        <EmptyState message="No equipment found yet. Create one via POST /equipment." />
      )}

      {!loading && !err && items.length > 0 && (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((eq) => (
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
              <div style={{ fontSize: 18, fontWeight: 800 }}>
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
