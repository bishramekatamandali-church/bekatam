
import React, { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { User, UserActionRequest, UserActionType, UserRole } from '../../types';

const ManageUsersPage: React.FC = () => {
  const {
    currentUser,
    getAllUsers,
    updateUserRole,
    getUserActionRequests,
    createUserActionRequest,
    approveUserActionRequest,
    isAdmin,
    loadingAuthState,
  } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [actionRequests, setActionRequests] = useState<UserActionRequest[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<UserActionType>('block');
  const [actionReason, setActionReason] = useState('');
  const [actionTarget, setActionTarget] = useState<User | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (loadingAuthState) return;
    let isMounted = true;

    const loadUsers = async () => {
      const usersData = await getAllUsers();
      if (isMounted) {
        setUsers(usersData);
      }
    };

    const loadRequests = async () => {
      const requestsData = await getUserActionRequests();
      if (isMounted) {
        setActionRequests(requestsData);
      }
    };

    loadUsers();
    loadRequests();

    return () => {
      isMounted = false;
    };
  }, [getAllUsers, getUserActionRequests, loadingAuthState, currentUser]); // Add currentUser to re-evaluate users if it changes (e.g. role change)

  const openRoleModal = (user: User) => {
    setFeedback(null);

    if (user.id === currentUser?.id) {
      setFeedback({ type: 'error', message: "You cannot change your own role." });
      setTimeout(() => setFeedback(null), 5000);
      return;
    }
    
    setSelectedUser(user);
    setNewRole(user.role); 
    setIsRoleModalOpen(true);
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !isAdmin) {
      setFeedback({ type: 'error', message: "Access Denied: Only admins can perform this action." });
      setTimeout(() => setFeedback(null), 7000);
      setIsRoleModalOpen(false);
      return;
    }
    setFeedback(null); 

    const result = await updateUserRole(selectedUser.id, newRole);
    
    if (result.success) {
      const usersData = await getAllUsers();
      setUsers(usersData); 
      setFeedback({ type: 'success', message: result.message || `Successfully updated ${selectedUser.fullName}'s role to ${newRole}.` });
    } else {
      setFeedback({ type: 'error', message: result.message || `Failed to update ${selectedUser.fullName}'s role.` });
    }
    
    setIsRoleModalOpen(false);
    setSelectedUser(null);
    
    setTimeout(() => setFeedback(null), 7000);
  };

  const openActionModal = (user: User, type: UserActionType) => {
    setFeedback(null);

    if (user.id === currentUser?.id) {
      setFeedback({ type: 'error', message: "You cannot perform this action on your own account." });
      setTimeout(() => setFeedback(null), 5000);
      return;
    }

    setActionTarget(user);
    setActionType(type);
    setActionReason('');
    setIsActionModalOpen(true);
  };

  const handleCreateActionRequest = async () => {
    if (!actionTarget || !isAdmin) {
      setFeedback({ type: 'error', message: "Access Denied: Only admins can perform this action." });
      setTimeout(() => setFeedback(null), 7000);
      setIsActionModalOpen(false);
      return;
    }

    if (!actionReason.trim()) {
      setFeedback({ type: 'error', message: "Please provide a reason for this action." });
      setTimeout(() => setFeedback(null), 7000);
      return;
    }

    const result = await createUserActionRequest(actionTarget.id, actionType, actionReason.trim());
    if (result.success) {
      const [usersData, requestsData] = await Promise.all([getAllUsers(), getUserActionRequests()]);
      setUsers(usersData);
      setActionRequests(requestsData);
      setFeedback({
        type: 'success',
        message: `Request submitted to ${actionType} ${actionTarget.fullName}. Awaiting approval from other admins.`,
      });
    } else {
      setFeedback({ type: 'error', message: result.message || 'Failed to create request.' });
    }

    setIsActionModalOpen(false);
    setActionTarget(null);
    setTimeout(() => setFeedback(null), 7000);
  };

  const handleApproveRequest = async (requestId: string) => {
    if (!isAdmin) return;

    const result = await approveUserActionRequest(requestId);
    if (result.success) {
      const [usersData, requestsData] = await Promise.all([getAllUsers(), getUserActionRequests()]);
      setUsers(usersData);
      setActionRequests(requestsData);
      setFeedback({ type: 'success', message: 'Approval recorded successfully.' });
    } else {
      setFeedback({ type: 'error', message: result.message || 'Failed to approve request.' });
    }

    setTimeout(() => setFeedback(null), 7000);
  };
  
  if (loadingAuthState) {
    return <p className="text-gray-500">Loading user data...</p>;
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardContent>
          <p className="text-gray-600 text-center py-8">You do not have permission to manage users.</p>
        </CardContent>
      </Card>
    );
  }
  
  const availableRoles: UserRole[] = ['user', 'admin'];
  const pendingRequests = actionRequests.filter((request) => request.status === 'pending');
  const approvalBadge = (request: UserActionRequest) => {
    const approvals = request.approvals?.length || 0;
    const needed = request.requiredApprovals ?? 0;
    return `${approvals}/${needed}`;
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Manage Users</h1>
        <p className="text-sm text-gray-500">View and manage user accounts, roles, and moderation actions. Admin actions require approval from all other admins.</p>
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(user => {
                    const isCurrentUserTheTarget = user.id === currentUser?.id;
                    const disableButton = !isAdmin || isCurrentUserTheTarget;
                    const accountStatus = user.accountStatus || 'active';
                    const isBlocked = accountStatus === 'blocked';
                    const isDeleted = accountStatus === 'deleted';
                    const titleMessage = !isAdmin
                      ? "Only admins can change roles."
                      : isCurrentUserTheTarget
                        ? "You cannot change your own role."
                        : `Change role for ${user.fullName}`;

                    return (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.fullName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{user.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              accountStatus === 'active'
                                ? 'bg-green-100 text-green-700'
                                : accountStatus === 'blocked'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {accountStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-wrap gap-2">
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openActionModal(user, 'block')}
                              disabled={!isAdmin || isCurrentUserTheTarget || isBlocked || isDeleted}
                              className="disabled:opacity-50 disabled:cursor-not-allowed"
                              title={
                                !isAdmin
                                  ? 'Only admins can request blocks.'
                                  : isCurrentUserTheTarget
                                    ? 'You cannot block your own account.'
                                    : isDeleted
                                      ? 'Deleted accounts cannot be blocked.'
                                      : isBlocked
                                        ? 'User is already blocked.'
                                        : `Request block for ${user.fullName}`
                              }
                            >
                              Request Block
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openActionModal(user, 'delete')}
                              disabled={!isAdmin || isCurrentUserTheTarget || isDeleted}
                              className="disabled:opacity-50 disabled:cursor-not-allowed"
                              title={
                                !isAdmin
                                  ? 'Only admins can request deletions.'
                                  : isCurrentUserTheTarget
                                    ? 'You cannot delete your own account.'
                                    : isDeleted
                                      ? 'User is already deleted.'
                                      : `Request delete for ${user.fullName}`
                              }
                            >
                              Request Delete
                            </Button>
                          </div>
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

      <Card className="mt-6">
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-700">Pending User Actions</h2>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <p className="text-gray-500">No pending requests.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approvals</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingRequests.map((request) => {
                    const hasApproved = request.approvals?.some((approval) => approval.adminId === currentUser?.id);
                    const isRequester = request.requestedByAdminId === currentUser?.id;
                    const disableApprove = !isAdmin || hasApproved || isRequester;

                    return (
                      <tr key={request.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="font-medium">{request.user?.fullName || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{request.user?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{request.actionType}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.reason}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.requestedByAdminName || 'Admin'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{approvalBadge(request)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApproveRequest(request.id)}
                            disabled={disableApprove}
                            className="disabled:opacity-50 disabled:cursor-not-allowed"
                            title={
                              !isAdmin
                                ? 'Only admins can approve.'
                                : isRequester
                                  ? 'Requesting admin cannot approve.'
                                  : hasApproved
                                    ? 'You already approved.'
                                    : 'Approve request'
                            }
                          >
                            Approve
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

      {actionTarget && isActionModalOpen && (
        <Modal
          isOpen={isActionModalOpen}
          onClose={() => setIsActionModalOpen(false)}
          title={`${actionType === 'block' ? 'Request Block' : 'Request Delete'} for ${actionTarget.fullName}`}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Provide a reason for this {actionType} request. All other admins must approve before it takes effect.
            </p>
            <div>
              <label htmlFor="action-reason" className="block text-sm font-medium text-gray-700">Reason</label>
              <textarea
                id="action-reason"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2.5 text-sm shadow-sm focus:border-purple-500 focus:ring-purple-500"
                placeholder="Enter the reason for this request..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsActionModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreateActionRequest}>Submit Request</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ManageUsersPage;
