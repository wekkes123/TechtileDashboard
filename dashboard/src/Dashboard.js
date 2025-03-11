import {useState, useReducer, useEffect} from "react";
import { Layout, Button, message } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import { generateMockData } from "./Components/mqttWebSocketListener";
import InfoBar from "./Components/ServerBar";
import Wall from "./Components/Wall";
import ControlPanel from "./Components/ControlPanel";
import Segment from "./Components/Segment";

const { Header, Content, Footer } = Layout;

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

    const segments = ["A", "B", "C", "D", "E", "F"];

    const [walls, dispatchTiles] = useReducer(tilesReducer, initialWalls);
    const [open, setOpen] = useState(false);
    const [viewMode, setViewMode] = useState("walls");

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
            //console.log("Received data:", data);
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

    return (
        <Layout style={{minHeight: "100vh", display: "flex"}}>
            <Layout style={{width: open ? "50vw" : "100vw", transition: "width 0.3s ease"}}>
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
                        <h1 style={{color: "white", margin: 0}}>Dashboard</h1>
                        <Button
                            type="primary"
                            icon={<MenuOutlined/>}
                            onClick={() => setOpen(true)}
                            style={{marginRight: '15px', marginTop: '35px'}}
                        >
                            Settings
                        </Button>
                    </div>
                    <div style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "10px",
                        marginTop: "10px"
                    }}>
                        <Button
                            onClick={debugFunctions.reactivateAllTiles}
                            type="primary"
                            style={{backgroundColor: "green"}}
                        >
                            Reactivate All Tiles
                        </Button>
                    </div>
                </Header>
                <Content style={{ padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
                    {viewMode === "walls" ? (
                        Object.entries(walls).map(([wallName, wallData]) => (
                            <Wall key={wallName} wallName={wallName} wallData={wallData} updateTile={updateTile} />
                        ))
                    ) : (
                        segments.map((segmentLabel) => (
                            <Segment key={segmentLabel} segmentLabel={segmentLabel} walls={walls} updateTile={updateTile} />
                        ))
                    )}
                </Content>

            </Layout>
            <ControlPanel open={open} onClose={() => setOpen(false)} viewMode={viewMode} setViewMode={setViewMode} />

            <Footer><InfoBar/></Footer>
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