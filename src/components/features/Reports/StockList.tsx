import React, { useState } from 'react';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import { Download, Search } from 'lucide-react';
import { useInventory } from '../../../hooks';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Table, type Column } from '../../common/Table';
import { Button } from '../../common/Button';
import styles from '../Features.module.css';

const StockList: React.FC = () => {
    const { items } = useInventory();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.partNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );



    // Define types for mixed content
    type RowItem = (typeof filteredItems[0] & { displayIndex?: number; isSeparator?: boolean; separatorLabel?: string });

    // 1. Sort by Code
    const sortedItems = [...filteredItems].sort((a, b) => a.code.localeCompare(b.code));

    // 2. Group items and inject separators
    const groupedData: RowItem[] = [];
    let lastPrefix = '';
    let displayIndex = 1;

    sortedItems.forEach((item) => {
        // Group by first part of code (e.g. "NC" from "NC 001")
        const prefix = item.code.trim().split(/[\s-]+/)[0].toUpperCase();

        if (prefix !== lastPrefix) {
            // Add separator (except maybe at very start if we want just separators BETWEEN)
            // User image shows separator between distinct groups.
            if (groupedData.length > 0) {
                groupedData.push({
                    id: `sep-${prefix}-${Date.now()}`, // Unique ID
                    isSeparator: true,
                    code: '', name: '', partNumber: '', unit: 'PCS', minLevel: 0, currentStock: 0, location: '', updatedAt: '', size: '', type: '', year: ''
                } as any);
            }
            lastPrefix = prefix;
        }

        groupedData.push({
            ...item,
            displayIndex: displayIndex++
        });
    });

    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        if (groupedData.length === 0) {
            alert("No items to export.");
            return;
        }

        setIsExporting(true);

        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Stock List');

            // Define Columns
            worksheet.columns = [
                { header: 'NO.', key: 'index', width: 6 },
                { header: 'DESCRIPTION', key: 'name', width: 40 },
                { header: 'DRWG NO.', key: 'partNumber', width: 20 },
                { header: 'MAT. CODE', key: 'code', width: 15 },
                { header: 'BAL', key: 'currentStock', width: 10 },
                { header: 'AREA', key: 'location', width: 15 },
                { header: 'STK LEVEL', key: 'minLevel', width: 12 },
            ];

            // Style Header Row
            const headerRow = worksheet.getRow(1);
            headerRow.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF00B050' } // Green #00b050
                };
                cell.font = {
                    bold: true,
                    color: { argb: 'FF000000' } // Black
                };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            });

            // Add Data Rows
            groupedData.forEach((item) => {
                if (item.isSeparator) {
                    const row = worksheet.addRow(['', '', '', '', '', '', '']);
                    row.height = 18;
                    // Style separator row
                    row.eachCell({ includeEmpty: true }, (cell) => {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FF00B050' } // Green #00b050
                        };
                        cell.border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        };
                    });
                } else {
                    const row = worksheet.addRow({
                        index: item.displayIndex,
                        name: item.name,
                        partNumber: item.partNumber || '-',
                        code: item.code.toUpperCase(),
                        currentStock: item.currentStock,
                        location: item.location || '-',
                        minLevel: item.minLevel
                    });

                    // Cell Styles
                    row.getCell('currentStock').alignment = { horizontal: 'center' };
                    row.getCell('index').alignment = { horizontal: 'center' };
                    row.getCell('minLevel').alignment = { horizontal: 'center' };

                    // Red Stock Level Column
                    const stkLevelCell = row.getCell('minLevel');
                    stkLevelCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFF0000' } // Red
                    };
                    stkLevelCell.font = {
                        bold: true,
                        color: { argb: 'FF000000' }
                    };

                    // Borders for all cells
                    row.eachCell({ includeEmpty: true }, (cell) => {
                        cell.border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        };
                    });
                }
            });

            // Generate Buffer
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, `Stock_List_${new Date().toISOString().split('T')[0]}.xlsx`);

        } catch (error) {
            console.error("Export failed:", error);
            alert("Failed to export Excel file.");
        } finally {
            setIsExporting(false);
        }
    };

    const finalColumns: Column<RowItem>[] = [
        { header: 'NO.', accessor: 'displayIndex', width: '60px', align: 'center' },
        { header: 'DESCRIPTION', accessor: 'name' },
        { header: 'DRWG NO.', accessor: 'partNumber' },
        { header: 'MAT. CODE', accessor: 'code' },
        {
            header: 'BAL',
            accessor: 'currentStock',
            width: '80px',
            align: 'center',
            cellStyle: () => ({ fontWeight: 'bold' })
        },
        {
            header: 'AREA',
            accessor: 'location',
        },
        {
            header: 'STK LEVEL',
            accessor: 'minLevel',
            width: '100px',
            align: 'center',
            cellStyle: () => ({ backgroundColor: 'red', color: 'black', fontWeight: 'bold' })
        }
    ];

    return (
        <div className={styles.pageContainer}>
            <div className={styles.header}>
                <h1 className={styles.title}>Stock List</h1>
                <Button
                    icon={isExporting ? undefined : <Download size={18} />}
                    onClick={handleExport}
                    disabled={isExporting}
                >
                    {isExporting ? 'Exporting...' : 'Export List'}
                </Button>
            </div>

            <Card>
                <div style={{ paddingBottom: '1rem' }}>
                    <Input
                        placeholder="Search by Description, Code, Drwg No..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={<Search size={18} />}
                        style={{ maxWidth: '400px' }}
                    />
                </div>
                <div className="custom-stock-list">
                    <style>{`
                        .custom-stock-list table thead th {
                            background-color: #00b050 !important;
                            color: black !important;
                            font-weight: 800 !important;
                            border: 1px solid #333 !important;
                        }
                        .custom-stock-list table tbody td {
                            border: 1px solid var(--color-border, #ccc);
                        }
                    `}</style>
                    <Table
                        data={groupedData}
                        columns={finalColumns}
                        renderRow={(item, cols) => {
                            if (item.isSeparator) {
                                return (
                                    <tr key={item.id}>
                                        <td
                                            colSpan={cols.length}
                                            style={{
                                                backgroundColor: '#00b050', // Green separator
                                                height: '24px',
                                                border: '1px solid #333'
                                            }}
                                        />
                                    </tr>
                                );
                            }
                            return null; // Default render
                        }}
                    />
                </div>
            </Card>
        </div>
    );
};

export default StockList;
