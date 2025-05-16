import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, Legend,
    CartesianGrid, ResponsiveContainer
} from 'recharts';

const rollingAverage = (arr, windowSize) => {
    if (!arr || arr.length === 0) return [];
    if (windowSize <= 1) return arr;
    const result = [];
    for (let i = 0; i <= arr.length - windowSize; i++) {
        const window = arr.slice(i, i + windowSize);
        result.push(window.reduce((sum, val) => sum + val, 0) / windowSize);
    }
    return result;
};


const GraphPage = ({ deviceId }) => {
    const [data, setData] = useState([]);
    const [hours, setHours] = useState(6);
    const [averageWindow, setAverageWindow] = useState(1);

    useEffect(() => {
        axios.get(`http://10.128.48.5:5000/data/${deviceId}?hours=${hours}`)
            .then((response) => {
                let formatted = response.data.map((entry) => ({
                    ...entry,
                    timestamp: entry.timestamp,
                    time: new Date(entry.timestamp * 1000).toLocaleTimeString(),
                    cpuLoad: typeof entry.cpuLoad === 'string' ? parseFloat(entry.cpuLoad.replace('%', '')) : Number(entry.cpuLoad) || 0,
                    cpuTemp: Number(entry.cpuTemp) || 0,
                    ram: typeof entry.ram === 'string' ? parseFloat(entry.ram.toLowerCase().replace('gb', '')) : Number(entry.ram) || 0,
                    diskUsage: typeof entry.diskUsage === 'string' ? parseFloat(entry.diskUsage.toLowerCase().replace('gb', '')) : Number(entry.diskUsage) || 0,
                }));

                formatted.sort((a, b) => a.timestamp - b.timestamp);

                const smoothed = formatted.slice(averageWindow - 1).map((_, i) => ({
                    time: formatted[i + averageWindow - 1].time,
                    cpuLoad: rollingAverage(formatted.map(e => e.cpuLoad), averageWindow)[i],
                    cpuTemp: rollingAverage(formatted.map(e => e.cpuTemp), averageWindow)[i],
                    ram: rollingAverage(formatted.map(e => e.ram), averageWindow)[i],
                    diskUsage: rollingAverage(formatted.map(e => e.diskUsage), averageWindow)[i],
                }));

                if (smoothed.length > 0) {
                    setData(smoothed);
                } else {
                    setData(formatted);
                }
            })
            .catch((error) => {
                console.error("Error fetching device data:", error);
            });
    }, [deviceId, hours, averageWindow]);

    const legendFormatter = (value) => {
        switch (value) {
            case 'cpuLoad': return 'CPU Load (%)';
            case 'cpuTemp': return 'CPU Temp (°C)';
            case 'ram': return 'RAM (GB)';
            case 'diskUsage': return 'Disk Usage (GB)';
            default: return value;
        }
    };

    return (
        <div style={{ width: "100%", height: "100%",minHeight: "400px", backgroundColor: "white", padding: "20px" }}>
            <h2>Device: {deviceId}</h2>

            <div style={{ marginBottom: "1rem" }}>
                <label>
                    Hours:
                    <input
                        type="number"
                        min="1"
                        max="48"
                        value={hours}
                        onChange={(e) => setHours(parseInt(e.target.value))}
                        style={{ marginLeft: 8, marginRight: 20 }}
                    />
                </label>
                <label>
                    Rolling Average Window:
                    <input
                        type="number"
                        min="1"
                        max="100"
                        value={averageWindow}
                        onChange={(e) => setAverageWindow(parseInt(e.target.value))}
                        style={{ marginLeft: 8, marginRight: 20 }}
                    />
                </label>
            </div>

            <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data}>
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend formatter={legendFormatter} />
                    <CartesianGrid stroke="#ccc" />
                    <Line type="monotone" dataKey="cpuLoad" stroke="#8884d8" name="CPU Load (%)" />
                    <Line type="monotone" dataKey="cpuTemp" stroke="#82ca9d" name="CPU Temp (°C)" />
                    <Line type="monotone" dataKey="ram" stroke="#ffc658" name="RAM (GB)" />
                    <Line type="monotone" dataKey="diskUsage" stroke="#ff7300" name="Disk Usage (GB)" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default GraphPage;
