import React, { useState, useMemo, useEffect } from 'react';
import { useContent } from '../../contexts/ContentContext';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { CollectionRecord, DonationRecord, ExpenseRecord } from '../../types';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ArrowDownTrayIcon, BanknotesIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, ScaleIcon } from '@heroicons/react/24/outline';
import { adToBsSimulated, bsToAdSimulated, BS_MONTH_NAMES_EN, getDaysInBsMonthSimulated, formatDateADBS } from '../../dateConverter';

interface TransactionLogItem {
  id: string;
  date: string;
  type: 'Income' | 'Expense';
  category: string;
  description: string;
  amount: number;
}

const NotoSansDevanagariBase64: string = "AAEAAAARAQAABAAQR0RFRgBsAmsAAEV0AAAABkdQT1O2B51VAAEVrAAAAGxHU1VC4spaYQAA+LAAAAA4T1MvMmpgKQQAAAFgAAAAYGNtYXABDQGXAAACDAAAAGxnbHlm/nK3EAAABWAAAAJgaGVhZBsAmsAAAADcAAAANmhoZWEH3gOFAAABJAAAACRobXR4DAAD/AAAAfQAAAAybG9jYQG8BIwAAARcAAAAMm1heHABGQCbAAABOAAAACBuYW1l406XlQAA+NgAAASxcG9zdBvYcFEAARMUAAAAOwABAAADUv9qAAMAAQAAAAAAAAAAAAAAAAAAAAABAAAD//3PAAEAAQAAAAoAAgAEAAMAAAAAAADUASQAAQAAAAAAAQAAAAAAAQAAAAAAAQAAAAAAAQAAAgAAAAAAAAAAAAAAAwAAAAMAAAAcAAEAAAAAAHAACAAEAAAAAAG4ABQADAAEAAAAAAAQABAANAAAAAABcABcAEgAAAAAQABgAAgABAAEAEAAg//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8=";
const DEVANAGARI_FONT_NAME = 'NotoSansDevanagariCustomPDF';
const BASE_FONT_NAME = 'Helvetica';
let isDevanagariFontSuccessfullyEmbedded = false;

const getCurrentFont = (text: string): string => {
  if (isDevanagariFontSuccessfullyEmbedded && text && /[^\x00-\x7F]+/.test(text)) {
    return DEVANAGARI_FONT_NAME;
  }
  return BASE_FONT_NAME;
};

const FinancialSummaryPage: React.FC = () => {
  const { collectionRecords, donationRecords, expenseRecords, loadingContent } = useContent();
  
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(todayString);

  // New state for BS date parts
  const [startBs, setStartBs] = useState(() => adToBsSimulated(new Date(firstDayOfMonth)));
  const [endBs, setEndBs] = useState(() => adToBsSimulated(new Date(todayString)));

  // Sync AD date changes to BS state
  useEffect(() => {
    if (startDate) {
      try {
        const adDate = new Date(startDate);
        if(!isNaN(adDate.getTime())) {
          setStartBs(adToBsSimulated(adDate));
        }
      } catch (e) { console.error("Error parsing start date:", e); }
    }
  }, [startDate]);

  useEffect(() => {
    if (endDate) {
      try {
        const adDate = new Date(endDate);
        if(!isNaN(adDate.getTime())) {
          setEndBs(adToBsSimulated(adDate));
        }
      } catch (e) { console.error("Error parsing end date:", e); }
    }
  }, [endDate]);

  const financialData = useMemo(() => {
    const transactionLog: TransactionLogItem[] = [];
    let totalIncome = 0;
    let totalExpense = 0;
    
    const parseDate = (dateString: string | null | undefined): Date | null => {
        if (!dateString) return null;
        const parts = dateString.split('-').map(part => parseInt(part, 10));
        if (parts.length !== 3 || parts.some(isNaN)) return null;
        return new Date(parts[0], parts[1] - 1, parts[2]);
    };
    
    const start = parseDate(startDate);
    let end = parseDate(endDate);
    if(end) {
        end.setHours(23, 59, 59, 999); 
    }

    collectionRecords.forEach(record => {
      const recordDate = parseDate(record.collectionDate);
      if (!recordDate || (start && recordDate < start) || (end && recordDate > end)) return;
      
      transactionLog.push({
        id: record.id,
        date: record.collectionDate,
        type: 'Income',
        category: record.purpose,
        description: `Collection by ${record.collectorName}`,
        amount: record.amount
      });
      totalIncome += record.amount;
    });

    donationRecords.forEach(record => {
      const recordDate = parseDate(record.donationDate);
      if (!recordDate || (start && recordDate < start) || (end && recordDate > end)) return;
      
      transactionLog.push({
        id: record.id,
        date: record.donationDate,
        type: 'Income',
        category: record.purpose,
        description: `Donation from ${record.donorName}`,
        amount: record.amount
      });
      totalIncome += record.amount;
    });


    expenseRecords.forEach(record => {
      const recordDate = parseDate(record.expenseDate);
       if (!recordDate || (start && recordDate < start) || (end && recordDate > end)) return;

       transactionLog.push({
        id: record.id,
        date: record.expenseDate,
        type: 'Expense',
        category: record.category,
        description: record.description,
        amount: record.amount
      });
      totalExpense += record.amount;
    });
    
    transactionLog.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      transactionLog,
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense
    };
  }, [collectionRecords, donationRecords, expenseRecords, startDate, endDate]);

  const handleBsChange = (
    type: 'start' | 'end',
    part: 'year' | 'month' | 'day',
    value: string
  ) => {
    const numericValue = parseInt(value, 10);
    const currentBs = type === 'start' ? { ...startBs } : { ...endBs };

    (currentBs as any)[part] = numericValue;
    
    const daysInMonth = getDaysInBsMonthSimulated(currentBs.month, currentBs.year);
    if (currentBs.day > daysInMonth) {
        currentBs.day = daysInMonth;
    }

    try {
      const newAdDate = bsToAdSimulated(currentBs.day, currentBs.month, currentBs.year);
      const newAdDateString = newAdDate.toISOString().split('T')[0];

      if (type === 'start') {
        setStartDate(newAdDateString);
      } else {
        setEndDate(newAdDateString);
      }
    } catch(e) {
      console.error("Error converting BS to AD date:", e);
    }
  };

  const bsYearOptions = useMemo(() => {
    const currentBsYear = adToBsSimulated(new Date()).year;
    return Array.from({ length: 15 }, (_, i) => currentBsYear - i);
  }, []);

  const renderBsDatePicker = (type: 'start' | 'end') => {
    const bsState = type === 'start' ? startBs : endBs;
    const adState = type === 'start' ? startDate : endDate;
    const label = type === 'start' ? 'Start Date (BS)' : 'End Date (BS)';
    
    return (
        <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">{label}</label>
            <div className="grid grid-cols-3 gap-2">
                <select value={bsState.year} onChange={(e) => handleBsChange(type, 'year', e.target.value)} className="p-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 dark:text-slate-200" aria-label={`${label} Year`}>
                    {bsYearOptions.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
                <select value={bsState.month} onChange={(e) => handleBsChange(type, 'month', e.target.value)} className="p-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 dark:text-slate-200" aria-label={`${label} Month`}>
                    {BS_MONTH_NAMES_EN.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
                </select>
                <select value={bsState.day} onChange={(e) => handleBsChange(type, 'day', e.target.value)} className="p-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 dark:text-slate-200" aria-label={`${label} Day`}>
                    {Array.from({ length: getDaysInBsMonthSimulated(bsState.month, bsState.year) }, (_, i) => i + 1).map(day => (
                        <option key={day} value={day}>{day}</option>
                    ))}
                </select>
            </div>
             <div className="mt-1 flex items-center gap-2">
                <label htmlFor={`${type}-ad-date`} className="text-xs text-slate-500 dark:text-slate-400">AD Date:</label>
                <input
                    type="date"
                    id={`${type}-ad-date`}
                    value={adState}
                    onChange={(e) => { if (type === 'start') setStartDate(e.target.value); else setEndDate(e.target.value); }}
                    className="p-1 border border-slate-300 dark:border-slate-600 rounded-md text-xs bg-white dark:bg-slate-700 dark:text-slate-200"
                />
            </div>
        </div>
    );
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'NPR', minimumFractionDigits: 2 }).format(amount);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Embed Font
    isDevanagariFontSuccessfullyEmbedded = false;
    try {
        if (NotoSansDevanagariBase64 && NotoSansDevanagariBase64 !== "YOUR_DEVANAGARI_FONT_BASE64_STRING_HERE") {
            doc.addFileToVFS('NotoSansDevanagariCustom.ttf', NotoSansDevanagariBase64);
            doc.addFont('NotoSansDevanagariCustom.ttf', DEVANAGARI_FONT_NAME, 'normal');
            isDevanagariFontSuccessfullyEmbedded = true;
        }
    } catch (e) { console.error("Could not embed font for PDF", e); }


    const titleText = 'Financial Summary Report';
    doc.setFont(getCurrentFont(titleText), 'bold');
    doc.setFontSize(18);
    doc.text(titleText, 14, 22);
    
    doc.setFont(BASE_FONT_NAME, 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100);
    const dateRangeText = `Date Range: ${startDate || 'Start'} to ${endDate || 'End'}`;
    doc.text(dateRangeText, 14, 30);

    const summaryY = 40;
    doc.setFontSize(12);
    const totalIncomeText = `Total Income: ${formatCurrency(financialData.totalIncome)}`;
    const totalExpenseText = `Total Expense: ${formatCurrency(financialData.totalExpense)}`;
    const netBalanceText = `Net Balance: ${formatCurrency(financialData.netBalance)}`;

    doc.setFont(getCurrentFont(totalIncomeText)); doc.text(totalIncomeText, 14, summaryY);
    doc.setFont(getCurrentFont(totalExpenseText)); doc.text(totalExpenseText, 80, summaryY);
    doc.setFont(getCurrentFont(netBalanceText), 'bold'); doc.text(netBalanceText, 140, summaryY);
    doc.setFont(BASE_FONT_NAME, 'normal');

    autoTable(doc, {
      startY: summaryY + 10,
      head: [['Date', 'Type', 'Category/Purpose', 'Description', 'Income', 'Expense']],
      body: financialData.transactionLog.map(item => [
        formatDateADBS(item.date),
        item.type,
        item.category,
        item.description,
        item.type === 'Income' ? formatCurrency(item.amount) : '',
        item.type === 'Expense' ? formatCurrency(item.amount) : '',
      ]),
      headStyles: { fillColor: [79, 70, 229], font: BASE_FONT_NAME },
      foot: [[
          'Grand Total',
          '', '', '',
          formatCurrency(financialData.totalIncome),
          formatCurrency(financialData.totalExpense),
      ]],
      footStyles: { fillColor: [49, 46, 129], textColor: 255, fontStyle: 'bold', font: BASE_FONT_NAME },
      didParseCell: function(data: any) {
        if (data.cell.text && data.cell.text.length > 0) {
            const textToTest = Array.isArray(data.cell.text) ? data.cell.text.join(' ') : String(data.cell.text);
            data.cell.styles.font = getCurrentFont(textToTest);
        }
        if (data.section === 'body' && (data.column.index === 4 || data.column.index === 5)) {
           data.cell.styles.halign = 'right';
        }
        if (data.section === 'foot') {
           data.cell.styles.halign = 'right';
           if (data.column.index === 0) data.cell.styles.halign = 'left';
        }
      }
    });

    doc.save(`financial_summary_${startDate}_to_${endDate}.pdf`);
  };

  const handleExportExcel = () => {
    const worksheetData: ({
        'Date': string;
        'Type': "Income" | "Expense" | "";
        'Category/Purpose': string;
        'Description': string;
        'Income (NPR)': number;
        'Expense (NPR)': number;
    })[] = financialData.transactionLog.map(item => ({
        'Date': formatDateADBS(item.date),
        'Type': item.type,
        'Category/Purpose': item.category,
        'Description': item.description,
        'Income (NPR)': item.type === 'Income' ? item.amount : 0,
        'Expense (NPR)': item.type === 'Expense' ? item.amount : 0,
    }));
    worksheetData.push({
        'Date': 'GRAND TOTAL',
        'Type': '',
        'Category/Purpose': '',
        'Description': '',
        'Income (NPR)': financialData.totalIncome,
        'Expense (NPR)': financialData.totalExpense,
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Financial Summary');
    XLSX.writeFile(workbook, `financial_summary_${startDate}_to_${endDate}.xlsx`);
  };

  if (loadingContent) {
    return <p className="text-slate-500">Loading financial data...</p>;
  }

  return (
    <div className="w-full space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Financial Summary</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Analyze income, expenses, and balances for specific periods.</p>
      </header>

      <Card className="dark:bg-slate-800">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Filters & Actions</h2>
           <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={handleExportPDF} variant="outline" size="sm" className="w-full sm:w-auto text-xs" disabled={financialData.transactionLog.length === 0}><ArrowDownTrayIcon className="mr-1 h-4 w-4"/>Export PDF</Button>
            <Button onClick={handleExportExcel} variant="outline" size="sm" className="w-full sm:w-auto text-xs" disabled={financialData.transactionLog.length === 0}><ArrowDownTrayIcon className="mr-1 h-4 w-4"/>Export Excel</Button>
           </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4 items-end">
            {renderBsDatePicker('start')}
            {renderBsDatePicker('end')}
            <div className="md:col-span-2 flex justify-end">
                <Button variant="ghost" onClick={() => { setStartDate(''); setEndDate(''); }}>Clear Dates</Button>
            </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="dark:bg-green-800/20 dark:border-green-700 border-green-200 border">
          <CardHeader className="flex items-center space-x-3 !pb-2">
            <ArrowTrendingUpIcon className="w-6 h-6 text-green-500"/>
            <h3 className="font-semibold text-slate-700 dark:text-slate-200">Total Income</h3>
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-green-600 dark:text-green-400">{formatCurrency(financialData.totalIncome)}</p></CardContent>
        </Card>
        <Card className="dark:bg-red-800/20 dark:border-red-700 border-red-200 border">
          <CardHeader className="flex items-center space-x-3 !pb-2">
            <ArrowTrendingDownIcon className="w-6 h-6 text-red-500"/>
            <h3 className="font-semibold text-slate-700 dark:text-slate-200">Total Expenses</h3>
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-red-600 dark:text-red-400">{formatCurrency(financialData.totalExpense)}</p></CardContent>
        </Card>
        <Card className="dark:bg-purple-800/20 dark:border-purple-700 border-purple-200 border">
          <CardHeader className="flex items-center space-x-3 !pb-2">
            <ScaleIcon className="w-6 h-6 text-purple-500"/>
            <h3 className="font-semibold text-slate-700 dark:text-slate-200">Net Balance</h3>
          </CardHeader>
          <CardContent><p className={`text-3xl font-bold ${financialData.netBalance >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(financialData.netBalance)}</p></CardContent>
        </Card>
      </div>

      <Card className="dark:bg-slate-800">
        <CardHeader className="dark:border-slate-700"><h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Detailed Transaction Log</h2></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Category/Purpose</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Amount (NPR)</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {financialData.transactionLog.map(item => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{formatDateADBS(item.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.type === 'Income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {item.type}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{item.category}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100 max-w-xs truncate" title={item.description}>{item.description}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${item.type === 'Income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {item.type === 'Income' ? '+' : '-'} {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 dark:bg-slate-700">
                <tr>
                    <td colSpan={4} className="px-6 py-3 text-right text-sm font-bold text-slate-900 dark:text-slate-100 uppercase">Net Balance for Period</td>
                    <td className={`px-6 py-3 text-right text-sm font-bold ${financialData.netBalance >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-red-700 dark:text-red-300'}`}>{formatCurrency(financialData.netBalance)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default FinancialSummaryPage;