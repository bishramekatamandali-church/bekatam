

import React, { useState } from 'react';
import { useParams } from "react-router-dom";
import { useContent } from '../contexts/ContentContext';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Ministry, MinistryJoinRequestFormData, MinistryJoinRequest } from '../types';
import AuthModal from '../components/auth/AuthModal';

const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className || ''}`}><path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63L12.5 21.75l-.435.145a.75.75 0 0 1-.63 0l-2.955-.985a.75.75 0 0 1-.363-.63l-.001-.122v-.002ZM17.25 19.128l-.001.121a.75.75 0 0 1-.363.63l-2.955.985a.75.75 0 0 1-.63 0l-.435-.145L10 21.75a.75.75 0 0 1-.363-.63l-.001-.119v-.004a5.625 5.625 0 0 1 11.25 0Z" /></svg>
);
const CheckCircleIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.06-1.06l-3.002 3.001-1.502-1.501a.75.75 0 0 0-1.06 1.06L11.25 13.5l3.36-3.314Z" clipRule="evenodd" />
  </svg>
);
const UserCircleIconSmall: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-4 h-4"}>
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.75a.75.75 0 00-1.5 0V7.5H9.75a.75.75 0 000 1.5H11V10.5a.75.75 0 001.5 0V9h.75a.75.75 0 000-1.5H12.5V6.25z" clipRule="evenodd" />
  </svg>
);


const SingleMinistryPage: React.FC = () => {
  const { ministryId } = useParams<{ ministryId: string }>();
  const { getContentById, loadingContent, addMinistryJoinRequest } = useContent();
  const { currentUser, isAuthenticated } = useAuth();

  const [ministry, setMinistry] = React.useState<Ministry | undefined>(undefined);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [agreedToGuidelines, setAgreedToGuidelines] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);


  React.useEffect(() => {
    if (ministryId && !loadingContent) {
      const foundMinistry = getContentById('ministry', ministryId) as Ministry | undefined;
      setMinistry(foundMinistry);
    }
  }, [ministryId, loadingContent, getContentById]);

  const handleOpenJoinModal = () => {
    if (!isAuthenticated) {
        setIsAuthModalOpen(true);
        return;
    }
    setShowSuccessMessage(false);
    setFormError('');
    setJoinMessage('');
    setAgreedToGuidelines(false);
    setIsJoinModalOpen(true);
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ministry || !currentUser) {
        setFormError("Error: Ministry details or user information is missing.");
        return;
    }
    if (!agreedToGuidelines) {
        setFormError("You must agree to the Ministry Guidelines & Expectations to submit your request.");
        return;
    }
    setFormError('');
    setIsSubmitting(true);

    const formData: MinistryJoinRequestFormData = {
        message: joinMessage.trim(), 
    };
    
    const result = await addMinistryJoinRequest(formData, ministry);
    setIsSubmitting(false);
    if (result) {
        setShowSuccessMessage(true);
    } else {
        setFormError("There was an issue submitting your request. Please try again.");
    }
  };


  if (loadingContent) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-xl text-gray-600">Loading ministry details...</p>
      </div>
    );
  }

  if (!ministry) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold text-gray-700">Ministry not found</h1>
        <p className="text-gray-500 mt-2">The ministry you are looking for does not exist or has been moved.</p>
        <Button asLink to="/ministries" variant="primary" className="mt-6">Back to Ministries</Button>
      </div>
    );
  }

  return (
    <div className="pb-12">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto">
           {ministry.imageUrl && (
            <img src={ministry.imageUrl} alt={ministry.title} className="w-full h-auto max-h-[500px] object-cover rounded-t-xl"/>
          )}
          <CardHeader>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{ministry.title}</h1>
            {ministry.category && <p className="text-purple-600 font-semibold mb-2">{ministry.category}</p>}
             <div className="text-sm text-gray-500 space-y-1">
                {ministry.leader && <p><strong className="text-gray-700">Leader:</strong> {ministry.leader}</p>}
                {ministry.meetingTime && <p><strong className="text-gray-700">Meeting Time:</strong> {ministry.meetingTime}</p>}
             </div>
             {ministry.postedByOwnerName && (
                <p className="text-xs text-slate-400 mt-3 flex items-center">
                    <UserCircleIconSmall className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    Content maintained by: {ministry.postedByOwnerName}
                </p>
            )}
          </CardHeader>
          <CardContent>
            <h3 className="text-xl font-semibold text-gray-700 mb-3 border-b pb-2">Ministry Guidelines & Expectations</h3>
            <div className="prose max-w-none text-gray-700 whitespace-pre-line">
                {ministry.description || "Details about this ministry's guidelines and expectations will be updated soon."}
            </div>
          </CardContent>
          <CardFooter>
             <Button variant="primary" onClick={handleOpenJoinModal}>
                <UsersIcon className="mr-2"/> Get Involved / Join
             </Button>
          </CardFooter>
        </Card>
         <div className="text-center mt-8">
            <Button asLink to="/ministries" variant="outline">Back to All Ministries</Button>
        </div>
      </div>
      
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {isJoinModalOpen && ministry && (
        <Modal 
            isOpen={isJoinModalOpen} 
            onClose={() => setIsJoinModalOpen(false)} 
            title={`Request to Join ${ministry.title} as a Member`} 
            size="lg"
        >
            {showSuccessMessage ? (
                <div className="text-center py-4">
                    <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Request Submitted!</h3>
                    <p className="text-gray-600">Your request to join "{ministry.title}" as a member has been sent for review. You will be notified once it's processed.</p>
                    <Button onClick={() => setIsJoinModalOpen(false)} variant="primary" className="mt-6">Close</Button>
                </div>
            ) : (
                <form 
                    onSubmit={handleJoinSubmit} 
                    className="space-y-6 max-h-[70vh] overflow-y-auto p-1 pr-3"
                >
                    <p className="text-sm text-gray-600">
                        We're excited you're interested in joining! Please review the guidelines below and submit your request to become a member of this ministry.
                    </p>
                    
                    <div>
                        <h4 className="text-md font-semibold text-gray-700 mb-2">Ministry Guidelines & Expectations:</h4>
                        <div className="p-3 bg-gray-100 rounded-md max-h-40 overflow-y-auto text-sm text-gray-600 whitespace-pre-line border border-gray-200">
                            {ministry.description || "No specific guidelines provided yet."}
                        </div>
                    </div>

                    {currentUser && (
                        <div className="p-3 bg-gray-50 rounded-md border border-gray-200 text-sm">
                            <p className="text-gray-700"><strong>Requesting as:</strong> {currentUser.fullName} ({currentUser.email})</p>
                        </div>
                    )}

                    <div>
                        <label htmlFor="joinMessage" className="block text-sm font-medium text-gray-700">
                           Your Message to the Ministry Leader (Optional)
                        </label>
                        <textarea
                            id="joinMessage"
                            name="joinMessage"
                            rows={3}
                            value={joinMessage}
                            onChange={(e) => setJoinMessage(e.target.value)}
                            className="mt-1 block w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white"
                            placeholder="Share why you're interested, any relevant experience, or questions you have..."
                        />
                    </div>
                    
                    <div className="flex items-start">
                        <div className="flex items-center h-5">
                        <input
                            id="agreedToGuidelines"
                            name="agreedToGuidelines"
                            type="checkbox"
                            checked={agreedToGuidelines}
                            onChange={(e) => setAgreedToGuidelines(e.target.checked)}
                            className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-300 rounded"
                        />
                        </div>
                        <div className="ml-3 text-sm">
                        <label htmlFor="agreedToGuidelines" className="font-medium text-gray-700">
                            I have read and agree to the Ministry Guidelines & Expectations.
                        </label>
                        </div>
                    </div>

                    {formError && (
                        <p className="text-sm text-red-600" role="alert">{formError}</p>
                    )}

                    <div className="flex justify-end space-x-3 pt-3 border-t">
                        <Button type="button" variant="outline" onClick={() => setIsJoinModalOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={isSubmitting || !agreedToGuidelines}>
                            {isSubmitting ? 'Submitting Request...' : 'Submit Request'}
                        </Button>
                    </div>
                </form>
            )}
        </Modal>
      )}
    </div>
  );
};

export default SingleMinistryPage;