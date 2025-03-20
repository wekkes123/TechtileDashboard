import React from "react";
import { Card, Button, Modal } from "antd";
import { useState } from "react";

const RpiCell = ({ tile, wallName, updateTile }) => {
    const [modalOpen, setModalOpen] = useState(false);

    const openModal = () => setModalOpen(true);
    const closeModal = () => setModalOpen(false);

    const handleToggleStatus = () => {
        updateTile(tile.id, { isActive: !tile.isActive });
        closeModal();
    };

    return (
        <>
            <Card
                onClick={openModal}
                style={{
                    background: tile.isActive ? "#dfffd6" : "#ffd6d6",
                    textAlign: "center",
                    cursor: "pointer"
                }}
            >
                {tile.id} ({tile.value})
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
                    <p>Row: {tile.row}</p>
                    <p>Column: {tile.col}</p>
                    <p>Current Value: {tile.value}</p>
                    <p>Active Status: {tile.isActive ? "Active" : "Inactive"}</p>
                    <p>Metadata: {JSON.stringify(tile.metadata)}</p>
                    <Button onClick={handleToggleStatus}>
                        Toggle Tile Status
                    </Button>
                </div>
            </Modal>
        </>
    );
};

export default RpiCell;