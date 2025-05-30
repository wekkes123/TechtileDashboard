import React, { useEffect, useState } from "react";
import { Card, Button, Modal, Tag, Tooltip, message } from "antd";
import axios from "axios";
import { useGraph } from "../Dashboard";

const RpiCell = ({ tile, wallName, updateTile, selectedDisplayField }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [now, setNow] = useState(Date.now());
    const { showGraphForTile } = useGraph();

    const openModal = () => setModalOpen(true);
    const closeModal = () => setModalOpen(false);

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 10000);
        return () => clearInterval(interval);
    }, []);

    const getBackgroundColor = () => {
        switch (tile.status.value) {
            case "working": return "#dfffd6";
            case "faulty": return "#ffd6d6";
            case "deactivated": return "#f0f0f0";
            default: return "#f0f0f0";
        }
    };

    const getStatusText = () => {
        switch (tile.status.value) {
            case "working": return "Working";
            case "faulty": return "Faulty";
            case "deactivated": return "Deactivated";
            default: return "Unknown";
        }
    };

    const timeSince = (timestamp) => {
        const seconds = Math.floor((now - timestamp) / 1000);
        if (seconds < 60) return `${seconds} second${seconds !== 1 ? "s" : ""} ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
        const days = Math.floor(hours / 24);
        return `${days} day${days !== 1 ? "s" : ""} ago`;
    };

    const handleStatusChange = (newStatus) => {
        updateTile(tile.id, { status: newStatus });
        closeModal();
    };

    const sendDeviceCommand = async (command) => {
        try {
            await axios.post(`http://10.128.48.5:5000/control/${tile.id}/${command}`);
            message.success(`Command '${command}' sent successfully to ${tile.id}`);
        } catch (error) {
            console.error(`Failed to send '${command}' command`, error);
            message.error(`Failed to send '${command}' command`);
        }
    };

    return (
        <>
            <Card
                onClick={openModal}
                style={{
                    background: getBackgroundColor(),
                    maxWidth: "120px",
                    maxHeight: "120px",
                    textAlign: "center",
                    cursor: "pointer"
                }}
            >
                {tile.id} ({tile.data?.[selectedDisplayField]?.value ?? "N/A"}{selectedDisplayField === "cpuTemp" ? "°" : ""})
            </Card>

            <Modal
                title={`Tile: ${tile.id} (last updated ${timeSince(tile.last_received)})`}
                open={modalOpen}
                onCancel={closeModal}
                footer={null}
            >
                <div>
                    <p>Walls: {tile.walls?.join(", ")}</p>
                    <p>Segments: {tile.segments?.join(", ")}</p>
                    <p>Tile ID: {tile.id}</p>
                    <p>
                        Status:
                        <Tag color={
                            tile.status.value === "working" ? "green" :
                                tile.status.value === "faulty" ? "red" : "default"
                        }>
                            {getStatusText()}
                        </Tag>
                    </p>

                    {Object.entries(tile.data).map(([key, value]) => (
                        <Tooltip
                            key={key}
                            title={`Last updated: ${timeSince(value.timestamp)}`}
                            placement="topLeft"
                        >
                            <p>{key}: {value.value}</p>
                        </Tooltip>
                    ))}

                    {tile.metadata && Object.keys(tile.metadata).length > 0 && (
                        <p>Metadata: {JSON.stringify(tile.metadata)}</p>
                    )}

                    <div style={{ display: "flex", gap: "10px", marginTop: "15px", flexWrap: "wrap" }}>
                        <Button
                            type="primary"
                            style={{ backgroundColor: "#52c41a" }}
                            onClick={() => handleStatusChange("working")}
                            disabled={tile.status.value === "working"}
                        >
                            Set Working
                        </Button>
                        <Button
                            danger
                            onClick={() => handleStatusChange("faulty")}
                            disabled={tile.status.value === "faulty"}
                        >
                            Set Faulty
                        </Button>
                        <Button
                            onClick={() => handleStatusChange("deactivated")}
                            disabled={tile.status.value === "deactivated"}
                            style={{ backgroundColor: "#d9d9d9", color: "rgba(0,0,0,0.65)" }}
                        >
                            Deactivate (UI Only)
                        </Button>
                        <Button
                            onClick={() => sendDeviceCommand("shutdown")}
                            style={{ backgroundColor: "#ffec3d" }}
                        >
                            Deactivate (API)
                        </Button>
                        <Button
                            onClick={() => sendDeviceCommand("reboot")}
                            style={{ backgroundColor: "#1890ff", color: "white" }}
                        >
                            Reboot
                        </Button>
                        <Button
                            onClick={() => showGraphForTile(tile.id)}
                            style={{ backgroundColor: "#722ed1", color: "white" }}
                        >
                            Show Graph
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default RpiCell;
