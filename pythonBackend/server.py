from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import socket
import yaml
from flask_caching import Cache

app = Flask(__name__)
CORS(app)

cache = Cache(app, config={'CACHE_TYPE': 'simple'})

STATUS_FILE_PATH = "status.json"


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
        data = request.get_json(force=True)  # Force parsing, avoids silent failure
        print("Received JSON:", data)

        if not data:
            return jsonify({"error": "Missing JSON body"}), 400

        status = data.get("status", "inactive")
        message = data.get("message", "")

        json_data = {
            "status": status if status in ["active", "inactive"] else "inactive",
            "message": message or ""
        }

        with open("status.json", "w") as f:
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
            return jsonify({"status": "alive", "time": round(response_time * 1000, 2)})  # ms
        else:
            return jsonify({"status": "failed"})
    except Exception as e:
        return jsonify({"error": "Error while pinging", "details": str(e)}), 500


@app.route("/data/<deviceId>", methods=["GET"])
@cache.cached(timeout=60, query_string=True)
def get_device_data(deviceId):
    try:
        hours = int(request.args.get("hours", 6))
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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
