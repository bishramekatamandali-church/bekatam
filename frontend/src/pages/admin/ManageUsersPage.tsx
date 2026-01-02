
import React, { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { User, UserRole } from '../../types';

const ManageUsersPage: React.FC = () => {
  const { currentUser, getAllUsers, updateUserRole, isOwner, loadingAuthState } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!loadingAuthState) {
      setUsers(getAllUsers());
    }
  }, [getAllUsers, loadingAuthState, currentUser]); // Add currentUser to re-evaluate users if it changes (e.g. role change)

  const openRoleModal = (user: User) => {
    setFeedback(null); 
    
    if (user.id === currentUser?.id && user.role === 'owner') {
        const ownersCount = users.filter(u => u.role === 'owner').length;
        if (ownersCount <= 1) {
            setFeedback({ type: 'error', message: "As the last owner, you cannot change your own role." });
            setTimeout(() => setFeedback(null), 7000);
            return;
        }
    }
    
    setSelectedUser(user);
    setNewRole(user.role); 
    setIsRoleModalOpen(true);
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !isOwner) {
        setFeedback({ type: 'error', message: "Access Denied: Only owners can perform this action." });
        setTimeout(() => setFeedback(null), 7000);
        setIsRoleModalOpen(false);
        return;
    }
    setFeedback(null); 

    const result = await updateUserRole(selectedUser.id, newRole);
    
    if (result.success) {
      setUsers(getAllUsers()); 
      setFeedback({ type: 'success', message: result.message || `Successfully updated ${selectedUser.fullName}'s role to ${newRole}.` });
    } else {
      setFeedback({ type: 'error', message: result.message || `Failed to update ${selectedUser.fullName}'s role.` });
    }
    
    setIsRoleModalOpen(false);
    setSelectedUser(null);
    
    setTimeout(() => setFeedback(null), 7000);
  };
  
  if (loadingAuthState) {
    return <p className="text-gray-500">Loading user data...</p>;
  }

  if (!isOwner) {
    return (
      <Card>
        <CardContent>
          <p className="text-gray-600 text-center py-8">You do not have permission to manage users.</p>
        </CardContent>
      </Card>
    );
  }
  
  const availableRoles: UserRole[] = ['user', 'admin', 'owner'];

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Manage Users</h1>
        <p className="text-sm text-gray-500">View and manage user accounts and roles. Only 'owner' can change roles. Max 3 owners allowed.</p>
      </div>

      {feedback && (
        <div className={`p-3 mb-4 rounded-md text-sm ${feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} role="alert">
          {feedback.message}
        </div>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-700">User List</h2>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-gray-500">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(user => {
                    const isCurrentUserTheTarget = user.id === currentUser?.id;
                    const isTargetLastOwner = user.role === 'owner' && users.filter(u => u.role === 'owner').length <= 1;
                    
                    let disableButton = !isOwner; 
                    let titleMessage = "Only owners can change roles.";

                    if (isOwner) { // Only if current user is an owner, check further specific disables
                        if (isCurrentUserTheTarget && user.role !== 'owner') { // Admin/User trying to change their own role
                             disableButton = true;
                             titleMessage = "Admins/Users cannot change their own role. Contact an owner.";
                        } else if (isCurrentUserTheTarget && isTargetLastOwner) { // Owner trying to change their own role when they are the last one
                            disableButton = true;
                            titleMessage = "As the last owner, you cannot change your own role via this button.";
                        }
                        // Note: The logic to prevent demoting *another* last owner is handled inside `updateUserRole`
                        // and will return an error message, so the button doesn't need to be disabled for that specific cross-user case here.
                    }


                    return (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.fullName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{user.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRoleModal(user)}
                            disabled={disableButton}
                            className="disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label={`Change role for ${user.fullName}`}
                            title={disableButton ? titleMessage : `Change role for ${user.fullName}`}
                          >
                            Change Role
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedUser && isRoleModalOpen && (
        <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} title={`Change Role for ${selectedUser.fullName}`}>
          <div className="space-y-4">
            <p>Current Role: <span className="font-semibold capitalize">{selectedUser.role}</span></p>
            <div>
              <label htmlFor="role-select" className="block text-sm font-medium text-gray-700">New Role:</label>
              <select
                id="role-select"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="mt-1 block w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white"
              >
                {availableRoles.map(role => (
                  <option key={role} value={role} className="capitalize">{role}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsRoleModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleRoleChange}>Save Changes</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ManageUsersPage;