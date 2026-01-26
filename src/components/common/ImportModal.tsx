import React, { useState, useRef } from 'react';
import { Upload, AlertTriangle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useInventory } from '../../hooks';
import { Button } from './Button';
import { Modal } from './Modal';
import { Table, type Column } from './Table';
import styles from './Common.module.css';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ImportedItem {
    id: string; // Added for Table key compatibility
    name: string;
    code: string;
    partNumber: string;
    location: string;
    size: string;
    unit: string;
    minLevel: number;
    currentStock: number;
    isValid: boolean;
    errors: string[];
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose }) => {
    const { items, batchImportItems } = useInventory();
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<ImportedItem[]>([]);
    const [debugInfo, setDebugInfo] = useState<{ headerRow: number; headers: string[]; firstRow: any[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files[0]) {
            processFile(files[0]);
        }
    };

    const processFile = async (selectedFile: File) => {
        setFile(selectedFile);
        setDebugInfo(null);
        setPreviewData([]);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // 1. Read as array of arrays to find header row
                const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                if (!rawData || rawData.length === 0) {
                    alert("File is empty");
                    return;
                }

                // 2. Find header row
                let headerRowIndex = 0;

                for (let i = 0; i < Math.min(rawData.length, 10); i++) { // Check first 10 rows
                    const row = rawData[i].map(cell => String(cell).toLowerCase().trim());

                    // Expanded permissive check
                    const hasName = row.some(c =>
                        c.includes('desc') || c === 'name' || c.includes('item') || c.includes('product')
                    );
                    const hasCode = row.some(c =>
                        c.includes('code') || c.includes('no') || c.includes('mat') || c.includes('sku') || c.includes('p/n')
                    );

                    if (hasName && hasCode) {
                        headerRowIndex = i;
                        break;
                    }
                }

                const headers = rawData[headerRowIndex].map(h => String(h).replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim());
                const firstDataRow = rawData.length > headerRowIndex + 1 ? rawData[headerRowIndex + 1] : [];

                // Set Debug Info
                setDebugInfo({
                    headerRow: headerRowIndex + 1, // 1-based for display
                    headers: headers,
                    firstRow: firstDataRow
                });

                // Clean helper: lowercase and remove all non-alphanumeric characters
                const clean = (s: string) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

                // Helper to find value
                const getValue = (row: any[], possibleNames: string[]): string => {
                    // 1. Exact "Clean" Match
                    for (const name of possibleNames) {
                        const index = headers.findIndex(h => clean(h) === clean(name));
                        if (index !== -1 && row[index] !== undefined) return String(row[index]).trim();
                    }

                    // 2. Contains "Clean" Match (if no exact match)
                    for (const name of possibleNames) {
                        const index = headers.findIndex(h => clean(h).includes(clean(name)));
                        if (index !== -1 && row[index] !== undefined) return String(row[index]).trim();
                    }

                    return '';
                };

                const mappedData: ImportedItem[] = [];

                // 3. Parse rows
                for (let i = headerRowIndex + 1; i < rawData.length; i++) {
                    const row = rawData[i];
                    if (!row || row.length === 0) continue;
                    // Skip empty
                    if (row.every(cell => !cell)) continue;

                    const item: ImportedItem = {
                        id: `import-preview-${i}`,
                        name: getValue(row, ['DESCRIPTION', 'Description', 'Item Name', 'Name', 'Item', 'Product Name', 'Product']),
                        code: getValue(row, ['MAT. CODE', 'Mat. Code', 'Material Code', 'Code', 'Part No', 'Item Code', 'Item No', 'Product Code', 'SKU', 'P/N']),
                        partNumber: getValue(row, ['DRWG NO.', 'Drwg No', 'Drawing No', 'Drwg', 'Part No', 'Part Number', 'Model']),
                        location: getValue(row, ['AREA', 'Area', 'Location', 'Bin', 'Rack', 'Shelf']),
                        size: getValue(row, ['SIZE', 'Size', 'Dimension', 'Specs']),
                        unit: getValue(row, ['UNIT', 'Unit', 'UOM']).toUpperCase() || 'PCS',
                        minLevel: Number(getValue(row, ['STK LEVEL', 'Stk Level', 'Min Level', 'Min Stock', 'Min'])) || 0,
                        currentStock: Number(getValue(row, ['BAL', 'Bal', 'Current Stock', 'Balance', 'Qty', 'Quantity', 'Amount', 'Stock'])) || 0,
                        isValid: true,
                        errors: []
                    };

                    // Validation
                    if (!item.name) item.errors.push('Missing Name');
                    if (!item.code) item.errors.push('Missing Code');

                    if (items.some(existing => existing.code === item.code)) {
                        item.isValid = false;
                        item.errors.push('Code already exists');
                    }

                    if (item.errors.length > 0) item.isValid = false;
                    mappedData.push(item);
                }

                setPreviewData(mappedData);

            } catch (error) {
                console.error("Error parsing Excel file", error);
                alert("Failed to parse file.");
            }
        };
        reader.readAsBinaryString(selectedFile);
    };

    const handleBatchImport = () => {
        const itemsToImport = previewData
            .filter(i => i.isValid)
            .map(i => ({
                id: crypto.randomUUID(),
                name: i.name,
                code: i.code,
                partNumber: i.partNumber,
                location: i.location,
                size: i.size,
                type: 'General',
                year: new Date().getFullYear().toString(),
                unit: i.unit as any,
                minLevel: i.minLevel,
                currentStock: i.currentStock,
                updatedAt: new Date().toISOString(),
                description: 'Imported from Excel'
            }));

        if (batchImportItems) {
            batchImportItems(itemsToImport);
            onClose();
            setFile(null);
            setPreviewData([]);
            setDebugInfo(null);
            alert(`Successfully imported ${itemsToImport.length} items.`);
        } else {
            alert("Context error");
        }
    }

    const columns: Column<ImportedItem>[] = [
        { header: 'Status', accessor: (row) => row.isValid ? <CheckCircle size={16} color="green" /> : <AlertTriangle size={16} color="red" />, width: '60px' },
        { header: 'Code', accessor: 'code' },
        { header: 'Name', accessor: 'name' },
        { header: 'Stock', accessor: 'currentStock', width: '80px' },
        { header: 'Issues', accessor: (row) => <span style={{ color: 'red', fontSize: '12px' }}>{row.errors.join(', ')}</span> }
    ];

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Import Excel" size="lg">
            <div className={styles.importContainer}>
                {!file ? (
                    <div
                        className={styles.dropZone}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className={styles.dropZoneIcon} />
                        <div>
                            <p style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>Click or Drag to upload Excel file</p>
                            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>.xlsx or .xls files supported</p>
                        </div>
                        <p style={{ fontSize: '0.8rem', maxWidth: '400px', lineHeight: '1.4' }}>
                            Supported Columns: Name/Description, Code, Part No, Location, Size, Unit, Min Level, Qty
                        </p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".xlsx, .xls"
                            style={{ display: 'none' }}
                        />
                    </div>
                ) : (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span>File: <strong>{file.name}</strong></span>
                            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setPreviewData([]); setDebugInfo(null); }}>Change File</Button>
                        </div>

                        {/* DEBUG INFO BOX - Always show if we have data to help user debug mappings */}
                        {debugInfo && (
                            <div style={{ background: '#f8f9fa', padding: '0.8rem', marginBottom: '1rem', borderRadius: '4px', fontSize: '12px', border: '1px solid #dee2e6' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>File Analysis:</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px' }}>
                                    <span>Header Row:</span> <span>#{debugInfo.headerRow}</span>
                                    <span>Detected Headers:</span> <span>{debugInfo.headers.join(' | ')}</span>
                                </div>
                            </div>
                        )}

                        <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                            <Table data={previewData} columns={columns} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <Button variant="secondary" onClick={onClose}>Cancel</Button>
                            <Button
                                onClick={handleBatchImport}
                                disabled={previewData.length === 0 || !previewData.some(i => i.isValid)}
                            >
                                Import {previewData.filter(i => i.isValid).length} Valid Items
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
