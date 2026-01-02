import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PrivacySetting, FriendRequestSetting, GroupInviteSetting } from '../../types';

interface PrivacyToggleProps {
  label: string;
  description: string;
  isChecked: boolean;
  onChange: (isChecked: boolean) => void;
  disabled?: boolean;
}

const PrivacyToggle: React.FC<PrivacyToggleProps> = ({ label, description, isChecked, onChange, disabled }) => {
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

interface PrivacySelectProps {
    label: string;
    description: string;
    value: PrivacySetting | FriendRequestSetting | GroupInviteSetting;
    onChange: (value: any) => void;
    disabled?: boolean;
    options: { value: string, label: string }[];
}

const PrivacySelect: React.FC<PrivacySelectProps> = ({ label, description, value, onChange, disabled, options }) => {
    return (
        <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:dark:border-slate-700 sm:pt-5">
            <label className="block text-xs font-medium leading-5 text-slate-900 dark:text-slate-200 sm:pt-1.5">
                {label}
                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>
            </label>
            <div className="mt-2 sm:col-span-2 sm:mt-0">
                <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    disabled={disabled}
                    className="w-full max-w-xs text-xs p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200 focus:ring-purple-500 focus:border-purple-500"
                >
                    {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>
        </div>
    );
};


const PrivacySettings: React.FC = () => {
    const { currentUser, updateUserProfile } = useAuth();
    const [feedback, setFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);

    const handleSettingChange = useCallback(async (settingName: string, value: boolean | PrivacySetting | FriendRequestSetting | GroupInviteSetting) => {
        if (!currentUser || !updateUserProfile) return;
        setFeedback(null);

        const currentSettings = currentUser.privacySettings || { 
          friendsList: 'public', 
          profileInSearch: true,
          whoCanSendFriendRequest: 'everyone',
          whoCanAddToGroups: 'everyone'
        };
        const newSettings = { ...currentSettings, [settingName]: value };

        const success = await updateUserProfile(currentUser.id, { privacySettings: newSettings });
        if (success) {
            setFeedback({type: 'success', message: 'Privacy setting updated.'});
        } else {
            setFeedback({type: 'error', message: 'Failed to update setting.'});
        }
        setTimeout(() => setFeedback(null), 2000);
    }, [currentUser, updateUserProfile]);


    if (!currentUser) {
        return <p>Please log in to manage your privacy settings.</p>;
    }

    return (
        <div className="space-y-6 divide-y divide-gray-200 dark:divide-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400">Manage who can see your information and how your profile appears.</p>
            
            <PrivacySelect
                label="Friends List Visibility"
                description="Choose who can see the list of your friends on your profile."
                value={currentUser.privacySettings?.friendsList || 'public'}
                onChange={(value) => handleSettingChange('friendsList', value)}
                options={[
                    {value: 'public', label: 'Everyone'},
                    {value: 'friends', label: 'Friends'},
                    {value: 'private', label: 'Only Me'},
                ]}
            />

            <PrivacySelect
                label="Who can send you friend requests?"
                description="Control who is allowed to send you a friend request."
                value={currentUser.privacySettings?.whoCanSendFriendRequest || 'everyone'}
                onChange={(value) => handleSettingChange('whoCanSendFriendRequest', value)}
                options={[
                    {value: 'everyone', label: 'Everyone'},
                    {value: 'friends_of_friends', label: 'Friends of Friends (Simulated)'},
                ]}
            />
            
             <PrivacySelect
                label="Who can add you to groups?"
                description="Choose who can add you to community groups."
                value={currentUser.privacySettings?.whoCanAddToGroups || 'everyone'}
                onChange={(value) => handleSettingChange('whoCanAddToGroups', value)}
                options={[
                    {value: 'everyone', label: 'Everyone'},
                    {value: 'friends', label: 'Only Friends'},
                ]}
            />

            <div className="pt-5">
                <PrivacyToggle
                    label="Appear in Community Search"
                    description="Allow other members to find your profile when they search the community page."
                    isChecked={currentUser.privacySettings?.profileInSearch ?? true}
                    onChange={(value) => handleSettingChange('profileInSearch', value)}
                />
            </div>

            {feedback && (
                <p className={`text-xs pt-4 ${feedback.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                    {feedback.message}
                </p>
            )}
        </div>
    );
};

export default PrivacySettings;