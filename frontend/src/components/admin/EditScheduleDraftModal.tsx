
import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { GeneratedScheduleItem, Responsibility } from '../../types';
import BSCalendarPicker from './BSCalendarPicker';
import { formatDateADBS, adToBsSimulated, BS_MONTH_NAMES_EN, bsToAdSimulated } from '../../dateConverter';
import { PlusCircleIcon, TrashIcon } from '@heroicons/react/24/outline';

interface EditScheduleDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: Partial<GeneratedScheduleItem>) => Promise<void>;
  initialData: GeneratedScheduleItem;
  isLoading?: boolean;
}

const parseDetailsString = (detailsString?: string): Record<string, string> => {
    if (!detailsString) return {};
    const details: Record<string, string> = {};
    const lines = detailsString.split('\n');
    lines.forEach(line => {
      const parts = line.split(/:(.*)/s); // Split only on the first colon
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts[1].trim();
        if (value) details[key] = value;
      }
    });
    return details;
  };
  
  const formatLabelFromKey = (key: string): string => {
      return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

export const EditScheduleDraftModal: React.FC<EditScheduleDraftModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<GeneratedScheduleItem>>({});
  const [bsDateDisplay, setBsDateDisplay] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        groupNameOrEventTitle: initialData.groupNameOrEventTitle,
        scheduledDate: initialData.scheduledDate,
        timeSlot: initialData.timeSlot,
        responsibilities: initialData.responsibilities || [],
        location: initialData.location || '',
        contactNumber: initialData.contactNumber || '',
        additionalNotesOrProgramDetails: initialData.additionalNotesOrProgramDetails || '',
        adminNotes: initialData.adminNotes || '',
      });
      if (initialData.scheduledDate) {
        const bs = adToBsSimulated(new Date(initialData.scheduledDate));
        const monthName = BS_MONTH_NAMES_EN[bs.month - 1] || 'Unknown';
        setBsDateDisplay(`${monthName} ${bs.day}, ${bs.year} BS`);
      }
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const handleResponsibilityChange = (index: number, field: 'role' | 'assignedTo', value: string) => {
    const updatedResponsibilities = [...(formData.responsibilities || [])];
    updatedResponsibilities[index][field] = value;
    setFormData(prev => ({...prev, responsibilities: updatedResponsibilities}));
  };

  const addResponsibilityRow = () => {
    const newResponsibility: Responsibility = { id: `new-${Date.now()}`, role: '', assignedTo: '' };
    const currentResponsibilities = formData.responsibilities || [];
    setFormData(prev => ({...prev, responsibilities: [...currentResponsibilities, newResponsibility]}));
  };

  const removeResponsibilityRow = (id: string) => {
    const updatedResponsibilities = (formData.responsibilities || []).filter(r => r.id !== id);
    setFormData(prev => ({...prev, responsibilities: updatedResponsibilities}));
  };

  const handleBsDateSelect = (bsDay: number, bsMonth: number, bsYear: number) => {
    const adDate = bsToAdSimulated(bsDay, bsMonth, bsYear);
    const adDateString = adDate.toLocaleDateString('en-CA');
    setFormData(prev => ({ ...prev, scheduledDate: adDateString }));
    const monthName = BS_MONTH_NAMES_EN[bsMonth - 1] || 'Unknown';
    setBsDateDisplay(`${monthName} ${bsDay}, ${bsYear} BS`);
  };

  const getFormattedAdDatePart = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    const formatted = formatDateADBS(dateString);
    const parts = formatted.split(' (');
    return parts.length > 1 ? parts[1].replace(')', '') : formatted;
  };
  
  const parsedDetails = useMemo(() => parseDetailsString(formData.additionalNotesOrProgramDetails), [formData.additionalNotesOrProgramDetails]);

  const finalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(initialData.id, formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Schedule Draft: ${initialData.groupNameOrEventTitle}`} size="lg">
      <form onSubmit={finalSubmit}>
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-400 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
          <div>
            <label htmlFor="groupNameOrEventTitle" className="block text-xs font-medium text-slate-700 dark:text-slate-300">Title</label>
            <input type="text" name="groupNameOrEventTitle" value={formData.groupNameOrEventTitle || ''} onChange={handleChange} required className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200"/>
          </div>
          <div>
            <label htmlFor="scheduledDate" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Scheduled Date (AD: {getFormattedAdDatePart(formData.scheduledDate)} | BS: {bsDateDisplay})
            </label>
            <BSCalendarPicker initialAdDate={formData.scheduledDate} onDateSelect={handleBsDateSelect} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="timeSlot" className="block text-xs font-medium text-slate-700 dark:text-slate-300">Time Slot</label>
              <input type="text" name="timeSlot" value={formData.timeSlot || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200"/>
            </div>
            <div>
              <label htmlFor="location" className="block text-xs font-medium text-slate-700 dark:text-slate-300">Location</label>
              <input type="text" name="location" value={formData.location || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200"/>
            </div>
          </div>
           <div className="mt-4 p-3 border border-slate-200 dark:border-slate-600 rounded-lg">
                <h3 className="text-sm font-semibold mb-2 dark:text-slate-200">Responsibilities</h3>
                <div className="space-y-2">
                    {(formData.responsibilities || []).map((resp, index) => (
                        <div key={resp.id} className="grid grid-cols-10 gap-2 items-center">
                            <input type="text" placeholder="Role (e.g., Opening Prayer)" value={resp.role} onChange={e => handleResponsibilityChange(index, 'role', e.target.value)} className="col-span-4 p-2 border text-xs dark:border-slate-500 rounded dark:bg-slate-600 dark:text-slate-200"/>
                            <input type="text" placeholder="Assigned To (e.g., John Doe)" value={resp.assignedTo} onChange={e => handleResponsibilityChange(index, 'assignedTo', e.target.value)} className="col-span-5 p-2 border text-xs dark:border-slate-500 rounded dark:bg-slate-600 dark:text-slate-200"/>
                            <Button type="button" onClick={() => removeResponsibilityRow(resp.id)} variant="ghost" size="sm" className="col-span-1 !p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"><TrashIcon className="w-4 h-4 mx-auto"/></Button>
                        </div>
                    ))}
                </div>
                <Button type="button" onClick={addResponsibilityRow} size="sm" variant="outline" className="mt-3 text-xs dark:text-slate-300 dark:border-slate-500"><PlusCircleIcon className="w-4 h-4 mr-1.5"/> Add Responsibility</Button>
            </div>
          <div>
            <label htmlFor="additionalNotesOrProgramDetails" className="block text-xs font-medium text-slate-700 dark:text-slate-300">Additional Details/Program</label>
            <textarea
              name="additionalNotesOrProgramDetails"
              value={formData.additionalNotesOrProgramDetails || ''}
              onChange={handleChange}
              rows={4}
              className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200"
            />
          </div>
           <div className="mt-3 pt-3 border-t dark:border-slate-600">
             <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Specific Program Details (Auto-parsed from details above):</h4>
             <div className="space-y-1 text-xs">
                  {Object.entries(parsedDetails).map(([key, value]) => (
                      <div key={key} className="flex">
                          <span className="font-medium text-slate-500 dark:text-slate-400 w-28 flex-shrink-0">{formatLabelFromKey(key)}:</span>
                          <span className="text-slate-700 dark:text-slate-300">{value}</span>
                      </div>
                  ))}
             </div>
          </div>
          <div>
            <label htmlFor="adminNotes" className="block text-xs font-medium text-slate-700 dark:text-slate-300">Admin Notes (Internal)</label>
            <textarea name="adminNotes" value={formData.adminNotes || ''} onChange={handleChange} rows={2} className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200"/>
          </div>
        </div>
        <div className="flex justify-end space-x-3 pt-6 mt-4 border-t border-slate-200 dark:border-slate-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Cancel</Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
