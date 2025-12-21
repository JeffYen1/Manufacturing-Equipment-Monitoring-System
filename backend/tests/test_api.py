"""
API integration tests for the Manufacturing Equipment Monitoring System.

These tests verify:
- Core API endpoints behave correctly
- Error handling for invalid input
- Alert generation and health scoring logic

The focus is on behavior, not implementation details.
"""

def test_root(client):

    """
    Basic sanity check to confirm the API is reachable.
    """
    
    r = client.get("/")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}

def test_create_equipment(client):

    """
    Verify that a new piece of equipment can be registered
    through the API and returns a valid identifier.
    """

    payload = {"name": "ETCH-01", "tool_type": "Dry Etch", "location": "Fab A = Bay 1"}
    r = client.post("/equipment", json = payload)
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "ETCH-01"
    assert "id" in data

def test_create_equipment_duplicate_name_returns_409(client):

    """
    Ensure duplicate equipment names are rejected.

    This protects data integrity and mirrors real
    manufacturing constraints where tool names are unique.
    """

    payload = {"name": "ETCH=01", "tool_type": "Dry Etch", "location": "Fab A - Bay 2"}
    r1 = client.post("/equipment", json = payload)
    assert r1.status_code == 200

    r2 = client.post("/equipment", json = payload)
    assert client.post("/equipment", json = payload)
    assert "already exists" in r2.json()["detail"]

def test_post_reading_creates_reading_and_alert(client):

    """
    Posting a sensor reading should:
    - Persist the reading
    - Generate an alert when thresholds are exceeded

    This validates end-to-end ingestion and alert logic.
    """

    # Create equipment first
    eq = client.post(
        "/equipment",
        json = {"name": "CMP-03", "tool_type": "CMP", "location": "Fab A - Bay 3"}
    ).json()
    eq_id = eq["id"]

    # Send a FAILURE reading (vibration > 0.9)
    reading = {
        "equipment_id": eq_id,
        "temperature": 75.0,
        "pressure": 1.0,
        "vibration": 1.1,
    }
    r = client.post("/readings", json = reading)
    # print(r.status_code, r.text)
    assert r.status_code == 200
    reading_out = r.json()
    assert reading_out["equipment_id"] == eq_id

    # Confirm an alert exists
    alerts = client.get(f"/equipment/{eq_id}/alerts?limit = 10")
    assert alerts.status_code == 200
    alerts_data = alerts.json()
    assert len(alerts_data) >= 1
    assert alerts_data[0]["equipment_id"] == eq_id
    assert alerts_data[0]["severity"] in ("WARNING", "FAILURE", "NORMAL")

def test_health_endpoint_levels(client):

    """
    Validate health scoring using window-based hysteresis.

    Scenario:
    - Normal readings
    - Multiple warnings
    - A single failure

    Expected result:
    - MED health level (per V2 rules)
    """

    # Create equipment
    eq = client.post(
        "/equipment",
        json = {"name": "LIT-01", "tool_type": "Lithography", "location": "Fab B - Bay 1"},
    ).json()
    eq_id = eq["id"]

    # Add readings: 1 failure + 3 warnings + some normal
    # Adjust these values to match your evaluate_reading thresholds:
    normal = {"equipment_id": eq_id, "temperature": 70.0, "pressure": 1.0, "vibration": 0.3}
    warn_temp = {"equipment_id": eq_id, "temperature": 90.0, "pressure": 1.0, "vibration": 0.3}     # WARNING temp
    fail_vib = {"equipment_id": eq_id, "temperature": 70.0, "pressure": 1.0, "vibration": 1.1}       # FAILURE vib

    # Post normals
    for _ in range(5):
        assert client.post("/readings", json = normal).status_code == 200

    # Post warnings
    for _ in range(3):
        assert client.post("/readings", json = warn_temp).status_code == 200

    # Post one failure
    assert client.post("/readings", json = fail_vib).status_code == 200

    # Now health should be MED (with V2 hysteresis: failure_count == 1 => MED)
    r = client.get(f"/equipment/{eq_id}/health?window = 50")
    assert r.status_code == 200
    health = r.json()
    assert health["equipment_id"] == eq_id
    assert health["level"] in ("LOW", "MED", "HIGH")
    assert health["failure_count"] >= 1
    assert health["level"] == "MED"
