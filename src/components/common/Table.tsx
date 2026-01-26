import React from 'react';
import styles from './Common.module.css';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    width?: string;
    className?: string;
    cellStyle?: (item: T) => React.CSSProperties;
    align?: 'left' | 'center' | 'right';
    sortable?: boolean;
    sortKey?: string;
}

interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (item: T) => void;
    className?: string;
    renderRow?: (item: T, columns: Column<T>[], index: number) => React.ReactNode;
    sortConfig?: { key: string; direction: 'asc' | 'desc' } | null;
    onSort?: (key: string) => void;
}

export const Table = <T extends { id: string | number }>({
    data,
    columns,
    onRowClick,
    className,
    renderRow,
    sortConfig,
    onSort
}: TableProps<T>) => {
    return (
        <div className={`${styles.tableContainer} ${className || ''}`}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        {columns.map((col, idx) => {
                            const sortKey = col.sortKey || (typeof col.accessor === 'string' ? col.accessor as string : undefined);
                            return (
                                <th
                                    key={idx}
                                    style={{
                                        width: col.width,
                                        textAlign: col.align || 'left',
                                        cursor: col.sortable ? 'pointer' : 'default',
                                        userSelect: 'none'
                                    }}
                                    className={styles.th}
                                    onClick={() => col.sortable && onSort && sortKey && onSort(sortKey)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: col.align === 'center' ? 'center' : (col.align === 'right' ? 'flex-end' : 'flex-start'), gap: '4px' }}>
                                        {col.header}
                                        {sortConfig && sortKey && sortConfig.key === sortKey && (
                                            sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                        )}
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className={styles.emptyState}>
                                No records found.
                            </td>
                        </tr>
                    ) : (
                        data.map((item, index) => {
                            if (renderRow) {
                                const customRow = renderRow(item, columns, index);
                                if (customRow) return customRow;
                            }

                            return (
                                <tr
                                    key={item.id}
                                    className={onRowClick ? styles.clickableRow : ''}
                                    onClick={() => onRowClick && onRowClick(item)}
                                >
                                    {columns.map((col, idx) => (
                                        <td
                                            key={idx}
                                            className={`${styles.td} ${col.className || ''}`}
                                            style={{
                                                textAlign: col.align || 'left',
                                                ...(col.cellStyle ? col.cellStyle(item) : {})
                                            }}
                                        >
                                            {typeof col.accessor === 'function'
                                                ? col.accessor(item)
                                                : (item[col.accessor] as React.ReactNode)}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
};
