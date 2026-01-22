

import React, { useState, useEffect } from 'react';
import Button from '../components/ui/Button';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Modal from '../components/ui/Modal'; 
import { useContent } from '../contexts/ContentContext';
import { useAuth } from '../contexts/AuthContext';
import { BranchChurch } from '../types';

// Icons
const MapPinIconContact: React.FC<{className?: string}> = ({className}) => (
 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
  <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 5.159-4.502 16.975 16.975 0 0 0 2.243-7.53A9.75 9.75 0 0 0 12 2.25a9.75 9.75 0 0 0-9.75 9.75c0 4.11 2.086 7.917 5.234 10.35l.028.015.07.041Z" clipRule="evenodd" />
  <path fillRule="evenodd" d="M12 9.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5Z" clipRule="evenodd" />
</svg>
);
const CheckCircleIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.06-1.06l-3.002 3.001-1.502-1.501a.75.75 0 0 0-1.06 1.06L11.25 13.5l3.36-3.314Z" clipRule="evenodd" />
  </svg>
);
const OfficeBuildingIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M4.5 2.25a.75.75 0 000 1.5v16.5a.75.75 0 00.75.75h13.5a.75.75 0 00.75-.75V3.75a.75.75 0 000-1.5h-15z" />
    <path fillRule="evenodd" d="M5.25 3.75A.75.75 0 016 3h12a.75.75 0 01.75.75v16.5a.75.75 0 01-.75.75H6a.75.75 0 01-.75-.75V3.75zM8.25 7.5a.75.75 0 01.75-.75h6a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-6a.75.75 0 01-.75-.75V7.5zM8.25 10.5a.75.75 0 01.75-.75h2.25a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v-.75zm3.75.75a.75.75 0 000-1.5h2.25a.75.75 0 000 1.5H12zm-3.75 3a.75.75 0 01.75-.75h2.25a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v-.75zm3.75.75a.75.75 0 000-1.5h2.25a.75.75 0 000 1.5H12zm-3.75 3a.75.75 0 01.75-.75h2.25a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v-.75zm3.75.75a.75.75 0 000-1.5h2.25a.75.75 0 000 1.5H12z" clipRule="evenodd" />
  </svg>
);


const ContactPage: React.FC = () => {
  const { addContactMessage, branchChurches, loadingContent } = useContent();
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    setFormData((prev) => ({
      ...prev,
      name: prev.name || currentUser.fullName || '',
      email: prev.email || currentUser.email || '',
    }));
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setError("Please fill in all fields.");
      return;
    }
    setIsSubmitting(true);
    const result = await addContactMessage(formData);
    setIsSubmitting(false);
    if (result) {
      setFormData({
        name: currentUser?.fullName || '',
        email: currentUser?.email || '',
        subject: '',
        message: '',
      });
      setIsSuccessModalOpen(true);
    } else {
      setError('There was an issue sending your message. Please try again.');
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <Card className="bg-teal-50 border border-teal-200">
            <CardHeader className="border-teal-200">
              <h2 className="text-2xl font-semibold text-gray-700">Send Us a Message</h2>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-100 text-red-700 text-sm" role="alert">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-xs font-medium text-gray-700">Full Name</label>
                  <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required 
                         className="mt-1 block w-full p-2.5 border border-teal-300 rounded-xl shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm bg-white" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-gray-700">Email Address</label>
                  <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required
                         className="mt-1 block w-full p-2.5 border border-teal-300 rounded-xl shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm bg-white" />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-xs font-medium text-gray-700">Subject</label>
                  <input type="text" name="subject" id="subject" value={formData.subject} onChange={handleChange} required
                         className="mt-1 block w-full p-2.5 border border-teal-300 rounded-xl shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm bg-white" />
                </div>
                <div>
                  <label htmlFor="message" className="block text-xs font-medium text-gray-700">Message</label>
                  <textarea name="message" id="message" rows={4} value={formData.message} onChange={handleChange} required
                            className="mt-1 block w-full p-2.5 border border-teal-300 rounded-xl shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm bg-white"></textarea>
                </div>
                <div>
                  <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
        
        {/* Branch Churches Section */}
        {!loadingContent && branchChurches.length > 0 && (
          <section className="mt-16 pt-12 border-t border-teal-200">
            <div className="text-center mb-12">
              <OfficeBuildingIcon className="text-teal-500 mx-auto mb-4 w-12 h-12" />
              <h2 className="text-3xl font-bold text-gray-800">Our Branch Locations</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-2">
                Find a BEM Church community closer to you.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {branchChurches.slice(0, 2).map((branch: BranchChurch) => ( 
                <Card key={branch.id} id={branch.id} className="bg-teal-50 border border-teal-200">
                  {branch.imageUrl && <img src={branch.imageUrl} alt={branch.name} className="w-full h-48 object-cover rounded-t-xl"/>}
                  <CardHeader className="border-teal-200">
                    <h3 className="text-xl font-semibold text-gray-800">{branch.name}</h3>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="text-gray-600 flex items-start"><MapPinIconContact className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0"/> {branch.address}</p>
                    {branch.pastorName && <p className="text-gray-600"><strong>Pastor:</strong> {branch.pastorName}</p>}
                    {branch.phone && <p className="text-gray-600"><strong>Phone:</strong> <a href={`tel:${branch.phone}`} className="hover:text-teal-600">{branch.phone}</a></p>}
                    {branch.email && <p className="text-gray-600"><strong>Email:</strong> <a href={`mailto:${branch.email}`} className="hover:text-teal-600">{branch.email}</a></p>}
                    <p className="text-gray-600"><strong>Service Times:</strong> {branch.serviceTimes}</p>
                    {branch.mapEmbedUrl && (
                       <a href={branch.mapEmbedUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-teal-600 hover:text-teal-700 text-sm font-medium mt-2">View on Map &raquo;</a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            {branchChurches.length > 2 && (
              <div className="text-center mt-8">
                <Button asLink to="/branches" variant="primary">View All Branches</Button>
              </div>
            )}
          </section>
        )}
      </div>

      <Modal isOpen={isSuccessModalOpen} onClose={() => setIsSuccessModalOpen(false)} title="Message Sent!">
        <div className="text-center">
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-lg text-gray-700 mb-2">Thank you for your message!</p>
          <p className="text-gray-600">We have received your inquiry and will get back to you as soon as possible.</p>
          <Button onClick={() => setIsSuccessModalOpen(false)} variant="primary" className="mt-6">
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ContactPage;
