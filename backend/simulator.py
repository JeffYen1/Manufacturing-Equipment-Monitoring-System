"""
Simulator for Manufacturing Equipment Monitoring System.

This script simulates multiple manufacturing tools by periodically
sending sensor readings to the backend API.

Purpose:
- Stress-test alert logic
- Demonstrate automated data ingestion
- Mimic real equipment telemetry
"""
import time
import random
import requests

BASE_URL = "https://congenial-funicular-g4rp7pp5pg9gcvgx-8000.app.github.dev"

TOOLS = [
    {"id": 1, "name": "ETCH-01"},
    {"id": 2, "name": "CVD-02"},
    {"id": 3, "name": "CMP-03"},
]

def generate_normal_reading():
    return {
        "temperature": random.uniform(60, 80),
        "pressure": random.uniform(0.9, 1.1),
        "vibration": random.uniform(0.2, 0.5),
    }

def generate_fault_reading():
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
    payload = {
        "equipment_id": tool_id,
        **reading
    }
    url = f"{BASE_URL}/readings"

    try:
        response = requests.post(url, json = payload, timeout = 10)
        print("POST", url, "->", response.status_code, response.text[:200])
    except requests.RequestException as e:
        print("Requset failed:", e)


def run_simulation():
    print("Starting equipment simulator...")

    while True:
        for tool in TOOLS:
            # 80% normal, 20% fault
            if random.random() < 0.8:
                reading = generate_normal_reading()
            else:
                reading = generate_fault_reading()
            
            send_reading(tool["id"], reading)

        time.sleep(5)

if __name__ == "__main__":
    run_simulation()