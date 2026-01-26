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

    const mapTxFromDB = (t: any): Transaction => ({
        id: t.id,
        itemId: t.itemid || t.itemId,
        type: t.type,
        date: t.date,
        quantity: t.quantity,
        balanceAfter: t.balanceafter || t.balanceAfter || 0,
        remarks: t.remarks,
        supplier: t.supplier,
        doNumber: t.donumber || t.doNumber,
        grnNumber: t.grnnumber || t.grnNumber,
        poNumber: t.ponumber || t.poNumber,
        qcStatus: t.qcstatus || t.qcStatus,
        mrrfNumber: t.mrrfnumber || t.mrrfNumber,
        jobOrderNumber: t.jobordernumber || t.jobOrderNumber,
        pic: t.pic,
        requestQty: t.requestqty || t.requestQty,
        returnQty: t.returnqty || t.returnQty
    });

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

    const toDBTx = (tx: Partial<Transaction>) => {
        const dbTx: any = {};
        if (tx.id) dbTx.id = tx.id;
        if (tx.itemId) dbTx.itemid = tx.itemId;
        if (tx.type) dbTx.type = tx.type;
        if (tx.date) dbTx.date = tx.date;
        if (tx.quantity !== undefined) dbTx.quantity = tx.quantity;
        if (tx.balanceAfter !== undefined) dbTx.balanceafter = tx.balanceAfter;
        if (tx.remarks) dbTx.remarks = tx.remarks;
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
        return dbTx;
    };

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
        const item = items.find((i) => i.id === newTx.itemId);
        if (!item) return;

        let newStock = item.currentStock;
        if (newTx.type === 'IN') {
            newStock += newTx.quantity;
        } else {
            newStock -= newTx.quantity;
        }

        const { error: itemError } = await supabase
            .from('items')
            .update({ currentstock: newStock, updatedat: new Date().toISOString() }) // Manual lowercasing here for simplicity or use helper
            .eq('id', item.id);

        if (itemError) {
            console.error('Error updating stock:', itemError);
            alert('Failed to update stock level.');
            return;
        }

        const transactionPayload = {
            ...newTx,
            balanceAfter: newStock,
        };

        const dbTx = toDBTx(transactionPayload);

        const { data, error: txError } = await supabase
            .from('transactions')
            .insert([dbTx])
            .select()
            .single();

        if (txError) {
            console.error('Error recording transaction:', txError);
            alert('Failed to record transaction.');
            return;
        }

        updateItem(item.id, { currentStock: newStock });
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
                deleteAllItems
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
