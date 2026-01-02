

import React from 'react';
import { Link } from "react-router-dom";
import { Group } from '../../types';
import { UsersIcon } from '@heroicons/react/24/solid';

interface GroupListItemProps {
  group: Group;
}

const GroupListItem: React.FC<GroupListItemProps> = ({ group }) => {
  return (
    <Link 
      to={`#`} // Placeholder: Should be `/group-chat/${group.id}`
      onClick={(e) => { e.preventDefault(); alert("Group chat page coming soon!"); }}
      className="flex items-center p-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors duration-150"
    >
      {group.groupImageUrl ? (
         <img 
            src={group.groupImageUrl} 
            alt={group.name} 
            className="w-12 h-12 rounded-full object-cover mr-4"
          />
      ) : (
        <div className="w-12 h-12 rounded-full mr-4 bg-purple-200 dark:bg-purple-800 flex items-center justify-center">
            <UsersIcon className="w-6 h-6 text-purple-600 dark:text-purple-300" />
        </div>
      )}
     
      <div className="flex-grow">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">{group.name}</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
          {group.members.length} member{group.members.length !== 1 ? 's' : ''}
        </p>
      </div>
    </Link>
  );
};

export default GroupListItem;
