import {useState, useReducer, useEffect} from "react";
import { Layout, Button, Drawer, Card, Modal, message } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import { generateMockData } from "./mqttWebSocketListener";

const { Header, Content } = Layout;


const tilesReducer = (state, action) => {
    switch (action.type) {
        case 'UPDATE_TILE':
            return {
                ...state,
                [action.payload.wall]: {
                    ...state[action.payload.wall],
                    tiles: {
                        ...state[action.payload.wall].tiles,
                        [action.payload.tileId]: {
                            ...state[action.payload.wall].tiles[action.payload.tileId],
                            ...action.payload.updates
                        }
                    }
                }
            };

        case 'BULK_UPDATE_TILES':
            const updatedState = { ...state };
            action.payload.forEach(({ wall, tileId, updates }) => {
                updatedState[wall].tiles[tileId] = {
                    ...updatedState[wall].tiles[tileId],
                    ...updates
                };
            });
            return updatedState;

        case 'RESET_TILE':
            return {
                ...state,
                [action.payload.wall]: {
                    ...state[action.payload.wall],
                    tiles: {
                        ...state[action.payload.wall].tiles,
                        [action.payload.tileId]: {
                            ...state[action.payload.wall].tiles[action.payload.tileId],
                            value: 0,
                            metadata: {},
                            isActive: true
                        }
                    }
                }
            };

        default:
            return state;
    }
};

const Dashboard = () => {
    const initialWalls = {
        "Wall East": {
            rows: ["1", "2", "3", "4"],
            cols: ["A", "B", "C", "D", "E", "F"],
            tiles: {}
        },
        "Wall West": {
            rows: ["11", "12", "13", "14"],
            cols: ["A", "B", "C", "D", "E", "F"],
            tiles: {}
        },
        "Ceiling": {
            rows: ["5", "6", "7", "8", "9", "10"],
            cols: ["A", "B", "C", "D", "E", "F"],
            tiles: {}
        },
        "Floor": {
            rows: ["15", "16", "17", "18", "19", "20"],
            cols: ["A", "B", "C", "D", "E", "F"],
            tiles: {}
        }
    };

    // Initialize tiles
    Object.keys(initialWalls).forEach(wallName => {
        initialWalls[wallName].tiles = {};
        initialWalls[wallName].rows.forEach((rowLabel) => {
            initialWalls[wallName].cols.forEach((colLabel) => {
                const tileKey = `${colLabel}${rowLabel}`;
                initialWalls[wallName].tiles[tileKey] = {
                    id: tileKey,
                    wall: wallName,
                    row: rowLabel,
                    col: colLabel,
                    value: 0,
                    metadata: {},
                    isActive: true  // New boolean flag
                };
            });
        });
    });

    const [walls, dispatchTiles] = useReducer(tilesReducer, initialWalls);
    const [open, setOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTile, setSelectedTile] = useState(null);

    // Function to update a single tile
    const updateTile = (wall, tileId, updates) => {
        dispatchTiles({
            type: 'UPDATE_TILE',
            payload: { wall, tileId, updates }
        });
        message.success(`Updated tile ${tileId} on ${wall}`);
    };

    // Function to bulk update tiles
    const bulkUpdateTiles = (updates) => {
        dispatchTiles({
            type: 'BULK_UPDATE_TILES',
            payload: updates
        });
        message.success(`Bulk updated ${updates.length} tiles`);
    };

    // Function to reset a tile
    const resetTile = (wall, tileId) => {
        dispatchTiles({
            type: 'RESET_TILE',
            payload: { wall, tileId }
        });
        message.info(`Reset tile ${tileId} on ${wall}`);
    };

    // Find tile's location by ID
    const findTileById = (tileId) => {
        for (const wall in walls) {
            if (walls[wall].tiles[tileId]) {
                return { wall, tileId };
            }
        }
        return null;
    };


    // Debug functions for testing
    const debugFunctions = {
        toggleSingleTile: () => {
            const wall = "Wall East";
            const tileId = "A1";
            updateTile(wall, tileId, { isActive: false });
        },
        toggleMultipleTiles: () => {
            const updates = [
                { wall: "Wall East", tileId: "A1", updates: { isActive: false } },
                { wall: "Wall West", tileId: "B12", updates: { isActive: false } },
                { wall: "Ceiling", tileId: "C7", updates: { isActive: false } }
            ];
            bulkUpdateTiles(updates);
        },
        reactivateAllTiles: () => {
            const updates = [];
            Object.keys(walls).forEach(wall => {
                Object.keys(walls[wall].tiles).forEach(tileId => {
                    updates.push({
                        wall,
                        tileId,
                        updates: { isActive: true }
                    });
                });
            });
            bulkUpdateTiles(updates);
        }
    };

    const handleMessage = (data) => {
        try {
            console.log("Received data:", data);
            //setLastMessage(data); // Store the last received message

            const tileLocation = findTileById(data.id);
            if (tileLocation) {
                updateTile(tileLocation.wall, tileLocation.tileId, {
                    value: Math.round(parseFloat(data.temp)),
                    isActive: data.status === "1"
                });
            } else {
                console.warn(`No tile found for ID: ${data.id}`);
            }
        } catch (error) {
            console.error("Error processing data:", error);
        }
    };


    useEffect(() => {
        generateMockData(handleMessage);
    }, []);


    const openModal = (wallName, tileKey) => {
        const selectedTileInfo = walls[wallName].tiles[tileKey];
        setSelectedTile(selectedTileInfo);
        setModalOpen(true);
    };

    return (
        <Layout style={{ minHeight: "100vh", display: "flex" }}>
            <Layout style={{ width: open ? "50vw" : "100vw", transition: "width 0.3s ease" }}>
                <Header style={{
                    background: "#001529",
                    padding: "0 16px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center"
                }}>
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}>
                        <h1 style={{ color: "white", margin: 0 }}>Dashboard</h1>
                        <Button
                            type="primary"
                            icon={<MenuOutlined />}
                            onClick={() => setOpen(true)}
                            style={{marginRight: '15px'}}
                        >
                            Open Panel
                        </Button>
                    </div>
                    <div style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "10px",
                        marginTop: "10px"
                    }}>
                        <Button
                            onClick={debugFunctions.toggleSingleTile}
                            type="primary"
                            danger
                        >
                            Toggle Single Tile
                        </Button>
                        <Button
                            onClick={debugFunctions.toggleMultipleTiles}
                            type="primary"
                            danger
                        >
                            Toggle Multiple Tiles
                        </Button>
                        <Button
                            onClick={debugFunctions.reactivateAllTiles}
                            type="primary"
                            style={{ backgroundColor: "green" }}
                        >
                            Reactivate All Tiles
                        </Button>
                    </div>
                </Header>
                <Content style={{ padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
                    {Object.entries(walls).map(([wallName, { rows, cols, tiles }]) => (
                        <div key={wallName} style={{ marginBottom: "20px" }}>
                            <h2 style={{ textAlign: "center" }}>{wallName}</h2>
                            <div style={{ display: "grid", gridTemplateColumns: "auto repeat(6, 1fr)", gap: "10px", alignItems: "center" }}>
                                <div></div>
                                {cols.map((colLabel) => (
                                    <div key={colLabel} style={{ textAlign: "center", fontWeight: "bold" }}>{colLabel}</div>
                                ))}
                                {rows.map((rowLabel) => (
                                    <>
                                        <div style={{ textAlign: "center", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center" }}>{rowLabel}</div>
                                        {cols.map((colLabel) => {
                                            const tileKey = `${colLabel}${rowLabel}`;
                                            const tile = tiles[tileKey];
                                            return (
                                                <Card
                                                    key={tileKey}
                                                    onClick={() => openModal(wallName, tileKey)}
                                                    style={{
                                                        background: tile.isActive ? "#dfffd6" : "#ffd6d6",
                                                        textAlign: "center",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    {tileKey} ({tile.value})
                                                </Card>
                                            );
                                        })}
                                    </>
                                ))}
                            </div>
                        </div>
                    ))}
                </Content>
            </Layout>
            <Drawer
                title="Tile Management"
                placement="right"
                width="50vw"
                onClose={() => setOpen(false)}
                open={open}
                style={{ position: "absolute", right: 0 }}
            >
                <h3>Debug Functions:</h3>
                <ul>
                    <li><strong>Toggle Single Tile:</strong> Deactivates A1 on Wall East</li>
                    <li><strong>Toggle Multiple Tiles:</strong> Deactivates tiles on different walls</li>
                    <li><strong>Reactivate All Tiles:</strong> Resets all tiles to active state</li>
                </ul>
            </Drawer>
            <Modal
                title={selectedTile ? `Tile: ${selectedTile.id}` : "Tile Info"}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
            >
                {selectedTile && (
                    <div>
                        <p>Wall: {selectedTile.wall}</p>
                        <p>Tile ID: {selectedTile.id}</p>
                        <p>Row: {selectedTile.row}</p>
                        <p>Column: {selectedTile.col}</p>
                        <p>Current Value: {selectedTile.value}</p>
                        <p>Active Status: {selectedTile.isActive ? "Active" : "Inactive"}</p>
                        <p>Metadata: {JSON.stringify(selectedTile.metadata)}</p>
                        <Button onClick={() => {
                            updateTile(selectedTile.wall, selectedTile.id, {
                                isActive: !selectedTile.isActive
                            });
                            setModalOpen(false);
                        }}>
                            Toggle Tile Status
                        </Button>
                    </div>
                )}
            </Modal>
        </Layout>
    );
};

export default Dashboard;

/*
example functions at the bottom
updateTile(wall, tileId, updates): Update a single tile
bulkUpdateTiles(updates): Update multiple tiles simultaneously
resetTile(wall, tileId): Reset a tile to its initial state
 */


// Tile management reducer
/*
A reducer is a way in react to change the state of something, this implementation provides a way to do bulk updates and have more predictable and consistent.
 */

/*
// Update a single tile
updateTile("Wall East", "A1", {
    value: 42,
    metadata: { source: "information stream" }
});

// Bulk update multiple tiles
bulkUpdateTiles([
    {
        wall: "Wall West",
        tileId: "B12",
        updates: { value: 100, metadata: { priority: "high" } }
    },
    {
        wall: "Ceiling",
        tileId: "C7",
        updates: { value: 75, metadata: { status: "active" } }
    }
]);

// Reset a tile
resetTile("Wall East", "A1");
 */