import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
//import { useTranslation } from 'react-i18next';

const NotificationToggle: React.FC<{
  label: string;
  description: string;
  isChecked: boolean;
  onChange: (isChecked: boolean) => void;
  disabled?: boolean;
}> = ({ label, description, isChecked, onChange, disabled }) => {
  const [internalChecked, setInternalChecked] = useState(isChecked);

  useEffect(() => {
    setInternalChecked(isChecked);
  }, [isChecked]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setInternalChecked(checked);
    onChange(checked);
  };

  return (
    <div className="flex items-start">
      <div className="flex h-6 items-center">
        <input
          id={label}
          name={label}
          type="checkbox"
          checked={internalChecked}
          onChange={handleChange}
          disabled={disabled}
          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600 disabled:opacity-50"
        />
      </div>
      <div className="ml-3 leading-5">
        <label htmlFor={label} className="text-xs font-medium text-slate-900 dark:text-slate-100">
          {label}
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </div>
  );
};


const NotificationSettings: React.FC = () => {
    const { currentUser, updateUserProfile } = useAuth();
    const [feedback, setFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);

    const handleSettingChange = useCallback(async (settingName: string, value: boolean) => {
        if (!currentUser || !updateUserProfile) return;
        setFeedback(null);
        const success = await updateUserProfile(currentUser.id, { [settingName]: value });
        if (success) {
            setFeedback({type: 'success', message: 'Preference updated successfully.'});
        } else {
            setFeedback({type: 'error', message: 'Failed to update preference.'});
        }
        setTimeout(() => setFeedback(null), 2000);
    }, [currentUser, updateUserProfile]);


    if (!currentUser) {
        return <p>Please log in to manage your notification settings.</p>;
    }

    return (
        <div className="space-y-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">Control what you get notified about.</p>
            <NotificationToggle
                label="General Content Updates"
                description="Receive notifications for new sermons, events, blog posts, and news."
                isChecked={currentUser.receiveContentUpdateNotifications ?? true}
                onChange={(value) => handleSettingChange('receiveContentUpdateNotifications', value)}
            />
             <NotificationToggle
                label="Public Prayer Requests"
                description="Get notified when a new public prayer request is posted by any member."
                isChecked={currentUser.receivePrayerRequestNotifications ?? true}
                onChange={(value) => handleSettingChange('receivePrayerRequestNotifications', value)}
            />
             <NotificationToggle
                label="Public Testimonies"
                description="Get notified when a new public testimony is shared by any member."
                isChecked={currentUser.receiveTestimonialNotifications ?? true}
                onChange={(value) => handleSettingChange('receiveTestimonialNotifications', value)}
            />
            <NotificationToggle
                label="Friend Activity"
                description="Receive notifications for friend requests and when a friend shares a 'Friends Only' post."
                isChecked={currentUser.receiveFriendActivityNotifications ?? true}
                onChange={(value) => handleSettingChange('receiveFriendActivityNotifications', value)}
            />
            {feedback && (
                <p className={`text-xs ${feedback.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                    {feedback.message}
                </p>
            )}
        </div>
    );
};

export default NotificationSettings;