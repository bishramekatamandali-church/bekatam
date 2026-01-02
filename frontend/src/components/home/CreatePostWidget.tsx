
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { PrayerHandsIcon, TestimonyIcon } from '../icons/GenericIcons';
import Button from '../ui/Button';

interface CreatePostWidgetProps {
    onTriggerCreate: (type: 'prayer' | 'testimonial') => void;
}

const CreatePostWidget: React.FC<CreatePostWidgetProps> = ({ onTriggerCreate }) => {
    const { currentUser, isAuthenticated } = useAuth();

    return (
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
            <div className="flex items-center space-x-3 mb-3">
                {isAuthenticated && currentUser ? (
                    <img src={currentUser.profileImageUrl || undefined} alt="Your profile" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                    <UserCircleIcon className="w-10 h-10 text-slate-400" />
                )}
                <p className="font-medium text-slate-700">{isAuthenticated && currentUser ? `Share with the community, ${currentUser.fullName.split(' ')[0]}` : "Join the community to share your story!"}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                 <Button
                    onClick={() => onTriggerCreate('prayer')}
                    variant="outline"
                    className="flex-grow justify-center"
                    aria-label="Share a Prayer"
                >
                   <PrayerHandsIcon className="w-5 h-5 mr-2" />
                   Share a Prayer
                </Button>
                 <Button
                    onClick={() => onTriggerCreate('testimonial')}
                    variant="outline"
                    className="flex-grow justify-center"
                    aria-label="Share a Testimony"
                >
                   <TestimonyIcon className="w-5 h-5 mr-2" />
                   Share a Testimony
                </Button>
            </div>
        </div>
    );
};

export default CreatePostWidget;
