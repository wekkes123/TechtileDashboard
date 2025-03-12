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

function generateTiles(wallName, wallData) {
    const tiles = {};
    Object.keys(wallData).forEach((key) => {
        tiles[key] = {
            id: key,
            wall: wallName,
            row: key.slice(1),
            col: key.charAt(0),
            value: 0,
            metadata: {},
            isActive: true,
        };
    });
    return tiles;
}

const Dashboard = () => {
    const [fetchedData, setFetchedData] = useState({})
    const [rpiCells, setRpiCells] = useState({});
    const [midspans, setMidspans] = useState({});
    const [wallNames, setWallNames] = useState({});
    const [segments, setSegments] = useState({})
    const [walls, setWalls] = useState({})
    const [open, setOpen] = useState(false);
    const [viewMode, setViewMode] = useState("walls");

    useEffect(() => {
        fetchHosts()
            .then((data) => {
                setFetchedData(data.all);
            })
            .catch((error) => console.error("Failed to load hosts.yaml:", error));
    }, []);

    useEffect(() => {
        if (!fetchedData || Object.keys(fetchedData).length === 0) {
            console.log(fetchedData)
            console.warn("Data is undefined or empty, skipping iteration.");
            return;
        }

        setRpiCells(fetchedData.hosts);
        setMidspans(fetchedData.vars.midspans);
        setWallNames(fetchedData.children.rpis.children);

        const extractedWalls = {};
        const extractedSegments = {};

        Object.keys(fetchedData.children).forEach((key) => {
            if (key.startsWith("segment")) {
                extractedSegments[key] = {
                    tiles: generateTiles(key, fetchedData.children[key].hosts),
                };
            }
            else if (key in wallNames) {
                extractedWalls[key] = {
                    tiles: generateTiles(key, fetchedData.children[key].hosts),
                };
            }
        });

        setWalls(extractedWalls);
        setSegments(extractedSegments);
        console.log(extractedSegments)

    }, [fetchedData]);

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
                </Header>
                <Content style={{ padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
                    {viewMode === "walls" ? (
                        Object.entries(walls).map(([wallName, wallData]) => (
                            <Wall key={wallName} wallName={wallName} wallData={wallData} />
                        ))
                    ) : (
                        Object.entries(segments).map(([segmentLabel, segmentData]) => (
                            <Segment key={segmentLabel} segmentLabel={segmentLabel} segmentData={segmentData} />
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