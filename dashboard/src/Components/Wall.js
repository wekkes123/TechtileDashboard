import React from "react";
import RpiCell from "./RpiCell";

const Wall = ({ wallName, wallData, updateTile }) => {
    if (!wallData || !wallData.tiles) {
        return <div>Loading {wallName}...</div>;
    }

    const tiles = wallData.tiles;
    const tileKeys = Object.keys(tiles);

    // Extract columns and rows dynamically
    const cols = [...new Set(tileKeys.map(key => key.charAt(0)))].sort();
    const rows = [...new Set(tileKeys.map(key => key.slice(1)))].sort();

    return (
        <div style={{ marginBottom: "20px" }}>
            <h2 style={{ textAlign: "center" }}>{wallName}</h2>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: `auto repeat(${cols.length}, 1fr)`,
                    gap: "10px",
                    alignItems: "center"
                }}
            >
                {/* Column Headers */}
                <div></div>
                {cols.map((colLabel) => (
                    <div key={colLabel} style={{ textAlign: "center", fontWeight: "bold" }}>
                        {colLabel}
                    </div>
                ))}

                {/* Grid Cells */}
                {rows.map((rowLabel) => (
                    <React.Fragment key={rowLabel}>
                        <div style={{ textAlign: "center", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {rowLabel}
                        </div>
                        {cols.map((colLabel) => {
                            const tileKey = `${colLabel}${rowLabel}`;
                            return tiles[tileKey] ? (
                                <RpiCell
                                    key={tileKey}
                                    tile={tiles[tileKey]}
                                    wallName={wallName}
                                    updateTile={updateTile}
                                />
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