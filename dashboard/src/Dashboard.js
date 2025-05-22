import {useState, useReducer, useEffect, useRef} from "react";
import { Layout, Button, message } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import { generateMockData } from "./Components/mqttWebSocketListener";
import InfoBar from "./Components/ServerBar";
import Wall from "./Components/Wall";
import ControlPanel from "./Components/ControlPanel";
import Segment from "./Components/Segment";
import DashboardHeader from "./Components/DashboardHeader";
import yaml from "js-yaml";
import pingRpi from './Components/PingRpi';
import GraphPage from "./Components/GraphPage";

const { Header, Content, Footer } = Layout;
//todo yaml needs real ip
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
    const Tiles = {};
    Object.keys(cellData).forEach((key) => {
        Tiles[key] = {
            id: key,
            row: key.slice(1),
            col: key.charAt(0),
            value: 0,
            metadata: {},
            data: {},
            status: "working",
            walls: new Set(),
            segments: new Set(),
        };
    });
    return Tiles;
}

const Dashboard = () => {
    const [rpiCells, setRpiCells] = useState({});
    const [midspans, setMidspans] = useState({});
    const [wallNames, setWallNames] = useState({});
    const [open, setOpen] = useState(false);
    const [viewMode, setViewMode] = useState("walls")
    const [visibleItems, setVisibleItems] = useState([]);
    const [rpi_ip,setrpi_ip] = useState("127.0.0.1");
    const [activity,setActivity] = useState(false);
    const [graphVisible, setGraphVisible] = useState(false);


    // Initialize tiles state with useReducer
    const [tiles, dispatchTiles] = useReducer(tilesReducer, {});

    const tilesRef = useRef(tiles);

    useEffect(() => {
        tilesRef.current = tiles;
    }, [tiles]);

    const normalizeTileId = (id) => {
        const match = id.match(/^([A-Z])(\d+)$/i);
        if (!match) return id; // fallback to original if it doesn't match the pattern

        const [, letter, number] = match;
        return `${letter.toUpperCase()}${number.padStart(2, "0")}`;
    };


    const getTilesByCategory = (categoryType) => {
        //console.log(`Organizing tiles for ${categoryType}...`);
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

        //console.log(`${categoryType} organized:`, sortedCategories);
        //console.log("tiles: ",tiles)
        return sortedCategories;
    };

    const walls = getTilesByCategory("walls");
    const segments = getTilesByCategory("segments");

    useEffect(() => {
        fetchHosts()
            .then((data) => {
                if (!data || !data.all) return;

                //console.log("Fetched YAML data:", data);

                // Extract and store the Pi IP
                const ipFromYaml = data?.all?.vars?.api_ip;
                if (ipFromYaml) {
                    setrpi_ip(ipFromYaml);
                }

                const allCells = {};
                const midspanConfig = data.all.vars.midspans;
                const fetchedWallNames = data.all.children.rpis.children;

                // Process walls and segments using the same base cell data
                Object.entries(data.all.children).forEach(([key, cellData]) => {
                    if (!cellData.hosts) return;

                    //console.log(`Processing ${key}:`, cellData.hosts);
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

                //console.log("Final processed rpiCells:", allCells);

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



    useEffect(() => {
        if (visibleItems.length === 0) {
            const newItems = viewMode === "walls" ? Object.keys(walls) : Object.keys(segments);
            setVisibleItems(newItems);
        }
    }, [viewMode, walls, segments]);


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

    let isPinging = false;

    const pingAllRpis = async () => {
        if (isPinging) return;
        isPinging = true;

        const timestamp = Date.now();
        const tiles = tilesRef.current;

        try {
            const pingResults = await Promise.allSettled(
                Object.keys(tiles).map(async (id) => {
                    const hostname = `rpi-${id}.local`;
                    const status = await pingRpi(hostname);
                    updateTile(id, {
                        status: {
                            value: status,
                            timestamp
                        }
                    });
                })
            );

            const failed = pingResults.filter(r => r.status === "rejected");
            if (failed.length) {
                console.warn(`${failed.length} RPis failed to respond`);
            }

        } catch (error) {
            console.error("Unexpected error while pinging RPis:", error);
        } finally {
            isPinging = false;
        }
    };



    const handleMessage = async (data) => {
        try {
            if (!data || typeof data !== "object") {
                console.warn("Received invalid data:", data);
                return;
            }

            const normalizedId = normalizeTileId(data.id);
            const timestamp = Date.now();
            let metaData = {};

            Object.entries(data).forEach(([dataId, value]) => {
                if (dataId !== "id" && dataId !== "status") {
                    metaData[dataId] = {
                        value,
                        timestamp
                    };
                }
            });

            if (tilesRef.current[normalizedId]) {
                const existingData = tilesRef.current[normalizedId]?.data || {};
                updateTile(normalizedId, {
                    data: {
                        ...existingData,
                        ...metaData
                    },
                    last_received: timestamp
                });
            } else {
                console.warn(`No tile found for ID: ${data?.id} (normalized as ${normalizedId})`);
            }
        } catch (error) {
            console.error("Error processing data:", error);
        }
    };

    useEffect(() => {
        generateMockData((data) => {
            Promise.resolve().then(() => handleMessage(data));
        });

        const interval = setInterval(pingAllRpis, 100000); // ping every 100 seconds
        return () => clearInterval(interval);
    }, []);


    return (
        <Layout style={{minHeight: "100vh", display: "flex"}}>
            <Layout style={{width: open ? "50vw" : "100vw", transition: "width 0.3s ease"}}>
                <DashboardHeader
                    setOpen={setOpen}
                    debugFunctions={debugFunctions}
                    rpiIp={rpi_ip}
                    pingAllRpis={pingAllRpis}
                />
                <Content
                    style={{
                        padding: "16px",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "40px",
                        marginTop: "70px"
                    }}
                >
                {viewMode === "walls"
                        ? Object.entries(walls)
                            .filter(([name]) => visibleItems.includes(name))  // Only show checked walls
                            .map(([wallName, wallData]) => (
                                <Wall key={wallName} wallName={wallName} wallData={wallData} updateTile={updateTile} />
                            ))
                        : Object.entries(segments)
                            .filter(([name]) => visibleItems.includes(name))  // Only show checked segments
                            .map(([segmentLabel, segmentData]) => (
                                <Segment key={segmentLabel} segmentLabel={segmentLabel} segmentData={segmentData} updateTile={updateTile} />
                            ))}
                </Content>
            </Layout>
            <Button
                type="primary"
                onClick={() => setGraphVisible(true)}
                style={{ backgroundColor: "#722ed1", marginTop: "35px" }}
            >
                Show Graph
            </Button>


            <ControlPanel
                open={open}
                onClose={() => setOpen(false)}
                viewMode={viewMode}
                setViewMode={setViewMode}
                wallNames={walls}
                segmentNames={segments}
                visibleItems={visibleItems}
                setVisibleItems={setVisibleItems}
                rpi_ip={rpi_ip}
                activity={activity}
            />

            <Footer><InfoBar/></Footer>
            {graphVisible && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    height: '100vh',
                    width: '100vw',
                    backgroundColor: 'white',
                    zIndex: 9999,
                    padding: '20px',
                    overflow: 'auto'
                }}>
                    <Button
                        type="primary"
                        danger
                        onClick={() => setGraphVisible(false)}
                        style={{ position: 'absolute', top: 20, right: 20, zIndex: 10000 }}
                    >
                        Close
                    </Button>
                    <GraphPage deviceId="TECHDASH"/>
                </div>
            )}

        </Layout>
    );
};

export default Dashboard;