import React from "react";
import RpiCell from "./RpiCell";
import { Button } from "antd";

const Wall = ({ wallName, wallData, updateTile }) => {
    if (!wallData || !wallData.tiles) {
        return <div>Loading {wallName}...</div>;
    }

    const tiles = wallData.tiles;
    const tileKeys = Object.keys(tiles);

    const cols = [...new Set(tileKeys.map(key => key.charAt(0)))].sort();
    const rows = [...new Set(tileKeys.map(key => key.slice(1)))].sort();

    const setAllTilesStatus = (status) => {
        Object.keys(tiles).forEach(tileId => {
            updateTile(tileId, { status });
        });
    };

    return (
        <div style={{ marginBottom: "20px", border: "1px solid #ddd", padding: "10px", borderRadius: "8px" }}>
            <h2 style={{ textAlign: "center" }}>{wallName}</h2>

            <div style={{ textAlign: "center", marginBottom: "10px" }}>
                <Button onClick={() => setAllTilesStatus("working")} type="primary" style={{ marginRight: "10px" , backgroundColor: "green"}}>
                    Turn All On
                </Button>
                <Button onClick={() => setAllTilesStatus("deactivated")} danger>
                    Turn All Off
                </Button>
            </div>

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
                    <div key={colLabel} style={{ textAlign: "center", fontWeight: "bold" }}>{colLabel}</div>
                ))}

                {rows.map(rowLabel => (
                    <React.Fragment key={rowLabel}>
                        <div style={{ textAlign: "center", fontWeight: "bold" }}>{rowLabel}</div>
                        {cols.map(colLabel => {
                            const tileKey = `${colLabel}${rowLabel}`;
                            return tiles[tileKey] ? (
                                <RpiCell key={tileKey} tile={tiles[tileKey]} updateTile={updateTile} />
                            ) : (
                                <div key={tileKey} style={{ height: "40px" }}></div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default Wall;
