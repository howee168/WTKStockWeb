
// Mocking the context logic to find the bug
const crypto = { randomUUID: () => "mock-uuid-" + Math.random() };

let items = [];
let transactions = [];

function setItems(callback) {
    if (typeof callback === 'function') {
        items = callback(items);
    } else {
        items = callback;
    }
    console.log("Items Updated:", JSON.stringify(items, null, 2));
}

function setTransactions(callback) {
    if (typeof callback === 'function') {
        transactions = callback(transactions);
    } else {
        transactions = callback;
    }
}

const addItem = (newItem) => {
    const item = {
        ...newItem,
        id: crypto.randomUUID(),
        currentStock: 0,
        updatedAt: new Date().toISOString(),
    };
    setItems((prev) => [...prev, item]);
    return item.id;
};

const updateItem = (id, updates) => {
    console.log(`Updating item ${id} with`, updates);
    setItems((prev) =>
        prev.map((item) =>
            item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
        )
    );
};

const addTransaction = (newTx) => {
    const item = items.find((i) => i.id === newTx.itemId);
    if (!item) {
        console.error("Item not found for transaction!");
        return;
    }

    // Calculate new stock
    let newStock = item.currentStock;
    console.log(`Current Stock: ${newStock} (${typeof newStock})`);
    console.log(`Tx Quantity: ${newTx.quantity} (${typeof newTx.quantity})`);

    if (newTx.type === 'IN') {
        newStock += newTx.quantity;
    } else {
        newStock -= newTx.quantity;
    }

    console.log(`New Stock: ${newStock} (${typeof newStock})`);

    // Update item stock
    updateItem(item.id, { currentStock: newStock });

    // Add transaction record
    const transaction = {
        ...newTx,
        id: crypto.randomUUID(),
        balanceAfter: newStock,
    };

    setTransactions((prev) => [transaction, ...prev]);
};

// Simulation
console.log("--- Step 1: Add Item ---");
const itemId = addItem({
    name: "Test Widget",
    code: "TW-001",
    partNumber: "P-100",
    location: "A1",
    size: "small",
    unit: "PCS",
    minLevel: 10
});

console.log("--- Step 2: GRN (Stock In) ---");
addTransaction({
    itemId: itemId,
    type: 'IN',
    date: new Date().toISOString(),
    quantity: 50,
    supplier: 'Supplier',
    doNumber: 'DO1',
    grnNumber: 'GRN1',
    balanceAfter: 0 // Mock placeholder
});

console.log("--- Step 3: MRRF (Stock Out) ---");
addTransaction({
    itemId: itemId,
    type: 'OUT',
    date: new Date().toISOString(),
    quantity: 5,
    mrrfNumber: 'MRRF1',
    jobOrderNumber: 'JO1',
    pic: 'John',
    requestQty: 5,
    remarks: 'Test'
});

console.log("--- Final Check ---");
const finalItem = items.find(i => i.id === itemId);
console.log("Final Item:", finalItem);

if (finalItem.currentStock !== 45) {
    console.error("FAIL: Balance is wrong");
} else {
    console.log("PASS: Balance is correct");
}

if (!finalItem.name) {
    console.error("FAIL: Name is missing!");
}
if (!finalItem.code) {
    console.error("FAIL: Code is missing!");
}
