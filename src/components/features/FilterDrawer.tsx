import React from 'react';
import { X } from 'lucide-react';
import { Button } from '../common/Button';
import styles from './FilterDrawer.module.css';

interface FilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    filters: FilterState;
    onFilterChange: (key: keyof FilterState, value: any) => void;
    onClearFilters: () => void;
    counts: {
        types: Record<string, number>;
        locations: Record<string, number>;
        years: Record<string, number>;
        sizes: Record<string, number>;
    };
}

export interface FilterState {
    types: string[];
    locations: string[];
    years: string[];
    sizes: string[];
    status: string[]; // 'low', 'good'
}

type CheckboxGroupProps = {
    title: string;
    options: Record<string, number>;
    selected: string[];
    onChange: (value: string) => void;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({ title, options, selected, onChange }) => (
    <div className={styles.section}>
        <div className={styles.sectionTitle}>{title}</div>
        <div className={styles.optionsGrid}>
            {Object.entries(options).sort().map(([label, count]) => (
                <label key={label} className={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={selected.includes(label)}
                        onChange={() => onChange(label)}
                    />
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label || '(Blank)'}</span>
                    <span className={styles.countBadge}>{count}</span>
                </label>
            ))}
        </div>
    </div>
);

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
    isOpen,
    onClose,
    filters,
    onFilterChange,
    onClearFilters,
    counts
}) => {

    const toggleArrayItem = (key: keyof FilterState, item: string) => {
        const current = filters[key] as string[];
        const updated = current.includes(item)
            ? current.filter(i => i !== item)
            : [...current, item];
        onFilterChange(key, updated);
    };

    return (
        <>
            <div
                className={`${styles.overlay} ${isOpen ? styles.open : ''}`}
                onClick={onClose}
            />
            <div className={`${styles.drawer} ${isOpen ? styles.open : ''}`}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Filter Inventory</h2>
                    <Button variant="secondary" onClick={onClose} style={{ padding: '0.5rem', border: 'none' }}>
                        <X size={24} />
                    </Button>
                </div>

                <div className={styles.content}>
                    {/* Status Section */}
                    <div className={styles.section}>
                        <div className={styles.sectionTitle}>Stock Status</div>
                        <div className={styles.optionsGrid}>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    className={styles.checkbox}
                                    checked={filters.status.includes('low')}
                                    onChange={() => toggleArrayItem('status', 'low')}
                                />
                                <span>Low Stock</span>
                            </label>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    className={styles.checkbox}
                                    checked={filters.status.includes('good')}
                                    onChange={() => toggleArrayItem('status', 'good')}
                                />
                                <span>Good Stock</span>
                            </label>
                        </div>
                    </div>

                    <CheckboxGroup
                        title="Type"
                        options={counts.types}
                        selected={filters.types}
                        onChange={(item) => toggleArrayItem('types', item)}
                    />

                    <CheckboxGroup
                        title="Location"
                        options={counts.locations}
                        selected={filters.locations}
                        onChange={(item) => toggleArrayItem('locations', item)}
                    />

                    <CheckboxGroup
                        title="Year"
                        options={counts.years}
                        selected={filters.years}
                        onChange={(item) => toggleArrayItem('years', item)}
                    />

                    <CheckboxGroup
                        title="Size"
                        options={counts.sizes}
                        selected={filters.sizes}
                        onChange={(item) => toggleArrayItem('sizes', item)}
                    />
                </div>

                <div className={styles.footer}>
                    <Button variant="secondary" onClick={onClearFilters}>
                        Clear All
                    </Button>
                    <Button onClick={onClose}>
                        Show Results
                    </Button>
                </div>
            </div>
        </>
    );
};
