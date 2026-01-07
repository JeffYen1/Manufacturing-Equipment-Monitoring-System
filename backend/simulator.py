"""
Simulator for Manufacturing Equipment Monitoring System.

This script simulates tool telemetry by posting sensor readings to the FastAPI backend.

Updates:
- Added WARNING-mode telemetry generation to produce readings that cross warning thresholds
  (temperature 86–94C or vibration 0.71–0.89) while keeping pressure stable.
- Tuned probabilities between NORMAL / WARNING / FAILURE so dashboards and health scoring
  show meaningful variation for demos and testing.

Why this matters:
Manufacturing monitoring systems depend on realistic distributions of warnings/failures
to validate alerting logic and prevent false confidence from all-normal data.
"""
import time
import random
import requests

BASE_URL = "http://127.0.0.1:8000"

def fetch_tools():
    r = requests.get(f"{BASE_URL}/equipment", timeout = 10)
    r.raise_for_status()
    data = r.json()
    # Expecting list of {id, name, ...}
    return [{"id": e["id"], "name": e.get("name", f"Tool-{e['id']}")} for e in data]

def generate_normal_reading():

    """
    Generate a normal (healthy) sensor reading.

    Values are intentionally kept within safe operating ranges
    to simulate equipment running under normal conditions.
    """

    return {
        "temperature": random.uniform(60, 80),
        "pressure": random.uniform(0.9, 1.1),
        "vibration": random.uniform(0.2, 0.5),
    }

def generate_warning_reading():
    warning_type = random.choice(["temp", "vibration"])

    if warning_type == "temp":
        return {
            "temperature": random.uniform(86, 94),
            "pressure": random.uniform(0.9, 1.1),
            "vibration": random.uniform(0.2, 0.5),
        }
    
    return {
        "temperature": random.uniform(60, 80),
        "pressure": random.uniform(0.9, 1.1),
        "vibration": random.uniform(0.71, 0.89),
    }

def generate_fault_reading():

    """
    Generate a faulty sensor reading.

    Randomly injects one type of fault:
    - High temperature
    - Excessive vibration
    - Out-of-range pressure

    These faults are designed to trigger WARNING or FAILURE
    alerts in the backend alert evaluation logic.
    """

    fault_type = random.choice(["temp", "vibration", "pressure"])

    if fault_type == "temp":
        return {
            "temperature": random.uniform(96, 110),
            "pressure": 1.0,
            "vibration": 0.4,
        }
    
    if fault_type == "vibration":
        return {
            "temperature": 75,
            "pressure": 1.0,
            "vibration": random.uniform(0.95, 1.2),
        }
    
    return {
        "temperature": 75,
        "pressure": random.uniform(0.5, 1.6),
        "vibration": 0.4,
    }

def send_reading(tool_id, reading):

    """
    Send a single sensor reading to the backend API.

    Args:
        tool_id: ID of the equipment in the backend database
        reading: Dictionary containing temperature, pressure, and vibration

    This function represents how real equipment controllers
    push telemetry data to manufacturing systems.
    """

    payload = {
        "equipment_id": tool_id,
        **reading
    }
    url = f"{BASE_URL}/readings"

    try:
        response = requests.post(url, json = payload, timeout = 10)
        print("POST", url, "->", response.status_code, response.text[:200])
    except requests.RequestException as e:
        print("Request failed:", e)


def run_simulation():

    """
    Main simulation loop.

    Continuously sends sensor readings for each configured tool.
    - 80% of readings are normal
    - 20% of readings contain injected faults

    Runs indefinitely until manually stopped.
    """

    print("Starting equipment simulator...")

    tools = fetch_tools()
    if not tools:
        print("No equipment found. Create equipment first (POST /equipment).")
        return

    while True:
        for tool in tools:
            # 80% normal, 20% fault
            if random.random() < 0.70:
                reading = generate_normal_reading()
            elif random.random() < 0.90:
                reading = generate_warning_reading()
            else:
                reading = generate_fault_reading()
            
            send_reading(tool["id"], reading)

        time.sleep(5)

if __name__ == "__main__":
    run_simulation()

