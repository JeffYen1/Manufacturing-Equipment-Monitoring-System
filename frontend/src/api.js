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

async function asError(res, context) {
    const text = await res.text();
    return new Error(`${context} failed (${res.status}): ${text || res.statusText}`);
}

async function expectJson(res, context) {
    if (!res.ok) throw await asError(res, context);
    return res.json();
}

function withNetworkHint(err) {
    const msg = err?.message ? String(err.message) : String(err);
    if (msg.includes("Failed to fetch") || msg.includes("ECONNREFUSED")){
        return new Error(
            `${msg}\n\nHint: Is the backend running on port 8000? (uvicorn ... --port 8000)`
        );
    }
    return err;
}

export async function fetchEquipment() {
    // List all tools for the Equipment List page
    try {
        const res = await fetch(`/api/equipment`);
        return await expectJson(res, "GET /equipment");
    } catch (e){
        throw withNetworkHint(e);
    }   
}

export async function fetchEquipmentById(id) {
    // Fetch tool metadata for the Equipment Detail page
    try{
        const res = await fetch(`/api/equipment/${id}`);
        return await expectJson(res, `GET /equipment/${id}`);
    } catch (e) {
        throw withNetworkHint(e);
    }
}

export async function fetchReadings(id, limit = 50) {
    // Fetch most recent sensor readings (latest first) for table/chart display
    try{
        const res = await fetch(`/api/equipment/${id}/readings?limit=${limit}`);
        return await expectJson(res, `GET / equipment/${id}/readings`);
    } catch (e) {
        throw withNetworkHint(e);
    }
}

export async function fetchHealth(id, window = 50) {
    try {
        const res = await fetch(`/api/equipment/${id}/health?window=${window}`);
        return await expectJson(res, `GET / equipment/${id}/health`);
    } catch (e) {
        throw withNetworkHint(e);
    }
}