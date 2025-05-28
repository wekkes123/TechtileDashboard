//Should be displayed: Status(Enable/Disable), Power, Max power, Class(0<-->8), be able to enable disable

// POEport.js
import React, { useState, useEffect } from "react";
import { Card, Modal, Button, Tag, Tooltip } from "antd";

const POEPort = ({ midspanId, portId, portData }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [now, setNow] = useState(Date.now());

    const openModal = () => setModalOpen(true);
    const closeModal = () => setModalOpen(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Date.now());
        }, 10000); // update every 10 seconds

        return () => clearInterval(interval); // cleanup
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

    const getStatusColor = (status) => {
        switch (status) {
            case "online":
                return "green";
            case "offline":
                return "red";
            case "unknown":
            default:
                return "default";
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
                    textAlign: "center"
                }}
            >
                <strong>Port:</strong> {portId}<br />
                <strong>Tile:</strong> {portData.rpi}<br />
                <strong>Status:</strong> <Tag color={getStatusColor(portData.status)}>{portData.status}</Tag><br />
                <strong>Power:</strong> {portData.power}<br />
                <strong>Voltage:</strong> {portData.voltage}<br />
            </Card>

            <Modal
                title={`POE Port: ${midspanId} - ${portId} (last updated ${portData.last_received ? timeSince(portData.last_received) : 'N/A'})`}
                open={modalOpen}
                onCancel={closeModal}
                footer={null}
            >
                <div>
                    <p><strong>Midspan ID:</strong> {midspanId}</p>
                    <p><strong>Port ID:</strong> {portId}</p>
                    <p><strong>Connected RPI:</strong> {portData.rpi}</p>
                    <p>
                        <strong>Status:</strong>
                        <Tag color={getStatusColor(portData.status)}>
                            {portData.status}
                        </Tag>
                    </p>
                    <p><strong>Power:</strong> {portData.power}</p>
                    <p><strong>Voltage:</strong> {portData.voltage}</p>
                    {/* Display other data dynamically */}
                    {Object.entries(portData).map(([key, value]) => {
                        // Exclude keys already displayed or internal
                        if (['rpi', 'power', 'status', 'voltage', 'last_received', 'midspan_id', 'port_id', 'midspan', 'port'].includes(key)) {
                            return null;
                        }
                        return (
                            <Tooltip
                                key={key}
                                title={`Last updated: ${portData.last_received ? timeSince(portData.last_received) : 'N/A'}`}
                                placement="topLeft"
                            >
                                <p><strong>{key}:</strong> {value}</p>
                            </Tooltip>
                        );
                    })}
                </div>
            </Modal>
        </>
    );
};

export default POEPort;
