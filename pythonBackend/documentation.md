# Flask API Documentation

This document describes the Flask API and MQTT logic used for monitoring and controlling Raspberry Pi devices.

---

## Overview

This Flask application:

* Publishes system status periodically via MQTT
* Accepts HTTP requests to update system status
* Queries SQLite database for device statistics
* Sends control commands to devices via MQTT
* Tracks pending control requests and cleans up stale ones

---

## Endpoints

### `GET /status`

Returns the current system status from the `status.json` file.

**Response**

```json
{
  "status": "active",
  "message": "System operational"
}
```

### `POST /status`

Updates the system status file.

**Request Body**

```json
{
  "status": "active",  // or "inactive"
  "message": "Custom message"
}
```

**Response**

```json
{
  "success": true,
  "data": { "status": "active", "message": "Custom message" }
}
```

---

### `GET /ping/<hostname>`

Pings a hostname and returns response time.

**Response**

```json
{
  "status": "alive",
  "time": 24.82  // in milliseconds
}
```

---

### `GET /data/<deviceId>?hours=N`

Fetches last N hours of data for a device from SQLite.

**Query Param**: `hours` (default 4)

**Response**

```json
[
  {
    "cpuLoad": 12.45,
    "cpuTemp": 53.2,
    "ram": 1.76,
    "diskUsage": 12.87,
    "timestamp": 1716972136
  },
  ...
]
```

---

### `POST /control/<device_id>/<command>`

Sends a control command to a device (`shutdown` or `reboot`).

**Response**

```json
{
  "success": true,
  "request_id": "f8790d20-f58a-4f56-8f49-55813bdc57c1"
}
```

---

## MQTT Topics

### `rpi/control/<device_id>`

Used to send control commands to a device.

**Payload**

```json
{
  "request_id": "<uuid>",
  "command": "shutdown"  // or "reboot"
}
```

### `rpi/control/ack/<device_id>`

Device responds with acknowledgment.

**Payload**

```json
{
  "request_id": "<uuid>",
  "device_id": "rpi-01"
}
```

### `rpi/control/confirm/<device_id>`

Server sends confirmation upon acknowledgment.

---

## File Structure

* `status.json`: Contains current system status and message.
* `rpi_data.db`: SQLite database for storing system stats.
* `hosts.yaml`: Used to store the API's LAN IP.

---

## Threads

* MQTT listener: Handles incoming acknowledgment messages.
* `publish_status_periodically`: Publishes status every 10 seconds.
* `cleanup_pending_requests`: Removes pending requests older than 60 seconds.

## Requirements

* Flask
* Flask-CORS
* Flask-Caching
* ping3
* paho-mqtt
* sqlite3
* PyYAML

---

## Run Server

```bash
python server.py
```
