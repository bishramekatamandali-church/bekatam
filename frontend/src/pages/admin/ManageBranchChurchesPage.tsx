
import React, { useState, useMemo } from 'react';
import { useContent } from '../../contexts/ContentContext';
import Card, { CardContent, CardHeader, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ContentFormModal from '../../components/admin/ContentFormModal';
import { BranchChurch, BranchChurchFormData, GenericContentFormData } from '../../types';
import { formatDateADBS } from '../../dateConverter'; 
import { PlusIcon as HeroPlusIcon, MagnifyingGlassIcon, Squares2X2Icon, Bars3Icon } from '@heroicons/react/24/outline';

const ManageBranchChurchesPage: React.FC = () => {
  const { branchChurches, addContent, updateContent, deleteContent, loadingContent } = useContent();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchChurch | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');


  const filteredBranches = useMemo(() => 
    branchChurches
      .filter(branch => 
        branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (branch.pastorName || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name)), 
  [branchChurches, searchTerm]);

  const handleOpenModal = (branch?: BranchChurch) => {
    setEditingBranch(branch || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBranch(null);
  };

  const handleSubmit = async (data: GenericContentFormData) => {
    if (editingBranch) {
      await updateContent('branchChurch', editingBranch.id, data as BranchChurchFormData);
    } else {
      await addContent('branchChurch', data as BranchChurchFormData);
    }
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this branch church? This action cannot be undone.')) {
      await deleteContent('branchChurch', id);
    }
  };
  
  const renderBranchCard = (branch: BranchChurch) => (
      <Card key={branch.id} className="flex flex-col dark:bg-slate-800">
        {branch.imageUrl && <img src={branch.imageUrl} alt={branch.name} className="w-full h-48 object-cover"/>}
        <CardHeader className="flex-grow dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-100 truncate" title={branch.name}>{branch.name}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{branch.address}</p>
          {branch.pastorName && <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">Pastor: {branch.pastorName}</p>}
        </CardHeader>
        <CardContent className="py-2 px-4 text-xs text-slate-600 dark:text-slate-300 space-y-1">
          <p><strong>Phone:</strong> {branch.phone || 'N/A'}</p>
          <p><strong>Email:</strong> {branch.email || 'N/A'}</p>
          <p><strong>Service Times:</strong> {branch.serviceTimes}</p>
          {branch.description && <p className="mt-1 italic line-clamp-2">{branch.description}</p>}
          {branch.establishedDate && <p className="text-xs text-slate-400 mt-1">Established: {formatDateADBS(branch.establishedDate)}</p>}
        </CardContent>
        <CardFooter className="flex justify-end space-x-2 bg-slate-50 dark:bg-slate-700/50 p-3">
          <Button variant="outline" size="sm" onClick={() => handleOpenModal(branch)} className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Edit</Button>
          <Button variant="secondary" size="sm" onClick={() => handleDelete(branch.id)} className="!bg-red-500 hover:!bg-red-600 text-white">Delete</Button>
        </CardFooter>
      </Card>
  );

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Manage Branch Churches</h1>
        <Button onClick={() => handleOpenModal()} variant="primary" size="sm">
          <HeroPlusIcon className="mr-1.5 h-4 w-4" /> Add Branch
        </Button>
      </div>
      
      <div className="mb-4 p-3 bg-white dark:bg-slate-800/50 rounded-lg shadow-sm flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-grow w-full sm:w-auto">
            <input 
                type="text"
                placeholder="Search by name, address, pastor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 pl-8 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm bg-white dark:bg-slate-700 dark:text-slate-200"
                aria-label="Search branches"
            />
            <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg self-end sm:self-center">
            <Button variant={viewMode === 'card' ? 'primary' : 'ghost'} size="sm" onClick={() => setViewMode('card')} className="!p-1.5" aria-label="Card View"><Squares2X2Icon className="w-5 h-5"/></Button>
            <Button variant={viewMode === 'list' ? 'primary' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="!p-1.5" aria-label="List View"><Bars3Icon className="w-5 h-5"/></Button>
        </div>
      </div>


      {loadingContent && <p className="text-slate-500 dark:text-slate-400">Loading branches...</p>}
      
      {!loadingContent && filteredBranches.length === 0 && (
        <Card className="dark:bg-slate-800">
            <CardContent>
                <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                    {searchTerm ? `No branches found matching "${searchTerm}".` : "No branch churches found. Add one to get started!"}
                </p>
            </CardContent>
        </Card>
      )}

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredBranches.map(renderBranchCard)}
        </div>
      ) : (
        <Card className="overflow-x-auto dark:bg-slate-800">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Address</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Pastor</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Service Times</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Actions</th>
                    </tr>
                </thead>
                 <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredBranches.map(branch => (
                        <tr key={branch.id}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">{branch.name}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate" title={branch.address}>{branch.address}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{branch.pastorName || 'N/A'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{branch.serviceTimes}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs font-medium space-x-1">
                                <Button variant="outline" size="sm" onClick={() => handleOpenModal(branch)} className="!p-1.5 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Edit</Button>
                                <Button variant="secondary" size="sm" onClick={() => handleDelete(branch.id)} className="!bg-red-500 hover:!bg-red-600 text-white !p-1.5">Delete</Button>
                            </td>
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
          contentType="branchChurch"
          initialData={editingBranch}
          isLoading={loadingContent}
        />
      )}
    </div>
  );
};

export default ManageBranchChurchesPage;
