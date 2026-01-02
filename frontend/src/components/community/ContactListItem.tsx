
import React from 'react';
import { Link } from "react-router-dom";
import { User } from '../../types';

interface ContactListItemProps {
  user: User;
}

const ContactListItem: React.FC<ContactListItemProps> = ({ user }) => {
  return (
    <Link 
      to={`/chat/${user.id}`} 
      className="flex items-center p-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors duration-150"
    >
      <img 
        src={user.profileImageUrl || `https://picsum.photos/seed/${user.id}/100/100`} 
        alt={user.fullName} 
        className="w-12 h-12 rounded-full object-cover mr-4"
      />
      <div className="flex-grow">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">{user.fullName}</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">10:45 AM</p>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">Hey there! I am using BEM Church.</p>
      </div>
    </Link>
  );
};

export default ContactListItem;
