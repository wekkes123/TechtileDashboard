const express = require('express');
const cors = require('cors');
const ping = require('ping');

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

app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
});
