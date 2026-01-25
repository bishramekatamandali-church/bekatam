import React, { useState, useMemo, useEffect } from 'react';
import { useContent } from '../../contexts/ContentContext';
import Card, { CardContent, CardHeader, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ContentFormModal from '../../components/admin/ContentFormModal'; 
import { CollectionRecord, CollectionRecordFormData, GenericContentFormData, collectionPurposeList, CollectionPurpose, DonorDetail } from '../../types';
import { formatDateADBS, formatTimestampADBS } from '../../dateConverter';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { PlusIcon as HeroPlusIcon, DocumentTextIcon as DocumentPdfIcon, TableCellsIcon as DocumentCsvIcon, Squares2X2Icon, Bars3Icon, CheckCircleIcon } from '@heroicons/react/24/outline';

const ITEMS_PER_PAGE_CARD = 9;
const ITEMS_PER_PAGE_LIST = 15;

const BASE_FONT_NAME = 'Helvetica';

const getCurrentFont = (doc: jsPDF, text: string): string => {
  // Always return the base font since custom fonts are removed.
  return BASE_FONT_NAME;
};


export const ManageCollectionRecordsPage: React.FC = () => {
  const { collectionRecords, addContent, updateContent, deleteContent, loadingContent } = useContent();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CollectionRecord | null>(null);
  const [modalFormLoading, setModalFormLoading] = useState(false); 

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPurpose, setFilterPurpose] = useState<CollectionPurpose | 'all'>('all');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = useMemo(() => viewMode === 'card' ? ITEMS_PER_PAGE_CARD : ITEMS_PER_PAGE_LIST, [viewMode]);

  const filteredRecords = useMemo(() => {
    return collectionRecords
      .filter(record => {
        const purposeMatch = filterPurpose === 'all' || record.purpose === filterPurpose;
        let dateMatch = true;
        if (filterDateStart && filterDateEnd) {
            dateMatch = new Date(record.collectionDate) >= new Date(filterDateStart) && new Date(record.collectionDate) <= new Date(filterDateEnd);
        } else if (filterDateStart) {
            dateMatch = new Date(record.collectionDate) >= new Date(filterDateStart);
        } else if (filterDateEnd) {
            dateMatch = new Date(record.collectionDate) <= new Date(filterDateEnd);
        }
        
        const term = searchTerm.toLowerCase();
        const searchMatch = 
            record.collectorName.toLowerCase().includes(term) ||
            record.purpose.toLowerCase().includes(term) ||
            (record.source || '').toLowerCase().includes(term) ||
            (record.notes || '').toLowerCase().includes(term) ||
            String(record.amount).includes(term) ||
            (record.donors || []).some(donor => donor.donorName.toLowerCase().includes(term));
            
        return purposeMatch && dateMatch && searchMatch;
      })
      .sort((a, b) => new Date(b.collectionDate).getTime() - new Date(a.collectionDate).getTime());
  }, [collectionRecords, searchTerm, filterPurpose, filterDateStart, filterDateEnd]);
  
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1); 
  }, [searchTerm, filterPurpose, filterDateStart, filterDateEnd, viewMode]);

  const totalAmountForFiltered = useMemo(() => {
    return filteredRecords.reduce((sum, record) => sum + Number(record.amount ?? 0), 0);
  }, [filteredRecords]);

  const handleOpenModal = (record?: CollectionRecord) => {
    setEditingRecord(record || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
  };

  const handleSubmit = async (data: GenericContentFormData) => {
    setModalFormLoading(true);
    let result;
    try {
      if (editingRecord) {
        result = await updateContent('collectionRecord', editingRecord.id, data as CollectionRecordFormData);
      } else {
        result = await addContent('collectionRecord', data as CollectionRecordFormData);
      }
      
      if (result.success) {
        const action = editingRecord ? 'updated' : 'added';
        const title = (result.newItem as CollectionRecord)?.purpose || (result.updatedItem as CollectionRecord)?.purpose || 'Record';
        const rawAmount = (result.newItem as CollectionRecord)?.amount || (result.updatedItem as CollectionRecord)?.amount || 0;
        const amountValue = Number(rawAmount);
        const formattedAmount = Number.isFinite(amountValue) ? amountValue.toFixed(2) : '0.00';
        alert(`Collection Record for "${title}" (Amount: ${formattedAmount}) ${action} successfully!`);
        handleCloseModal();
      } else {
        alert(result.message || `Failed to ${editingRecord ? 'update' : 'add'} collection record.`);
      }
    } catch (error) {
      console.error("Error submitting collection record:", error);
      alert(`An error occurred while ${editingRecord ? 'updating' : 'adding'} the record.`);
    } finally {
      setModalFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this collection record? This action cannot be undone.')) {
      await deleteContent('collectionRecord', id);
    }
  };

  const generateRecordPdf = (record: CollectionRecord) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const footerMargin = 12;
    const lineSpacing = 6;
    const sectionSpacing = 8;
    let yPos = margin;

    const churchNameForPdf = "BEM Church";
    const documentTitle = "Collection Record";

    doc.setFontSize(16);
    doc.setFont(getCurrentFont(doc, churchNameForPdf), 'bold');
    doc.text(churchNameForPdf, pageWidth / 2, yPos, { align: 'center' });
    yPos += 7;

    doc.setFontSize(13);
    doc.setFont(getCurrentFont(doc, documentTitle), 'normal');
    doc.text(documentTitle, pageWidth / 2, yPos, { align: 'center' });
    yPos += sectionSpacing;

    const addDetail = (label: string, value?: string) => {
      const valueString = String(value ?? '').trim();
      if (!valueString) return;
      if (yPos > pageHeight - footerMargin - 20) {
        doc.addPage();
        yPos = margin;
      }
      doc.setFont(getCurrentFont(doc, label), 'bold');
      doc.text(`${label}:`, margin, yPos);
      doc.setFont(getCurrentFont(doc, valueString), 'normal');
      const labelWidth = doc.getTextWidth(`${label}:`) + 2;
      const valueX = margin + labelWidth;
      const valueWidth = pageWidth - margin - valueX;
      const lines = doc.splitTextToSize(valueString, valueWidth);
      doc.text(lines, valueX, yPos);
      yPos += lineSpacing * (Array.isArray(lines) ? lines.length : 1);
    };

    addDetail('Purpose', record.purpose);
    addDetail('Collection Date', formatDateADBS(record.collectionDate));
    addDetail('Collector Name', record.collectorName);
    addDetail('Source / Location', record.source);
    addDetail('Total Amount', `NPR ${Number(record.amount ?? 0).toFixed(2)}`);
    addDetail('Counted By', record.countedBy);
    addDetail('Deposit Status', record.isDeposited ? 'Deposited' : 'Pending');
    addDetail('Deposit Date', record.depositDate ? formatDateADBS(record.depositDate) : '');
    addDetail('Bank Deposit Reference', record.bankDepositReference);
    addDetail('Notes', record.notes);
    addDetail('Recorded At', record.recordedAt ? formatTimestampADBS(record.recordedAt) : '');
    addDetail('Recorded By', record.recordedByAdminName);

    if (record.donors && record.donors.length > 0) {
      yPos += 2;
      doc.setFont(getCurrentFont(doc, 'Donor Details'), 'bold');
      doc.text('Donor Details', margin, yPos);
      yPos += lineSpacing;

      record.donors.forEach((donor, index) => {
        const donorLine = `${index + 1}. ${donor.donorName} - NPR ${Number(donor.amount ?? 0).toFixed(2)}${donor.contact ? ` (${donor.contact})` : ''}${donor.address ? `, ${donor.address}` : ''}`;
        const donorLines = doc.splitTextToSize(donorLine, pageWidth - margin * 2);
        if (yPos > pageHeight - footerMargin - 20) {
          doc.addPage();
          yPos = margin;
        }
        doc.setFont(getCurrentFont(doc, donorLine), 'normal');
        doc.text(donorLines, margin, yPos);
        yPos += lineSpacing * (Array.isArray(donorLines) ? donorLines.length : 1);
      });
    }

    const totalPages = doc.getNumberOfPages();
    const generatedDate = formatDateADBS(new Date().toISOString()).split('(')[0].trim();
    const currentYear = new Date().getFullYear();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont(getCurrentFont(doc, generatedDate), 'normal');
      doc.setFontSize(8);
      doc.text(`Generated date: ${generatedDate}`, margin, pageHeight - footerMargin);
      const copyrightText = `All rights reserved at ${churchNameForPdf} © ${currentYear}`;
      doc.text(copyrightText, (pageWidth - doc.getTextWidth(copyrightText)) / 2, pageHeight - footerMargin);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - doc.getTextWidth(`Page ${i} of ${totalPages}`), pageHeight - footerMargin);
    }

    doc.save(`Collection_Record_${record.purpose.replace(/\s+/g, '_')}_${record.id.slice(0, 6)}.pdf`);
  };


  const downloadCollectionRecordsCsv = () => {
   if (filteredRecords.length === 0) {
      return;
    }

    const dataForCsv = [
      [
        "ID",
        "Collection Date (AD)",
        "Purpose",
        "Total Amount (NPR)",
        "Collector Name",
        "Source / Location",
        "Notes",
        "Counted By",
        "Deposit Status",
        "Deposit Date (AD)",
        "Bank Deposit Reference",
        "Donor Count",
        "Donor Details",
        "Recorded At (ISO)",
        "Recorded By ID",
        "Recorded By Name",
        "Updated At (ISO)",
      ],
      ...filteredRecords.map((record) => {
        const donorDetails = (record.donors || [])
          .map((donor) => {
            const base = `${donor.donorName} (NPR ${Number(donor.amount ?? 0).toFixed(2)})`;
            const contact = donor.contact ? ` | ${donor.contact}` : '';
            const address = donor.address ? ` | ${donor.address}` : '';
            return `${base}${contact}${address}`;
          })
          .join('; ');

        return [
          record.id,
          new Date(record.collectionDate).toLocaleDateString('en-CA'),
          record.purpose,
          Number(record.amount ?? 0).toFixed(2),
          record.collectorName,
          record.source || '',
          record.notes || '',
          record.countedBy || '',
          record.isDeposited ? 'Deposited' : 'Pending',
          record.depositDate ? new Date(record.depositDate).toLocaleDateString('en-CA') : '',
          record.bankDepositReference || '',
          String(record.donors?.length || 0),
          donorDetails,
          record.recordedAt ? new Date(record.recordedAt).toISOString() : '',
          record.recordedByAdminId || '',
          record.recordedByAdminName || '',
          record.updatedAt ? new Date(record.updatedAt).toISOString() : '',
        ];
      }),
    ];

    const ws = XLSX.utils.aoa_to_sheet(dataForCsv);
    const csvOutput = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `collection_records_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };
  
  const renderRecordCard = (record: CollectionRecord) => (
    <Card key={record.id} className="flex flex-col dark:bg-slate-800">
        <CardHeader className="pb-3 dark:border-slate-700">
            <div className="flex justify-between items-start">
                <h2 className="text-md font-semibold text-gray-800 dark:text-slate-100 flex-grow mr-2" title={record.purpose}>{record.purpose}</h2>
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400 whitespace-nowrap">NPR {Number(record.amount ?? 0).toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Date: {formatDateADBS(record.collectionDate)}</p>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-amber-700 dark:text-amber-500 bg-amber-100 dark:bg-amber-700/30 px-2 py-0.5 rounded-full inline-block">{record.collectorName}</span>
                {record.isDeposited ? (
                    <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex items-center"><CheckCircleIcon className="w-3 h-3 mr-1"/>Deposited</span>
                ) : (
                    <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">Pending Deposit</span>
                )}
            </div>
        </CardHeader>
        <CardContent className="text-xs text-gray-600 dark:text-slate-300 space-y-1 flex-grow pt-2 pb-3">
            {record.source && <p><strong>Source:</strong> {record.source}</p>}
            {record.donors && record.donors.length > 0 && (
                <details className="text-xs">
                    <summary className="cursor-pointer font-medium text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200">Donors ({record.donors.length})</summary>
                    <div className="mt-1 bg-gray-50 dark:bg-slate-700 p-2 rounded max-h-20 overflow-y-auto">
                        {record.donors.map(d => <div key={d.id} className="truncate">{d.donorName}: {Number(d.amount ?? 0).toFixed(2)}</div>)}
                    </div>
                </details>
            )}
            {record.notes && <p className="mt-1 italic line-clamp-2"><strong>Notes:</strong> {record.notes}</p>}
        </CardContent>
        <CardFooter className="flex flex-wrap justify-end gap-2 bg-gray-50 dark:bg-slate-700/50 p-2">
            <Button variant="outline" size="sm" onClick={() => generateRecordPdf(record)} className="text-xs dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700"><DocumentPdfIcon className="mr-1 h-4 w-4"/>PDF</Button>
            <Button variant="outline" size="sm" onClick={() => handleOpenModal(record)} className="text-xs dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Edit</Button>
            <Button variant="secondary" size="sm" onClick={() => handleDelete(record.id)} className="!bg-red-500 hover:!bg-red-600 text-white text-xs">Delete</Button>
        </CardFooter>
    </Card>
  );

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-3">
        <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-slate-100">Manage Collection Records</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Add, view, edit, and manage church collection records.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={() => handleOpenModal()} variant="primary" size="sm" className="w-full sm:w-auto">
                <HeroPlusIcon className="mr-1.5 h-4 w-4" /> Add Collection
            </Button>
             <Button 
                onClick={downloadCollectionRecordsCsv} 
                variant="outline" 
                size="sm" 
                className="w-full sm:w-auto dark:text-purple-300 dark:border-purple-500 dark:hover:bg-purple-700 dark:hover:text-white"
                disabled={filteredRecords.length === 0}
                title={filteredRecords.length === 0 ? "No records to download" : "Download filtered records as CSV"}
            >
                <DocumentCsvIcon className="mr-1.5 h-4 w-4" /> Download CSV
            </Button>
        </div>
      </div>
      
      <div className="mb-4 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <input 
                type="text"
                placeholder="Search by collector, purpose, donor, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:flex-grow p-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700 dark:text-slate-200"
                aria-label="Search collection records"
            />
             <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2 items-center">
                <select 
                    value={filterPurpose}
                    onChange={(e) => setFilterPurpose(e.target.value as CollectionPurpose | 'all')}
                    className="w-full sm:w-auto p-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-slate-200 focus:ring-purple-500 focus:border-purple-500"
                    aria-label="Filter by purpose"
                >
                    <option value="all">All Purposes</option>
                    {collectionPurposeList.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <input
                  type="date"
                  value={filterDateStart}
                  onChange={(e) => setFilterDateStart(e.target.value)}
                  className="w-full sm:w-auto p-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-slate-200 focus:ring-purple-500 focus:border-purple-500"
                  aria-label="Filter start date"
                />
                <input
                  type="date"
                  value={filterDateEnd}
                  onChange={(e) => setFilterDateEnd(e.target.value)}
                  className="w-full sm:w-auto p-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-slate-200 focus:ring-purple-500 focus:border-purple-500"
                  aria-label="Filter end date"
                />
                <div className="flex items-center space-x-1 bg-gray-100 dark:bg-slate-700 p-1 rounded-lg self-end sm:self-center">
                    <Button variant={viewMode === 'card' ? 'primary' : 'ghost'} size="sm" onClick={() => setViewMode('card')} className="!p-2"><Squares2X2Icon className="w-5 h-5"/></Button>
                    <Button variant={viewMode === 'list' ? 'primary' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="!p-2"><Bars3Icon className="w-5 h-5"/></Button>
                </div>
             </div>
        </div>
         <div className="mb-4 text-right text-sm font-semibold text-gray-700 dark:text-slate-200">
            Total for Filtered: <span className="text-purple-700 dark:text-purple-400">NPR {totalAmountForFiltered.toFixed(2)}</span>
        </div>


      {loadingContent && <p className="text-gray-500 dark:text-slate-400">Loading collection records...</p>}
      
      {!loadingContent && filteredRecords.length === 0 && (
        <Card className="dark:bg-slate-800">
            <CardContent>
                <p className="text-center text-gray-500 dark:text-slate-400 py-8">
                  {searchTerm || filterPurpose !== 'all' ? `No collections found matching your criteria.` : "No collection records found. Add one to get started!"}
                </p>
            </CardContent>
        </Card>
      )}

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedRecords.map(record => renderRecordCard(record))}
        </div>
      ) : (
        <Card className="overflow-x-auto">
          <CardContent>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-300 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-300 uppercase tracking-wider">Purpose</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-300 uppercase tracking-wider">Collector</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-300 uppercase tracking-wider">Source</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-300 uppercase tracking-wider">Amount (NPR)</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-slate-300 uppercase tracking-wider">Deposit</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-slate-300 uppercase tracking-wider">Donors</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                {paginatedRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-slate-200">
                      {formatDateADBS(record.collectionDate)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-slate-200">
                      {record.purpose}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-slate-200">
                      {record.collectorName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-slate-300">
                      {record.source || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-slate-100 text-right font-semibold">
                      {Number(record.amount ?? 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-center">
                      {record.isDeposited ? (
                        <span className="inline-flex items-center text-green-700 bg-green-100 px-2 py-0.5 rounded-full dark:bg-green-900/40 dark:text-green-300">
                          Deposited
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full dark:bg-yellow-900/40 dark:text-yellow-300">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-slate-200 text-center">
                      {record.donors?.length || 0}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button variant="outline" size="sm" onClick={() => generateRecordPdf(record)} className="text-xs dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">
                        <DocumentPdfIcon className="mr-1 h-4 w-4" />
                        PDF
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleOpenModal(record)} className="text-xs dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">
                        Edit
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => handleDelete(record.id)} className="!bg-red-500 hover:!bg-red-600 text-white text-xs">
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center space-x-2">
          <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} variant="outline" size="sm" className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Previous</Button>
          <span className="text-sm text-slate-600 dark:text-slate-400">Page {currentPage} of {totalPages}</span>
          <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} variant="outline" size="sm" className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Next</Button>
        </div>
      )}

      {isModalOpen && (
        <ContentFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          contentType="collectionRecord"
          initialData={editingRecord}
          isLoading={modalFormLoading}
        />
      )}
    </div>
  );
};
