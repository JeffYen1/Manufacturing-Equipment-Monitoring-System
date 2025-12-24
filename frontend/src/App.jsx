import { useEffect, useState } from "react";
import { fetchEquipment } from "./api";
import "./App.css";

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setErr("");
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
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Live list from <code>GET /equipment</code>
      </p>

      {loading && <div>Loading...</div>}
      {err && (
        <div style={{ padding: 12, border: "1px solid #999", borderRadius: 8 }}>
          <b>Error:</b> {err}
          <div style={{ marginTop: 8, opacity: 0.8 }}>
            Tip: check CORS + your <code>VITE_API_BASE_URL</code>.
          </div>
        </div>
      )}

      {!loading && !err && (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((eq) => (
            <div
              key={eq.id}
              style={{
                padding: 14,
                border: "1px solid #444",
                borderRadius: 10,
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
            </div>
          ))}

          {items.length === 0 && (
            <div style={{ opacity: 0.8 }}>
              No equipment found. Create one using <code>POST /equipment</code>.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
