

import React from 'react';
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';
import { NavItem } from '../../types';
import { NewspaperIcon as HeroNewspaperIcon, SpeakerWaveIcon as HeroSpeakerWaveIcon, CalendarIcon as HeroCalendarIcon, UsersIcon as HeroUsersIcon } from '@heroicons/react/24/outline'; // Adjusted to use Outline for consistency where solid wasn't used
import { PrayerHandsIcon } from '../../components/icons/GenericIcons';


interface AdminTab extends NavItem {
  subpath: string; 
  group?: string; 
}

const ChartBarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}><path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.035-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c-1.035 0-1.875.84-1.875 1.875v9.375c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V10.5c0-1.035-.84-1.875-1.875-1.875h-.75ZM3 13.125c-1.035 0-1.875.84-1.875 1.875v3.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V15c0-1.035-.84-1.875-1.875-1.875H3Z" /></svg>
);
const DocumentTextIcon: React.FC<{ className?: string }> = ({ className }) => ( 
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}><path d="M5.625 3.75a2.25 2.25 0 0 0-2.25 2.25v12a2.25 2.25 0 0 0 2.25 2.25h12.75a2.25 2.25 0 0 0 2.25-2.25V6A2.25 2.25 0 0 0 18.375 3.75H5.625ZM12 18.75a.75.75 0 0 1 0-1.5h6a.75.75 0 0 1 0 1.5h-6Z" /><path d="M8.25 7.5a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5h-6a.75.75 0 0 1-.75-.75ZM12 11.25a.75.75 0 0 1-.75-.75V7.5a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-.75-.75Z" /></svg>
);
const CalendarDaysIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}><path fillRule="evenodd" d="M5.75 2.25A.75.75 0 0 1 6.5 3v.75h11V3A.75.75 0 0 1 18.25 3v.75h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H5.75V3A.75.75 0 0 1 5.75 2.25ZM4.5 10.5V18A1.5 1.5 0 0 0 1.5 1.5h12A1.5 1.5 0 0 0 19.5 18v-7.5H4.5Z" clipRule="evenodd" /></svg>
);
const BuildingLibraryIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}><path d="M12.75 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM7.5 10.5A2.25 2.25 0 0 0 9.75 12.75v.032a.75.75 0 0 0 .814.739L12 13.5l1.436.021a.75.75 0 0 0 .814-.74V12.75A2.25 2.25 0 0 0 16.5 10.5v-.142a.75.75 0 0 0-.39-.676l-.983-.491a.75.75 0 0 1-.39-.676V8.25A2.25 2.25 0 0 0 12.5 6H12a2.25 2.25 0 0 0-2.25 2.25v.215a.75.75 0 0 1-.39.676l-.983.491a.75.75 0 0 0-.39.676v.142Z" clipRule="evenodd" /></svg>
);
const UsersGroupIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}><path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63L12.5 21.75l-.435.145a.75.75 0 0 1-.63 0l-2.955-.985a.75.75 0 0 1-.363-.63l-.001-.122v-.002ZM17.25 19.128l-.001.121a.75.75 0 0 1-.363.63l-2.955.985a.75.75 0 0 1-.63 0l-.435-.145L10 21.75a.75.75 0 0 1-.363-.63l-.001-.119v-.004a5.625 5.625 0 0 1 11.25 0Z" /></svg>
);
const PresentationChartLineIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}><path d="M18.75 3H5.25A2.25 2.25 0 003 5.25v13.5A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V5.25A2.25 2.25 0 0018.75 3ZM11.25 6.75a.75.75 0 01.75.75v6.75a.75.75 0 01-1.5 0V7.5a.75.75 0 01.75-.75Zm3 4.5a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0v-2.25a.75.75 0 01.75-.75Z" /><path d="M6.75 12.75a.75.75 0 000 1.5h.75a.75.75 0 000-1.5h-.75Z" /></svg>
);
const ArchiveBoxIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}><path fillRule="evenodd" d="M2.25 2.25a.75.75 0 0 0-.75.75v11.25c0 .414.336.75.75.75h19.5a.75.75 0 0 0 .75-.75V3a.75.75 0 0 0-.75-.75H2.25ZM2.25 16.5a.75.75 0 0 0-.75.75v3c0 .414.336.75.75.75h19.5a.75.75 0 0 0 .75-.75v-3a.75.75 0 0 0-.75-.75H2.25Z" clipRule="evenodd" /><path d="M9.75 6a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-.75-.75h-3a.75.75 0 0 1-.75-.75V6Z" /></svg>
);
const InformationCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" /></svg>
);
const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695Z" clipRule="evenodd" /></svg>
);
const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6Z" clipRule="evenodd" /></svg>
);
const BookOpenIcon: React.FC<{ className?: string }> = ({ className }) => ( 
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-5 h-5"}><path d="M11.25 4.533A9.709 9.709 0 0 0 3 12a9.709 9.709 0 0 0 8.25 7.467c.953.093 1.69.837 1.69 1.779V21.75a.75.75 0 0 0 1.5 0V21.25c0-.942.737-1.686 1.69-1.779A9.709 9.709 0 0 0 21 12a9.709 9.709 0 0 0-8.25-7.467V3.75a.75.75 0 0 0-1.5 0v.783Z" /><path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" /></svg>
);
const CurrencyDollarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 7.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5Z" />
    <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h15a3 3 0 013 3v15a3 3 0 01-3 3h-15a3 3 0 01-3-3v-15Zm2.25 3.019A1.5 1.5 0 002.25 9v6A1.5 1.5 0 003.75 16.5h16.5A1.5 1.5 0 0021.75 15V9A1.5 1.5 0 0020.25 7.5H3.75Zm10.5 1.5a.75.75 0 00-1.5 0v3a.75.75 0 001.5 0v-3Z" clipRule="evenodd" />
  </svg>
);
const ChatBubbleLeftRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071 1.05L12.936 4.5H7.5a3 3 0 00-3 3V12a3 3 0 003 3h1.036L7.464 16.168a.75.75 0 10-1.18 1.18L8.29 19.55a3.751 3.751 0 005.304 0l2.008-2.192a.75.75 0 10-1.18-1.18l-1.036 1.036H15a3 3 0 003-3V7.5a3 3 0 00-3-3h-1.036l1.071-1.164a.75.75 0 00-1.071-1.05zM15 9.75a.75.75 0 000-1.5H7.5a.75.75 0 000 1.5H15z" clipRule="evenodd" />
  </svg>
);
const GlobeEuropeAfricaIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75z" />
    <path fillRule="evenodd" d="M12.751 18.37a2.25 2.25 0 01-1.5 0c-1.862.804-2.927 2.484-3.166 4.252a.75.75 0 001.484.219 6.714 6.714 0 013.182-3.427V18.37zm-4.25-2.5a.75.75 0 000 1.5 4.503 4.503 0 014.5 4.5.75.75 0 001.5 0 6.004 6.004 0 00-6-6zM12 6.75A5.25 5.25 0 006.75 12a5.25 5.25 0 005.25 5.25 5.25 5.25 0 005.25-5.25A5.25 5.25 0 0012 6.75zm3.115 3.247a.75.75 0 01-1.06 1.06l-3.094-3.093a.75.75 0 111.06-1.06l3.093 3.093zM12.75 5.25a.75.75 0 00-1.5 0v.047A6.734 6.734 0 006.75 12a6.734 6.734 0 005.297 6.703v.047a.75.75 0 001.5 0v-.047A6.734 6.734 0 0017.25 12a6.734 6.734 0 00-5.297-6.703V5.25z" clipRule="evenodd" />
    <path d="M8.249 17.63c-.738.321-1.275.974-1.499 1.811a.75.75 0 001.483.219c.17-.618.555-1.12 1.068-1.417v3.007a.75.75 0 001.5 0V18.37c-.047-.02-.093-.042-.138-.064a2.251 2.251 0 00-2.414-.676z" />
  </svg>
);
const UserPlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M10.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM20.25 14.25H22.5a.75.75 0 010 1.5H20.25v2.25a.75.75 0 01-1.5 0V15.75h-2.25a.75.75 0 010-1.5H18.75V12a.75.75 0 011.5 0v2.25z" />
    <path fillRule="evenodd" d="M3 19.5a3 3 0 013-3h5.25a.75.75 0 010 1.5H6A1.5 1.5 0 004.5 19.5v.75c0 .621.504 1.125 1.125 1.125h9.75A1.125 1.125 0 0016.5 20.25v-.75a1.5 1.5 0 00-1.5-1.5H9.375a.75.75 0 010-1.5H15a3 3 0 013 3v.75a3 3 0 01-3 3H6a3 3 0 01-3-3v-.75z" clipRule="evenodd" />
  </svg>
);
const PhotoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
  </svg>
);
const UsersIconAdmin: React.FC<{ className?: string }> = ({ className }) => ( 
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}><path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63L12.5 21.75l-.435.145a.75.75 0 0 1-.63 0l-2.955-.985a.75.75 0 0 1-.363-.63l-.001-.122v-.002ZM17.25 19.128l-.001.121a.75.75 0 0 1-.363.63l-2.955.985a.75.75 0 0 1-.63 0l-.435-.145L10 21.75a.75.75 0 0 1-.363-.63l-.001-.119v-.004a5.625 5.625 0 0 1 11.25 0Z" /></svg>
);
const BriefcaseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}><path fillRule="evenodd" d="M7.5 5.25A2.25 2.25 0 019.75 3h4.5A2.25 2.25 0 0116.5 5.25v1.5h-9v-1.5zm-2.25.75A2.25 2.25 0 003 8.25v9A2.25 2.25 0 005.25 19.5h13.5A2.25 2.25 0 0021 17.25v-9A2.25 2.25 0 0018.75 6h-1.5V5.25A3.75 3.75 0 0013.5 1.5h-4.5A3.75 3.75 0 005.25 5.25V6h-1.5zm10.5 4.5a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5z" clipRule="evenodd" /></svg>
);
const ClipboardDocumentCheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}><path fillRule="evenodd" d="M10.5 3.75a.75.75 0 01.75.75V4.5h2.25V3.75a.75.75 0 011.5 0V4.5h.75A2.25 2.25 0 0118 6.75v10.5A2.25 2.25 0 0115.75 19.5H8.25A2.25 2.25 0 016 17.25V6.75A2.25 2.25 0 018.25 4.5h.75V3.75a.75.75 0 011.5 0zm2.25 3H8.25V6h4.5v.75z" clipRule="evenodd" /><path d="M11.03 12.22a.75.75 0 010 1.06l-1.72 1.72a.75.75 0 01-1.06-1.06l1.72-1.72a.75.75 0 011.06 0zM14.28 11.53a.75.75 0 00-1.06-1.06l-4.5 4.5a.75.75 0 101.06 1.06l4.5-4.5z" /></svg>
);
const CreditCardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}><path d="M4.5 3.75a3 3 0 00-3 3v10.5a3 3 0 003 3h15a3 3 0 003-3V6.75a3 3 0 00-3-3h-15z" /><path fillRule="evenodd" d="M5.25 7.5A.75.75 0 016 6.75h12a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75H6a.75.75 0 01-.75-.75V7.5zM6 12a.75.75 0 000 1.5h6a.75.75 0 000-1.5H6z" clipRule="evenodd" /></svg>
);
const WrenchScrewdriverIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M12 6.75a5.25 5.25 0 015.25 5.25c0 2.446-1.652 4.512-3.977 5.083a.75.75 0 01-.628-.284Path.75.75 0 01-.284-.628A3.752 3.752 0 0012 15.75a3.752 3.752 0 00-3.362 2.173.75.75 0 01-.284.628.75.75 0 01-.628.284A5.251 5.251 0 016.75 12a5.25 5.25 0 015.25-5.25z" clipRule="evenodd" />
    <path d="M6.222 18.252a.75.75 0 01-.397-.694c-.003-.245.07-.486.203-.69l4.03-6.512a5.234 5.234 0 012.283-1.517.75.75 0 01.476.153l3.105 3.106a.75.75 0 01.153.476c.133.76.433 1.507.886 2.167L18 17.207a.75.75 0 01-.222.658l-6.061 4.668a.75.75 0 01-.877 0l-5.556-4.278z" />
    <path d="M2.25 12.013A5.25 5.25 0 0012 21.75l.035-.004a5.25 5.25 0 00-.027-10.496L2.25 12.013z" />
  </svg>
);

const BanknotesIcon: React.FC<{className?:string}> = ({className}) => ( 
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.378 1.602a.75.75 0 00-.756 0L3 6.632l9 5.25 9-5.25-8.622-5.03zM21.75 7.903l-9 5.25v9l8.628-5.032a.75.75 0 00.372-.648V7.903zM11.25 22.153v-9l-9-5.25v8.853a.75.75 0 00.372.648l8.628 5.033z" />
  </svg>
);


const AdminDashboardPage: React.FC = () => {
  const { currentUser, isOwner } = useAuth();

  const adminTabs: AdminTab[] = [
    { label: 'Dashboard', path: '/admin', subpath: '', icon: ChartBarIcon, group: "General" },
    { label: 'Home Slides', path: '/admin/manage-home-slides', subpath: 'manage-home-slides', icon: PresentationChartLineIcon, group: "Content Management" },
    { label: 'Sermons', path: '/admin/manage-sermons', subpath: 'manage-sermons', icon: DocumentTextIcon, group: "Content Management" },
    { label: 'Events', path: '/admin/manage-events', subpath: 'manage-events', icon: CalendarDaysIcon, group: "Content Management" },
    { label: 'Ministries', path: '/admin/manage-ministries', subpath: 'manage-ministries', icon: BuildingLibraryIcon, group: "Content Management" },
    { label: 'Blog', path: '/admin/manage-blog', subpath: 'manage-blog', icon: HeroNewspaperIcon, group: "Content Management" },
    { label: 'News', path: '/admin/manage-news', subpath: 'manage-news', icon: HeroNewspaperIcon, group: "Content Management" }, 
    
    { label: 'Direct Media Uploads', path: '/admin/manage-direct-media', subpath: 'manage-direct-media', icon: PhotoIcon, group: "Media Management"},
    { label: 'PDF Theme Images', path: '/admin/manage-theme-images', subpath: 'manage-theme-images', icon: PhotoIcon, group: "Media Management"}, 
    
    { label: 'About Sections', path: '/admin/manage-about-sections', subpath: 'manage-about-sections', icon: InformationCircleIcon, group: "About Page Settings" },
    { label: 'Key Persons', path: '/admin/manage-key-persons', subpath: 'manage-key-persons', icon: UserIcon, group: "About Page Settings" },
    { label: 'History Milestones', path: '/admin/manage-history', subpath: 'manage-history', icon: ClockIcon, group: "About Page Settings" },
    { label: 'Church History (Book)', path: '/admin/manage-church-history', subpath: 'manage-church-history', icon: BookOpenIcon, group: "Church Records" }, 
    { label: 'Branches', path: '/admin/manage-branches', subpath: 'manage-branches', icon: GlobeEuropeAfricaIcon, group: "Church Network" },
    { label: 'Fellowship Schedules', path: '/admin/manage-fellowship-schedules', subpath: 'manage-fellowship-schedules', icon: HeroCalendarIcon, group: "Program Management" }, // Using HeroCalendarIcon for consistency
    { label: 'Advertisements', path: '/admin/manage-advertisements', subpath: 'manage-advertisements', icon: HeroSpeakerWaveIcon, group: "Site Utilities" }, // Using HeroSpeakerWaveIcon for consistency
  ];

  const ownerTabs: AdminTab[] = [];
   if (isOwner) {
    ownerTabs.push(
      { label: 'Church Members', path: '/admin/manage-members', subpath: 'manage-members', icon: UsersIconAdmin, group: "Membership & Admin" },
      { label: 'Meeting Logs', path: '/admin/manage-meetings', subpath: 'manage-meetings', icon: BriefcaseIcon, group: "Membership & Admin" },
      { label: 'Decision Logs', path: '/admin/manage-decisions', subpath: 'manage-decisions', icon: ClipboardDocumentCheckIcon, group: "Membership & Admin" },
      { label: 'Expense Records', path: '/admin/manage-expenses', subpath: 'manage-expenses', icon: CreditCardIcon, group: "Finance" },
      { label: 'Collection Records', path: '/admin/manage-collection-records', subpath: 'manage-collection-records', icon: BanknotesIcon, group: "Finance" },
      { label: 'Donation Records', path: '/admin/donation-records', subpath: 'donation-records', icon: CurrencyDollarIcon, group: "Finance" },
      { label: 'Manage Donate Page', path: '/admin/manage-donate-page', subpath: 'manage-donate-page', icon: CurrencyDollarIcon, group: "Finance" },
      { label: 'Prayer Requests', path: '/admin/manage-prayer-requests', subpath: 'manage-prayer-requests', icon: PrayerHandsIcon, group: "Community Engagement" },
      { label: 'Ministry Join Requests', path: '/admin/ministry-join-requests', subpath: 'ministry-join-requests', icon: UserPlusIcon, group: "Community Engagement" }, // Group changed
      { label: 'Contact Messages', path: '/admin/contact-messages', subpath: 'contact-messages', icon: ChatBubbleLeftRightIcon, group: "Community Engagement" }, // Group changed
      { label: 'Users', path: '/admin/users', subpath: 'users', icon: UsersGroupIcon, group: "Site Administration" },
      { label: 'SEO Tools', path: '/admin/seo-tools', subpath: 'seo-tools', icon: WrenchScrewdriverIcon, group: "Site Administration" },
      { label: 'Activity Log', path: '/admin/activity-log', subpath: 'activity-log', icon: ArchiveBoxIcon, group: "Site Administration" }
    );
  }
  const allTabs = [...adminTabs, ...ownerTabs];


  const groupedTabs = allTabs.reduce((acc, tab) => {
    const groupName = tab.group || 'Other';
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(tab);
    return acc;
  }, {} as Record<string, AdminTab[]>);

  // Sort groups: General, Content Management, Media Management, About Page Settings, Church Records, Program Management, Community Engagement, Membership & Admin, Finance, Site Administration, Other
  const groupOrder = ["General", "Content Management", "Media Management", "About Page Settings", "Church Records", "Program Management", "Community Engagement", "Membership & Admin", "Finance", "Site Administration", "Other"];

  const sortedGroupEntries = Object.entries(groupedTabs).sort(([groupA], [groupB]) => {
      const indexA = groupOrder.indexOf(groupA);
      const indexB = groupOrder.indexOf(groupB);
      if (indexA === -1 && indexB === -1) return groupA.localeCompare(groupB); // Both not in order, sort alphabetically
      if (indexA === -1) return 1; // A not in order, B is: B comes first
      if (indexB === -1) return -1; // B not in order, A is: A comes first
      return indexA - indexB; // Both in order, sort by order
  });


  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150
    ${isActive 
      ? 'bg-purple-600 text-white shadow-md' 
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
    }`;

  return (
    <div className="container mx-auto px-2 sm:px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100">Admin Panel</h1>
        <p className="text-md text-slate-600 dark:text-slate-300">Welcome, {currentUser?.fullName || 'Admin'}. Select a section to manage.</p>
      </header>

      <div className="flex flex-col md:flex-row md:space-x-6 lg:space-x-8">
        <aside className="md:w-1/4 lg:w-1/5 mb-6 md:mb-0 flex-shrink-0">
          <nav className="space-y-1 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-md sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto"> 
            {sortedGroupEntries.map(([groupName, tabsInGroup]) => (
              <div key={groupName} className="mb-2 last:mb-0">
                {groupName !== 'Other' && ( // Don't show 'Other' group title explicitly if it's the only one or for better UI
                    <h3 className="px-3 pt-3 pb-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-3 first:mt-0">{groupName}</h3>
                )}
                {tabsInGroup.map((tab) => (
                  <NavLink
                    key={tab.subpath}
                    to={tab.path}
                    end={tab.subpath === ''} 
                    className={navLinkClasses}
                  >
                    {tab.icon && React.createElement(tab.icon as React.ComponentType<{ className?: string }>, { className: 'mr-3 h-5 w-5 flex-shrink-0' })}
                    <span className="truncate">{tab.label}</span>
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <main className="flex-1 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-md min-h-[calc(100vh-10rem)]"> 
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardPage;