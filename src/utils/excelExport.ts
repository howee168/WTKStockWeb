import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { Item, Transaction } from '../types';

/**
 * Generates an Excel Worksheet based on the specific "Material Stock Card" template.
 */
export async function generateStockCardWorkbook(item: Item, transactions: Transaction[]): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();

    // Sheet name constraints (max 31 chars, no special chars)
    let sheetName = item.code.substring(0, 31).replace(/[\\/?*[\]]/g, '');
    if (!sheetName) sheetName = `Item_${item.id.substring(0, 5)}`;

    const worksheet = workbook.addWorksheet(sheetName, {
        pageSetup: { paperSize: 9, orientation: 'portrait' }
    });

    // --- COLUMN SETUP ---
    worksheet.columns = [
        { width: 5 },   // A: No.
        { width: 12 },  // B: Date
        { width: 8 },   // C: In
        { width: 8 },   // D: Out
        { width: 10 },  // E: Balance
        { width: 33 },  // F: Remarks (main)
        { width: 2 }    // G: Remarks (padding for border edges)
    ];

    // --- CONSTANTS ---
    const BORDER = {
        top: { style: 'thin' as ExcelJS.BorderStyle },
        left: { style: 'thin' as ExcelJS.BorderStyle },
        bottom: { style: 'thin' as ExcelJS.BorderStyle },
        right: { style: 'thin' as ExcelJS.BorderStyle }
    };

    const BOLD_CENTER = { font: { bold: true }, alignment: { horizontal: 'center' as const, vertical: 'middle' as const } };
    const BOLD_LEFT = { font: { bold: true }, alignment: { horizontal: 'left' as const, vertical: 'middle' as const } };
    const NORMAL_LEFT = { font: { bold: false }, alignment: { horizontal: 'left' as const, vertical: 'middle' as const } };
    const NORMAL_CENTER = { font: { bold: false }, alignment: { horizontal: 'center' as const, vertical: 'middle' as const } };

    // --- ROW 1: WTK Technologies ---
    worksheet.mergeCells('A1:G1');
    const r1 = worksheet.getCell('A1');
    r1.value = 'WTK Technologies (M) Sdn. Bhd.';
    r1.font = { name: 'Times New Roman', size: 16, bold: true };
    r1.alignment = { horizontal: 'center', vertical: 'middle' };

    // Add border to outer header block manually (Row 1 to 8)
    for (let r = 1; r <= 8; r++) {
        for (let c = 1; c <= 7; c++) {
            worksheet.getCell(r, c).border = BORDER;
        }
    }

    // --- ROW 2-3: Material Stock Card & Rev Info ---
    worksheet.mergeCells('A2:C3');
    const r2Title = worksheet.getCell('A2');
    r2Title.value = 'Material Stock Card';
    r2Title.font = { name: 'Times New Roman', size: 14, bold: true };
    r2Title.alignment = { horizontal: 'center', vertical: 'middle' };

    // Row 2 Rev No
    worksheet.mergeCells('D2:E2');
    worksheet.getCell('D2').value = 'Rev. No.';
    worksheet.getCell('D2').font = BOLD_LEFT.font;
    worksheet.getCell('F2').value = ':';
    worksheet.getCell('G2').value = '0';
    worksheet.getCell('G2').alignment = BOLD_CENTER.alignment;
    worksheet.getCell('G2').font = BOLD_CENTER.font;

    // Row 3 Date
    worksheet.mergeCells('D3:E3');
    worksheet.getCell('D3').value = 'Date';
    worksheet.getCell('D3').font = BOLD_LEFT.font;
    worksheet.getCell('F3').value = ':';
    worksheet.getCell('G3').value = '3rd Jan, 2006'; // Static as per template? Or current? Keeping static to match template
    worksheet.getCell('G3').alignment = BOLD_CENTER.alignment;
    worksheet.getCell('G3').font = BOLD_CENTER.font;

    // --- ROW 4: Document Control ---
    worksheet.mergeCells('A4:C4');
    const r4Left = worksheet.getCell('A4');
    r4Left.value = 'WTK-PD-002';
    r4Left.font = { bold: true };
    r4Left.alignment = { horizontal: 'right', vertical: 'middle' };

    worksheet.mergeCells('D4:E4');
    worksheet.getCell('D4').value = 'Page';
    worksheet.getCell('D4').font = BOLD_LEFT.font;
    worksheet.getCell('F4').value = ':';
    worksheet.getCell('G4').value = '1 of 1'; // Dynamic page count could be complex without knowing total rows, keeping simple
    worksheet.getCell('G4').alignment = BOLD_CENTER.alignment;
    worksheet.getCell('G4').font = BOLD_CENTER.font;

    // --- ROW 5: Location & S/C No ---
    worksheet.getCell('A5').value = 'Location :';
    worksheet.getCell('A5').font = BOLD_LEFT.font;
    worksheet.mergeCells('B5:C5');
    worksheet.getCell('B5').value = item.location || '';
    worksheet.getCell('B5').font = BOLD_LEFT.font;

    worksheet.mergeCells('D5:E5');
    worksheet.getCell('D5').value = 'S/C No. :';
    worksheet.getCell('D5').font = BOLD_LEFT.font;
    worksheet.mergeCells('F5:G5');
    worksheet.getCell('F5').value = ''; // Map to relevant property later if exist

    // --- ROW 6: Mat. Name & Mat. Code ---
    worksheet.getCell('A6').value = 'Mat. Name :';
    worksheet.getCell('A6').font = BOLD_LEFT.font;
    worksheet.mergeCells('B6:C6');
    worksheet.getCell('B6').value = item.name;
    worksheet.getCell('B6').font = BOLD_LEFT.font;

    worksheet.mergeCells('D6:E6');
    worksheet.getCell('D6').value = 'Mat. Code :';
    worksheet.getCell('D6').font = BOLD_LEFT.font;
    worksheet.mergeCells('F6:G6');
    worksheet.getCell('F6').value = item.code;
    worksheet.getCell('F6').font = BOLD_LEFT.font;

    // --- ROW 7: Die No & Type ---
    worksheet.getCell('A7').value = 'Die No:';
    worksheet.getCell('A7').font = BOLD_LEFT.font;
    worksheet.mergeCells('B7:C7');
    worksheet.getCell('B7').value = item.partNumber || ''; // Assuming part number is Die No 

    worksheet.mergeCells('D7:E7');
    worksheet.getCell('D7').value = 'Type :';
    worksheet.getCell('D7').font = BOLD_LEFT.font;
    worksheet.mergeCells('F7:G7');

    // --- ROW 8: Size & Year ---
    worksheet.getCell('A8').value = 'Size :';
    worksheet.getCell('A8').font = BOLD_LEFT.font;
    worksheet.mergeCells('B8:C8');

    worksheet.mergeCells('D8:E8');
    worksheet.getCell('D8').value = 'Year :';
    worksheet.getCell('D8').font = BOLD_LEFT.font;
    worksheet.mergeCells('F8:G8');
    // Default to current year or based on transactions
    const year = transactions.length > 0 && transactions[0].date ? transactions[0].date.substring(0, 4) : new Date().getFullYear();
    worksheet.getCell('F8').value = year;
    worksheet.getCell('F8').alignment = BOLD_CENTER.alignment;

    // --- ROW 9: Table Headers ---
    const headers = ['No.', 'Date', 'In', 'Out', 'Balance', 'Remarks'];
    worksheet.getRow(9).height = 20;

    headers.forEach((h, i) => {
        let titleCell;
        if (h === 'Remarks') {
            worksheet.mergeCells('F9:G9');
            titleCell = worksheet.getCell('F9');
        } else {
            titleCell = worksheet.getCell(9, i + 1);
        }

        titleCell.value = h;
        titleCell.font = BOLD_CENTER.font;
        titleCell.alignment = BOLD_CENTER.alignment;

        // Ensure merged borders have complete borders
        if (h === 'Remarks') {
            worksheet.getCell('F9').border = BORDER;
            worksheet.getCell('G9').border = BORDER;
        } else {
            worksheet.getCell(9, i + 1).border = BORDER;
        }
    });

    // --- ROW 10+: Transactions Data ---
    let currentRow = 10;

    // Add opening balance if needed based on the first record? 
    // Usually handled elsewhere, but let's just dump the transactions.

    transactions.forEach((t, i) => {

        // No.
        worksheet.getCell(`A${currentRow}`).value = i + 1;
        worksheet.getCell(`A${currentRow}`).alignment = NORMAL_CENTER.alignment;

        // Date (formatting DD/MM)
        let dateDisplay = t.date;
        if (t.date) {
            const parts = t.date.split('-');
            if (parts.length === 3) dateDisplay = `${parts[2]}/${parts[1]}`; // DD/MM format like in picture
        }
        worksheet.getCell(`B${currentRow}`).value = dateDisplay;
        worksheet.getCell(`B${currentRow}`).alignment = NORMAL_CENTER.alignment;

        // In
        worksheet.getCell(`C${currentRow}`).value = t.type === 'IN' ? t.quantity : '';
        worksheet.getCell(`C${currentRow}`).alignment = NORMAL_CENTER.alignment;

        // Out
        worksheet.getCell(`D${currentRow}`).value = t.type === 'OUT' ? t.quantity : '';
        worksheet.getCell(`D${currentRow}`).alignment = NORMAL_CENTER.alignment;

        // Balance
        worksheet.getCell(`E${currentRow}`).value = t.balanceAfter;
        worksheet.getCell(`E${currentRow}`).alignment = NORMAL_CENTER.alignment;

        // Remarks (Merge F&G)
        worksheet.mergeCells(`F${currentRow}:G${currentRow}`);
        const refInfo = t.type === 'IN' ? t.grnNumber : t.mrrfNumber;
        worksheet.getCell(`F${currentRow}`).value = `${t.remarks || ''} ${refInfo ? `(${refInfo})` : ''}`.trim();
        worksheet.getCell(`F${currentRow}`).alignment = NORMAL_LEFT.alignment;

        // Apply borders
        for (let c = 1; c <= 7; c++) {
            worksheet.getCell(currentRow, c).border = BORDER;
        }

        currentRow++;
    });

    // --- Footer: Latest Balance ---
    worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
    const latestCell = worksheet.getCell(`A${currentRow}`);
    latestCell.value = 'Latest Balance';
    latestCell.alignment = { horizontal: 'center', vertical: 'middle' };

    const finalBalance = transactions.length > 0 ? transactions[transactions.length - 1].balanceAfter : item.currentStock;
    worksheet.getCell(`E${currentRow}`).value = finalBalance;
    worksheet.getCell(`E${currentRow}`).alignment = NORMAL_CENTER.alignment;

    worksheet.mergeCells(`F${currentRow}:G${currentRow}`);

    // Apply borders to footer
    for (let c = 1; c <= 7; c++) {
        worksheet.getCell(currentRow, c).border = BORDER;
    }

    return workbook;
}

/**
 * Trigger browser download of an ExcelJS workbook.
 */
export async function downloadWorkbook(workbook: ExcelJS.Workbook, filename: string) {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, filename);
}
