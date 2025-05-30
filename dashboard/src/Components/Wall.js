import React from "react";
import RpiCell from "./RpiCell";
import { Button, message } from "antd";
import axios from "axios";

const Wall = ({ wallName, wallData, updateTile, faultyCount, showOnlyFaulty, selectedDisplayField }) => {
    if (!wallData || !wallData.tiles) {
        return <div>Loading {wallName}...</div>;
    }

    const tiles = wallData.tiles;
    const tileKeys = Object.keys(tiles);

    const cols = [...new Set(tileKeys.map(key => key.charAt(0)))].sort();
    const rows = [...new Set(tileKeys.map(key => key.slice(1)))].sort();

    const setAllTilesStatus = async (status) => {
        const deviceIds = Object.keys(tiles);

        for (const tileId of deviceIds) {
            updateTile(tileId, { status });

            try {
                const command = status === "deactivated" ? "shutdown" : "reboot";
                await axios.post(`http://10.128.48.5:5000/control/${tileId}/${command}`);
                message.success(`Sent ${command} to ${tileId}`);
            } catch (error) {
                console.error(`Failed to send ${status} to ${tileId}`, error);
                message.error(`Failed ${status} for ${tileId}`);
            }
        }
    };

    const useSimpleLayout = showOnlyFaulty && faultyCount < 10;

    return (
        <div style={{ border: "1px solid #ddd", padding: "10px", borderRadius: "8px", marginBottom: "20px" }}>
            <h2 style={{ textAlign: "center" }}>{wallName}</h2>

            <div style={{ textAlign: "center", marginBottom: "10px" }}>
                <Button
                    onClick={() => setAllTilesStatus("working")}
                    type="primary"
                    style={{ marginRight: "10px", backgroundColor: "green" }}
                >
                    Turn All On
                </Button>
                <Button onClick={() => setAllTilesStatus("deactivated")} danger>
                    Turn All Off
                </Button>
            </div>

            {useSimpleLayout ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center" }}>
                    {Object.values(tiles).map(tile => (
                        <RpiCell key={tile.id} tile={tile} updateTile={updateTile} selectedDisplayField={selectedDisplayField} />
                    ))}
                </div>
            ) : (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: `auto repeat(${cols.length}, 1fr)`,
                        gap: "10px",
                        alignItems: "center",
                    }}
                >
                    <div></div>
                    {cols.map(colLabel => (
                        <div key={colLabel} style={{ maxWidth: "120px", textAlign: "center", fontWeight: "bold" }}>{colLabel}</div>
                    ))}

                    {rows.map(rowLabel => (
                        <React.Fragment key={rowLabel}>
                            <div style={{ textAlign: "center", fontWeight: "bold" }}>{rowLabel}</div>
                            {cols.map(colLabel => {
                                const tileKey = `${colLabel}${rowLabel}`;
                                return tiles[tileKey] ? (
                                    <RpiCell key={tileKey} tile={tiles[tileKey]} updateTile={updateTile} selectedDisplayField={selectedDisplayField} />
                                ) : (
                                    <div key={tileKey} style={{ height: "40px" }}></div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Wall;
