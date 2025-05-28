import {useState, useReducer, useEffect, useRef, createContext, useContext} from "react";
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
import MidspanDevice from "./Components/MidspanDevice";

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
    const [midspanConnections, setMidspanConnections] = useState({});
    const [midspanPorts, setMidspanPorts] = useState({});
    const [wallNames, setWallNames] = useState({});
    const [open, setOpen] = useState(false);
    const [viewMode, setViewMode] = useState("walls")
    const [visibleItems, setVisibleItems] = useState([]);
    const [rpi_ip,setrpi_ip] = useState("10.128.48.5");
    const [activity,setActivity] = useState(false);
    const [openHeader, setOpenHeader] = useState(false);
    const [showExtra, setShowExtra] = useState(false);
    const [showOnlyFaulty, setShowOnlyFaulty] = useState(false);

    const [selectedTileId, setSelectedTileId] = useState(null);
    const [graphVisible, setGraphVisible] = useState(false);

    const showGraphForTile = (tileId) => {
        setSelectedTileId(tileId);
        setGraphVisible(true);
    };
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




    const getTilesByCategory = (categoryType, filterFn = () => true) => {
        const categorizedTiles = {};

        Object.entries(tiles).forEach(([tileId, tileData]) => {
            if (!filterFn(tileData)) return;

            const parents = categoryType === "walls" ? tileData.walls : tileData.segments;

            parents.forEach((parent) => {
                if (!categorizedTiles[parent]) categorizedTiles[parent] = { tiles: {} };
                categorizedTiles[parent].tiles[tileId] = tileData;
            });
        });

        return Object.keys(categorizedTiles).sort().reduce((acc, key) => {
            acc[key] = categorizedTiles[key];
            return acc;
        }, {});
    };

    const walls = getTilesByCategory("walls", showOnlyFaulty ? (tile) => tile.status?.value === "faulty" : undefined);
    const segments = getTilesByCategory("segments", showOnlyFaulty ? (tile) => tile.status?.value === "faulty" : undefined);
    const faultyCount = Object.values(tiles).filter(tile => tile.status?.value === "faulty").length;

    useEffect(() => {
        fetchHosts()
            .then((data) => {
                if (!data || !data.all) return;
                const ipFromYaml = data?.all?.vars?.api_ip;
                if (ipFromYaml) {
                    setrpi_ip(ipFromYaml);
                }

                const allCells = {};
                const midspanConfig = data.all.vars.midspans;
                const midspanConnectionsConfig = data.all.hosts;
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
                console.log("Config:", midspanConnectionsConfig)
                setMidspanConnections(midspanConnectionsConfig)
                setWallNames(fetchedWallNames);
            })
            .catch((error) => console.error("Failed to load hosts.yaml:", error));
    }, []);

    useEffect(() => {
        const midspanPortsConfig = {};
        if (midspanConnections){
            console.log("Connections: ", midspanConnections)
            Object.entries(midspanConnections).forEach(([rpiId, rpiData]) => {
                const poeInfo = rpiData["poe-port"];
                const midspanInfo = rpiData["midspan"]

                if (!midspanPortsConfig[midspanInfo]){
                    midspanPortsConfig[midspanInfo] = {};
                }

                midspanPortsConfig[midspanInfo][poeInfo] = {
                    power: "N/A",
                    status: "unknown",
                    voltage: "N/A",
                    rpi: rpiId,
                };
            });

            setMidspanPorts(midspanPortsConfig)
        }
        console.log("connections:", midspanPortsConfig)
    }, [midspanConnections]);


    useEffect(() => {
        if (visibleItems.length === 0) {
            const newItems = viewMode === "walls" ? Object.keys(walls) : Object.keys(segments);
            setVisibleItems(newItems);
            console.log("visible items", newItems)
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
                updates: { status: "working" }
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
        const timer = setTimeout(() => {
            pingAllRpis();
        }, 1000); // 1000ms delay

        const interval = setInterval(pingAllRpis, 100000);
        return () => {
            clearTimeout(timer);
            clearInterval(interval);}
    }, []);


    useEffect(() => {
        generateMockData((data) => {
            Promise.resolve().then(() => handleMessage(data));
        });
    }, []);


    return (
        <GraphContext.Provider value={{ showGraphForTile }}>

        <Layout style={{minHeight: "100vh", display: "flex"}}>
            <Layout style={{width: open ? "50vw" : "100vw", transition: "width 0.3s ease"}}>
                <DashboardHeader
                    setOpen={setOpen}
                    showExtra={showExtra}
                    setShowExtra={setShowExtra}
                    //statusJson={statusJson}
                />
                {showExtra && (
                    <div
                        style={{
                            position: "fixed",
                            top: "70px",
                            left: 0,
                            right: 0,
                            background: "#f0f2f5",
                            borderBottom: "1px solid #d9d9d9",
                            zIndex: 999,
                            overflow: "hidden",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "16px",
                            padding: showExtra ? "16px" : "0px",
                        }}
                    >
                        <p style={{margin: 0}}>Extra controls</p>
                        <Button
                            onClick={() => pingAllRpis()}
                            style={{ backgroundColor: "lightblue", color: "rgba(1,1,1,1)" }}
                        >
                            Ping All
                        </Button>
                        <Button
                            onClick={() => setShowOnlyFaulty(prev => !prev)}
                            style={{ backgroundColor: "lightblue", color: "rgba(1,1,1,1)" }}
                        >
                            {showOnlyFaulty ? "Show All Tiles" : `Show Only Faulty (${faultyCount})`}
                        </Button>
                    </div>
                )}

                <Content
                    style={{
                        padding: "10px",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        maxWidth: "99vw",
                        gap: "20px",
                        marginTop: showExtra ? "140px" : "70px"
                    }}
                >
                    {viewMode === "walls"
                    ? Object.entries(walls)
                        .filter(([name]) => visibleItems.includes(name))
                        .map(([wallName, wallData]) => (
                            <Wall
                                key={wallName}
                                wallName={wallName}
                                wallData={wallData}
                                updateTile={updateTile}
                                faultyCount={Object.values(wallData.tiles).filter(t => t.status.value === "faulty").length}
                            />
                        ))
                    : Object.entries(segments)
                        .filter(([name]) => visibleItems.includes(name))
                        .map(([segmentLabel, segmentData]) => (
                            <Segment
                                key={segmentLabel}
                                segmentLabel={segmentLabel}
                                segmentData={segmentData}
                                updateTile={updateTile}
                                faultyCount={Object.values(segmentData.tiles).filter(t => t.status.value === "faulty").length}
                            />
                        ))}

                    {Object.entries(midspans).map(([midspanId, midspanData]) => {
                        const allVisibleTileIds = new Set();

                        // Gather visible tile IDs
                        const source = viewMode === "walls" ? walls : segments;
                        visibleItems.forEach(name => {
                            const tileGroup = source[name];
                            if (tileGroup) {
                                Object.keys(tileGroup.tiles).forEach(tileId => {
                                    allVisibleTileIds.add(tileId);
                                });
                            }
                        });

                        // Filter ports based on visible tile IDs
                        const filteredPorts = {};
                        const ports = midspanPorts[midspanId] || {};
                        Object.entries(ports).forEach(([portId, portInfo]) => {
                            if (allVisibleTileIds.has(portInfo.rpi)) {
                                filteredPorts[portId] = portInfo;
                            }
                        });

                        // Only render midspan if it has relevant ports
                        if (Object.keys(filteredPorts).length === 0) return null;

                        return (
                            <MidspanDevice
                                key={midspanId}
                                midspanId={midspanId}
                                midspanData={midspanData}
                                ports={filteredPorts}
                            />
                        );
                    })}

                </Content>
            </Layout>

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

            <InfoBar/>
            {graphVisible && selectedTileId && (
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
                    <GraphPage deviceId={selectedTileId}/>
                </div>
            )}

        </Layout>
        </GraphContext.Provider>
    );
};

export const GraphContext = createContext({
    showGraphForTile: () => {},
});

export const useGraph = () => useContext(GraphContext);

export default Dashboard;