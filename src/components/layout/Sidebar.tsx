import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    ArrowDownToLine,
    ArrowUpFromLine,
    History,
    List,
    Moon,
    Sun,
    TrendingUp
} from 'lucide-react';
import styles from './Layout.module.css';
import { useTheme } from '../../context/ThemeContext';

const Sidebar: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
        isActive ? `${styles.navItem} ${styles.active}` : styles.navItem;

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <div className={styles.logoIcon}>
                    <TrendingUp size={24} color="var(--color-primary)" />
                </div>
                <span>WTK<span style={{ color: 'var(--color-primary)' }}>Stock</span></span>
            </div>

            <nav className={styles.nav}>
                <NavLink to="/" className={getNavLinkClass}>
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </NavLink>

                <NavLink to="/inventory" className={getNavLinkClass}>
                    <Package size={20} />
                    <span>Inventory List</span>
                </NavLink>

                <div className={styles.divider} />

                <NavLink to="/grn" className={getNavLinkClass}>
                    <ArrowDownToLine size={20} />
                    <span>Good Received (GRN)</span>
                </NavLink>

                <NavLink to="/mrrf" className={getNavLinkClass}>
                    <ArrowUpFromLine size={20} />
                    <span>Stock Out (MRRF)</span>
                </NavLink>

                <div className={styles.divider} />

                <NavLink to="/reports" className={getNavLinkClass}>
                    <History size={20} />
                    <span>Stock Cards</span>
                </NavLink>

                <NavLink to="/stock-list" className={getNavLinkClass}>
                    <List size={20} />
                    <span>Stock List</span>
                </NavLink>
            </nav>

            <div className={styles.footer}>
                <button
                    className={styles.logoutBtn}
                    onClick={toggleTheme}
                    title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                >
                    {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                    <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
