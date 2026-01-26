
const XLSX = require('xlsx');

// Mock content matching what we expect the user might have
const mockData = [
    ["User: Test", "Date: 2026", "", ""], // Junk row 1
    ["", "", "", ""], // Junk row 2
    ["NO.", "DESCRIPTION", "MAT. CODE", "DRWG NO.", "BAL", "AREA", "STK LEVEL", "UNIT"], // Header Row (Index 2)
    [1, "Test Item 1", "MCODE-001", "D-001", 100, "A1", 10, "PCS"],
    [2, "Test Item 2", "MCODE-002", "D-002", 50, "A2", 5, "SET"]
];

function runTest() {
    console.log("Creating mock workbook...");
    const ws = XLSX.utils.aoa_to_sheet(mockData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    // Simulate read
    const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });
    console.log("Raw Data:", rawData);

    // Logic from ImportModal
    let headerRowIndex = 0;

    // Find header
    for (let i = 0; i < Math.min(rawData.length, 10); i++) {
        const row = rawData[i].map(cell => String(cell).toLowerCase().trim());
        const hasName = row.some(c => c.includes('desc') || c === 'name' || c.includes('item'));
        const hasCode = row.some(c => c.includes('code') || c.includes('no') || c.includes('mat'));

        if (hasName && hasCode) {
            headerRowIndex = i;
            console.log(`Found header at index ${i}:`, rawData[i]);
            break;
        }
    }

    const headers = rawData[headerRowIndex].map(h => String(h).trim());
    console.log("Detected Headers:", headers);

    const getValue = (row, possibleNames) => {
        let targetIndex = headers.findIndex(h =>
            possibleNames.some(name => h.toLowerCase() === name.toLowerCase())
        );

        if (targetIndex === -1) {
            targetIndex = headers.findIndex(h =>
                possibleNames.some(name => h.toLowerCase().includes(name.toLowerCase()))
            );
        }

        if (targetIndex !== -1 && row[targetIndex] !== undefined) {
            return String(row[targetIndex]).trim();
        }
        return '';
    };

    // Parse items
    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length === 0) continue;
        if (row.every(cell => !cell)) continue;

        const name = getValue(row, ['DESCRIPTION', 'Description', 'Item Name', 'Name', 'Item']);
        const code = getValue(row, ['MAT. CODE', 'Mat. Code', 'Material Code', 'Code', 'Part No', 'Item Code']);

        console.log(`Row ${i} -> Name: "${name}", Code: "${code}"`);

        if (!name) console.error("FAIL: Missing Name");
        if (!code) console.error("FAIL: Missing Code");
    }
}

runTest();
