import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Item, Transaction } from '../types';
import { supabase } from '../lib/supabase';

interface InventoryContextType {
    items: Item[];
    transactions: Transaction[];
    loading: boolean;
    addItem: (item: Omit<Item, 'id' | 'currentStock' | 'updatedAt'>) => Promise<void>;
    updateItem: (id: string, updates: Partial<Item>) => Promise<void>;
    deleteItem: (id: string) => Promise<void>;
    addTransaction: (transaction: Omit<Transaction, 'id' | 'balanceAfter'>) => Promise<void>;
    getItem: (id: string) => Item | undefined;
    batchImportItems: (items: Item[]) => Promise<void>;
    deleteAllItems: () => Promise<void>;
    updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<Item[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const mapItemFromDB = (i: any): Item => ({
        id: i.id,
        name: i.name,
        code: i.code,
        partNumber: i.partnumber || i.partNumber || '',
        location: i.location,
        size: i.size,
        type: i.type,
        year: i.year,
        unit: i.unit,
        minLevel: i.minlevel || i.minLevel || 0,
        currentStock: i.currentstock || i.currentStock || 0,
        description: i.description,
        updatedAt: i.updatedat || i.updatedAt || new Date().toISOString()
    });

    const mapTxFromDB = (t: any): Transaction => {
        // Parse metadata from remarks if present
        let cleanRemarks = t.remarks || '';
        let metadata: any = {};

        if (cleanRemarks.includes('|||JSON|||')) {
            const parts = cleanRemarks.split('|||JSON|||');
            cleanRemarks = parts[0];
            try {
                metadata = JSON.parse(parts[1]);
            } catch (e) {
                console.error('Failed to parse metadata from remarks', e);
            }
        }

        return {
            id: t.id,
            itemId: t.itemid || t.itemId,
            type: t.type,
            date: t.date,
            quantity: t.quantity,
            balanceAfter: t.balanceafter || t.balanceAfter || 0,
            remarks: cleanRemarks,
            supplier: t.supplier,
            doNumber: t.donumber || t.doNumber,
            grnNumber: t.grnnumber || t.grnNumber,
            poNumber: t.ponumber || t.poNumber,
            qcStatus: t.qcstatus || t.qcStatus,
            mrrfNumber: t.mrrfnumber || t.mrrfNumber,
            jobOrderNumber: t.jobordernumber || t.jobOrderNumber,
            pic: t.pic,
            requestQty: t.requestqty || t.requestQty,
            returnQty: t.returnqty || t.returnQty,

            // Demo - from metadata
            isDemo: metadata.isDemo || t.is_demo || t.isDemo,
            demoStatus: metadata.demoStatus || t.demo_status || t.demoStatus,
            demoReturnDate: metadata.demoReturnDate || t.demo_return_date || t.demoReturnDate,
            demoFeedback: metadata.demoFeedback || t.demo_feedback || t.demoFeedback,
            demoItemName: metadata.demoItemName || t.demo_item_name || t.demoItemName,
            customerPhone: metadata.customerPhone // Phone number for notifications
        };
    };

    // Helper to map keys to lowercase for DB
    const toDBItem = (item: Partial<Item>) => {
        const dbItem: any = {};
        if (item.id) dbItem.id = item.id;
        if (item.name) dbItem.name = item.name;
        if (item.code) dbItem.code = item.code;
        if (item.partNumber) dbItem.partnumber = item.partNumber;
        if (item.location) dbItem.location = item.location;
        if (item.size) dbItem.size = item.size;
        if (item.type) dbItem.type = item.type;
        if (item.year) dbItem.year = item.year;
        if (item.unit) dbItem.unit = item.unit;
        if (item.minLevel !== undefined) dbItem.minlevel = item.minLevel;
        if (item.currentStock !== undefined) dbItem.currentstock = item.currentStock;
        if (item.description) dbItem.description = item.description;
        if (item.updatedAt) dbItem.updatedat = item.updatedAt;
        return dbItem;
    };

    // Helper to package transaction for DB (including metadata stuffing)
    const prepareDBPayload = (tx: Partial<Transaction>) => {
        const dbTx: any = {};
        if (tx.id) dbTx.id = tx.id;
        if (tx.itemId) dbTx.itemid = tx.itemId;
        if (tx.type) dbTx.type = tx.type;
        if (tx.date) dbTx.date = tx.date;
        if (tx.quantity !== undefined) dbTx.quantity = tx.quantity;
        if (tx.balanceAfter !== undefined) dbTx.balanceafter = tx.balanceAfter;

        // Pack metadata into remarks
        const metadata = {
            isDemo: tx.isDemo,
            demoStatus: tx.demoStatus,
            demoReturnDate: tx.demoReturnDate,
            demoFeedback: tx.demoFeedback,
            demoItemName: tx.demoItemName,
            customerPhone: tx.customerPhone
        };

        // Remove undefined keys from metadata
        Object.keys(metadata).forEach(key => (metadata as any)[key] === undefined && delete (metadata as any)[key]);

        const hasMetadata = Object.keys(metadata).length > 0;
        const cleanRemarks = tx.remarks || '';

        if (hasMetadata) {
            dbTx.remarks = `${cleanRemarks}|||JSON|||${JSON.stringify(metadata)}`;
        } else {
            dbTx.remarks = cleanRemarks;
        }

        if (tx.supplier) dbTx.supplier = tx.supplier;
        if (tx.doNumber) dbTx.donumber = tx.doNumber;
        if (tx.grnNumber) dbTx.grnnumber = tx.grnNumber;
        if (tx.poNumber) dbTx.ponumber = tx.poNumber;
        if (tx.qcStatus) dbTx.qcstatus = tx.qcStatus;
        if (tx.mrrfNumber) dbTx.mrrfnumber = tx.mrrfNumber;
        if (tx.jobOrderNumber) dbTx.jobordernumber = tx.jobOrderNumber;
        if (tx.pic) dbTx.pic = tx.pic;
        if (tx.requestQty !== undefined) dbTx.requestqty = tx.requestQty;
        if (tx.returnQty !== undefined) dbTx.returnqty = tx.returnQty;

        // DO NOT send these flat fields if they don't exist in DB
        // keeping them commented out for reference or if DB is updated later
        /*
        if (tx.isDemo !== undefined) dbTx.is_demo = tx.isDemo;
        if (tx.demoStatus) dbTx.demo_status = tx.demoStatus;
        if (tx.demoReturnDate) dbTx.demo_return_date = tx.demoReturnDate;
        if (tx.demoFeedback) dbTx.demo_feedback = tx.demoFeedback;
        if (tx.demoItemName) dbTx.demo_item_name = tx.demoItemName;
        */

        return dbTx;
    };

    const toDBTx = (tx: Partial<Transaction>) => prepareDBPayload(tx); // Compatibility wrapper

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: itemsData, error: itemsError } = await supabase.from('items').select('*');
            if (itemsError) throw itemsError;

            const { data: txData, error: txError } = await supabase.from('transactions').select('*').order('date', { ascending: false });
            if (txError) throw txError;

            setItems((itemsData || []).map(mapItemFromDB));
            setTransactions((txData || []).map(mapTxFromDB));

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const addItem = async (newItem: Omit<Item, 'id' | 'currentStock' | 'updatedAt'>) => {
        const item = {
            ...newItem,
            currentStock: 0,
            updatedAt: new Date().toISOString(),
        };

        const dbPayload = toDBItem(item);

        const { data, error } = await supabase.from('items').insert([dbPayload]).select().single();

        if (error) {
            console.error('Error adding item:', error);
            alert(`Failed to add item: ${error.message}`);
            return;
        }

        setItems((prev) => [...prev, mapItemFromDB(data)]);
    };

    const updateItem = async (id: string, updates: Partial<Item>) => {
        const payload = toDBItem({ ...updates, updatedAt: new Date().toISOString() });

        const { error } = await supabase
            .from('items')
            .update(payload)
            .eq('id', id);

        if (error) {
            console.error('Error updating item:', error);
            alert(`Failed to update item: ${error.message}`);
            return;
        }

        setItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
            )
        );
    };

    const deleteItem = async (id: string) => {
        const { error } = await supabase.from('items').delete().eq('id', id);

        if (error) {
            console.error('Error deleting item:', error);
            alert('Failed to delete item from cloud.');
            return;
        }

        setItems((prev) => prev.filter((item) => item.id !== id));
    };

    const getItem = (id: string) => items.find((i) => i.id === id);

    const addTransaction = async (newTx: Omit<Transaction, 'id' | 'balanceAfter'>) => {
        // If it's a demo unit with no itemId (manual entry), skip item update
        const item = newTx.itemId ? items.find((i) => i.id === newTx.itemId) : undefined;

        let newStock = 0;

        if (item) {
            newStock = item.currentStock;
            if (newTx.type === 'IN') {
                newStock += newTx.quantity;
            } else {
                newStock -= newTx.quantity;
            }

            const { error: itemError } = await supabase
                .from('items')
                .update({ currentstock: newStock, updatedat: new Date().toISOString() })
                .eq('id', item.id);

            if (itemError) {
                console.error('Error updating stock:', itemError);
                alert('Failed to update stock level.');
                return;
            }
        }

        // If no item found and no itemId provided (Manual Demo), we MUST assign it to a placeholder item
        // to satisfy DB foreign key constraints (assuming itemid is NOT NULL).
        let finalItemId = newTx.itemId || item?.id;

        if (!finalItemId) {
            // Check for existing placeholder
            const placeholderCode = 'DEMO-MANUAL';
            let placeholderItem = items.find(i => i.code === placeholderCode);

            if (!placeholderItem) {
                // Create it
                const newItem = {
                    name: 'Manual Demo Tracking Placeholder',
                    code: placeholderCode,
                    partNumber: 'N/A',
                    location: 'Virtual',
                    size: 'N/A',
                    type: 'Virtual',
                    year: new Date().getFullYear().toString(),
                    unit: 'PCS' as const,
                    minLevel: 0,
                    currentStock: 0,
                    description: 'System item for tracking manual demos',
                    updatedAt: new Date().toISOString()
                };

                const dbItem = toDBItem(newItem);
                const { data: createdItem, error: createError } = await supabase.from('items').insert([dbItem]).select().single();

                if (createError) {
                    console.error('Error creating placeholder item:', createError);
                    alert('Failed to initialize demo tracking system.');
                    return;
                }

                setItems(prev => [...prev, mapItemFromDB(createdItem)]);
                placeholderItem = mapItemFromDB(createdItem);
            }
            finalItemId = placeholderItem.id;
        }

        const transactionPayload = {
            ...newTx,
            itemId: finalItemId,
            balanceAfter: item ? newStock : 0, // No balance tracking for manual demo items
        };

        // Use prepareDBPayload to bundle metadata
        const dbTx = prepareDBPayload(transactionPayload);

        const { data, error: txError } = await supabase
            .from('transactions')
            .insert([dbTx])
            .select()
            .single();

        if (txError) {
            console.error('Error recording transaction:', txError);
            alert(`Failed to record transaction: ${txError.message}`);
            return;
        }

        if (item) {
            updateItem(item.id, { currentStock: newStock });
        }
        setTransactions((prev) => [mapTxFromDB(data), ...prev]);
    };

    const batchImportItems = async (newItems: Item[]) => {
        const dbItems = newItems.map(toDBItem);

        const { data, error: itemsError } = await supabase
            .from('items')
            .insert(dbItems)
            .select();

        if (itemsError) {
            console.error('Batch import failed:', itemsError);
            alert('Failed to import items.');
            return;
        }

        if (data) {
            // Map returned items to internal format (though we track items by ID usually, here we just need them for transactions)
            const insertedItems = data.map(mapItemFromDB);

            const newTransactions = insertedItems
                .filter(item => item.currentStock > 0)
                .map(item => ({
                    itemId: item.id,
                    type: 'IN',
                    date: new Date().toISOString(),
                    quantity: item.currentStock,
                    balanceAfter: item.currentStock,
                    remarks: 'Imported Opening Balance',
                    supplier: 'Import',
                    qcStatus: 'OK'
                } as Transaction));

            if (newTransactions.length > 0) {
                const dbTxList = newTransactions.map(toDBTx);
                const { error: txError } = await supabase
                    .from('transactions')
                    .insert(dbTxList);

                if (txError) {
                    console.error('Failed to import opening balances:', txError);
                }
            }

            fetchData();
        }
    };

    const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
        // Must fetch existing transaction to merge remarks/metadata correctly
        const existingTx = transactions.find(t => t.id === id);
        if (!existingTx) return;

        const merged = { ...existingTx, ...updates };
        const dbTx = prepareDBPayload(merged);

        const { error } = await supabase
            .from('transactions')
            .update(dbTx)
            .eq('id', id);

        if (error) {
            console.error('Error updating transaction:', error);
            alert(`Failed to update transaction: ${error.message}`);
            return;
        }

        setTransactions(prev =>
            prev.map(tx => (tx.id === id ? { ...tx, ...updates } : tx))
        );
    };

    const deleteTransaction = async (id: string) => {
        const { error } = await supabase.from('transactions').delete().eq('id', id);

        if (error) {
            console.error('Error deleting transaction:', error);
            alert('Failed to delete transaction.');
            return;
        }

        setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    };

    const deleteAllItems = async () => {
        try {
            setLoading(true);
            // Delete all transactions first
            const { error: txErr } = await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');

            if (txErr) {
                console.error("Error clearing transactions", txErr);
                // Continue? No.
            }

            const { error: itemErr } = await supabase.from('items').delete().neq('id', '00000000-0000-0000-0000-000000000000');

            if (itemErr) throw itemErr;

            setItems([]);
            setTransactions([]);
        } catch (err) {
            console.error("Failed to delete all data:", err);
            alert("Failed to clear data.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <InventoryContext.Provider
            value={{
                items,
                transactions,
                loading,
                addItem,
                updateItem,
                deleteItem,
                addTransaction,
                getItem,
                batchImportItems,
                deleteAllItems,
                updateTransaction,
                deleteTransaction
            }}
        >
            {children}
        </InventoryContext.Provider>
    );
};

export const useInventory = () => {
    const context = useContext(InventoryContext);
    if (!context) {
        throw new Error('useInventory must be used within an InventoryProvider');
    }
    return context;
};
