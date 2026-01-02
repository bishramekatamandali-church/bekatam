import React, { useState, useMemo } from 'react';
import { useContent } from '../../contexts/ContentContext';
import Card, { CardContent, CardHeader, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ContentFormModal from '../../components/admin/ContentFormModal';
import { Advertisement, AdvertisementFormData, GenericContentFormData, AD_SIZES } from '../../types';
import { formatDateADBS } from '../../dateConverter';
import { PlusIcon as HeroPlusIcon, MagnifyingGlassIcon, Squares2X2Icon, Bars3Icon, PresentationChartLineIcon, CheckCircleIcon, XCircleIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';


const ManageAdvertisementsPage: React.FC = () => {
  const { advertisements, addContent, updateContent, deleteContent, loadingContent } = useContent();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  const filteredAds = useMemo(() => {
    return advertisements
      .filter(ad => {
        const statusMatch = statusFilter === 'all' || (statusFilter === 'active' && ad.isActive) || (statusFilter === 'inactive' && !ad.isActive);
        const searchMatch = ad.name.toLowerCase().includes(searchTerm.toLowerCase());
        return statusMatch && searchMatch;
      })
      .sort((a, b) => (a.displayOrder ?? Infinity) - (b.displayOrder ?? Infinity) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [advertisements, searchTerm, statusFilter]);

  const stats = useMemo(() => ({
    total: advertisements.length,
    active: advertisements.filter(ad => ad.isActive).length,
    impressions: 12560, // Simulated
    clicks: 892, // Simulated
  }), [advertisements]);

  const handleOpenModal = (ad?: Advertisement) => {
    setEditingAd(ad || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAd(null);
  };

  const handleSubmit = async (data: GenericContentFormData) => {
    const adData = data as AdvertisementFormData;
    if (editingAd) {
      await updateContent('advertisement', editingAd.id, adData);
    } else {
      await addContent('advertisement', adData);
    }
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this advertisement?')) {
      await deleteContent('advertisement', id);
    }
  };
  
  const renderAdCard = (ad: Advertisement) => (
     <Card key={ad.id} className="flex flex-col dark:bg-slate-800">
        <div className="relative aspect-video bg-slate-200 dark:bg-slate-700">
             <img src={ad.imageUrl || ad.videoUrl} alt={ad.altText || ad.name} className="w-full h-full object-cover"/>
             <span className="absolute top-2 right-2 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded capitalize">{ad.adType.replace('_', ' ')}</span>
        </div>
        <div className="flex-grow p-3">
          <div className="flex justify-between items-start mb-1">
            <h2 className="text-md font-semibold text-slate-700 dark:text-slate-100 line-clamp-2" title={ad.name}>{ad.name}</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ad.isActive ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300'}`}>
              {ad.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Size: {ad.adSizeKey ? AD_SIZES[ad.adSizeKey] : 'N/A'} | Order: {ad.displayOrder ?? 'N/A'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1" title={ad.linkUrl}>Links to: {ad.linkUrl}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Schedule: {ad.startDate ? formatDateADBS(ad.startDate) : 'Always'} - {ad.endDate ? formatDateADBS(ad.endDate) : 'Never Expires'}
          </p>
          <div className="mt-2 h-10 overflow-y-auto">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Placements: </span>
            {ad.placements.map(p => (
                <span key={p} className="text-[10px] bg-purple-100 dark:bg-purple-700/50 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-full mr-1 mb-1 inline-block">{p}</span>
            ))}
          </div>
        </div>
        <CardFooter className="flex justify-end space-x-2 p-2 bg-slate-50 dark:bg-slate-700/50">
          <Button variant="outline" size="sm" onClick={() => handleOpenModal(ad)} className="text-xs dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Edit</Button>
          <Button variant="secondary" size="sm" onClick={() => handleDelete(ad.id)} className="!bg-red-500 hover:!bg-red-600 text-white text-xs">Delete</Button>
        </CardFooter>
      </Card>
  );

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-3">
        <div>
            <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Manage Advertisements</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Create, manage, and monitor ad campaigns.</p>
        </div>
        <Button onClick={() => handleOpenModal()} variant="primary" size="sm">
          <HeroPlusIcon className="mr-1.5 h-4 w-4" /> Add Advertisement
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="dark:bg-slate-800"><CardHeader className="!pb-2"><h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Ads</h3></CardHeader><CardContent><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
        <Card className="dark:bg-slate-800"><CardHeader className="!pb-2"><h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Campaigns</h3></CardHeader><CardContent><p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p></CardContent></Card>
        <Card className="dark:bg-slate-800"><CardHeader className="!pb-2"><h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Impressions</h3></CardHeader><CardContent><p className="text-2xl font-bold">{stats.impressions.toLocaleString()}</p></CardContent></Card>
        <Card className="dark:bg-slate-800"><CardHeader className="!pb-2"><h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Clicks</h3></CardHeader><CardContent><p className="text-2xl font-bold">{stats.clicks.toLocaleString()}</p></CardContent></Card>
      </div>

       <div className="mb-4 p-3 bg-white dark:bg-slate-800/50 rounded-lg shadow-sm flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-grow w-full sm:w-auto">
            <input type="text" placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 pl-8 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm bg-white dark:bg-slate-700 dark:text-slate-200" aria-label="Search ads"/>
            <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="w-full sm:w-auto p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-slate-200" aria-label="Filter by status">
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
        </select>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg self-end sm:self-center">
            <Button variant={viewMode === 'card' ? 'primary' : 'ghost'} size="sm" onClick={() => setViewMode('card')} className="!p-1.5" aria-label="Card View"><Squares2X2Icon className="w-5 h-5"/></Button>
            <Button variant={viewMode === 'list' ? 'primary' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="!p-1.5" aria-label="List View"><Bars3Icon className="w-5 h-5"/></Button>
        </div>
      </div>

      {loadingContent && <p className="text-slate-500 dark:text-slate-400">Loading advertisements...</p>}
      
      {!loadingContent && filteredAds.length === 0 && (
        <Card className="dark:bg-slate-800"><CardContent><p className="text-center text-slate-500 dark:text-slate-400 py-8">{searchTerm ? `No ads found for "${searchTerm}".` : "No advertisements found. Add one to get started!"}</p></CardContent></Card>
      )}

      {viewMode === 'card' ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAds.map(renderAdCard)}
        </div>
      ) : (
        <Card className="overflow-x-auto dark:bg-slate-800">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Preview</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Type / Size</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Clicks</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Impressions</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Actions</th>
                    </tr>
                </thead>
                 <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredAds.map(ad => (
                        <tr key={ad.id}>
                            <td className="px-4 py-3"><img src={ad.imageUrl || ad.videoUrl} alt={ad.altText || ad.name} className="w-20 h-12 object-cover rounded"/></td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">{ad.name}</td>
                            <td className="px-4 py-3"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ad.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{ad.isActive ? 'Active' : 'Inactive'}</span></td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 capitalize">{ad.adType.replace('_', ' ')} <br/> <span className="text-xs">{ad.adSizeKey ? AD_SIZES[ad.adSizeKey] : 'N/A'}</span></td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 text-right">521</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 text-right">8,123</td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs font-medium space-x-1">
                                <Button variant="outline" size="sm" onClick={() => handleOpenModal(ad)} className="!p-1.5 dark:text-slate-300 dark:border-slate-600">Edit</Button>
                                <Button variant="secondary" size="sm" onClick={() => handleDelete(ad.id)} className="!bg-red-500 hover:!bg-red-600 !p-1.5">Delete</Button>
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
          contentType="advertisement"
          initialData={editingAd}
          isLoading={loadingContent}
        />
      )}
    </div>
  );
};

export default ManageAdvertisementsPage;