const API_BASE = import.meta.env.VITE_API_BASE_URL;

/**
 * API helpers for the frontend.
 *
 * We call the backend through the Vite dev proxy (`/api/...`) so:
 * - requests stay same-origin (no CORS issues)
 * - we avoid Codespaces tunnel auth redirects
 * - local development is stable and predictable
 *
 * Backend routes (proxied):
 * - GET /equipment
 * - GET /equipment/{id}
 * - GET /equipment/{id}/readings?limit=N
 */

export async function fetchEquipment() {
    // List all tools for the Equipment List page
    const res = await fetch(`/api/equipment`);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`GET /equipment failed: ${res.status} ${await res.text}`);
    }
    return res.json();
}

export async function fetchEquipmentById(id) {
    // Fetch tool metadata for the Equipment Detail page
    const res = await fetch(`/api/equipment/${id}`);
    if (!res.ok) throw new Error(`GET /equipment/${id} failed: ${res.status} ${await res.text()}`);
    return res.json();
}

export async function fetchReadings(id, limit = 50) {
    // Fetch most recent sensor readings (latest first) for table/chart display
    const res = await fetch(`/api/equipment/${id}/readings?limit=${limit}`);
    if (!res.ok) throw new Error(`GET /equipment/${id}/readings failed: ${res.status} ${await res.text()}`)
    return res.json();
}