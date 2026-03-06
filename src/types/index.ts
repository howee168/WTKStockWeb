export type Unit = 'PCS' | 'SET' | 'KG' | 'M' | 'LTR' | 'BOX';

export interface Item {
    id: string; // Unique ID
    name: string; // Mat. Name
    code: string; // Mat. Code
    partNumber: string; // Part / Drg No.
    location: string; // Location
    size: string; // Size
    type: string; // Type
    year: string; // Year
    unit: Unit;
    minLevel: number;
    currentStock: number;
    description?: string;
    updatedAt: string;
}

export type TransactionType = 'IN' | 'OUT';

export interface Transaction {
    id: string;
    itemId?: string; // Reference to Item (Optional for Demo Manual Entry)
    type: TransactionType;
    date: string; // ISO String
    quantity: number;
    balanceAfter: number;
    remarks?: string;

    // Specific to GRN (Stock In)
    supplier?: string;
    doNumber?: string; // D/O No.
    grnNumber?: string; // GRN No.
    poNumber?: string;
    qcStatus?: 'OK' | 'NG';

    // Specific to MRRF (Stock Out)
    mrrfNumber?: string; // MRRF No.
    jobOrderNumber?: string; // Job Order No.
    pic?: string; // PIC
    requestQty?: number;
    returnQty?: number;

    // Demo Tracking (These specific fields need to be explicitly typed for TS)
    isDemo?: boolean;
    demoStatus?: 'PENDING' | 'RETURNED';
    demoReturnDate?: string;
    demoFeedback?: string;
    demoItemName?: string; // For manual entry without inventory link
    customerPhone?: string; // For WhatsApp notifications
}
