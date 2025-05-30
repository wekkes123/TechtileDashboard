import React, { useState, useEffect } from "react";
import { Card, Modal, Button, Tag, Tooltip } from "antd";

const POEPort = ({ midspanId, portId, portData, togglePort }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [now, setNow] = useState(Date.now());

    const openModal = () => setModalOpen(true);
    const closeModal = () => setModalOpen(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Date.now());
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const timeSince = (timestamp) => {
        const seconds = Math.floor((now - timestamp) / 1000);
        if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        const days = Math.floor(hours / 24);
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    };

    const getBackgroundColor = () => {
        const status = portData?.status?.value;
        switch (status) {
            case "active":
                return "#dfffd6";
            case "inactive":
                return "#ffd6d6";
            default:
                return "#FFFFFF";
        }
    };

    return (
        <>
            <Card
                onClick={openModal}
                style={{
                    height: "110px",
                    width: "110px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                    backgroundColor: getBackgroundColor(),
                    cursor: "pointer"
                }}
            >
                <strong>Port:</strong> {portId}<br />
                <strong>Tile:</strong> {portData?.rpi ?? "N/A"}<br />
            </Card>

            <Modal
                title={`POE Port: ${midspanId} - ${portId} (last updated ${portData?.last_received ? timeSince(portData.last_received) : 'N/A'})`}
                open={modalOpen}
                onCancel={closeModal}
                footer={null}
            >
                <div>
                    <p><strong>Midspan ID:</strong> {midspanId}</p>
                    <p><strong>Port ID:</strong> {portId}</p>
                    <p><strong>Connected RPI:</strong> {portData?.rpi ?? "N/A"}</p>
                    <p>
                        <strong>Status:</strong>
                        <Tag color={
                            portData?.status?.value === "active" ? "green" :
                                portData?.status?.value === "inactive" ? "red" :
                                    "default"
                        }>
                            {portData?.status?.value ?? "Unknown"}
                        </Tag>
                    </p>
                    <p><strong>Power:</strong> {portData?.power?.value ?? "N/A"}</p>
                    <p><strong>Voltage:</strong> {portData?.voltage ?? "N/A"}</p>
                    <p><strong>Max Power:</strong> {portData?.maxPower?.value ?? "N/A"}</p>
                    <p><strong>Class:</strong> {portData?.class?.value ?? "N/A"}</p>

                    {Object.entries(portData || {}).map(([key, value]) => {
                        if (['rpi', 'power', 'status', 'voltage', 'last_received', 'midspan_id', 'port_id', 'midspan', 'port', 'maxPower', 'class', 'id'].includes(key)) {
                            return null;
                        }
                        return (
                            <Tooltip
                                key={key}
                                title={`Last updated: ${portData.last_received ? timeSince(portData.last_received) : 'N/A'}`}
                                placement="topLeft"
                            >
                                <p><strong>{key}:</strong> {typeof value === "object" && value?.value !== undefined ? value.value : String(value)}</p>
                            </Tooltip>
                        );
                    })}

                </div>
            </Modal>
        </>
    );
};

export default POEPort;