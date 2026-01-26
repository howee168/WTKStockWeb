import React, { useState } from 'react';
import { Download, Search } from 'lucide-react';
import { useInventory } from '../../../hooks';
import * as XLSX from 'xlsx';
import type { Transaction } from '../../../types';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Table, type Column } from '../../common/Table';
import styles from '../Features.module.css';

const StockCard: React.FC = () => {
    const { items, transactions } = useInventory();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItemId, setSelectedItemId] = useState('');

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedItem = items.find(i => i.id === selectedItemId);

    // Filter and sort transactions for selected item
    const itemTransactions = transactions
        .filter(t => t.itemId === selectedItemId)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const handleExport = () => {
        if (!selectedItem) return;

        const data = itemTransactions.map((t, index) => ({
            'No.': index + 1,
            'Date': t.date,
            'In': t.type === 'IN' ? t.quantity : '',
            'Out': t.type === 'OUT' ? t.quantity : '',
            'Balance': t.balanceAfter,
            'Document No': t.type === 'IN' ? t.grnNumber : t.mrrfNumber,
            'Remarks': t.remarks || (t.type === 'IN' ? `GRN: ${t.grnNumber}` : `MRRF: ${t.mrrfNumber}`)
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Stock Card');

        // Add header info (manual approach for better formatting could be done, but this is simple)
        XLSX.writeFile(wb, `${selectedItem.name}_StockCard.xlsx`);
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
                <h1 className={styles.title}>Stock Card Reports</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem' }}>
                <Card title="Items" className={styles.card}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <Input
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={<Search size={18} />}
                        />
                        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                            {filteredItems.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedItemId(item.id)}
                                    style={{
                                        padding: '0.75rem',
                                        borderBottom: '1px solid var(--color-border)',
                                        cursor: 'pointer',
                                        backgroundColor: selectedItemId === item.id ? 'var(--color-primary-light)' : 'transparent',
                                        color: selectedItemId === item.id ? 'var(--color-primary)' : 'inherit'
                                    }}
                                >
                                    <div style={{ fontWeight: 600 }}>{item.code}</div>
                                    <div style={{ fontSize: '0.9rem' }}>{item.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                <Card>
                    {selectedItem ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{selectedItem.name}</h2>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '0.5rem 2rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                        <span>Code: <strong>{selectedItem.code}</strong></span>
                                        <span>Location: <strong>{selectedItem.location}</strong></span>
                                        <span>Part No: <strong>{selectedItem.partNumber}</strong></span>
                                        <span>Min Level: <strong>{selectedItem.minLevel}</strong></span>
                                        <span>Current Stock: <strong style={{ color: 'var(--color-text-main)' }}>{selectedItem.currentStock} {selectedItem.unit}</strong></span>
                                    </div>
                                </div>
                                <Button onClick={handleExport} variant="secondary">
                                    <Download size={18} />
                                    Export Excel
                                </Button>
                            </div>

                            <Table
                                data={itemTransactions}
                                columns={columns}
                            />
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <p>Select an item to view its stock card history.</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default StockCard;
