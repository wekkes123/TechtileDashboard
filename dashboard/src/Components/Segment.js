//Shoud display: list of cells in a segment, possible to shut down/reboot
import React from "react";
import RpiCell from "./RpiCell";

const Segment = ({ segmentLabel, walls, updateTile, cellCount = 20 }) => {
    // Extract only the relevant tiles for this segment
    const segmentTiles = {};
    Object.keys(walls).forEach((wallName) => {
        Object.entries(walls[wallName].tiles).forEach(([tileId, tileData]) => {
            if (tileId.startsWith(segmentLabel)) {
                segmentTiles[tileId] = tileData;
            }
        });
    });

    // Generate row numbers dynamically
    const rows = Array.from({ length: cellCount }, (_, i) => (i + 1).toString());

    return (
        <div style={{ marginBottom: "20px" }}>
            <h2 style={{ textAlign: "center" }}>Segment {segmentLabel}</h2>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(10, 1fr)",  // Two rows of 10 tiles
                    gap: "10px",
                    justifyItems: "center"
                }}
            >
                {rows.map((rowLabel) => {
                    const tileKey = `${segmentLabel}${rowLabel}`;
                    return (
                        <RpiCell
                            key={tileKey}
                            tile={segmentTiles[tileKey]}
                            segmentLabel={segmentLabel}
                            updateTile={updateTile}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default Segment;
