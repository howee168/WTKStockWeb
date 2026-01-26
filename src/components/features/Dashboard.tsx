import React from 'react';
import { useInventory } from '../../hooks';
import { Card } from '../common/Card';
import { AlertTriangle, Package } from 'lucide-react';
import styles from './Features.module.css';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
    const { items, transactions } = useInventory();

    const totalItems = items.length;
    const lowStockItems = items.filter(i => i.currentStock <= i.minLevel);
    const recentTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    const StatCard = ({ title, value, icon, color, to }: any) => (
        <Link to={to} style={{ textDecoration: 'none' }}>
            <Card className={styles.statCard}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>{title}</span>
                    <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{value}</span>
                </div>
                <div style={{
                    backgroundColor: color,
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    opacity: 0.9
                }}>
                    {icon}
                </div>
            </Card>
        </Link>
    );

    return (
        <div className={styles.pageContainer}>
            <h1 className={styles.title}>Dashboard</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                <StatCard
                    title="Total Items"
                    value={totalItems}
                    icon={<Package size={24} />}
                    color="var(--color-primary)"
                    to="/inventory"
                />
                <StatCard
                    title="Low Stock Alerts"
                    value={lowStockItems.length}
                    icon={<AlertTriangle size={24} />}
                    color="var(--color-warning)"
                    to="/inventory"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
                <Card title="Low Stock Items">
                    {lowStockItems.length === 0 ? (
                        <p style={{ color: 'var(--color-text-muted)' }}>All stock levels are healthy.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {lowStockItems.map(item => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Code: {item.code}</div>
                                    </div>
                                    <div style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                                        {item.currentStock} / {item.minLevel} {item.unit}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card title="Recent Activity">
                    {recentTransactions.length === 0 ? (
                        <p style={{ color: 'var(--color-text-muted)' }}>No transactions yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {recentTransactions.map(t => (
                                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        padding: '0.5rem',
                                        borderRadius: '50%',
                                        backgroundColor: t.type === 'IN' ? 'var(--color-success)' : 'var(--color-danger)',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {t.type}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                                            {items.find(i => i.id === t.itemId)?.code || 'Unknown Item'}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{t.date}</div>
                                    </div>
                                    <div style={{ fontWeight: 600 }}>
                                        {t.type === 'IN' ? '+' : '-'}{t.quantity}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
