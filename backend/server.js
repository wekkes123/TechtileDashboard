const express = require('express');
const cors = require('cors');
const ping = require('ping');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 5000;

app.use(cors());

// Ping endpoint
app.get('/ping/:hostname', async (req, res) => {
    const { hostname } = req.params;

    try {
        const response = await ping.promise.probe(hostname, { timeout: 10 });

        if (response.alive) {
            res.json({ status: 'alive', time: response.time });
        } else {
            res.json({ status: 'failed' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error while pinging', details: error.message });
    }
});

app.get('/data/:deviceId', (req, res) => {
    const { deviceId } = req.params;
    const hours = parseInt(req.query.hours) || 6; // default to 6 hours if not provided
    const db = new sqlite3.Database('/home/pi/rpi_data.db');

    // Calculate cutoff timestamp in seconds
    const cutoffTimestamp = Math.floor(Date.now() / 1000) - hours * 3600;

    const query = `
        SELECT cpuLoad, cpuTemp, ram, diskUsage, timestamp
        FROM rpi_data
        WHERE id = ? AND timestamp >= ?
        ORDER BY timestamp ASC
    `;

    db.all(query, [deviceId, cutoffTimestamp], (err, rows) => {
        db.close();
        if (err) {
            console.error("SQLite error:", err.message);
            return res.status(500).json({ error: 'Database error' });
        }

        const formatted = rows.map(row => ({
            cpuLoad: parseFloat(row.cpuLoad?.replace('%', '')) || 0,
            cpuTemp: parseFloat(row.cpuTemp) || 0,
            ram: parseFloat(row.ram?.replace(/[a-zA-Z]/g, '')) || 0,
            diskUsage: parseFloat(row.diskUsage?.replace(/[a-zA-Z]/g, '')) || 0,
            timestamp: row.timestamp
        }));

        res.json(formatted);
    });
});



app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
});
