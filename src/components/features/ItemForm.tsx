import React, { useState, useEffect } from 'react';
import { type Item, type Unit } from '../../types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import styles from './Features.module.css';

interface ItemFormProps {
    initialData?: Item;
    onSubmit: (data: Omit<Item, 'id' | 'currentStock' | 'updatedAt'>) => void;
    onCancel: () => void;
}

export const ItemForm: React.FC<ItemFormProps> = ({ initialData, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        partNumber: '',
        location: '',
        size: '',
        type: '',
        year: '',
        unit: 'PCS' as Unit,
        minLevel: 0,
        description: '',
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                code: initialData.code,
                partNumber: initialData.partNumber,
                location: initialData.location,
                size: initialData.size,
                type: initialData.type,
                year: initialData.year,
                unit: initialData.unit,
                minLevel: initialData.minLevel,
                description: initialData.description || '',
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'minLevel' ? Number(value) : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGrid}>
                <Input
                    label="Material Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />
                <Input
                    label="Material Code"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    required
                />
                <Input
                    label="Part / Drg No."
                    name="partNumber"
                    value={formData.partNumber}
                    onChange={handleChange}
                />
                <Input
                    label="Location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                />
                <Input
                    label="Size"
                    name="size"
                    value={formData.size}
                    onChange={handleChange}
                />
                <Input
                    label="Type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                />
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Unit</label>
                    <select
                        name="unit"
                        value={formData.unit}
                        onChange={handleChange}
                        className={styles.select}
                    >
                        <option value="PCS">PCS</option>
                        <option value="SET">SET</option>
                        <option value="KG">KG</option>
                        <option value="M">M</option>
                        <option value="LTR">LTR</option>
                        <option value="BOX">BOX</option>
                    </select>
                </div>
                <Input
                    label="Min Stock Level"
                    name="minLevel"
                    type="number"
                    min="0"
                    value={formData.minLevel}
                    onChange={handleChange}
                />
                <Input
                    label="Year"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                />
            </div>

            <Input
                label="Description / Remarks"
                name="description"
                value={formData.description}
                onChange={handleChange}
            />

            <div className={styles.formActions}>
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit">
                    {initialData ? 'Update Item' : 'Create Item'}
                </Button>
            </div>
        </form>
    );
};
