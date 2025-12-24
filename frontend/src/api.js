const API_BASE = import.meta.env.VITE_API_BASE_URL;

export async function fetchEquipment() {
    const res = await fetch('/api/equipment');
    if (!res.ok) {
        const text = await res.text();
        throw new Error('GET /equipment failed: ${res.status] ${text}');
    }
    return res.json();
}