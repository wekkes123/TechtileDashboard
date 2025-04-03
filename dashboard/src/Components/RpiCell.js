import React from "react";
import { Card, Button, Modal, Tag } from "antd";
import { useState } from "react";

const RpiCell = ({ tile, wallName, updateTile }) => {
    const [modalOpen, setModalOpen] = useState(false);

    const openModal = () => setModalOpen(true);
    const closeModal = () => setModalOpen(false);

    // Get background color based on status
    const getBackgroundColor = () => {
        switch (tile.status) {
            case "working":
                return "#dfffd6"; // Green for working
            case "faulty":
                return "#ffd6d6"; // Red for faulty
            case "deactivated":
                return "#f0f0f0"; // Grey for deactivated
            default:
                return "#f0f0f0"; // Default gray
        }
    };

    // Get status text for display
    const getStatusText = () => {
        switch (tile.status) {
            case "working":
                return "Working";
            case "faulty":
                return "Faulty";
            case "deactivated":
                return "Deactivated";
            default:
                return "Unknown";
        }
    };

    // Handle status change
    const handleStatusChange = (newStatus) => {
        updateTile(tile.id, { status: newStatus });
        closeModal();
    };

    return (
        <>
            <Card
                onClick={openModal}
                style={{
                    background: getBackgroundColor(),
                    textAlign: "center",
                    cursor: "pointer"
                }}
            >
                {tile.id} ({tile.data.temp}°)
            </Card>
            <Modal
                title={`Tile: ${tile.id}`}
                open={modalOpen}
                onCancel={closeModal}
                footer={null}
            >
                <div>
                    <p>Walls: {tile.walls?.join(", ")}</p>
                    <p>Segments: {tile.segments?.join(", ")}</p>
                    <p>Tile ID: {tile.id}</p>
                    <p>
                        Status: <Tag color={
                        tile.status === "working" ? "green" :
                            tile.status === "faulty" ? "red" :
                                "default"
                    }>
                        {getStatusText()}
                    </Tag>
                    </p>
                    {Object.entries(tile.data).map(([key, value]) => (
                        <p key={key}>{key}: {value}</p>
                    ))}
                    <p>Metadata: {JSON.stringify(tile.metadata)}</p>

                    <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                        <Button
                            type="primary"
                            style={{ backgroundColor: "#52c41a" }}
                            onClick={() => handleStatusChange("working")}
                            disabled={tile.status === "working"}
                        >
                            Set Working
                        </Button>
                        <Button
                            danger
                            onClick={() => handleStatusChange("faulty")}
                            disabled={tile.status === "faulty"}
                        >
                            Set Faulty
                        </Button>
                        <Button
                            onClick={() => handleStatusChange("deactivated")}
                            disabled={tile.status === "deactivated"}
                            style={{ backgroundColor: "#d9d9d9", color: "rgba(0,0,0,0.65)" }}
                        >
                            Deactivate
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default RpiCell;