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

    const rawData = serverData?.data || {};

    // Helper: safely unwrap numeric percentage or temperature
    const parseNumeric = (val) => {
        if (typeof val === "string") {
            return parseFloat(val.replace("%", ""));
        }
        return typeof val === "number" ? val : undefined;
    };

    const getColor = (value, threshold) => {
        if (value === undefined || threshold === undefined) return "white";
        if (value >= threshold.critical) return "#fa9d9d";
        if (value >= threshold.warning) return "#facd7a";
        return "#c5fab1";
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

    const renderField = (label, dataField, thresholdKey, unit = "%") => {
        const raw = rawData[dataField]?.value;
        const parsed = parseNumeric(raw);
        if (raw === undefined) return null;

        return (
            <div style={{ ...styles.infoItem, color: getColor(parsed, thresholds?.[thresholdKey]) }}>
                {label}: {raw}{unit}
            </div>
        );
    };

    return (
        <div style={styles.infoBar}>
            <div style={styles.infoItem}><strong>Server</strong></div>
            {rawData.status?.value && (
                <div style={styles.infoItem}>Status: {rawData.status.value}</div>
            )}
            {rawData.ip?.value && (
                <div style={styles.infoItem}>IP Address: {rawData.ip.value}</div>
            )}
            {renderField("CPU Load", "cpuLoad", "cpuLoad")}
            {renderField("RAM", "ram", "ram")}
            {renderField("Internal Disk", "internalDisk", "internalDisk")}
            {renderField("Raid Disk", "raidDisk", "raidDisk")}
            {renderField("CPU Temp", "cpuTemp", "cpuTemp", "°C")}
        </div>
    );
}

export default InfoBar;
