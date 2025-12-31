/**
 * Nav
 *
 * Simple navigation shared across pages so you don't need to type routes manually.
 */

import { Link, useLocation } from "react-router-dom";

export default function Nav() {
    const { pathname } = useLocation();

    const linkStyle = (active) => ({
        textDecoration: "none",
        color: "inherit",
        fontWeight: active ? 800 : 600,
        opacity: active ? 1 : 0.85,
    });

    return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
      <Link to="/" style={linkStyle(pathname === "/")}>Equipment</Link>
      <span style={{ opacity: 0.5 }}>|</span>
      <Link to="/dashboard" style={linkStyle(pathname.startsWith("/dashboard"))}>Dashboard</Link>
    </div>
  );
}