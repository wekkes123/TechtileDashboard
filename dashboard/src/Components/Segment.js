import React from "react";
import RpiCell from "./RpiCell";

const Segment = ({ segmentLabel, segmentData }) => {
    if (!segmentData || !segmentData.tiles) {
        return <div>Loading {segmentLabel}...</div>;
    }

    const tiles = segmentData.tiles;
    const tileKeys = Object.keys(tiles);

    // Extract unique columns and rows dynamically
    const cols = [...new Set(tileKeys.map(key => key.charAt(0)))].sort();
    const rows = [...new Set(tileKeys.map(key => key.slice(1)))].sort();
    const cellsPerRow = Math.ceil(rows.length / 2 - 1);

    console.log("cols, rows:", cols, rows, "Cells per row:", cellsPerRow);

    return (
        <div style={{marginBottom: "20px"}}>
            <h2 style={{textAlign: "center"}}>{segmentLabel}</h2>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(10, 1fr)", // 10 columns per row
                    gridAutoRows: "1fr", // Ensures even row heights
                    gap: "10px",
                    justifyItems: "center"
                }}
            >
                {rows.reduce((result, rowLabel, index) => {
                    if (index % cellsPerRow === 0) {
                        result.push([]); // Start a new row group every `cellsPerRow` rows
                    }
                    result[result.length - 1].push(rowLabel);
                    return result;
                }, []).map((rowGroup, groupIndex) => (
                    <React.Fragment key={groupIndex}>
                        {rowGroup.map((rowLabel) => (
                            <React.Fragment key={rowLabel}>
                                {cols.map((colLabel) => {
                                    const tileKey = `${colLabel}${rowLabel}`;
                                    return (
                                        <RpiCell key={tileKey} tile={tiles[tileKey]} wallName={segmentLabel}/>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </React.Fragment>
                ))}
            </div>
        </div>

    );
};

export default Segment;
