const API_BASE = import.meta.env.VITE_API_BASE_URL;

export async function fetchEquipment() {
    const res = await fetch(`/api/equipment`);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`GET /equipment failed: ${res.status} ${await res.text}`);
    }
    return res.json();
}

export async function fetchEquipmentById(id) {
    const res = await fetch(`/api/equipment/${id}`);
    if (!res.ok) throw new Error(`GET /equipment/${id} failed: ${res.status} ${await res.text()}`);
    return res.json();
}

export async function fetchReadings(id, limit = 50) {
    const res = await fetch(`/api/equipment/${id}/readings?limit=${limit}`);
    if (!res.ok) throw new Error(`GET /equipment/${id}/readings failed: ${res.status} ${await res.text()}`)
    return res.json();
}