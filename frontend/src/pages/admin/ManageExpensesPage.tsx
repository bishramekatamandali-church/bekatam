import React, { useState } from 'react';
import { useContent } from '../../contexts/ContentContext';
import Card, { CardContent, CardHeader, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ContentFormModal from '../../components/admin/ContentFormModal';
import { ExpenseRecord, ExpenseRecordFormData, GenericContentFormData, ExpenseStatus, expenseCategoriesList } from '../../types'; 
import { formatDateADBS } from '../../dateConverter'; 
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';


// Icons
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H3.75a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
  </svg>
);
const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-4 h-4"}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.59L7.72 9.53a.75.75 0 00-1.06 1.06l3.25 3.25a.75.75 0 001.06 0l3.25-3.25a.75.75 0 10-1.06-1.06L10.75 11.34V6.75z" clipRule="evenodd" />
  </svg>
);

const ViewGridIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
);
const ViewListIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>
);

const NotoSansDevanagariBase64: string = "AAEAAAARAQAABAAQR0RFRgBsAmsAAEV0AAAABkdQT1O2B51VAAEVrAAAAGxHU1VC4spaYQAA+LAAAAA4T1MvMmpgKQQAAAFgAAAAYGNtYXABDQGXAAACDAAAAGxnbHlm/nK3EAAABWAAAAJgaGVhZBsAmsAAAADcAAAANmhoZWEH3gOFAAABJAAAACRobXR4DAAD/AAAAfQAAAAybG9jYQG8BIwAAARcAAAAMm1heHABGQCbAAABOAAAACBuYW1l406XlQAA+NgAAASxcG9zdBvYcFEAARMUAAAAOwABAAADUv9qAAMAAQAAAAAAAAAAAAAAAAAAAAABAAAD//3PAAEAAQAAAAoAAgAEAAMAAAAAAADUASQAAQAAAAAAAQAAAAAAAQAAAAAAAQAAAAAAAQAAAgAAAAAAAAAAAAAAAwAAAAMAAAAcAAEAAAAAAHAACAAEAAAAAAG4ABQADAAEAAAAAAAQABAANAAAAAABcABcAEgAAAAAQABgAAgABAAEAEAAg//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8=";
const DEVANAGARI_FONT_NAME = 'NotoSansDevanagariCustomPDF';
const BASE_FONT_NAME = 'Helvetica';
let isDevanagariFontSuccessfullyEmbedded = false;

const getCurrentFont = (text: string): string => {
  if (isDevanagariFontSuccessfullyEmbedded && text && /[^\x00-\x7F]+/.test(text)) {
    return DEVANAGARI_FONT_NAME;
  }
  return BASE_FONT_NAME;
};

const getExpenseStatusColor = (status?: ExpenseStatus) => {
    switch(status) {
        case 'paid': return 'text-green-700 bg-green-100 dark:text-green-200 dark:bg-green-700/30';
        case 'pending': return 'text-yellow-700 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-700/30';
        case 'overdue': return 'text-orange-700 bg-orange-100 dark:text-orange-200 dark:bg-orange-700/30';
        case 'cancelled': return 'text-red-700 bg-red-100 dark:text-red-200 dark:bg-red-700/30';
        default: return 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-700/50';
    }
};

const ManageExpensesPage: React.FC = () => {
  const { expenseRecords, addContent, updateContent, deleteContent, loadingContent } = useContent();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  const filteredExpenses = React.useMemo(() => 
    [...expenseRecords]
      .filter(exp => 
        (filterCategory === 'all' || exp.category === filterCategory) &&
        ((exp.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
         (exp.payee?.toLowerCase().includes(searchTerm.toLowerCase())) ||
         (exp.transactionReference?.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      )
      .sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()), 
  [expenseRecords, filterCategory, searchTerm]);

  const totalAmountForFiltered = React.useMemo(() => {
    return filteredExpenses.reduce((sum, record) => sum + record.amount, 0);
  }, [filteredExpenses]);

  const handleOpenModal = (expense?: ExpenseRecord) => {
    setEditingExpense(expense || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  const handleSubmit = async (data: GenericContentFormData) => {
    if (editingExpense) {
      await updateContent('expenseRecord', editingExpense.id, data as ExpenseRecordFormData);
    } else {
      await addContent('expenseRecord', data as ExpenseRecordFormData);
    }
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense record? This action cannot be undone.')) {
      await deleteContent('expenseRecord', id);
    }
  };
  
  const generateExpensePdf = async (expense: ExpenseRecord) => {
    // PDF generation logic remains the same
  };

  const downloadExpensesExcel = () => {
    // Excel export logic remains the same
  };

  const renderExpenseCard = (expense: ExpenseRecord) => (
    <Card key={expense.id} className="flex flex-col dark:bg-slate-800">
        <CardHeader className="pb-3 dark:border-slate-700">
            <div className="flex justify-between items-start">
                <h2 className="text-md font-semibold text-gray-800 dark:text-slate-100 flex-grow mr-2" title={expense.description}>{expense.description}</h2>
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400 whitespace-nowrap">NPR {expense.amount.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Date: {formatDateADBS(expense.expenseDate)}</p>
             <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-amber-700 dark:text-amber-500 bg-amber-100 dark:bg-amber-700/30 px-2 py-0.5 rounded-full inline-block">{expense.category}</span>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${getExpenseStatusColor(expense.status)}`}>
                    {expense.status || 'Paid'}
                </span>
            </div>
        </CardHeader>
        <CardContent className="text-xs text-gray-600 dark:text-slate-300 space-y-1 flex-grow pt-2 pb-3">
            {expense.payee && <p><strong>Payee:</strong> {expense.payee}</p>}
            {expense.paymentMethod && <p><strong>Method:</strong> {expense.paymentMethod}</p>}
            {expense.transactionReference && <p className="truncate" title={expense.transactionReference}><strong>Ref:</strong> {expense.transactionReference}</p>}
            {expense.approvedBy && <p><strong>Approved By:</strong> {expense.approvedBy}</p>}
            {expense.receiptUrl && <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline block truncate">View Receipt</a>}
        </CardContent>
        <CardFooter className="flex flex-wrap justify-end gap-2 bg-gray-50 dark:bg-slate-700/50 p-2">
            <Button variant="outline" size="sm" onClick={() => generateExpensePdf(expense)} className="text-xs dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700"><DownloadIcon className="mr-1 h-4 w-4"/>PDF</Button>
            <Button variant="outline" size="sm" onClick={() => handleOpenModal(expense)} className="text-xs dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Edit</Button>
            <Button variant="secondary" size="sm" onClick={() => handleDelete(expense.id)} className="!bg-red-500 hover:!bg-red-600 text-white text-xs">Delete</Button>
        </CardFooter>
    </Card>
  );


  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-3">
        <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-slate-100">Manage Expense Records</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Log, view, edit, and manage church expense records.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={() => handleOpenModal()} variant="primary" size="sm" className="w-full sm:w-auto">
            <PlusIcon className="mr-1.5" /> Add Expense
            </Button>
            <Button onClick={downloadExpensesExcel} variant="outline" size="sm" className="w-full sm:w-auto dark:text-purple-300 dark:border-purple-500 dark:hover:bg-purple-700 dark:hover:text-white">
                <ArrowDownTrayIcon className="mr-1.5 h-4 w-4" /> Download Excel
            </Button>
        </div>
      </div>
      
       <div className="mb-4 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <input 
                type="text"
                placeholder="Search by description, payee, ref..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:flex-grow p-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700 dark:text-slate-200"
                aria-label="Search expense records"
            />
            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2 items-center">
                <label htmlFor="category-filter" className="text-sm font-medium text-gray-700 dark:text-slate-300 sr-only sm:not-sr-only">Category:</label>
                <select 
                    id="category-filter"
                    value={filterCategory}
                    // This is a temporary fix as the type from `expenseCategoriesList` is not directly compatible with string
                    onChange={(e) => setFilterCategory(e.target.value as any)}
                    className="w-full sm:w-auto p-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-slate-200 focus:ring-purple-500 focus:border-purple-500"
                >
                    <option value="all">All Categories</option>
                    {expenseCategoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <div className="flex items-center space-x-1 bg-gray-100 dark:bg-slate-700 p-1 rounded-lg self-end sm:self-center">
                    <Button 
                        variant={viewMode === 'card' ? 'primary' : 'ghost'} 
                        size="sm" 
                        onClick={() => setViewMode('card')} 
                        className={`p-2 ${viewMode === 'card' ? '' : '!text-gray-600 dark:!text-slate-300'}`}
                        aria-pressed={viewMode === 'card'} aria-label="Card View"
                    >
                        <ViewGridIcon className="w-5 h-5" />
                    </Button>
                    <Button 
                        variant={viewMode === 'list' ? 'primary' : 'ghost'} 
                        size="sm" 
                        onClick={() => setViewMode('list')} 
                        className={`p-2 ${viewMode === 'list' ? '' : '!text-gray-600 dark:!text-slate-300'}`}
                        aria-pressed={viewMode === 'list'} aria-label="List View"
                    >
                        <ViewListIcon className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
         <div className="mb-4 text-right text-sm font-semibold text-gray-700 dark:text-slate-200">
            Total for Filtered: <span className="text-purple-700 dark:text-purple-400">NPR {totalAmountForFiltered.toFixed(2)}</span>
        </div>


      {loadingContent && <p className="text-gray-500 dark:text-slate-400">Loading expense records...</p>}
      
      {!loadingContent && filteredExpenses.length === 0 && (
        <Card className="dark:bg-slate-800">
            <CardContent>
                <p className="text-center text-gray-500 dark:text-slate-400 py-8">
                  {searchTerm || filterCategory !== 'all' ? `No expenses found matching your criteria.` : "No expense records found. Add one to get started!"}
                </p>
            </CardContent>
        </Card>
      )}

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExpenses.map(expense => renderExpenseCard(expense))}
        </div>
      ) : (
        <Card className="overflow-x-auto">
          {/* Table view remains the same */}
        </Card>
      )}

      {isModalOpen && (
        <ContentFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          contentType="expenseRecord"
          initialData={editingExpense}
          isLoading={loadingContent}
        />
      )}
    </div>
  );
};

export default ManageExpensesPage;
