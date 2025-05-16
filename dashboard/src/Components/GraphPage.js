import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts';

const GraphPage = ({ deviceId }) => {
    const [data, setData] = useState([]);

    useEffect(() => {
        fetch(`http://10.128.48.5:5000/data/${deviceId}`)
            .then((res) => res.json())
            .then((json) => {
                // Convert timestamps to readable format
                const formatted = json.map((entry) => ({
                    ...entry,
                    time: new Date(entry.timestamp * 1000).toLocaleTimeString(),
                }));
                setData(formatted.reverse()); // Chronological
            });
    }, [deviceId]);

    return (
        <div style={{ width: "100%", height: 400 }}>
            <h2>Device: {deviceId}</h2>
            <ResponsiveContainer>
                <LineChart data={data}>
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <CartesianGrid stroke="#ccc" />
                    <Line type="monotone" dataKey="cpuLoad" stroke="#8884d8" name="CPU Load" />
                    <Line type="monotone" dataKey="cpuTemp" stroke="#82ca9d" name="CPU Temp" />
                    <Line type="monotone" dataKey="ram" stroke="#ffc658" name="RAM" />
                    <Line type="monotone" dataKey="diskUsage" stroke="#ff7300" name="Disk Usage" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default GraphPage;
