import {useState, useReducer, useEffect} from "react";
import { Layout, Button, message } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import { generateMockData } from "./Components/mqttWebSocketListener";
import InfoBar from "./Components/ServerBar";
import Wall from "./Components/Wall";
import ControlPanel from "./Components/ControlPanel";
import Segment from "./Components/Segment";
import yaml from "js-yaml";

const { Header, Content, Footer } = Layout;

async function fetchHosts() {
    const response = await fetch("/hosts.yaml");
    const text = await response.text();
    return yaml.load(text);
}

// Tiles reducer for state management
const tilesReducer = (state, action) => {
    switch (action.type) {
        case 'UPDATE_TILE':
            const { tileId, updates } = action.payload;
            return {
                ...state,
                [tileId]: {
                    ...state[tileId],
                    ...updates
                }
            };

        case 'BULK_UPDATE_TILES':
            const updatedState = { ...state };
            action.payload.forEach(({ tileId, updates }) => {
                updatedState[tileId] = {
                    ...updatedState[tileId],
                    ...updates
                };
            });
            return updatedState;

        case 'RESET_TILE':
            return {
                ...state,
                [action.payload.tileId]: {
                    ...state[action.payload.tileId],
                    value: 0,
                    metadata: {},
                    status: "working" // Changed from isActive: true
                }
            };

        default:
            return state;
    }
};

function generateTiles(wallOrSegmentName, cellData) {
    const tiles = {};
    Object.keys(cellData).forEach((key) => {
        tiles[key] = {
            id: key,
            row: key.slice(1),
            col: key.charAt(0),
            value: 0,
            metadata: {},
            status: "working", // Changed from isActive: true
            walls: new Set(),
            segments: new Set(),
        };
    });
    return tiles;
}

const Dashboard = () => {
    const [rpiCells, setRpiCells] = useState({});
    const [midspans, setMidspans] = useState({});
    const [wallNames, setWallNames] = useState({});
    const [open, setOpen] = useState(false);
    const [viewMode, setViewMode] = useState("walls");

    // Initialize tiles state with useReducer
    const [tiles, dispatchTiles] = useReducer(tilesReducer, {});

    useEffect(() => {
        fetchHosts()
            .then((data) => {
                if (!data || !data.all) return;

                console.log("Fetched YAML data:", data);

                const allCells = {};
                const midspanConfig = data.all.vars.midspans
                const fetchedWallNames = data.all.children.rpis.children;

                // Process walls and segments using the same base cell data
                Object.entries(data.all.children).forEach(([key, cellData]) => {
                    if (!cellData.hosts) return;

                    console.log(`Processing ${key}:`, cellData.hosts);
                    const newTiles = generateTiles(key, cellData.hosts);

                    Object.entries(newTiles).forEach(([cellKey, cellInfo]) => {
                        if (!allCells[cellKey]) {
                            allCells[cellKey] = { ...cellInfo, walls: new Set(), segments: new Set() };
                        }

                        if (key.startsWith("segment")) {
                            allCells[cellKey].segments.add(key);
                        } else if (key in fetchedWallNames) {
                            allCells[cellKey].walls.add(key);
                        }
                    });
                });

                // Convert sets to arrays for easier rendering
                Object.keys(allCells).forEach((cellKey) => {
                    allCells[cellKey].walls = Array.from(allCells[cellKey].walls);
                    allCells[cellKey].segments = Array.from(allCells[cellKey].segments);
                });

                console.log("Final processed rpiCells:", allCells);

                // Initialize the tiles state with the processed cells
                dispatchTiles({
                    type: 'BULK_UPDATE_TILES',
                    payload: Object.entries(allCells).map(([tileId, tileData]) => ({
                        tileId,
                        updates: tileData
                    }))
                });

                setRpiCells(allCells);
                setMidspans(midspanConfig);
                setWallNames(fetchedWallNames);
            })
            .catch((error) => console.error("Failed to load hosts.yaml:", error));
    }, []);

    // Function to update a single tile
    const updateTile = (tileId, updates) => {
        dispatchTiles({
            type: 'UPDATE_TILE',
            payload: { tileId, updates }
        });
        message.success(`Updated tile ${tileId}`);
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
    const resetTile = (tileId) => {
        dispatchTiles({
            type: 'RESET_TILE',
            payload: { tileId }
        });
        message.info(`Reset tile ${tileId}`);
    };

    // Debug functions for testing
    const debugFunctions = {
        reactivateAllTiles: () => {
            const updates = Object.keys(tiles).map(tileId => ({
                tileId,
                updates: { status: "working" } // Changed from isActive: true
            }));
            bulkUpdateTiles(updates);
        },
        setAllFaulty: () => {
            const updates = Object.keys(tiles).map(tileId => ({
                tileId,
                updates: { status: "faulty" }
            }));
            bulkUpdateTiles(updates);
        },
        setAllDeactivated: () => {
            const updates = Object.keys(tiles).map(tileId => ({
                tileId,
                updates: { status: "deactivated" }
            }));
            bulkUpdateTiles(updates);
        }
    };

    const getTilesByCategory = (categoryType) => {
        console.log(`Organizing tiles for ${categoryType}...`);
        const categorizedTiles = {};

        Object.entries(tiles).forEach(([tileId, tileData]) => {
            const parents = categoryType === "walls" ? tileData.walls : tileData.segments;

            parents.forEach((parent) => {
                if (!categorizedTiles[parent]) categorizedTiles[parent] = { tiles: {} };
                categorizedTiles[parent].tiles[tileId] = tileData;
            });
        });

        // Sort the categories alphabetically before returning
        const sortedCategories = Object.keys(categorizedTiles).sort().reduce((acc, key) => {
            acc[key] = categorizedTiles[key];
            return acc;
        }, {});

        console.log(`${categoryType} organized:`, sortedCategories);
        return sortedCategories;
    };

    const walls = getTilesByCategory("walls");
    const segments = getTilesByCategory("segments");

    const handleMessage = (data) => {
        try {
            // Find the tile by ID
            if (tiles[data.id]) {
                updateTile(data.id, {
                    value: Math.round(parseFloat(data.temp)),
                    // Map the old status "1" to "working" and "0" to "deactivated"
                    status: data.status === "1" ? "working" : "deactivated"
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
                            Set All Working
                        </Button>
                        <Button
                            onClick={debugFunctions.setAllFaulty}
                            danger
                        >
                            Set All Faulty
                        </Button>
                        <Button
                            onClick={debugFunctions.setAllDeactivated}
                            style={{backgroundColor: "#d9d9d9", color: "rgba(0,0,0,0.65)"}}
                        >
                            Deactivate All
                        </Button>
                    </div>
                </Header>
                <Content style={{ padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
                    {viewMode === "walls"
                        ? Object.entries(walls).map(([wallName, wallData]) => (
                            <Wall
                                key={wallName}
                                wallName={wallName}
                                wallData={wallData}
                                updateTile={updateTile}
                            />
                        ))
                        : Object.entries(segments).map(([segmentLabel, segmentData]) => (
                            <Segment
                                key={segmentLabel}
                                segmentLabel={segmentLabel}
                                segmentData={segmentData}
                                updateTile={updateTile}
                            />
                        ))
                    }
                </Content>
            </Layout>

            <ControlPanel
                open={open}
                onClose={() => setOpen(false)}
                viewMode={viewMode}
                setViewMode={setViewMode}
            />

            <Footer><InfoBar/></Footer>
        </Layout>
    );
};

export default Dashboard;