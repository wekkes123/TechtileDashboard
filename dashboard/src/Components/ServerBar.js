import React, { useReducer, useEffect, useState } from "react";
import yaml from "js-yaml";

// Fetch YAML settings
async function fetchSettings() {
    const response = await fetch("/settings.yaml");
    const text = await response.text();
    return yaml.load(text);
}

export default function InfoBar() {
    const initialState = {
        status: "Unknown",
        ip: "0.0.0.0",
        cpuLoad: 0,
        ram: 0,
        internalDisk: 0,
        raidDisk: 0,
        cpuTemp: 30,
    };

    const [thresholds, setThresholds] = useState(null);

    useEffect(() => {
        fetchSettings().then((data) => {
            console.log("Loaded YAML settings:", data); // Debugging
            setThresholds(data.thresholds); // Update state when YAML is loaded
        }).catch((error) => console.error("Failed to load settings.yaml:", error));
    }, []);

    function infoReducer(state, action) {
        switch (action.type) {
            case "UPDATE_ALL":
                return { ...state, ...action.payload };
            case "UPDATE_FIELD":
                return { ...state, [action.field]: action.value };
            default:
                return state;
        }
    }

    const [state, dispatch] = useReducer(infoReducer, initialState);

    // Function to determine text color based on thresholds
    const getColor = (value, threshold) => {
        if (!threshold) return "white"; // Default color if thresholds are not yet loaded
        if (value >= threshold.critical) return "#fa9d9d"; // Red
        if (value >= threshold.warning) return "#facd7a"; // Orange
        return "#c5fab1"; // Green
    };

    const updateAllInfo = () => {
        dispatch({
            type: "UPDATE_ALL",
            payload: {
                status: "Online",
                ip: "192.168.1.100",
                cpuLoad: Math.floor(Math.random() * 100),
                ram: Math.floor(Math.random() * 100),
                internalDisk: Math.floor(Math.random() * 100),
                raidDisk: Math.floor(Math.random() * 100),
                cpuTemp: Math.floor(Math.random() * 100),
            },
        });
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
            <div style={styles.infoItem}>Status: {state.status}</div>
            <div style={styles.infoItem}>IP Address: {state.ip}</div>
            <div style={{ ...styles.infoItem, color: getColor(state.cpuLoad, thresholds?.cpuLoad) }}>
                CPU Load: {state.cpuLoad}%
            </div>
            <div style={{ ...styles.infoItem, color: getColor(state.ram, thresholds?.ram) }}>
                RAM: {state.ram}%
            </div>
            <div style={{ ...styles.infoItem, color: getColor(state.internalDisk, thresholds?.internalDisk) }}>
                Internal Disk: {state.internalDisk}%
            </div>
            <div style={{ ...styles.infoItem, color: getColor(state.raidDisk, thresholds?.raidDisk) }}>
                Raid Disk: {state.raidDisk}%
            </div>
            <div style={{ ...styles.infoItem, color: getColor(state.cpuTemp, thresholds?.cpuTemp) }}>
                CPU Temp: {state.cpuTemp}°C
            </div>
            <button
                style={styles.button}
                onMouseOver={(e) => (e.target.style.background = styles.buttonHover.background)}
                onMouseOut={(e) => (e.target.style.background = styles.button.background)}
                onClick={updateAllInfo}
            >
                Update All
            </button>
        </div>
    );
}
