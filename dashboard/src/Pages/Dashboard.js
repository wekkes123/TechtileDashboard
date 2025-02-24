import { useState } from "react";
import { Layout, Button, Drawer, Card, Modal } from "antd";
import { MenuOutlined } from "@ant-design/icons";

const { Header, Content } = Layout;

const Dashboard = () => {
    const [open, setOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTile, setSelectedTile] = useState(null);

    const walls = {
        "Wall East": { rows: ["1", "2", "3", "4"], cols: ["A", "B", "C", "D", "E", "F"] },
        "Wall West": { rows: ["11", "12", "13", "14"], cols: ["A", "B", "C", "D", "E", "F"] },
        "Ceiling": { rows: ["5", "6", "7", "8", "9", "10"], cols: ["A", "B", "C", "D", "E", "F"] },
        "Floor": { rows: ["15", "16", "17", "18", "19", "20"], cols: ["A", "B", "C", "D", "E", "F"] }
    };

    const openModal = (wallName, rowIndex, colIndex) => {
        const tileNumber = `${walls[wallName].cols[colIndex]}${walls[wallName].rows[rowIndex]}`;
        setSelectedTile({ title: `${wallName} - ${tileNumber}`, info: "Tile Info" });
        setModalOpen(true);
    };

    return (
        <Layout style={{ minHeight: "100vh", display: "flex" }}>
            <Layout style={{ width: open ? "50vw" : "100vw", transition: "width 0.3s ease" }}>
                <Header style={{ background: "#001529", padding: "0 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h1 style={{ color: "white", margin: 0 }}>Dashboard</h1>
                    <Button type="primary" icon={<MenuOutlined />} onClick={() => setOpen(true)} style={{marginRight: '15px'}}>
                        Open Panel
                    </Button>
                </Header>
                <Content style={{ padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
                    {Object.entries(walls).map(([wallName, { rows, cols }]) => (
                        <div key={wallName} style={{ marginBottom: "20px" }}>
                            <h2 style={{ textAlign: "center" }}>{wallName}</h2>
                            <div style={{ display: "grid", gridTemplateColumns: "auto repeat(6, 1fr)", gap: "10px", alignItems: "center" }}>
                                <div></div>
                                {cols.map((colLabel) => (
                                    <div key={colLabel} style={{ textAlign: "center", fontWeight: "bold" }}>{colLabel}</div>
                                ))}
                                {rows.map((rowLabel, rowIndex) => (
                                    <>
                                        <div style={{ textAlign: "center", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center" }}>{rowLabel}</div>
                                        {cols.map((colLabel, colIndex) => (
                                            <Card
                                                key={`${wallName}-${rowIndex}-${colIndex}`}
                                                onClick={() => openModal(wallName, rowIndex, colIndex)}
                                                style={{ background: "#dfffd6", textAlign: "center", cursor: "pointer" }}
                                            >
                                                {colLabel}{rowLabel}
                                            </Card>
                                        ))}
                                    </>
                                ))}
                            </div>
                        </div>
                    ))}
                </Content>
            </Layout>
            <Drawer
                title="Collapsible Panel"
                placement="right"
                width="50vw"
                onClose={() => setOpen(false)}
                open={open}
                style={{ position: "absolute", right: 0 }}
            >
                <p>Content inside the panel...</p>
            </Drawer>
            <Modal
                title={selectedTile ? selectedTile.title : "Tile Info"}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
            >
                <p>{selectedTile ? selectedTile.info : "No information available"}</p>
            </Modal>
        </Layout>
    );
};

export default Dashboard;
