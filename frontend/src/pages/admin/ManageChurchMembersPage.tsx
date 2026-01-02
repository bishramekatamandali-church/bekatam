import React, { useState, useMemo, useEffect } from 'react';
import { useContent } from '../../contexts/ContentContext';
import Card, { CardContent, CardHeader, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ContentFormModal from '../../components/admin/ContentFormModal';
import { ChurchMember, ChurchMemberFormData, GenericContentFormData } from '../../types';
import { formatDateADBS, formatTimestampADBS } from '../../dateConverter';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx'; 
import { PlusIcon as HeroPlusIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';


const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H3.75a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
  </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.59L7.72 9.53a.75.75 0 00-1.06 1.06l3.25 3.25a.75.75 0 001.06 0l3.25-3.25a.75.75 0 10-1.06-1.06L10.75 11.34V6.75z" clipRule="evenodd" />
  </svg>
);

const ViewGridIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
);

const ViewListIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
    </svg>
);

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

const ManageChurchMembersPage: React.FC = () => {
  const { churchMembers, addContent, updateContent, deleteContent, loadingContent } = useContent();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<ChurchMember | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  const churchName = "BEM Church";

  const filteredMembers = useMemo(() => {
    return churchMembers
      .filter(member => 
        member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (member.contactPhone?.includes(searchTerm))
      )
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [churchMembers, searchTerm]);

  const handleOpenModal = (member?: ChurchMember) => {
    setEditingMember(member || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
  };

  const handleSubmit = async (data: GenericContentFormData) => {
    if (editingMember) {
      await updateContent('churchMember', editingMember.id, data as ChurchMemberFormData);
    } else {
      await addContent('churchMember', data as ChurchMemberFormData);
    }
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this church member record? This action cannot be undone.')) {
      await deleteContent('churchMember', id);
    }
  };

  const generateMemberPdf = async (member: ChurchMember, appName: string) => {
    const doc = new jsPDF('p', 'mm', 'a4');

    isDevanagariFontSuccessfullyEmbedded = false;
    try {
        if (NotoSansDevanagariBase64 && NotoSansDevanagariBase64 !== "YOUR_DEVANAGARI_FONT_BASE64_STRING_HERE") {
            doc.addFileToVFS('NotoSansDevanagariCustom.ttf', NotoSansDevanagariBase64);
            doc.addFont('NotoSansDevanagariCustom.ttf', DEVANAGARI_FONT_NAME, 'normal');
            isDevanagariFontSuccessfullyEmbedded = true;
        }
    } catch (e) { console.error("Could not embed font for PDF", e); }


    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;
    const lineSpacing = 7;
    const baseFontSize = 10;
    const footerFontSize = 8;

    const memberName = `Member Profile: ${member.fullName}`;
    doc.setFont(getCurrentFont(memberName), 'bold');
    doc.setFontSize(16);
    doc.text(memberName, pageWidth / 2, yPos, { align: 'center' });
    yPos += lineSpacing * 2;

    doc.setFontSize(baseFontSize);

    const addDetail = (label: string, value: string | undefined | boolean) => {
      if (value === undefined || String(value).trim() === '') return;
      if (yPos > pageHeight - margin - 20) { doc.addPage(); yPos = margin; }
      
      const valueString = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);

      doc.setFont(getCurrentFont(label), 'bold');
      doc.text(`${label}:`, margin, yPos);
      
      doc.setFont(getCurrentFont(valueString), 'normal');
      const labelWidth = doc.getTextWidth(`${label}:`) + 2;
      const valueXPos = margin + labelWidth;
      const textBlockWidth = pageWidth - 2 * margin - labelWidth;
      const lines = doc.splitTextToSize(valueString, textBlockWidth);
      doc.text(lines, valueXPos, yPos);
      yPos += lines.length * lineSpacing * 0.85;
    };

    if (member.profileImageUrl) {
      try {
        const response = await fetch(member.profileImageUrl);
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        const imgData = await new Promise<string | ArrayBuffer | null>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
        if (imgData && typeof imgData === 'string') {
          const imgProps = doc.getImageProperties(imgData);
          const imgWidth = 30;
          const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
          doc.addImage(imgData, 'JPEG', pageWidth - margin - imgWidth, margin + 5, imgWidth, imgHeight);
        }
      } catch (e) { console.error("Error loading profile image for PDF:", e); }
    }
    
    addDetail("Full Name", member.fullName);
    addDetail("Email", member.contactEmail);
    addDetail("Phone", member.contactPhone);
    addDetail("Address", member.address);
    addDetail("Member Since", member.memberSince ? formatDateADBS(member.memberSince) : undefined);
    addDetail("Date of Birth", member.dateOfBirth ? formatDateADBS(member.dateOfBirth) : undefined);
    addDetail("Baptism Date", member.baptismDate ? formatDateADBS(member.baptismDate) : undefined);
    addDetail("Active Member", member.isActiveMember);
    addDetail("Family Members", member.familyMembers);
    if (member.notes) {
        yPos += lineSpacing / 2;
        doc.setFont(getCurrentFont("Notes:"), 'bold');
        doc.text("Notes:", margin, yPos);
        yPos += lineSpacing * 0.8;
        doc.setFont(getCurrentFont(member.notes), 'normal');
        const notesLines = doc.splitTextToSize(member.notes, pageWidth - (margin * 2));
        doc.text(notesLines, margin, yPos);
        yPos += notesLines.length * lineSpacing * 0.8;
    }
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont(BASE_FONT_NAME, 'normal'); // Footer is always base font
        doc.setFontSize(footerFontSize);
        doc.setTextColor(100);
        const footerText = `${appName} | Page ${i} of ${pageCount}`;
        const textWidth = doc.getTextWidth(footerText);
        doc.text(footerText, (pageWidth - textWidth) / 2, pageHeight - margin / 2);
    }

    doc.save(`${(member.fullName || 'Member').replace(/\s+/g, '_')}_profile.pdf`);
  };

  const excelHeaders = [
    "ID", "Full Name", "Email", "Phone", "Address", 
    "Member Since", "Date of Birth", "Baptism Date", 
    "Active Member", "Family Members", "Notes", "Profile Image URL",
    "Posted By Owner ID", "Posted By Owner Name", "Created At", "Updated At"
  ];

  const memberToExcelRow = (member: ChurchMember): (string | number | boolean | null)[] => {
    return [
      member.id,
      member.fullName,
      member.contactEmail || '',
      member.contactPhone || '',
      member.address || '',
      member.memberSince ? new Date(member.memberSince).toLocaleDateString('en-CA') : '', 
      member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString('en-CA') : '',
      member.baptismDate ? new Date(member.baptismDate).toLocaleDateString('en-CA') : '',
      member.isActiveMember ? 'Yes' : 'No',
      member.familyMembers || '',
      member.notes || '',
      member.profileImageUrl || '',
      member.postedByOwnerId || '',
      member.postedByOwnerName || '',
      member.createdAt ? new Date(member.createdAt).toISOString() : '',
      member.updatedAt ? new Date(member.updatedAt).toISOString() : ''
    ];
  };
  
  const downloadAllMembersExcel = () => {
    const dataForExcel = [
      excelHeaders,
      ...filteredMembers.map(member => memberToExcelRow(member))
    ];

    const ws = XLSX.utils.aoa_to_sheet(dataForExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Church Members");
    XLSX.writeFile(wb, "bem_church_members.xlsx");
  };
  
  const downloadSingleMemberExcel = (member: ChurchMember) => {
    const dataForExcel = [
        excelHeaders,
        memberToExcelRow(member)
    ];
    const ws = XLSX.utils.aoa_to_sheet(dataForExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Church Member");
    XLSX.writeFile(wb, `Member_${(member.fullName || 'record').replace(/\s+/g, '_')}_record.xlsx`);
  };

  const renderMemberCard = (member: ChurchMember) => (
    <Card key={member.id} className="flex flex-col">
      <CardHeader className="flex items-start space-x-4">
        {member.profileImageUrl ? (
          <img src={member.profileImageUrl} alt={member.fullName} className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"/>
        ) : (
           <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-3xl font-bold">
              {(member.fullName || 'M').charAt(0).toUpperCase()}
           </div>
        )}
        <div className="flex-grow">
          <h2 className="text-lg font-semibold text-gray-700 truncate" title={member.fullName}>{member.fullName}</h2>
          <p className={`text-xs font-medium ${member.isActiveMember ? 'text-green-600' : 'text-red-500'}`}>
              {member.isActiveMember ? 'Active Member' : 'Inactive Member'}
          </p>
          <p className="text-xs text-gray-500">Joined: {formatDateADBS(member.memberSince).split(' ')[0]}</p>
        </div>
      </CardHeader>
      <CardContent className="py-2 px-4 text-xs text-gray-600 space-y-1 flex-grow">
          {member.contactEmail && <p><strong>Email:</strong> {member.contactEmail}</p>}
          {member.contactPhone && <p><strong>Phone:</strong> {member.contactPhone}</p>}
          {member.dateOfBirth && <p><strong>DOB:</strong> {formatDateADBS(member.dateOfBirth).split(' ')[0]}</p>}
          {member.baptismDate && <p><strong>Baptized:</strong> {formatDateADBS(member.baptismDate).split(' ')[0]}</p>}
          {member.address && <p className="line-clamp-1"><strong>Address:</strong> {member.address}</p>}
          {member.familyMembers && <p className="line-clamp-1"><strong>Family:</strong> {member.familyMembers}</p>}
          {member.notes && <p className="mt-1 italic line-clamp-2"><strong>Notes:</strong> {member.notes}</p>}
      </CardContent>
      <CardFooter className="flex flex-wrap justify-end gap-2 bg-gray-50 p-3">
        <Button variant="outline" size="sm" onClick={() => downloadSingleMemberExcel(member)} className="text-xs">
            <ArrowDownTrayIcon className="mr-1 h-4 w-4"/> Excel
        </Button>
        <Button variant="outline" size="sm" onClick={() => generateMemberPdf(member, churchName)} className="text-xs">
          <DownloadIcon className="mr-1 h-4 w-4"/> PDF
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleOpenModal(member)} className="text-xs">Edit</Button>
        <Button variant="secondary" size="sm" onClick={() => handleDelete(member.id)} className="!bg-red-500 hover:!bg-red-600 text-white text-xs">Delete</Button>
      </CardFooter>
    </Card>
  );

  const tableColumns = [
    { header: "ID", accessor: (m: ChurchMember) => m.id, hiddenInList: true, hiddenInExcel: false },
    { header: "Full Name", accessor: (m: ChurchMember) => m.fullName, hiddenInList: false, hiddenInExcel: false },
    { header: "Email", accessor: (m: ChurchMember) => m.contactEmail || 'N/A', hiddenInList: true, hiddenInExcel: false },
    { header: "Phone", accessor: (m: ChurchMember) => m.contactPhone || 'N/A', hiddenInList: false, hiddenInExcel: false },
    { header: "Address", accessor: (m: ChurchMember) => m.address || 'N/A', hiddenInList: true, hiddenInExcel: true, truncate: true },
    { header: "Member Since", accessor: (m: ChurchMember) => formatDateADBS(m.memberSince).split(' ')[0], hiddenInList: false, hiddenInExcel: false },
    { header: "Status", accessor: (m: ChurchMember) => m.isActiveMember ? 'Active' : 'Inactive', hiddenInList: false, hiddenInExcel: false,
      cellClass: (m: ChurchMember) => m.isActiveMember ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800' },
    { header: "Actions", accessor: null, hiddenInList: false, hiddenInExcel: false }
  ];


  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-3">
        <div>
            <h1 className="text-2xl font-semibold text-gray-800">Manage Church Members</h1>
            <p className="text-sm text-gray-500">Add, view, edit, and manage church member records.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={() => handleOpenModal()} variant="primary" size="sm" className="w-full sm:w-auto">
            <HeroPlusIcon className="mr-1.5 h-4 w-4" /> Add New Member
            </Button>
             <Button 
                onClick={downloadAllMembersExcel} 
                variant="outline" 
                size="sm" 
                className="w-full sm:w-auto dark:text-purple-300 dark:border-purple-500 dark:hover:bg-purple-700 dark:hover:text-white"
                disabled={filteredMembers.length === 0}
                title={filteredMembers.length === 0 ? "No members to download" : "Download all members as Excel"}
            >
                <ArrowDownTrayIcon className="mr-1.5 h-4 w-4" /> Download Excel
            </Button>
        </div>
      </div>
      
      <div className="mb-4 flex flex-col sm:flex-row gap-4 items-center">
        <input 
            type="text"
            placeholder="Search members by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:flex-grow p-2.5 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            aria-label="Search church members"
        />
        <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-md">
            <Button 
                variant={viewMode === 'card' ? 'primary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('card')} 
                className={`px-3 py-1.5 ${viewMode === 'card' ? '' : '!text-gray-600'}`}
                aria-pressed={viewMode === 'card'}
                aria-label="Card View"
            >
                <ViewGridIcon className="w-5 h-5" />
            </Button>
            <Button 
                variant={viewMode === 'list' ? 'primary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('list')} 
                className={`px-3 py-1.5 ${viewMode === 'list' ? '' : '!text-gray-600'}`}
                aria-pressed={viewMode === 'list'}
                aria-label="List View"
            >
                <ViewListIcon className="w-5 h-5" />
            </Button>
        </div>
      </div>


      {loadingContent && <p className="text-gray-500">Loading member records...</p>}
      
      {!loadingContent && filteredMembers.length === 0 && (
        <Card>
            <CardContent>
                <p className="text-center text-gray-500 py-8">
                    {searchTerm ? `No members found matching "${searchTerm}".` : "No church members recorded yet. Add one to get started!"}
                </p>
            </CardContent>
        </Card>
      )}

      {viewMode === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map(member => renderMemberCard(member))}
        </div>
      )}
      
      {viewMode === 'list' && !loadingContent && filteredMembers.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profile</th>
                {tableColumns.filter(col => !col.hiddenInList).map(col => (
                    <th key={col.header} scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <tr key={member.id}>
                  <td className="px-4 py-3 whitespace-nowrap">
                      {member.profileImageUrl ? (
                        <img src={member.profileImageUrl} alt={member.fullName} className="w-10 h-10 rounded-full object-cover"/>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold">
                          {(member.fullName || 'M').charAt(0).toUpperCase()}
                        </div>
                      )}
                  </td>
                  {tableColumns.filter(col => !col.hiddenInList).map(col => {
                    if (col.accessor === null) { // Actions column
                        return (
                            <td key={`${member.id}-${col.header}`} className="px-4 py-3 whitespace-nowrap text-xs font-medium space-x-1">
                                <Button variant="outline" size="sm" onClick={() => downloadSingleMemberExcel(member)} className="!p-1.5 text-xs" aria-label={`Download Excel for ${member.fullName}`}>
                                    <ArrowDownTrayIcon className="w-4 h-4"/>
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => generateMemberPdf(member, churchName)} className="!p-1.5 text-xs" aria-label={`Download PDF for ${member.fullName}`}>
                                <DownloadIcon className="w-4 h-4"/>
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleOpenModal(member)} className="!p-1.5 text-xs">Edit</Button>
                                <Button variant="secondary" size="sm" onClick={() => handleDelete(member.id)} className="!bg-red-500 hover:!bg-red-600 text-white !p-1.5 text-xs">Del</Button>
                            </td>
                        );
                    }
                    const cellValue = col.accessor(member);
                    const cellClass = col.cellClass ? col.cellClass(member) : '';
                    const cellContent = <span className={col.header === 'Status' ? `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${cellClass}` : ''}>{cellValue}</span>;

                    return (
                        <td key={`${member.id}-${col.header}`} className={`px-4 py-3 whitespace-nowrap text-sm ${col.header === 'Full Name' ? 'font-medium text-gray-900' : 'text-gray-500'} ${col.truncate ? 'max-w-xs truncate' : ''}`} title={col.truncate ? String(cellValue) : undefined}>
                            {cellContent}
                        </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}


      {isModalOpen && (
        <ContentFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          contentType="churchMember"
          initialData={editingMember}
          isLoading={loadingContent}
        />
      )}
    </div>
  );
};

export default ManageChurchMembersPage;
