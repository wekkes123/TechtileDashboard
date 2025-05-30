import React, { useState, useEffect } from "react";
import { Card, Modal, Button, Tag, Tooltip } from "antd";

const PDUPort = ({ PDUId, portId, portData }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [now, setNow] = useState(Date.now());

    const openModal = () => setModalOpen(true);
    const closeModal = () => setModalOpen(false);

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 10000);
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
        const status = portData?.status?.value?.toLowerCase();
        switch (status) {
            case "active":
                return "#dfffd6"; // Green
            case "inactive":
                return "#ffd6d6"; // Red
            default:
                return "#FFFFFF"; // Default
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
                <strong>Port:</strong> {portId}
            </Card>

            <Modal
                title={`PDU Port: ${PDUId} - ${portId} (last updated ${portData?.status?.timestamp ? timeSince(portData.status.timestamp) : 'N/A'})`}
                open={modalOpen}
                onCancel={closeModal}
                footer={null}
            >
                <div>
                    <p><strong>PDU ID:</strong> {PDUId}</p>
                    <p><strong>Port ID:</strong> {portId}</p>

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
                    <p><strong>Voltage:</strong> {portData?.voltage?.value ?? "N/A"}</p>
                    <p><strong>Current:</strong> {portData?.current?.value ?? "N/A"}</p>

                    {Object.entries(portData || {}).map(([key, value]) => {
                        if (['power', 'status', 'voltage', 'current', 'last_received', 'PDU_id', 'port_id', 'PDU', 'port', 'id'].includes(key)) {
                            return null;
                        }
                        return (
                            <Tooltip
                                key={key}
                                title={`Last updated: ${value?.timestamp ? timeSince(value.timestamp) : 'N/A'}`}
                                placement="topLeft"
                            >
                                <p><strong>{key}:</strong> {value?.value ?? String(value)}</p>
                            </Tooltip>
                        );
                    })}
                </div>
            </Modal>
        </>
    );
};

export default PDUPort;
