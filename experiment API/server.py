from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import socket
import yaml

app = Flask(__name__)
CORS(app)

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
