import React, { useState, useMemo } from 'react';
import { Download, Search } from 'lucide-react';
import { useInventory } from '../../../hooks';
import type { Transaction } from '../../../types';
import ExcelJS from 'exceljs';
import { generateStockCardWorkbook, downloadWorkbook } from '../../../utils/excelExport';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Table, type Column } from '../../common/Table';
import styles from '../Features.module.css';

const OverallStockCard: React.FC = () => {
    const { items, transactions } = useInventory();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('ALL');

    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        transactions.forEach(t => {
            if (t.date) {
                months.add(t.date.substring(0, 7));
            }
        });
        return Array.from(months).sort((a, b) => b.localeCompare(a));
    }, [transactions]);

    // Group items and their transactions
    const itemsWithTransactions = useMemo(() => {
        const filteredItems = items.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.code.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return filteredItems.map(item => {
            let itemTrans = transactions.filter(t => t.itemId === item.id);

            if (selectedMonth !== 'ALL') {
                itemTrans = itemTrans.filter(t => t.date && t.date.startsWith(selectedMonth));
            }

            // Sort by date
            itemTrans.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            return {
                ...item,
                transactions: itemTrans
            };
        }).filter(item => item.transactions.length > 0 || selectedMonth === 'ALL');
        // If ALL is selected, maybe show all including 0 transactions? 
        // Or to keep it cleaner, let's only show items that have at least 1 transaction for the given filter.
        // Actually, "overall record" usually means seeing active items. Let's just filter out ones with 0 transactions to save space.
    }, [items, transactions, searchTerm, selectedMonth]);

    const handleExport = async () => {
        if (itemsWithTransactions.length === 0) {
            alert("No records to export.");
            return;
        }

        try {
            // Create a master workbook to hold all sheets
            const masterWorkbook = new ExcelJS.Workbook();

            for (const item of itemsWithTransactions) {
                if (item.transactions.length === 0) continue;

                // Generate a single-sheet workbook for this item using our template utility
                const tempWorkbook = await generateStockCardWorkbook(item, item.transactions);

                // The template utility creates exactly one sheet. We need to copy it into the master workbook
                const sourceSheet = tempWorkbook.worksheets[0];

                let sheetName = sourceSheet.name;
                // Handle duplicate names across different chunks
                if (masterWorkbook.worksheets.some(ws => ws.name === sheetName)) {
                    sheetName = `${sheetName.substring(0, 25)}_${item.id.substring(0, 4)}`;
                }

                // Add a blank sheet to master
                const newSheet = masterWorkbook.addWorksheet(sheetName, {
                    pageSetup: { paperSize: 9, orientation: 'portrait' }
                });

                // Set columns to match the template
                newSheet.columns = [...sourceSheet.columns];

                // Copy all rows and heights and merges
                sourceSheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
                    const newRow = newSheet.getRow(rowNumber);
                    newRow.height = row.height;

                    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                        const newCell = newRow.getCell(colNumber);
                        newCell.value = cell.value;
                        newCell.style = cell.style; // Copies font, alignment, borders
                    });
                });

                // Copy all merges
                // We access the internal merges object of ExcelJS to reproduce them exactly
                // @ts-ignore - reaching into private property for a clean copy
                if (sourceSheet._merges) {
                    // @ts-ignore
                    Object.values(sourceSheet._merges).forEach((merge: any) => {
                        // merge object format is internal, we extract the range string
                        newSheet.mergeCells(merge.model.top, merge.model.left, merge.model.bottom, merge.model.right);
                    });
                }
            }

            if (masterWorkbook.worksheets.length === 0) {
                alert("No data available to export.");
                return;
            }

            await downloadWorkbook(masterWorkbook, `Overall_StockCard_${selectedMonth}.xlsx`);
        } catch (error) {
            console.error("Failed to generate multi-sheet export", error);
            alert("Error generating the excel file.");
        }
    };

    const columns: Column<Transaction>[] = [
        { header: 'Date', accessor: 'date', width: '120px' },
        {
            header: 'In',
            accessor: (t: Transaction) => t.type === 'IN' ? <span style={{ color: 'var(--color-success)' }}>{t.quantity}</span> : '-',
            width: '80px'
        },
        {
            header: 'Out',
            accessor: (t: Transaction) => t.type === 'OUT' ? <span style={{ color: 'var(--color-danger)' }}>{t.quantity}</span> : '-',
            width: '80px'
        },
        { header: 'Balance', accessor: 'balanceAfter', width: '100px' },
        {
            header: 'Ref No.',
            accessor: (t: Transaction) => t.type === 'IN' ? (t.grnNumber || '-') : (t.mrrfNumber || '-'),
            width: '150px'
        },
        {
            header: 'Details',
            accessor: (t: Transaction) => t.type === 'IN' ? `Supp: ${t.supplier || '-'}` : `Job: ${t.jobOrderNumber || '-'}`,
        },
        { header: 'Remarks', accessor: 'remarks' }
    ];

    return (
        <div className={styles.pageContainer}>
            <div className={styles.header}>
                <h1 className={styles.title}>Overall Stock Card Reports</h1>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Input
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={<Search size={18} />}
                        style={{ width: '250px' }}
                    />

                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        style={{
                            padding: '0.6rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg-surface)',
                            color: 'var(--color-text-main)',
                            fontFamily: 'inherit',
                            minWidth: '200px'
                        }}
                    >
                        <option value="ALL">Overall Record (All time)</option>
                        {availableMonths.map(month => {
                            const date = new Date(`${month}-01`);
                            const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                            return <option key={month} value={month}>{monthName}</option>;
                        })}
                    </select>

                    <Button onClick={handleExport} variant="secondary">
                        <Download size={18} />
                        Export All
                    </Button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {itemsWithTransactions.length === 0 ? (
                    <Card>
                        <div className={styles.emptyState}>
                            <p>No records found for the selected filter.</p>
                        </div>
                    </Card>
                ) : (
                    itemsWithTransactions.map(item => (
                        <Card key={item.id}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{item.name}</h2>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto', gap: '0.5rem 2rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                            <span>Code: <strong>{item.code}</strong></span>
                                            <span>Location: <strong>{item.location}</strong></span>
                                            <span>Current Stock: <strong style={{ color: 'var(--color-text-main)' }}>{item.currentStock} {item.unit}</strong></span>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', textAlign: 'right' }}>
                                        <strong>{item.transactions.length}</strong> transactions
                                    </div>
                                </div>

                                {item.transactions.length > 0 ? (
                                    <Table
                                        data={item.transactions}
                                        columns={columns}
                                    />
                                ) : (
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', textAlign: 'center', margin: '1rem 0' }}>
                                        No transactions for this item in the selected period.
                                    </p>
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default OverallStockCard;
