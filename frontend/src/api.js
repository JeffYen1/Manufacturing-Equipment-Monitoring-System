const API_BASE = import.meta.env.VITE_API_BASE_URL;

/**
 * Frontend API helpers.
 *
 * We call the backend through the Vite dev proxy (`/api/...`) so we avoid:
 * - CORS issues (same-origin requests)
 * - Codespaces tunnel auth redirects returning HTML instead of JSON
 *
 * Design goal:
 * - Every function either returns JSON, or throws a readable Error message
 *   that the UI can display (and allow Retry).
 */

async function asError(res, context) {
    // Use text() because FastAPI error bodies are usually JSON, but sometimes
    // proxy/network errors return empty bodies or HTML.
    const text = await res.text();
    return new Error(`${context} failed (${res.status}): ${text || res.statusText}`);
}

async function expectJson(res, context) {
    // Centralized response check so pages stay simple.
    if (!res.ok) throw await asError(res, context);
    return res.json();
}

function withNetworkHint(err) {
    // Browser-level failures often appear as "Failed to fetch"
    // (e.g., backend stopped or proxy cannot connect).
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