import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useInventory } from '../../hooks';
import styles from './Features.module.css';
import { Monitor, ArrowLeftRight, CheckCircle, AlertCircle, Plus, X, MessageCircle, Trash2 } from 'lucide-react';

const DemoTracker: React.FC = () => {
    const { transactions, items, addTransaction, updateTransaction, deleteTransaction } = useInventory();

    const activeDemos = transactions.filter(tx => tx.isDemo && tx.demoStatus === 'PENDING');
    const returnedDemos = transactions.filter(tx => tx.isDemo && tx.demoStatus === 'RETURNED'); // Get history

    const [isSending, setIsSending] = useState<string | null>(null); // Track which ID is currently sending

    activeDemos.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    returnedDemos.sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());

    // Calculate Overdue Count
    const overdueCount = activeDemos.filter(tx => tx.demoReturnDate && new Date(tx.demoReturnDate) < new Date()).length;

    // --- Tab State ---
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

    // --- Modal States ---
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [selectedDemoId, setSelectedDemoId] = useState<string | null>(null);

    // --- Add Demo Form State ---
    const [addForm, setAddForm] = useState({
        item: '', // Manual text entry
        date: new Date().toISOString().split('T')[0],
        quantity: 1,
        pic: '',
        customerPhone: '',
        expectedReturnDate: '',
        remarks: ''
    });

    // --- Return Form State ---
    const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
    const [returnFeedback, setReturnFeedback] = useState('');

    // --- Handlers: Add New Demo ---
    const handleAddChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setAddForm(prev => ({ ...prev, [name]: value }));
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        await addTransaction({
            type: 'OUT',
            date: addForm.date,
            quantity: Number(addForm.quantity),
            pic: addForm.pic,
            remarks: addForm.remarks,
            // Manual Entry Fields
            isDemo: true,
            demoStatus: 'PENDING',
            demoItemName: addForm.item,
            demoReturnDate: addForm.expectedReturnDate,
            customerPhone: addForm.customerPhone,
            // Explicitly no itemId for manual entry
        });

        setIsAddModalOpen(false);
        setAddForm({
            item: '',
            date: new Date().toISOString().split('T')[0],
            quantity: 1,
            pic: '',
            customerPhone: '',
            expectedReturnDate: '',
            remarks: ''
        });
    };

    // --- Handlers: Return Demo ---
    const handleReturnClick = (txId: string) => {
        setSelectedDemoId(txId);
        setReturnModalOpen(true);
        setReturnFeedback('');
    };

    const handleConfirmReturn = async () => {
        if (!selectedDemoId) return;

        const originalTx = transactions.find(t => t.id === selectedDemoId);
        if (!originalTx) return;

        // 1. Create Stock In (Logic depends on whether it was linked or manual)
        // For Manual items, we just record the IN transaction for history, but it won't affect any 'currentStock' of a real item because itemId is undefined.
        await addTransaction({
            itemId: originalTx.itemId, // Pass it if it exists (legacy compatibility), otherwise undefined
            type: 'IN',
            date: returnDate,
            quantity: originalTx.quantity,
            remarks: `Demo Return: ${originalTx.demoItemName || 'Unknown Item'}`,
            supplier: 'Demo Return',
            qcStatus: 'OK'
        });

        // 2. Update Original Transaction Status
        await updateTransaction(selectedDemoId, {
            demoStatus: 'RETURNED',
            demoFeedback: returnFeedback
        });

        setReturnModalOpen(false);
        setSelectedDemoId(null);
    };

    const handleDeleteDemo = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this demo record?')) {
            await deleteTransaction(id);
        }
    };

    const triggerAutoReminder = async (transactionId: string, useTemplate = false) => {
        setIsSending(transactionId + (useTemplate ? '-template' : '-text'));
        try {
            const response = await fetch(`https://ipqgxhbnowmjqefmyfod.supabase.co/functions/v1/send-reminders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`
                },
                body: JSON.stringify({ transactionId, useTemplate })
            });

            const result = await response.json();
            if (response.ok && result.success) {
                alert(useTemplate ? 'Test Template sent! Check your phone.' : 'Reminder sent successfully!');
            } else {
                const errorMessage = result.error || (result.results && result.results[0]?.error) || 'Unknown error';
                alert(`Failed to send reminder: ${errorMessage}`);
                console.error('Reminder failure details:', result);
            }
        } catch (error) {
            console.error('Error triggering reminder:', error);
            alert('Error connecting to the reminder service.');
        } finally {
            setIsSending(null);
        }
    };

    // Helper to get display name (either linked item code or manual name)
    const getDisplayName = (tx: any) => {
        // Prioritize manual name if it exists (even if there is a linked placeholder item)
        if (tx.demoItemName) {
            return tx.demoItemName;
        }

        // Fallback to linked item lookup
        if (tx.itemId) {
            const item = items.find(i => i.id === tx.itemId);
            // Hide the placeholder specific name if it leaks through, though demoItemName should catch it
            if (item && item.code === 'DEMO-MANUAL') {
                return 'Manual Item (Name Missing)';
            }
            return item ? `${item.code} - ${item.name}` : 'Unknown Item (Linked)';
        }

        return 'Unnamed Manual Item';
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.header}>
                <h1 className={styles.title}>
                    Demo Tracker
                    {overdueCount > 0 && (
                        <span style={{
                            marginLeft: '15px', padding: '0.25rem 0.75rem', borderRadius: '9999px',
                            backgroundColor: 'var(--color-danger)', color: 'white', fontSize: '0.8rem', verticalAlign: 'middle'
                        }}>
                            {overdueCount} Overdue
                        </span>
                    )}
                </h1>
                <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus size={18} /> New Demo Out
                </Button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                <button
                    onClick={() => setActiveTab('active')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        backgroundColor: 'transparent',
                        borderBottom: activeTab === 'active' ? '2px solid var(--color-primary)' : '2px solid transparent',
                        color: activeTab === 'active' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    Active Demos ({activeDemos.length})
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        backgroundColor: 'transparent',
                        borderBottom: activeTab === 'history' ? '2px solid var(--color-primary)' : '2px solid transparent',
                        color: activeTab === 'history' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    History ({returnedDemos.length})
                </button>
            </div>

            <Card>
                {activeTab === 'active' ? (
                    activeDemos.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                            <CheckCircle size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p>No active demo units at the moment.</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                                        <th style={{ padding: '1rem' }}>Date Out</th>
                                        <th style={{ padding: '1rem' }}>Item</th>
                                        <th style={{ padding: '1rem' }}>Customer / PIC</th>
                                        <th style={{ padding: '1rem' }}>Qty</th>
                                        <th style={{ padding: '1rem' }}>Exp. Return</th>
                                        <th style={{ padding: '1rem' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeDemos.map(tx => {
                                        const isOverdue = tx.demoReturnDate ? new Date(tx.demoReturnDate) < new Date() : false;
                                        return (
                                            <tr key={tx.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                <td style={{ padding: '1rem' }}>{formatDate(tx.date)}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <strong>{getDisplayName(tx)}</strong>
                                                    {tx.remarks && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{tx.remarks}</div>}
                                                </td>
                                                <td style={{ padding: '1rem' }}>{tx.pic || '-'}</td>
                                                <td style={{ padding: '1rem' }}>{tx.quantity}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isOverdue ? 'var(--color-danger)' : 'inherit', fontWeight: isOverdue ? 700 : 400 }}>
                                                        {isOverdue && <AlertCircle size={16} />}
                                                        {tx.demoReturnDate || '-'}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <Button size="sm" onClick={() => handleReturnClick(tx.id)}>
                                                        <ArrowLeftRight size={16} /> Return
                                                    </Button>
                                                    {tx.customerPhone && (
                                                        <>
                                                            <a
                                                                href={`https://wa.me/${tx.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello! Our records show the following demo unit is due for collection/return: ${getDisplayName(tx) || 'Item'}. Please prepare the item for retrieval or return it to our office. Thank you.`)}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{
                                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                                    padding: '0.4rem', borderRadius: '4px',
                                                                    backgroundColor: '#25D366', color: 'white',
                                                                    marginLeft: '0.5rem', textDecoration: 'none'
                                                                }}
                                                                title="Open WhatsApp (Manual)"
                                                            >
                                                                <MessageCircle size={16} />
                                                            </a>
                                                            <button
                                                                onClick={() => triggerAutoReminder(tx.id)}
                                                                disabled={!!isSending}
                                                                style={{
                                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                                    padding: '0.4rem', borderRadius: '4px',
                                                                    backgroundColor: 'var(--color-primary)', color: 'white',
                                                                    marginLeft: '0.5rem', border: 'none', cursor: 'pointer',
                                                                    opacity: isSending === `${tx.id}-text` ? 0.5 : 1
                                                                }}
                                                                title="Send Official Reminder (Automated)"
                                                            >
                                                                <Monitor size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteDemo(tx.id)}
                                                                style={{
                                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                                    padding: '0.4rem', borderRadius: '4px',
                                                                    backgroundColor: 'var(--color-danger)', color: 'white',
                                                                    marginLeft: '0.5rem', border: 'none', cursor: 'pointer'
                                                                }}
                                                                title="Delete Record"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    returnedDemos.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                            <p>No history found.</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                                        <th style={{ padding: '1rem' }}>Date Out</th>
                                        <th style={{ padding: '1rem' }}>Item</th>
                                        <th style={{ padding: '1rem' }}>Customer / PIC</th>
                                        <th style={{ padding: '1rem' }}>Qty</th>
                                        <th style={{ padding: '1rem' }}>Feedback</th>
                                        <th style={{ padding: '1rem' }}>Status</th>
                                        <th style={{ padding: '1rem' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {returnedDemos.map(tx => (
                                        <tr key={tx.id} style={{ borderBottom: '1px solid var(--color-border)', opacity: 0.8 }}>
                                            <td style={{ padding: '1rem' }}>{formatDate(tx.date)}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <strong>{getDisplayName(tx)}</strong>
                                            </td>
                                            <td style={{ padding: '1rem' }}>{tx.pic || '-'}</td>
                                            <td style={{ padding: '1rem' }}>{tx.quantity}</td>
                                            <td style={{ padding: '1rem', fontStyle: 'italic', color: 'var(--color-text-muted)' }}>{tx.demoFeedback || '-'}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.5rem', borderRadius: '4px',
                                                    backgroundColor: 'var(--color-success)', color: 'white', fontSize: '0.75rem'
                                                }}>
                                                    RETURNED
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <button
                                                    onClick={() => handleDeleteDemo(tx.id)}
                                                    style={{
                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                        padding: '0.4rem', borderRadius: '4px',
                                                        backgroundColor: 'var(--color-danger)', color: 'white',
                                                        border: 'none', cursor: 'pointer'
                                                    }}
                                                    title="Delete History Record"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </Card>

            {/* Add New Demo Modal */}
            {
                isAddModalOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            backgroundColor: 'var(--color-bg-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)',
                            width: '100%', maxWidth: '500px', boxShadow: 'var(--shadow-lg)', maxHeight: '90vh', overflowY: 'auto'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ margin: 0 }}>Step 1: New Demo Out</h2>
                                <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleAddSubmit}>
                                <Input label="Item Name / Description" name="item" value={addForm.item} onChange={handleAddChange} required placeholder="e.g. Model X Sample" />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <Input label="Date Out" type="date" name="date" value={addForm.date} onChange={handleAddChange} required />
                                    <Input label="Quantity" type="number" name="quantity" value={addForm.quantity} onChange={handleAddChange} required min="1" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <Input label="Customer / PIC" name="pic" value={addForm.pic} onChange={handleAddChange} placeholder="Who has it?" />
                                    <Input label="Phone Number" name="customerPhone" value={addForm.customerPhone} onChange={handleAddChange} placeholder="e.g. 60123456789" />
                                </div>
                                <Input label="Expected Return Date" type="date" name="expectedReturnDate" value={addForm.expectedReturnDate} onChange={handleAddChange} />
                                <Input label="Remarks" name="remarks" value={addForm.remarks} onChange={handleAddChange} />

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                                    <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                                    <Button type="submit">Confirm Send</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Return Modal */}
            {
                returnModalOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            backgroundColor: 'var(--color-bg-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)',
                            width: '100%', maxWidth: '500px', boxShadow: 'var(--shadow-lg)'
                        }}>
                            <h2 style={{ marginBottom: '1.5rem' }}>Process Return</h2>

                            <div style={{ marginBottom: '1rem' }}>
                                <Input
                                    label="Return Date"
                                    type="date"
                                    value={returnDate}
                                    onChange={(e) => setReturnDate(e.target.value)}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Feedback / Condition</label>
                                <textarea
                                    value={returnFeedback}
                                    onChange={(e) => setReturnFeedback(e.target.value)}
                                    style={{
                                        width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-input)',
                                        color: 'var(--color-text)', minHeight: '100px', resize: 'vertical'
                                    }}
                                    placeholder="e.g. Returned in good condition. Customer Feedback..."
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <Button variant="secondary" onClick={() => setReturnModalOpen(false)}>Cancel</Button>
                                <Button onClick={handleConfirmReturn}>Confirm Return</Button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default DemoTracker;
