from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_caching import Cache
import os
import json
import socket
import yaml
import sqlite3
import time
import uuid
import threading
from ping3 import ping
from mqtt_config import client  # Ensure mqtt_config.py defines and connects the MQTT client

app = Flask(__name__)
CORS(app)
cache = Cache(app, config={'CACHE_TYPE': 'simple'})

STATUS_FILE_PATH = "status.json"
PENDING_REQUESTS = {}

# MQTT handlers
def on_mqtt_message(client, userdata, message):
    try:
        payload = json.loads(message.payload.decode("utf-8"))
        topic_parts = message.topic.split("/")
        if topic_parts[:3] == ["rpi", "control", "ack"]:
            device_id = topic_parts[3] if len(topic_parts) > 3 else "unknown"
            request_id = payload.get("request_id")
            print(f"[ACK] Received from {message.topic}: {payload}")

            if request_id and request_id in PENDING_REQUESTS:
                PENDING_REQUESTS.pop(request_id, None)

                confirm_topic = f"rpi/control/confirm/{payload['device_id']}"
                confirm_payload = {"request_id": request_id}
                client.publish(confirm_topic, json.dumps(confirm_payload))
                print(f"[CONFIRM] Sent confirmation for {request_id} to {confirm_topic}")
    except Exception as e:
        print(f"[ERROR] MQTT on_message failed: {e}")

client.on_message = on_mqtt_message
client.subscribe("rpi/control/ack/#")
client.loop_start()

def publish_status_periodically():
    topic = "experiment"
    interval = 10  # seconden

    while True:
        if os.path.exists(STATUS_FILE_PATH):
            try:
                with open(STATUS_FILE_PATH, "r") as f:
                    data = json.load(f)
                client.publish(topic, json.dumps(data))
                print(f"[MQTT] Published status to '{topic}':", data)
            except Exception as e:
                print(f"[ERROR] Failed to publish status: {e}")
        else:
            print(f"[MQTT] Status file not found, skipping publish")

        time.sleep(interval)
mqtt_status_thread = threading.Thread(target=publish_status_periodically, daemon=True)
mqtt_status_thread.start()


# Flask routes
@app.route("/status", methods=["GET"])
def get_status():
    if not os.path.exists(STATUS_FILE_PATH):
        return jsonify({"status": "inactive", "message": ""}), 200

    try:
        with open(STATUS_FILE_PATH, "r") as f:
            data = json.load(f)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": f"Error reading status file: {str(e)}"}), 500


@app.route("/status", methods=["POST"])
def update_status():
    try:
        data = request.get_json(force=True)
        print("Received JSON:", data)

        if not data:
            return jsonify({"error": "Missing JSON body"}), 400

        status = data.get("status", "inactive")
        message = data.get("message", "")

        json_data = {
            "status": status if status in ["active", "inactive"] else "inactive",
            "message": message or ""
        }

        with open(STATUS_FILE_PATH, "w") as f:
            json.dump(json_data, f)

        return jsonify({"success": True, "data": json_data}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/ping/<hostname>", methods=["GET"])
def ping_host(hostname):
    try:
        response_time = ping(hostname, timeout=10)
        if response_time is not None:
            return jsonify({"status": "alive", "time": round(response_time * 1000, 2)})
        else:
            return jsonify({"status": "failed"})
    except Exception as e:
        return jsonify({"error": "Error while pinging", "details": str(e)}), 500


@app.route("/data/<deviceId>", methods=["GET"])
@cache.cached(timeout=60, query_string=True)
def get_device_data(deviceId):
    try:
        hours = int(request.args.get("hours", 4))
        cutoff_timestamp = int(time.time()) - hours * 3600

        conn = sqlite3.connect('/home/pi/rpi_data.db', check_same_thread=False)
        cursor = conn.cursor()

        query = """
            SELECT cpuLoad, cpuTemp, ram, diskUsage, timestamp
            FROM rpi_data
            WHERE id = ? AND timestamp >= ?
            ORDER BY timestamp ASC
        """
        cursor.execute(query, (deviceId, cutoff_timestamp))
        rows = cursor.fetchall()
        conn.close()

        formatted = []
        for row in rows:
            cpu_load = float(str(row[0]).replace('%', '')) if row[0] else 0
            cpu_temp = float(row[1]) if row[1] else 0
            ram = float(str(row[2]).replace('MB', '').replace('GB', '').strip()) if row[2] else 0
            disk_usage = float(str(row[3]).replace('MB', '').replace('GB', '').strip()) if row[3] else 0
            timestamp = row[4]

            formatted.append({
                "cpuLoad": cpu_load,
                "cpuTemp": cpu_temp,
                "ram": ram,
                "diskUsage": disk_usage,
                "timestamp": timestamp
            })

        return jsonify(formatted)
    except Exception as e:
        return jsonify({"error": "Database error", "details": str(e)}), 500


@app.route("/control/<device_id>/<command>", methods=["POST"])
def send_control_command(device_id, command):
    try:
        if command not in ["shutdown", "reboot"]:
            return jsonify({"error": "Unsupported command"}), 400

        request_id = str(uuid.uuid4())
        topic = f"rpi/control/{device_id}"
        payload = {
            "request_id": request_id,
            "command": command
        }

        PENDING_REQUESTS[request_id] = {
            "device_id": device_id,
            "timestamp": time.time()
        }

        client.publish(topic, json.dumps(payload))
        print(f"[SEND] Sent '{command}' to {device_id} with request ID {request_id}")
        return jsonify({"success": True, "request_id": request_id}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def get_lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception as e:
        print("Could not determine LAN IP:", e)
        return "127.0.0.1"


def update_api_ip_in_yaml(ip, path="hosts.yaml"):
    try:
        with open(path, "r") as f:
            data = yaml.safe_load(f)

        data["all"]["vars"]["api_ip"] = ip

        with open(path, "w") as f:
            yaml.dump(data, f)

        print("Updated api_ip in hosts.yaml:", ip)

    except Exception as e:
        print("Failed to update YAML:", e)


def cleanup_pending_requests():
    while True:
        time.sleep(30)
        now = time.time()
        for req_id in list(PENDING_REQUESTS.keys()):
            if now - PENDING_REQUESTS[req_id]["timestamp"] > 60:
                print(f"[TIMEOUT] Removing stale request ID: {req_id}")
                del PENDING_REQUESTS[req_id]

cleanup_thread = threading.Thread(target=cleanup_pending_requests, daemon=True)
cleanup_thread.start()

if __name__ == "__main__":
    update_api_ip_in_yaml(get_lan_ip(), "/home/pi/TechtileDashboard/build/hosts.yaml")
    app.run(host="0.0.0.0", port=5000)
