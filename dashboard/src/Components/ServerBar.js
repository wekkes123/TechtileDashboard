import React, { useEffect, useState } from "react";
import yaml from "js-yaml";

// Fetch YAML settings
async function fetchSettings() {
    const response = await fetch("/settings.yaml");
    const text = await response.text();
    return yaml.load(text);
}

function InfoBar({ serverData }) {
    const [thresholds, setThresholds] = useState(null);

    useEffect(() => {
        fetchSettings()
            .then((data) => {
                console.log("Loaded YAML settings:", data);
                setThresholds(data.thresholds);
            })
            .catch((error) => console.error("Failed to load settings.yaml:", error));
    }, []);

    const serverBarData = serverData?.data || {};

    const getColor = (value, threshold) => {
        if (value === undefined || threshold === undefined) return "white";
        if (value >= threshold.critical) return "#fa9d9d"; // Red
        if (value >= threshold.warning) return "#facd7a"; // Orange
        return "#c5fab1"; // Green
    };

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
            zIndex: 1000,
        },
        infoItem: {
            margin: "0 10px",
        },
    };

    const renderField = (label, value, thresholdKey) => {
        if (value === undefined) return null;
        return (
            <div style={{ ...styles.infoItem, color: getColor(value, thresholds?.[thresholdKey]) }}>
                {label}: {value}{label.includes("Temp") ? "°C" : "%"}
            </div>
        );
    };

    return (
        <div style={styles.infoBar}>
            <div style={styles.infoItem}><strong>Server</strong></div>
            {serverBarData.status && <div style={styles.infoItem}>Status: {serverBarData.status}</div>}
            {serverBarData.ip && <div style={styles.infoItem}>IP Address: {serverBarData.ip}</div>}
            {renderField("CPU Load", serverBarData.cpuLoad, "cpuLoad")}
            {renderField("RAM", serverBarData.ram, "ram")}
            {renderField("Internal Disk", serverBarData.internalDisk, "internalDisk")}
            {renderField("Raid Disk", serverBarData.raidDisk, "raidDisk")}
            {renderField("CPU Temp", serverBarData.cpuTemp, "cpuTemp")}
        </div>
    );
}

export default InfoBar;
