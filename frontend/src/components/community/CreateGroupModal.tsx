import React, { useState, useMemo, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useContent } from '../../contexts/ContentContext';
import { User, GroupFormData, GroupPermissionSetting } from '../../types';
import AdvancedMediaUploader from '../admin/AdvancedMediaUploader';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PermissionSelector: React.FC<{
    label: string;
    description: string;
    value: GroupPermissionSetting;
    onChange: (value: GroupPermissionSetting) => void;
}> = ({ label, description, value, onChange }) => (
    <div className="py-3 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
        <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">{label}</label>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{description}</p>
        <div className="flex gap-4">
            <div className="flex items-center">
                <input id={`${label}-admins`} name={label} type="radio" value="admins_only" checked={value === 'admins_only'} onChange={(e) => onChange(e.target.value as GroupPermissionSetting)} className="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500"/>
                <label htmlFor={`${label}-admins`} className="ml-2 block text-sm text-slate-700 dark:text-slate-300">Admins Only</label>
            </div>
            <div className="flex items-center">
                <input id={`${label}-all`} name={label} type="radio" value="all_members" checked={value === 'all_members'} onChange={(e) => onChange(e.target.value as GroupPermissionSetting)} className="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500"/>
                <label htmlFor={`${label}-all`} className="ml-2 block text-sm text-slate-700 dark:text-slate-300">All Members</label>
            </div>
        </div>
    </div>
);


const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, friendships, getAllUsers } = useAuth();
  const { addContent } = useContent();

  const [groupName, setGroupName] = useState('');
  const [groupImageUrl, setGroupImageUrl] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [permissions, setPermissions] = useState<GroupFormData['permissions']>({
    editSettings: 'admins_only',
    sendMessage: 'all_members',
    addMembers: 'admins_only',
    approveMembers: 'admins_only',
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const friends = useMemo(() => {
    if (!currentUser) return [];
    const allUsersMap = new Map(getAllUsers().map(u => [u.id, u]));
    const myFriends: User[] = [];
    friendships.forEach(f => {
      if (f.status === 'accepted') {
        const friendId = f.requesterId === currentUser.id ? f.addresseeId : f.requesterId;
        const friendUser = allUsersMap.get(friendId);
        if (friendUser) myFriends.push(friendUser);
      }
    });
    return myFriends;
  }, [currentUser, getAllUsers, friendships]);

  const filteredFriends = useMemo(() => {
    return friends.filter(friend => friend.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [friends, searchTerm]);
  
  const resetForm = () => {
    setGroupName('');
    setGroupImageUrl('');
    setSelectedMemberIds(new Set());
    setPermissions({ editSettings: 'admins_only', sendMessage: 'all_members', addMembers: 'admins_only', approveMembers: 'admins_only' });
    setError('');
    setIsSubmitting(false);
    setSearchTerm('');
  }

  useEffect(() => {
    if(!isOpen) {
        setTimeout(resetForm, 300); // Reset after modal close animation
    }
  }, [isOpen])

  const handleToggleMember = (userId: string) => {
    setSelectedMemberIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handlePermissionChange = (field: keyof typeof permissions, value: GroupPermissionSetting) => {
    setPermissions(prev => ({ ...prev, [field]: value }));
  };
  
  const handleCloudinaryUpload = async (file: File) => {
    // This is a placeholder for the actual upload logic.
    // In a real implementation, you would use a service to upload the file and get a URL.
    alert(`Simulating upload of ${file.name}. In a real app, this would upload to a cloud service.`);
    const tempUrl = URL.createObjectURL(file); // Create a temporary local URL for preview
    setGroupImageUrl(tempUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!groupName.trim()) { setError('Group name is required.'); return; }
    if (selectedMemberIds.size < 1) { setError('You must select at least one friend.'); return; }
    
    setIsSubmitting(true);
    const formData: GroupFormData = {
      name: groupName,
      groupImageUrl: groupImageUrl || undefined,
      memberIds: Array.from(selectedMemberIds),
      permissions: permissions,
    };
    
    const result = await addContent('group', formData);
    setIsSubmitting(false);

    if (result.success) {
      alert(`Group "${groupName}" created successfully!`);
      onClose();
    } else {
      setError(result.message || 'Failed to create group.');
    }
  };

  if (!currentUser) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Community Group" size="lg">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-3 scrollbar-thin scrollbar-thumb-slate-400 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
          
          <AdvancedMediaUploader
            label="Group Profile Picture (Optional)"
            mediaType="image"
            currentUrl={groupImageUrl}
            onUrlChange={setGroupImageUrl}
            onFileUpload={handleCloudinaryUpload}
          />

          <div>
            <label htmlFor="groupName" className="block text-xs font-medium text-slate-700 dark:text-slate-200">
              Group Name*
            </label>
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200"
              required
            />
          </div>

          <div>
            <h3 className="text-xs font-medium text-slate-700 dark:text-slate-200">Add Friends*</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">You will be automatically added as an admin.</p>
            <input
              type="search"
              placeholder="Search friends..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-sm p-2 mb-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200"
            />
            <div className="space-y-2 border border-slate-200 dark:border-slate-600 rounded-md p-3 max-h-48 overflow-y-auto">
              {filteredFriends.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">{friends.length === 0 ? 'You have no friends to add.' : 'No friends found matching search.'}</p>
              ) : (
                filteredFriends.map(friend => (
                  <div key={friend.id} className="flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700 p-1.5 rounded-md">
                    <label htmlFor={`friend-${friend.id}`} className="flex items-center space-x-3 cursor-pointer">
                      <img src={friend.profileImageUrl || ''} alt={friend.fullName} className="w-8 h-8 rounded-full object-cover" />
                      <span className="text-sm text-slate-800 dark:text-slate-200">{friend.fullName}</span>
                    </label>
                    <input
                      id={`friend-${friend.id}`}
                      type="checkbox"
                      checked={selectedMemberIds.has(friend.id)}
                      onChange={() => handleToggleMember(friend.id)}
                      className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="p-3 border border-slate-200 dark:border-slate-600 rounded-lg">
            <h3 className="text-md font-semibold text-slate-800 dark:text-slate-100 mb-2">Group Permissions</h3>
            <PermissionSelector label="Edit group info" description="Who can change group name, photo, etc." value={permissions.editSettings} onChange={v => handlePermissionChange('editSettings', v)} />
            <PermissionSelector label="Send messages" description="Who can send messages to the group." value={permissions.sendMessage} onChange={v => handlePermissionChange('sendMessage', v)} />
            <PermissionSelector label="Add members" description="Who can add new members to the group." value={permissions.addMembers} onChange={v => handlePermissionChange('addMembers', v)} />
            <PermissionSelector label="Approve new members" description="Who can approve requests to join (if group is private - feature coming soon)." value={permissions.approveMembers} onChange={v => handlePermissionChange('approveMembers', v)} />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Cancel</Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Group...' : 'Create Group'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateGroupModal;