import {useState, useReducer, useEffect, useRef, createContext, useContext} from "react";
import { Layout, Button, message } from "antd";
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
import PDUDevice from "./Components/PDUdevice";

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
                    status: "working"
                }
            };

        default:
            return state;
    }
};

// Midspan reducer for state management
const midspanReducer = (state, action) => {
    switch (action.type) {
        case 'UPDATE_MIDSPAN':
            const { midspanId, updates } = action.payload;
            return {
                ...state,
                [midspanId]: {
                    ...state[midspanId],
                    ...updates,
                    last_received: Date.now()
                }
            };

        case 'BULK_UPDATE_MIDSPANS':
            const updatedState = { ...state };
            action.payload.forEach(({ midspanId, updates }) => {
                updatedState[midspanId] = {
                    ...updatedState[midspanId],
                    ...updates,
                    last_received: Date.now()
                };
            });
            return updatedState;

        case 'RESET_MIDSPAN':
            return {
                ...state,
                [action.payload.midspanId]: {
                    ...state[action.payload.midspanId],
                    data: {},
                    status: "working"
                }
            };

        default:
            return state;
    }
};

// POE Ports reducer for state management
const poePortsReducer = (state, action) => {
    switch (action.type) {
        case 'UPDATE_POE_PORT':
            const { midspanId, portId, updates } = action.payload;
            return {
                ...state,
                [midspanId]: {
                    ...state[midspanId],
                    [portId]: {
                        ...state[midspanId]?.[portId],
                        ...updates,
                        last_received: Date.now()
                    }
                }
            };

        case 'BULK_UPDATE_POE_PORTS':
            const updatedState = { ...state };
            action.payload.forEach(({ midspanId, portId, updates }) => {
                if (!updatedState[midspanId]) {
                    updatedState[midspanId] = {};
                }
                updatedState[midspanId][portId] = {
                    ...updatedState[midspanId][portId],
                    ...updates,
                    last_received: Date.now()
                };
            });
            return updatedState;

        case 'INITIALIZE_POE_PORTS':
            return action.payload;

        default:
            return state;
    }
};

// PDU reducer for state management
const pduReducer = (state, action) => {
    switch (action.type) {
        case 'UPDATE_PDU':
            const { pduId, updates } = action.payload;
            return {
                ...state,
                [pduId]: {
                    ...state[pduId],
                    ...updates,
                    last_received: Date.now()
                }
            };

        case 'UPDATE_PDU_PORT':
            const { pduId: pid, portId, updates: portUpdates } = action.payload;
            return {
                ...state,
                [pid]: {
                    ...state[pid],
                    ports: {
                        ...(state[pid]?.ports || {}),
                        [portId]: {
                            ...(state[pid]?.ports?.[portId] || {}),
                            ...portUpdates
                        }
                    },
                    last_received: Date.now()
                }
            };

        case 'INITIALIZE_PDU_PORTS':
            return {
                ...state,
                ...action.payload
            };

        case 'BULK_UPDATE_PDUS':
            const updatedState = { ...state };
            action.payload.forEach(({ pduId, updates }) => {
                updatedState[pduId] = {
                    ...updatedState[pduId],
                    ...updates,
                    last_received: Date.now()
                };
            });
            return updatedState;

        default:
            return state;
    }
};


const pduPortReducer = (state, action) => {
    switch (action.type) {
        case 'UPDATE_PDU_PORT': {
            const { pduId, portId, updates } = action.payload;
            return {
                ...state,
                [pduId]: {
                    ...state[pduId],
                    [portId]: {
                        ...state[pduId]?.[portId],
                        ...updates
                    }
                }
            };
        }

        default:
            return state;
    }
};


// Server reducer for singleton server state
const serverReducer = (state, action) => {
    switch (action.type) {
        case 'UPDATE_SERVER':
            return {
                ...state,
                ...action.payload.updates,
                last_received: Date.now()
            };

        case 'BULK_UPDATE_SERVERS':
            return action.payload.reduce((acc, update) => ({
                ...acc,
                ...update,
                last_received: Date.now()
            }), state);

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
    const [pduDevices, setPduDevices] = useState({});
    const [wallNames, setWallNames] = useState({});
    const [open, setOpen] = useState(false);
    const [viewMode, setViewMode] = useState("walls")
    const [visibleItems, setVisibleItems] = useState([]);
    const [rpi_ip, setrpi_ip] = useState("10.128.48.5");
    const [activity, setActivity] = useState(false);
    const [openHeader, setOpenHeader] = useState(false);
    const [showExtra, setShowExtra] = useState(false);
    const [showOnlyFaulty, setShowOnlyFaulty] = useState(false);
    const [selectedTileId, setSelectedTileId] = useState(null);
    const [graphVisible, setGraphVisible] = useState(false);
    const [statusJson, setStatusJson] = useState({
        status: "inactive",
        message: ""
    });
    const [selectedDisplayField, setSelectedDisplayField] = useState("cpuTemp");

    const showGraphForTile = (tileId) => {
        setSelectedTileId(tileId);
        setGraphVisible(true);
    };

    // Initialize all reducers
    const [tiles, dispatchTiles] = useReducer(tilesReducer, {});
    const [midspanData, dispatchMidspan] = useReducer(midspanReducer, {});
    const [poePortsData, dispatchPoePorts] = useReducer(poePortsReducer, {});
    const [pduData, dispatchPdu] = useReducer(pduReducer, {});
    const [pduPortData, dispatchPduPorts] = useReducer(pduPortReducer, {});
    const [serverData, dispatchServer] = useReducer(serverReducer, {});

    const tilesRef = useRef(tiles);
    const midspanDataRef = useRef(midspanData);
    const poePortsDataRef = useRef(poePortsData);
    const pduDataRef = useRef(pduData);
    const pduPortDataRef = useRef(pduPortData);
    const serverDataRef = useRef(serverData);

    useEffect(() => {
        tilesRef.current = tiles;
    }, [tiles]);

    useEffect(() => {
        midspanDataRef.current = midspanData;
    }, [midspanData]);

    useEffect(() => {
        poePortsDataRef.current = poePortsData;
    }, [poePortsData]);

    useEffect(() => {
        pduDataRef.current = pduData;
    }, [pduData]);

    useEffect(() => {
        pduPortDataRef.current = pduPortData;
    }, [pduPortData]);

    useEffect(() => {
        serverDataRef.current = serverData;
    }, [serverData]);

    const normalizeTileId = (id) => {
        const match = id.match(/^([A-Z])(\d+)$/i);
        if (!match) return id;

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

                // Initialize the tiles state with the processed cells
                dispatchTiles({
                    type: 'BULK_UPDATE_TILES',
                    payload: Object.entries(allCells).map(([tileId, tileData]) => ({
                        tileId,
                        updates: tileData
                    }))
                });

                const pduDevicesConfig = {}
                const ports = [1, 2, 3, 4, 5];
                pduDevicesConfig["pdu-001"] = {"ports": ports}
                pduDevicesConfig["pdu-002"] = {"ports": ports}  // TODO: add ports to PDU's

                setRpiCells(allCells);
                setMidspans(midspanConfig);
                setMidspanConnections(midspanConnectionsConfig)
                setWallNames(fetchedWallNames);
                setPduDevices(pduDevicesConfig);
            })
            .catch((error) => console.error("Failed to load hosts.yaml:", error));
    }, []);

    useEffect(() => {
        const midspanPortsConfig = {};
        if (midspanConnections){
            Object.entries(midspanConnections).forEach(([rpiId, rpiData]) => {
                const poeInfo = rpiData["poe-port"];
                const midspanInfo = rpiData["midspan"];

                if (!midspanPortsConfig[midspanInfo]) {
                    midspanPortsConfig[midspanInfo] = {};
                }

                midspanPortsConfig[midspanInfo][poeInfo] = {
                    power: "N/A",
                    status: "unknown",
                    voltage: "N/A",
                    rpi: rpiId,
                };
            });

            dispatchPoePorts({
                type: 'INITIALIZE_POE_PORTS',
                payload: midspanPortsConfig
            });
        }
    }, [midspanConnections]);

    useEffect(() => {
        if (visibleItems.length === 0) {
            const newItems = viewMode === "walls" ? Object.keys(walls) : Object.keys(segments);
            setVisibleItems(newItems);
        }
    }, [viewMode, walls, segments]);

    // Tile update functions
    const updateTile = (tileId, updates) => {
        dispatchTiles({
            type: 'UPDATE_TILE',
            payload: { tileId, updates }
        });
        message.success(`Updated tile ${tileId}`);
    };

    const bulkUpdateTiles = (updates) => {
        dispatchTiles({
            type: 'BULK_UPDATE_TILES',
            payload: updates
        });
        message.success(`Bulk updated ${updates.length} tiles`);
    };

    const resetTile = (tileId) => {
        dispatchTiles({
            type: 'RESET_TILE',
            payload: { tileId }
        });
        message.info(`Reset tile ${tileId}`);
    };

    const togglePort = () => {
        //todo add toggleport logic
    }

    // Midspan update functions
    const updateMidspan = (midspanId, updates) => {
        dispatchMidspan({
            type: 'UPDATE_MIDSPAN',
            payload: { midspanId, updates }
        });
    };

    const updatePduPort = (pduId, portId, updates) => {
        dispatchPduPorts({
            type: 'UPDATE_PDU_PORT',
            payload: { pduId, portId, updates }
        });
    };

    // POE Port update functions
    const updatePoePort = (midspanId, portId, updates) => {
        dispatchPoePorts({
            type: 'UPDATE_POE_PORT',
            payload: { midspanId, portId, updates }
        });
    };

    // PDU update functions
    const updatePdu = (pduId, updates) => {
        dispatchPdu({
            type: 'UPDATE_PDU',
            payload: { pduId, updates }
        });
    };

    // Server update functions
    const updateServer = (updates) => {
        dispatchServer({
            type: 'UPDATE_SERVER',
            payload: { updates }
        });
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
        console.log(pduPortData)
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

    const handleRpiMessage = async (data) => {
        try {
            if (!data || typeof data !== "object") {
                console.warn("Received invalid RPI data:", data);
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
            console.error("Error processing RPI data:", error);
        }
    };

    const handlePDUPortMessage = async (data) => {
        try {
            if (!data || typeof data !== "object") {
                console.warn("Received invalid PDU port data:", data);
                return;
            }

            const pduId = data.id || data.pdu_id;
            const portId = data.port;

            if (!pduId || portId === undefined) {
                console.warn("PDU port message missing required IDs:", data);
                return;
            }

            const timestamp = Date.now();
            let processedData = {};

            Object.entries(data).forEach(([key, value]) => {
                if (!['id', 'pdu_id', 'port'].includes(key)) {
                    processedData[key] = {
                        value,
                        timestamp
                    };
                }
            });

            updatePduPort(pduId, portId, processedData);
        } catch (error) {
            console.error("Error processing PDU port data:", error);
        }
    };


    const handleMidspanMessage = async (data) => {
        try {
            if (!data || typeof data !== "object") {
                console.warn("Received invalid midspan data:", data);
                return;
            }

            const midspanId = data.id || data.midspan_id;
            if (!midspanId) {
                console.warn("Midspan message missing ID:", data);
                return;
            }

            const timestamp = Date.now();
            let processedData = {};

            Object.entries(data).forEach(([key, value]) => {
                if (key !== "id" && key !== "midspan_id") {
                    processedData[key] = {
                        value,
                        timestamp
                    };
                }
            });

            updateMidspan(midspanId, {
                data: {
                    ...midspanDataRef.current[midspanId]?.data || {},
                    ...processedData
                }
            });

            //console.log(`Updated midspan ${midspanId}:`, processedData);
        } catch (error) {
            console.error("Error processing midspan data:", error);
        }
    };

    const handlePOEPortMessage = async (data) => {
        try {
            if (!data || typeof data !== "object") {
                console.warn("Received invalid POE port data:", data);
                return;
            }

            const midspanId = data.id;
            const portId = data.port;

            if (!midspanId || !portId) {
                console.warn("POE port message missing required IDs:", data);
                return;
            }

            const timestamp = Date.now();
            let processedData = {};

            Object.entries(data).forEach(([key, value]) => {
                if (!['midspan_id', 'midspan', 'port_id', 'port'].includes(key)) {
                    processedData[key] = {
                        value,
                        timestamp
                    };
                }
            });

            updatePoePort(midspanId, portId, processedData);

            //console.log(`Updated POE port ${midspanId}:${portId}:`, processedData);
        } catch (error) {
            console.error("Error processing POE port data:", error);
        }
    };

    const handlePDUMessage = async (data) => {
        try {
            if (!data || typeof data !== "object") {
                console.warn("Received invalid PDU data:", data);
                return;
            }

            const pduId = data.id || data.pdu_id;
            if (!pduId) {
                console.warn("PDU message missing ID:", data);
                return;
            }

            const timestamp = Date.now();
            let processedData = {};

            Object.entries(data).forEach(([key, value]) => {
                if (key !== "id" && key !== "pdu_id") {
                    processedData[key] = {
                        value,
                        timestamp
                    };
                }
            });

            updatePdu(pduId, {
                data: {
                    ...pduDataRef.current[pduId]?.data || {},
                    ...processedData
                }
            });

            console.log(`Updated PDU ${pduId}:`, processedData);
        } catch (error) {
            console.error("Error processing PDU data:", error);
        }
    };

    const handleServerMessage = async (data) => {
        try {
            if (!data || typeof data !== "object") {
                console.warn("Received invalid data:", data);
                return;
            }
            const timestamp = Date.now();
            let processedData = {};

            Object.entries(data).forEach(([key, value]) => {
                if (!['id', 'server_id', 'hostname'].includes(key)) {
                    processedData[key] = {
                        value,
                        timestamp
                    };
                }
            });
            updateServer( {
                data: {
                    ...serverDataRef.current?.data,
                    ...processedData
                }
            });
            console.log(`Updated server:`, processedData);
        } catch (error) {
            console.error("Error processing server data:", error);
        }
    };

    const handleStatusMessage = async (data) => {
        try {
            setActivity(data?.status === "active");
            setStatusJson(data)
        } catch (error) {
            console.error("Error processing status data:", error);
        }
    };

    const handlePDUPortsMessage = async (data) => {
        try {
            //
        } catch (error) {
            console.error("Error processing status data:", error);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            pingAllRpis();
        }, 1000);

        const interval = setInterval(pingAllRpis, 100000);
        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        }
    }, []);

    useEffect(() => {
        const cleanup = generateMockData({
            "rpi/data": (data) => {
                Promise.resolve().then(() => handleRpiMessage(data));
            },
            "midspan/data": (data) => {
                Promise.resolve().then(() => handleMidspanMessage(data));
            },
            "midspan/poepoort": (data) => {
                Promise.resolve().then(() => handlePOEPortMessage(data));
            },
            "pdu/data": (data) => {
                Promise.resolve().then(() => handlePDUMessage(data));
            },
            "server/data": (data) => {
                Promise.resolve().then(() => handleServerMessage(data));
            },
            "experiment": (data) => {
                Promise.resolve().then(() => handleStatusMessage(data));
            },
            "pdu/port": (data) => {
                Promise.resolve().then(() => handlePDUPortMessage(data));
            },
        });

        return cleanup;
    }, []);

    return (
        <GraphContext.Provider value={{ showGraphForTile }}>

        <Layout style={{minHeight: "100vh", display: "flex"}}>
            <Layout style={{width: open ? "50vw" : "100vw", transition: "width 0.3s ease"}}>
                <DashboardHeader
                    setOpen={setOpen}
                    showExtra={showExtra}
                    setShowExtra={setShowExtra}
                    statusJson={statusJson}
                />
                {showExtra && (
                    <div
                        style={{
                            position: "fixed",
                            top: "70px",
                            left: 0,
                            right: 0,
                            background: "#001529",
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
                        <p style={{margin: 0, color: "#FFFFFF" }}>Extra controls</p>
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
                        <Button
                            onClick={() => {
                                setSelectedTileId("TECHDASH");
                                setGraphVisible(true);
                            }}
                            style={{ backgroundColor: "lightblue", color: "rgba(1,1,1,1)" }}
                        >
                            show TECHDASH graph
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
                                selectedDisplayField={selectedDisplayField}
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
                                selectedDisplayField={selectedDisplayField}
                            />
                        ))}

                        {Object.entries(midspans).map(([midspanId, midspanConfigData]) => {
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
                            const ports = poePortsData[midspanId] || {};
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
                                    midspanData={midspanConfigData}
                                    midspanRuntimeData={midspanData[midspanId]}
                                    ports={filteredPorts}
                                    /*togglePort={togglePort}*/
                                />
                            );
                        })}

                    {Object.entries(pduData).map(([pduId, deviceData]) => (
                        <PDUDevice
                            key={pduId}
                            PDUId={pduId}
                            PDUData={deviceData}
                            ports={pduPortData[pduId] || {}}
                        />
                    ))}


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
                    tiles={tiles}
                    setSelectedDisplayField={setSelectedDisplayField}
                />


            {serverData?.data && <InfoBar serverData={serverData} />}

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