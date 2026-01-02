
import * as XLSX from 'xlsx';
import {
  ExpenseRecord, CollectionRecord, DonationRecord, ChurchMember, MeetingLog, FellowshipRosterItem, GeneratedScheduleItem, MeetingDecisionPoint, DonorDetail, Responsibility
} from '../types'; // Adjust path as necessary
import { formatDateADBS, formatTimestampADBS } from '../dateConverter'; // Adjust path as necessary

const XLSX_CELL_CHAR_LIMIT = 255;

interface CellCommentInstruction {
  r: number; // 0-indexed row for data (add 1 for actual sheet row due to header)
  c: number; // 0-indexed column
  text: string;
}

interface SheetPreparationResult {
  sheetData: any[][];
  comments: CellCommentInstruction[];
  columnWidths: { wch: number }[];
}

const getResponsibility = (responsibilities: Responsibility[] | undefined, roleName: string): string => {
    if (!responsibilities) return '';
    const resp = responsibilities.find(r => r.role.toLowerCase().includes(roleName.toLowerCase()));
    return resp ? resp.assignedTo : '';
};

const prepareCell = (value: any, isLargeContentField: boolean): { cellValue: string, commentText?: string } => {
  if (value === null || value === undefined) {
    return { cellValue: '' };
  }
  const stringValue = String(value);
  if (isLargeContentField && stringValue.length > XLSX_CELL_CHAR_LIMIT) {
    return {
      cellValue: stringValue.substring(0, XLSX_CELL_CHAR_LIMIT - 3) + "...",
      commentText: stringValue
    };
  }
  return { cellValue: stringValue };
};

// Expense Records Sheet
const prepareExpenseSheetData = (items: ExpenseRecord[]): SheetPreparationResult => {
  const headers = ["ID", "Expense Date (AD)", "Category", "Description", "Amount (NPR)", "Payee", "Payment Method", "Transaction Ref.", "Approved By", "Receipt URL", "Notes", "Source", "Location", "Posted By ID", "Posted By Name", "Created At (ISO)", "Updated At (ISO)"];
  const largeContentFieldIndices = { description: 3, notes: 10 };
  const columnWidths = [
    { wch: 28 }, { wch: 15 }, { wch: 20 }, { wch: 40 }, { wch: 15 }, { wch: 25 }, { wch: 18 }, 
    { wch: 25 }, { wch: 20 }, { wch: 30 }, { wch: 40 }, { wch: 20 }, { wch: 20 },
    { wch: 28 }, { wch: 20 }, { wch: 25 }, { wch: 25 }
  ];
  const sheetDataArray: any[][] = [headers];
  const comments: CellCommentInstruction[] = [];

  items.forEach((item, rowIndex) => {
    const row: any[] = [];
    const { cellValue: descValue, commentText: descComment } = prepareCell(item.description, true);
    if (descComment) comments.push({ r: rowIndex + 1, c: largeContentFieldIndices.description, text: descComment });
    
    const { cellValue: notesValue, commentText: notesComment } = prepareCell(item.notes, true);
    if (notesComment) comments.push({ r: rowIndex + 1, c: largeContentFieldIndices.notes, text: notesComment });

    row.push(
      item.id, new Date(item.expenseDate).toLocaleDateString('en-CA'), item.category, descValue, item.amount.toFixed(2),
      item.payee || '', item.paymentMethod || '', item.transactionReference || '', item.approvedBy || '',
      item.receiptUrl || '', notesValue, item.source || '', item.location || '',
      item.postedByOwnerId || '', item.postedByOwnerName || '',
      item.createdAt ? new Date(item.createdAt).toISOString() : '',
      item.updatedAt ? new Date(item.updatedAt).toISOString() : ''
    );
    sheetDataArray.push(row);
  });
  return { sheetData: sheetDataArray, comments, columnWidths };
};

// Collection Records Sheet
const prepareCollectionSheetData = (items: CollectionRecord[]): SheetPreparationResult => {
  const headers = ["ID", "Collection Date (AD)", "Purpose", "Total Amount (NPR)", "Collector Name", "Source", "Notes", "# Donors", "Donor Details", "Recorded At (ISO)", "Recorded By ID", "Recorded By Name", "Updated At (ISO)"];
  const largeContentFieldIndices = { notes: 6, donorDetails: 8 };
  const columnWidths = [
    { wch: 28 }, { wch: 15 }, { wch: 25 }, { wch: 18 }, { wch: 25 }, { wch: 20 }, { wch: 40 },
    { wch: 8 }, { wch: 50 }, { wch: 25 }, { wch: 28 }, { wch: 20 }, { wch: 25 }
  ];

  const sheetDataArray: any[][] = [headers];
  const comments: CellCommentInstruction[] = [];

  items.forEach((item, rowIndex) => {
    const row: any[] = [];
    const donorSummary = (item.donors || []).map(d => `${d.donorName}: ${d.amount.toFixed(2)} (Addr: ${d.address || 'N/A'}, Contact: ${d.contact || 'N/A'})`).join('; ');
    
    const { cellValue: notesValue, commentText: notesComment } = prepareCell(item.notes, true);
    if (notesComment) comments.push({ r: rowIndex + 1, c: largeContentFieldIndices.notes, text: notesComment });

    const { cellValue: donorDetailsValue, commentText: donorDetailsComment } = prepareCell(donorSummary, true);
    if (donorDetailsComment) comments.push({ r: rowIndex + 1, c: largeContentFieldIndices.donorDetails, text: donorDetailsComment });

    row.push(
      item.id, new Date(item.collectionDate).toLocaleDateString('en-CA'), item.purpose, item.amount.toFixed(2),
      item.collectorName, item.source || '', notesValue, (item.donors || []).length, donorDetailsValue,
      new Date(item.recordedAt).toISOString(), item.recordedByOwnerId || '', item.recordedByOwnerName || '',
      item.updatedAt ? new Date(item.updatedAt).toISOString() : ''
    );
    sheetDataArray.push(row);
  });
  return { sheetData: sheetDataArray, comments, columnWidths };
};

// Donation Records Sheet
const prepareDonationSheetData = (items: DonationRecord[]): SheetPreparationResult => {
  const headers = ["ID", "Donor Name", "Email", "Phone", "Amount (NPR)", "Purpose", "Donation Date (AD)", "Transaction Timestamp (ISO)"];
  const columnWidths = [{ wch: 28 }, { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 25 }];
  const sheetDataArray: any[][] = [headers];
  items.forEach(item => {
    sheetDataArray.push([
      item.id, item.donorName, item.donorEmail, item.donorPhone || '', item.amount.toFixed(2), item.purpose,
      new Date(item.donationDate).toLocaleDateString('en-CA'), new Date(item.transactionTimestamp).toISOString()
    ]);
  });
  return { sheetData: sheetDataArray, comments: [], columnWidths };
};

// Church Members Sheet
const prepareMemberSheetData = (items: ChurchMember[]): SheetPreparationResult => {
  const headers = ["ID", "Full Name", "Email", "Phone", "Address", "Member Since (AD)", "DOB (AD)", "Baptism Date (AD)", "Active", "Family Members", "Notes", "Profile Image URL", "Posted By ID", "Posted By Name", "Created At (ISO)", "Updated At (ISO)"];
  const largeContentFieldIndices = { address: 4, familyMembers: 9, notes: 10 };
  const columnWidths = [
    { wch: 28 }, { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, 
    { wch: 10 }, { wch: 30 }, { wch: 50 }, { wch: 30 }, { wch: 28 }, { wch: 20 }, { wch: 25 }, { wch: 25 }
  ];
  const sheetDataArray: any[][] = [headers];
  const comments: CellCommentInstruction[] = [];

  items.forEach((item, rowIndex) => {
    const row: any[] = [];
    const { cellValue: addrValue, commentText: addrComment } = prepareCell(item.address, true);
    if (addrComment) comments.push({ r: rowIndex + 1, c: largeContentFieldIndices.address, text: addrComment });
    
    const { cellValue: familyValue, commentText: familyComment } = prepareCell(item.familyMembers, true);
    if (familyComment) comments.push({ r: rowIndex + 1, c: largeContentFieldIndices.familyMembers, text: familyComment });
    
    const { cellValue: notesValue, commentText: notesComment } = prepareCell(item.notes, true);
    if (notesComment) comments.push({ r: rowIndex + 1, c: largeContentFieldIndices.notes, text: notesComment });

    row.push(
      item.id, item.fullName, item.contactEmail || '', item.contactPhone || '', addrValue,
      item.memberSince ? new Date(item.memberSince).toLocaleDateString('en-CA') : '',
      item.dateOfBirth ? new Date(item.dateOfBirth).toLocaleDateString('en-CA') : '',
      item.baptismDate ? new Date(item.baptismDate).toLocaleDateString('en-CA') : '',
      item.isActiveMember ? "Yes" : "No", familyValue, notesValue, item.profileImageUrl || '',
      item.postedByOwnerId || '', item.postedByOwnerName || '',
      item.createdAt ? new Date(item.createdAt).toISOString() : '',
      item.updatedAt ? new Date(item.updatedAt).toISOString() : ''
    );
    sheetDataArray.push(row);
  });
  return { sheetData: sheetDataArray, comments, columnWidths };
};

// Meeting Logs Sheet
const prepareMeetingSheetData = (items: MeetingLog[]): SheetPreparationResult => {
  const headers = ["ID", "Meeting Date (AD)", "Title", "Type", "Attendees", "Agenda", "Minutes", "Action Items", "Status", "Image URL", "Decision Points", "Posted By ID", "Posted By Name", "Created At (ISO)", "Updated At (ISO)"];
  const largeContentFieldIndices = { attendees: 4, agenda: 5, minutes: 6, actionItems: 7, decisionPoints: 10 };
  const columnWidths = [
    { wch: 28 }, { wch: 15 }, { wch: 30 }, { wch: 25 }, { wch: 40 }, { wch: 50 }, { wch: 60 }, 
    { wch: 40 }, { wch: 20 }, { wch: 30 }, { wch: 50 }, { wch: 28 }, { wch: 20 }, { wch: 25 }, { wch: 25 }
  ];
  const sheetDataArray: any[][] = [headers];
  const comments: CellCommentInstruction[] = [];

  items.forEach((item, rowIndex) => {
    const row: any[] = [];
    const decisionSummary = (item.decisionPoints || []).map(dp => `${dp.description} (Proposed by: ${dp.proposedBy || 'N/A'}, Status: ${dp.status}, Resolution: ${dp.resolutionDate ? formatDateADBS(dp.resolutionDate) : 'N/A'}, Notes: ${dp.followUpNotes || ''})`).join('; \n');

    const fieldValues = {
        attendees: item.attendees,
        agenda: item.agenda,
        minutes: item.minutes,
        actionItems: item.actionItems,
        decisionPoints: decisionSummary
    };

    const processedCells: { [key: string]: { cellValue: string, commentText?: string } } = {};
    for (const key in largeContentFieldIndices) {
        const fieldKey = key as keyof typeof fieldValues;
        processedCells[fieldKey] = prepareCell(fieldValues[fieldKey], true);
        if (processedCells[fieldKey].commentText) {
            comments.push({ r: rowIndex + 1, c: largeContentFieldIndices[fieldKey as keyof typeof largeContentFieldIndices], text: processedCells[fieldKey].commentText! });
        }
    }
    
    row.push(
      item.id, new Date(item.meetingDate).toLocaleDateString('en-CA'), item.title, item.meetingType || '',
      processedCells.attendees.cellValue, processedCells.agenda.cellValue, processedCells.minutes.cellValue, processedCells.actionItems.cellValue,
      item.status || '', item.imageUrl || '', processedCells.decisionPoints.cellValue,
      item.postedByOwnerId || '', item.postedByOwnerName || '',
      item.createdAt ? new Date(item.createdAt).toISOString() : '',
      item.updatedAt ? new Date(item.updatedAt).toISOString() : ''
    );
    sheetDataArray.push(row);
  });
  return { sheetData: sheetDataArray, comments, columnWidths };
};

// Fellowship Rosters Sheet
const prepareRosterSheetData = (items: FellowshipRosterItem[]): SheetPreparationResult => {
  const headers = ["ID", "Roster Type", "Group/Event Title", "Assigned Date (AD)", "Time Slot", "Coordinator", "Co-Coordinator", "Choir", "Speaker/Program", "Location", "Contact", "Details", "Is Template", "Posted By ID", "Posted By Name", "Created At (ISO)", "Updated At (ISO)"];
  const largeContentFieldIndex = 11; // additionalNotesOrProgramDetails
  const columnWidths = [
    { wch: 28 }, { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
    { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 50 }, { wch: 10 }, { wch: 28 }, { wch: 20 }, { wch: 25 }, { wch: 25 }
  ];
  const sheetDataArray: any[][] = [headers];
  const comments: CellCommentInstruction[] = [];

  items.forEach((item, rowIndex) => {
    const row: any[] = [];
    const { cellValue, commentText } = prepareCell(item.additionalNotesOrProgramDetails, true);
    if (commentText) comments.push({ r: rowIndex + 1, c: largeContentFieldIndex, text: commentText });
    
    row.push(
      item.id, item.rosterType, item.groupNameOrEventTitle, new Date(item.assignedDate).toLocaleDateString('en-CA'), item.timeSlot,
      getResponsibility(item.responsibilities, 'coordinator'),
      getResponsibility(item.responsibilities, 'co-coordinator'),
      getResponsibility(item.responsibilities, 'choir'),
      getResponsibility(item.responsibilities, 'sermon') || getResponsibility(item.responsibilities, 'speaker'),
      item.location || '', item.contactNumber || '', cellValue, item.isTemplate ? "Yes" : "No",
      item.postedByOwnerId || '', item.postedByOwnerName || '',
      item.createdAt ? new Date(item.createdAt).toISOString() : '',
      item.updatedAt ? new Date(item.updatedAt).toISOString() : ''
    );
    sheetDataArray.push(row);
  });
  return { sheetData: sheetDataArray, comments, columnWidths };
};

// Generated Schedules Sheet
const prepareScheduleSheetData = (items: GeneratedScheduleItem[]): SheetPreparationResult => {
  const headers = ["ID", "Roster Type", "Group/Event Title", "Scheduled Date (AD)", "Time Slot", "Coordinator", "Co-Coordinator", "Choir", "Speaker/Program", "Location", "Contact", "Details/Program", "Admin Notes", "Published", "Event ID", "Generated At (ISO)", "Based on Roster ID", "Posted By ID", "Posted By Name", "Created At (ISO)", "Updated At (ISO)"];
  const largeContentFieldIndices = { details: 11, adminNotes: 12 };
  const columnWidths = [
    { wch: 28 }, { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
    { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 50 }, { wch: 40 }, { wch: 10 }, { wch: 28 }, { wch: 25 },
    { wch: 28 }, { wch: 28 }, { wch: 20 }, { wch: 25 }, { wch: 25 }
  ];
  const sheetDataArray: any[][] = [headers];
  const comments: CellCommentInstruction[] = [];

  items.forEach((item, rowIndex) => {
    const row: any[] = [];
    const { cellValue: detailsValue, commentText: detailsComment } = prepareCell(item.additionalNotesOrProgramDetails, true);
    if (detailsComment) comments.push({ r: rowIndex + 1, c: largeContentFieldIndices.details, text: detailsComment });

    const { cellValue: adminNotesValue, commentText: adminNotesComment } = prepareCell(item.adminNotes, true);
    if (adminNotesComment) comments.push({ r: rowIndex + 1, c: largeContentFieldIndices.adminNotes, text: adminNotesComment });

    row.push(
      item.id, item.rosterType, item.groupNameOrEventTitle, new Date(item.scheduledDate).toLocaleDateString('en-CA'), item.timeSlot,
      getResponsibility(item.responsibilities, 'coordinator'),
      getResponsibility(item.responsibilities, 'co-coordinator'),
      getResponsibility(item.responsibilities, 'choir'),
      getResponsibility(item.responsibilities, 'sermon') || getResponsibility(item.responsibilities, 'speaker'),
      item.location || '', item.contactNumber || '', detailsValue, adminNotesValue,
      item.isPublishedAsEvent ? "Yes" : "No", item.publishedEventId || '', new Date(item.generatedAt).toISOString(),
      item.basedOnRosterItemId || '', item.postedByOwnerId || '', item.postedByOwnerName || '',
      item.createdAt ? new Date(item.createdAt).toISOString() : '',
      item.updatedAt ? new Date(item.updatedAt).toISOString() : ''
    );
    sheetDataArray.push(row);
  });
  return { sheetData: sheetDataArray, comments, columnWidths };
};


export interface AllAdminDataForReport {
  expenses: ExpenseRecord[];
  collections: CollectionRecord[];
  donations: DonationRecord[];
  members: ChurchMember[];
  meetings: MeetingLog[];
  rosters: FellowshipRosterItem[];
  schedules: GeneratedScheduleItem[];
}

export const generateJumboAdminReport = (data: AllAdminDataForReport): void => {
  const wb = XLSX.utils.book_new();

  const sheetConfigs = [
    { name: "Expense Records", items: data.expenses, prepareFunc: prepareExpenseSheetData },
    { name: "Collection Records", items: data.collections, prepareFunc: prepareCollectionSheetData },
    { name: "Donation Records", items: data.donations, prepareFunc: prepareDonationSheetData },
    { name: "Church Members", items: data.members, prepareFunc: prepareMemberSheetData },
    { name: "Meeting Logs", items: data.meetings, prepareFunc: prepareMeetingSheetData },
    { name: "Fellowship Rosters", items: data.rosters, prepareFunc: prepareRosterSheetData },
    { name: "Generated Schedules", items: data.schedules, prepareFunc: prepareScheduleSheetData },
  ];

  sheetConfigs.forEach(config => {
    if (config.items && config.items.length > 0) {
      // @ts-ignore // TypeScript might struggle with the generic nature here if not perfectly aligned
      const { sheetData, comments, columnWidths } = config.prepareFunc(config.items);
      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      ws['!cols'] = columnWidths;

      comments.forEach(comment => {
        const cellRef = XLSX.utils.encode_cell({ r: comment.r, c: comment.c });
        if (!ws[cellRef]) { // Should not happen if aoa_to_sheet worked correctly with prepareCell
            ws[cellRef] = { t: 's', v: sheetData[comment.r][comment.c] }; // Use value from sheetData
        }
        ws[cellRef].c = [{ a: "Full Content", t: comment.text.replace(/\r\n/g, "\n") }]; // Normalize newlines for Excel comments
      });
      XLSX.utils.book_append_sheet(wb, ws, config.name);
    } else {
        // Create an empty sheet with headers if no data
        // @ts-ignore
        const { sheetData: headerOnlyData, columnWidths } = config.prepareFunc([]); 
        const ws = XLSX.utils.aoa_to_sheet(headerOnlyData);
        ws['!cols'] = columnWidths;
        XLSX.utils.book_append_sheet(wb, ws, config.name);
    }
  });

  XLSX.writeFile(wb, "BEM_Church_Admin_Jumbo_Report.xlsx");
};