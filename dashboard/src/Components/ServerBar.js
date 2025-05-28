import React, { useReducer, useEffect, useState } from "react";
import yaml from "js-yaml";

// Fetch YAML settings
async function fetchSettings() {
    const response = await fetch("/settings.yaml");
    const text = await response.text();
    return yaml.load(text);
}

export default function InfoBar({serverData}) {
    const [thresholds, setThresholds] = useState(null);

    useEffect(() => {
        fetchSettings().then((data) => {
            console.log("Loaded YAML settings:", data); // Debugging
            setThresholds(data.thresholds); // Update state when YAML is loaded
        }).catch((error) => console.error("Failed to load settings.yaml:", error));
    }, []);

    console.log("data: ", serverData)
    if (!serverData) {
        return <div>Loading Server Bar...</div>;
    }
    const serverBarData = serverData.data

    // Function to determine text color based on thresholds
    const getColor = (value, threshold) => {
        if (!threshold) return "white"; // Default color if thresholds are not yet loaded
        if (value >= threshold.critical) return "#fa9d9d"; // Red
        if (value >= threshold.warning) return "#facd7a"; // Orange
        return "#c5fab1"; // Green
    };

    // Styles inside the component
    const styles = {
        infoBar: {
            position: "fixed",
            bottom: 0,
            width: "100%",
            background: "#222",
            color: "white",
            display: "flex",
            justifyContent: "space-around",
            padding: "10px",
            fontSize: "14px",
        },
        infoItem: {
            margin: "0 10px",
        },
        button: {
            background: "#444",
            color: "white",
            border: "none",
            padding: "5px 10px",
            marginLeft: "10px",
            cursor: "pointer",
        },
        buttonHover: {
            background: "#666",
        },
    };

    return (
        <div style={styles.infoBar}>
            <div style={styles.infoItem}><strong>Server</strong></div>
            <div style={styles.infoItem}>Status: {serverBarData.status}</div>
            <div style={styles.infoItem}>IP Address: {serverBarData.ip}</div>
            <div style={{ ...styles.infoItem, color: getColor(serverBarData.cpuLoad, thresholds?.cpuLoad) }}>
                CPU Load: {serverBarData.cpuLoad}%
            </div>
            <div style={{ ...styles.infoItem, color: getColor(serverBarData.ram, thresholds?.ram) }}>
                RAM: {serverBarData.ram}%
            </div>
            <div style={{ ...styles.infoItem, color: getColor(serverBarData.internalDisk, thresholds?.internalDisk) }}>
                Internal Disk: {serverBarData.internalDisk}%
            </div>
            <div style={{ ...styles.infoItem, color: getColor(serverBarData.raidDisk, thresholds?.raidDisk) }}>
                Raid Disk: {serverBarData.raidDisk}%
            </div>
            <div style={{ ...styles.infoItem, color: getColor(serverBarData.cpuTemp, thresholds?.cpuTemp) }}>
                CPU Temp: {serverBarData.cpuTemp}°C
            </div>
        </div>
    );
}
