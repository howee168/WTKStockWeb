import React, { useState } from 'react';
import { ArrowDownToLine, Search } from 'lucide-react';
import { useInventory } from '../../../hooks';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { Card } from '../../common/Card';
import styles from '../Features.module.css';
import { useNavigate } from 'react-router-dom';

const GRN: React.FC = () => {
    const navigate = useNavigate();
    const { items, addTransaction } = useInventory();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItemId, setSelectedItemId] = useState('');

    const [formData, setFormData] = useState({
        quantity: 0,
        date: new Date().toISOString().split('T')[0],
        supplier: '',
        doNumber: '',
        grnNumber: '',
        poNumber: '',
        qcStatus: 'OK' as 'OK' | 'NG',
        remarks: ''
    });

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedItem = items.find(i => i.id === selectedItemId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItemId || formData.quantity <= 0) return;

        addTransaction({
            itemId: selectedItemId,
            type: 'IN',
            date: formData.date,
            quantity: Number(formData.quantity),
            supplier: formData.supplier,
            doNumber: formData.doNumber,
            grnNumber: formData.grnNumber,
            poNumber: formData.poNumber,
            qcStatus: formData.qcStatus,
            remarks: formData.remarks
        });

        navigate('/inventory');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'quantity' ? Number(value) : value
        }));
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.header}>
                <h1 className={styles.title}>Good Received Note (GRN)</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
                <Card title="1. Select Item" className={styles.card}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <Input
                            placeholder="Search Item..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={<Search size={18} />}
                        />
                        <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
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
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Current: {item.currentStock} {item.unit}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                <Card title="2. Enter Details">
                    <form onSubmit={handleSubmit} className={styles.form}>
                        {selectedItem ? (
                            <div style={{ padding: '1rem', backgroundColor: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                                <strong>Selected:</strong> {selectedItem.code} - {selectedItem.name}
                                <br />
                                <span style={{ fontSize: '0.9rem' }}>Location: {selectedItem.location} | Current Stock: {selectedItem.currentStock} {selectedItem.unit}</span>
                            </div>
                        ) : (
                            <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
                                Please select an item from the left list.
                            </div>
                        )}

                        <div className={styles.formGrid}>
                            <Input
                                label="Date"
                                name="date"
                                type="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                            />
                            <Input
                                label="Quantity Received"
                                name="quantity"
                                type="number"
                                min="1"
                                value={formData.quantity}
                                onChange={handleChange}
                                required
                                disabled={!selectedItemId}
                            />
                            <Input
                                label="Supplier Name"
                                name="supplier"
                                value={formData.supplier}
                                onChange={handleChange}
                                disabled={!selectedItemId}
                            />
                            <Input
                                label="D/O No. (External)"
                                name="doNumber"
                                value={formData.doNumber}
                                onChange={handleChange}
                                disabled={!selectedItemId}
                            />
                            <Input
                                label="GRN No. (Internal)"
                                name="grnNumber"
                                value={formData.grnNumber}
                                onChange={handleChange}
                                required
                                disabled={!selectedItemId}
                            />
                            <Input
                                label="PO No."
                                name="poNumber"
                                value={formData.poNumber}
                                onChange={handleChange}
                                disabled={!selectedItemId}
                            />
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>QC Result</label>
                                <select
                                    name="qcStatus"
                                    value={formData.qcStatus}
                                    onChange={handleChange}
                                    className={styles.select}
                                    disabled={!selectedItemId}
                                >
                                    <option value="OK">OK</option>
                                    <option value="NG">NG (Not Good)</option>
                                </select>
                            </div>
                        </div>

                        <Input
                            label="Remarks"
                            name="remarks"
                            value={formData.remarks}
                            onChange={handleChange}
                            disabled={!selectedItemId}
                        />

                        <div className={styles.formActions}>
                            <Button type="submit" disabled={!selectedItemId || formData.quantity <= 0}>
                                <ArrowDownToLine size={18} />
                                Confirm Stock In
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default GRN;
