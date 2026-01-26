import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, FileSpreadsheet, Filter } from 'lucide-react';
import { useInventory } from '../../hooks';
import { type Item } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Table, type Column } from '../common/Table';
import { Modal } from '../common/Modal';
import { ImportModal } from '../common/ImportModal';
import { ItemForm } from './ItemForm';
import { FilterDrawer, type FilterState } from './FilterDrawer';
import styles from './Features.module.css';

const InventoryList: React.FC = () => {
    const { items, addItem, updateItem, deleteItem, deleteAllItems } = useInventory();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');

    // Sort State
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Filter State
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        types: [],
        locations: [],
        years: [],
        sizes: [],
        status: []
    });

    // Compute Counts for Facets
    const facetCounts = useMemo(() => {
        const counts = {
            types: {} as Record<string, number>,
            locations: {} as Record<string, number>,
            years: {} as Record<string, number>,
            sizes: {} as Record<string, number>
        };

        items.forEach(item => {
            if (item.type) counts.types[item.type] = (counts.types[item.type] || 0) + 1;
            if (item.location) counts.locations[item.location] = (counts.locations[item.location] || 0) + 1;
            if (item.year) counts.years[item.year] = (counts.years[item.year] || 0) + 1;
            if (item.size) counts.sizes[item.size] = (counts.sizes[item.size] || 0) + 1;
        });

        return counts;
    }, [items]);

    const activeFilterCount = useMemo(() => {
        return filters.types.length + filters.locations.length + filters.years.length + filters.sizes.length + filters.status.length;
    }, [filters]);

    const handleFilterChange = (key: keyof FilterState, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleClearFilters = () => {
        setFilters({
            types: [],
            locations: [],
            years: [],
            sizes: [],
            status: []
        });
    };

    const handleClearAll = async () => {
        if (confirm('DANGER: This will delete ALL items and transactions. This action cannot be undone. Are you sure?')) {
            if (confirm('Please confirm AGAIN: Do you strictly want to WIPE all data?')) {
                await deleteAllItems();
                alert('All data has been cleared.');
            }
        }
    };

    const handleAddNew = () => {
        setEditingItem(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (item: Item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this item?')) {
            deleteItem(id);
        }
    };

    const handleSubmit = (data: Omit<Item, 'id' | 'currentStock' | 'updatedAt'>) => {
        if (editingItem) {
            updateItem(editingItem.id, data);
        } else {
            addItem(data);
        }
        setIsModalOpen(false);
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredAndSortedItems = useMemo(() => {
        let result = items.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.partNumber.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (sortConfig) {
            result.sort((a, b) => {
                const aValue = a[sortConfig.key as keyof Item];
                const bValue = b[sortConfig.key as keyof Item];

                // Handle null/undefined
                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return result;
    }, [items, searchTerm, sortConfig]);

    const columns: Column<Item>[] = [
        { header: 'Code', accessor: 'code', width: '120px', sortable: true },
        { header: 'Name', accessor: 'name', sortable: true },
        { header: 'Part No.', accessor: 'partNumber', sortable: true },
        { header: 'Location', accessor: 'location', width: '120px', sortable: true },
        {
            header: 'Stock',
            accessor: (item: Item) => (
                <span style={{
                    fontWeight: 600,
                    color: item.currentStock <= item.minLevel ? 'var(--color-danger)' : 'inherit',
                    whiteSpace: 'nowrap'
                }}>
                    {item.currentStock} {item.unit}
                </span>
            ),
            width: '120px',
            sortable: true,
            sortKey: 'currentStock'
        },
        {
            header: 'Actions',
            accessor: (item: Item) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                        variant="secondary"
                        onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                        title="Edit Item"
                    >
                        <Edit2 size={20} />
                    </Button>
                    <Button
                        variant="secondary"
                        style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger-subtle)' }}
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                        title="Delete Item"
                    >
                        <Trash2 size={20} />
                    </Button>
                </div>
            ),
            width: '120px'
        }
    ];

    return (
        <div className={styles.pageContainer}>
            <div className={styles.header}>
                <h1 className={styles.title}>Inventory List</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="secondary" icon={<FileSpreadsheet size={18} />} onClick={() => setIsImportModalOpen(true)}>
                        Import Excel
                    </Button>
                    <Button variant="danger" icon={<Trash2 size={18} />} onClick={handleClearAll} style={{ backgroundColor: '#dc2626', color: 'white', borderColor: '#dc2626' }}>
                        Clear All
                    </Button>
                    <Button icon={<Plus size={18} />} onClick={handleAddNew}>
                        Add New Item
                    </Button>
                </div>
            </div>

            <Card>
                <div style={{ paddingBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', position: 'relative' }}>
                    <Input
                        placeholder="Search by Name, Code, Part No..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ maxWidth: '400px', flex: 1 }}
                    />
                    <Button
                        variant="secondary"
                        icon={<Filter size={18} />}
                        onClick={() => setIsFilterOpen(true)}
                        style={{
                            whiteSpace: 'nowrap',
                            minWidth: 'fit-content',
                            ...(activeFilterCount > 0 ? {
                                borderColor: 'var(--color-primary)',
                                color: 'var(--color-primary)',
                                backgroundColor: 'var(--color-primary-light)'
                            } : {})
                        }}
                    >
                        Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
                    </Button>
                </div>
                <Table
                    data={filteredAndSortedItems}
                    columns={columns}
                    onRowClick={handleEdit}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                />
            </Card>

            <FilterDrawer
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                counts={facetCounts}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingItem ? 'Edit Item' : 'Add New Item'}
            >
                <ItemForm
                    initialData={editingItem}
                    onSubmit={handleSubmit}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
            />
        </div>
    );
};

export default InventoryList;
