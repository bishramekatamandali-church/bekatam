import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink } from "react-router-dom";
import { NavItem } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from '../auth/AuthModal';
import Button from '../ui/Button';
import NotificationIcon from '../notifications/NotificationIcon';
import { HeroNewspaperIcon, CogIcon as HeroCog6ToothIcon, SearchIcon as HeroMagnifyingGlassIcon, ChevronDownIcon as HeroChevronDownIcon, PrayerHandsIcon, TestimonyIcon, ChatBubbleOvalLeftEllipsisIcon } from '../icons/GenericIcons'; 
import GlobalSearchModal from '../search/GlobalSearchModal'; 
import { useNotification } from '../../contexts/NotificationContext';
import { ArrowDownTrayIcon as HeroArrowDownTrayIcon } from '@heroicons/react/24/outline';

const ChurchIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75h.008v.008H12v-.008z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h12" />
  </svg>
);

const MenuIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const CloseIconMenu: React.FC = () => ( 
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CalendarDaysIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
  </svg>
);

const BookOpenIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-5 h-5"}><path d="M11.25 4.533A9.709 9.709 0 0 0 3 12a9.709 9.709 0 0 0 8.25 7.467c.953.093 1.69.837 1.69 1.779V21.75a.75.75 0 0 0 1.5 0V21.25c0-.942.737-1.686 1.69-1.779A9.709 9.709 0 0 0 21 12a9.709 9.709 0 0 0-8.25-7.467V3.75a.75.75 0 0 0-1.5 0v.783Z" /><path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" /></svg>
);
const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-5 h-5"}><path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63L12.5 21.75l-.435.145a.75.75 0 0 1-.63 0l-2.955-.985a.75.75 0 0 1-.363-.63l-.001-.122v-.002ZM17.25 19.128l-.001.121a.75.75 0 0 1-.363.63l-2.955.985a.75.75 0 0 1-.63 0l-.435-.145L10 21.75a.75.75 0 0 1-.363-.63l-.001-.119v-.004a5.625 5.625 0 0 1 11.25 0Z" /></svg>
);

const NavDropdown: React.FC<{ item: NavItem }> = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <div 
      className="relative" 
      ref={dropdownRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button 
        className="px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 whitespace-nowrap hover:bg-indigo-700 flex items-center"
        onClick={() => setIsOpen(prev => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {item.label}
        <HeroChevronDownIcon className={`ml-1 h-4 w-4 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 origin-top-left rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          {item.children?.map(child => (
            <NavLink
              key={child.path}
              to={child.path!}
              className={({ isActive }) => 
                `block w-full text-left px-4 py-2 text-sm transition-colors ${isActive ? 'bg-teal-100 text-teal-800' : 'text-slate-700 hover:bg-slate-100'}`
              }
              onClick={() => setIsOpen(false)}
            >
              {child.icon && React.createElement(child.icon, {className: "inline-block w-4 h-4 mr-2 align-text-bottom"})}
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

const MobileNavCollapsible: React.FC<{ item: NavItem; closeMobileMenu: () => void }> = ({ item, closeMobileMenu }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex justify-between items-center px-3 py-2 rounded-md text-base font-medium text-indigo-200 hover:bg-indigo-700 hover:text-white"
        aria-expanded={isOpen}
      >
        <span>
          {item.icon && React.createElement(item.icon, { className: "inline-block w-4 h-4 mr-1.5 align-text-bottom" })}
          {item.label}
        </span>
        <HeroChevronDownIcon className={`ml-1 h-5 w-5 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="pl-4 border-l-2 border-indigo-600 ml-3 py-1">
          {item.children?.map(child => (
             <NavLink
              key={child.path}
              to={child.path!}
              className={({isActive}) => `block px-3 py-2 rounded-md text-base font-medium transition-colors duration-150 ${isActive ? 'bg-teal-500 text-white' : 'text-indigo-200 hover:bg-indigo-700 hover:text-white'}`}
              onClick={closeMobileMenu}
            >
              {child.icon && React.createElement(child.icon, { className: "inline-block w-4 h-4 mr-1.5 align-text-bottom" })}
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};


const Header: React.FC<{ installPrompt: any; onInstallClick: () => void; }> = ({ installPrompt, onInstallClick }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { isAuthenticated, isAdmin, logout, currentUser, friendRequestCount } = useAuth();
  const { unreadCount } = useNotification();
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // Corresponds to lg breakpoint
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleProfileDropdown = () => setIsProfileDropdownOpen(prev => !prev);
  const closeProfileDropdown = () => setIsProfileDropdownOpen(false);

  const baseNavItems: NavItem[] = [
    { label: "Home", path: '/' },
    {
      label: "Community",
      children: [
        { label: "Updates", path: '/updates', icon: PrayerHandsIcon }, // Prayer Wall
        { label: "Community Feed", path: '/community', icon: UsersIcon },
        { label: "Blog", path: '/blog' },
        { label: "News", path: '/news', icon: HeroNewspaperIcon },
      ]
    },
    {
      label: "Connect",
      children: [
        { label: "Ministries", path: '/ministries' },
        { label: "Events", path: '/events' },
        { label: "Event Calendar", path: '/event-calendar', icon: CalendarDaysIcon },
        { label: "Our Branches", path: '/branches' },
        { label: "Contact Us", path: '/contact' },
      ]
    },
    {
      label: "Resources",
      children: [
        { label: "Sermons", path: '/sermons' },
        { label: "Media Library", path: '/media' },
        { label: "Church History", path: '/church-history', icon: BookOpenIcon },
      ]
    },
    { label: "About", path: '/about' },
    { label: "Donate", path: '/donate' },
  ];
  
  const allNavItems: NavItem[] = isAdmin ? [...baseNavItems, { label: "Admin Panel", path: '/admin', adminOnly: true }] : baseNavItems;
  
  const NavLinkStyles = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 whitespace-nowrap ${
      isActive ? 'bg-teal-500 text-white' : 'hover:bg-indigo-700'
    }`;

  const dropdownItemStyles = "block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors";

  return (
    <>
      <header className="bg-indigo-800 text-white shadow-lg sticky top-0 z-50 h-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              <ChurchIcon />
              <span className="hidden sm:inline text-xl sm:text-2xl font-bold tracking-tight">BEM</span>
            </Link>
            
            <nav className="hidden lg:flex items-center space-x-1 lg:space-x-2 flex-wrap justify-center flex-grow mx-4">
              {allNavItems.map((item) => (
                item.children ? (
                  <NavDropdown key={item.label} item={item} />
                ) : (
                  <NavLink
                    key={item.label}
                    to={item.path!}
                    className={NavLinkStyles}
                  >
                    {item.icon && React.createElement(item.icon, {className: "inline-block w-4 h-4 mr-1 align-text-bottom"})}
                    {item.label}
                  </NavLink>
                )
              ))}
            </nav>

            <div className="flex items-center flex-shrink-0">
               <button
                  onClick={() => setIsSearchModalOpen(true)}
                  className="p-1.5 ml-1 rounded-full text-indigo-200 hover:text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-800"
                  aria-label={"Search site"}
                >
                  <HeroMagnifyingGlassIcon className="w-6 h-6" />
                </button>
              {installPrompt && (
                <Button onClick={onInstallClick} variant="outline" size="sm" className="ml-2 hidden lg:inline-flex items-center !text-white !border-white hover:!bg-white hover:!text-indigo-800">
                  <HeroArrowDownTrayIcon className="w-4 h-4 mr-1.5" />
                  Install
                </Button>
              )}
              {isAuthenticated && currentUser ? (
                <>
                  <Link
                    to="/community"
                    className="p-1.5 ml-1 rounded-full text-indigo-200 hover:text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-800"
                    aria-label="Messages"
                  >
                    <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6" />
                  </Link>
                  <NotificationIcon /> 
                  <div className="relative ml-2" ref={profileDropdownRef}>
                    <button
                      onClick={toggleProfileDropdown}
                      className="flex items-center max-w-xs rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-800 p-0.5 hover:bg-indigo-700"
                      id="user-menu-button" 
                      aria-expanded={isProfileDropdownOpen} 
                      aria-haspopup="true"
                    >
                      <span className="sr-only">Open user menu</span>
                      {currentUser.profileImageUrl ? (
                        <img className="h-8 w-8 rounded-full object-cover" src={currentUser.profileImageUrl} alt="User profile" />
                      ) : (
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-600 hover:bg-indigo-500">
                          <span className="text-sm font-medium leading-none text-white">{currentUser.fullName.charAt(0).toUpperCase()}</span>
                        </span>
                      )}
                       <HeroChevronDownIcon className="ml-1 h-4 w-4 text-indigo-300 group-hover:text-white" />
                    </button>
                    {isProfileDropdownOpen && (
                      <div
                        className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                        role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button" tabIndex={-1}
                      >
                        <div className="px-4 py-3 border-b border-slate-200">
                            <p className="text-sm text-slate-800">Signed in as</p>
                            <p className="text-sm font-medium text-slate-900 truncate">{currentUser.fullName}</p>
                        </div>
                        <NavLink to="/profile" className={dropdownItemStyles} role="menuitem" tabIndex={-1} onClick={closeProfileDropdown}>
                            Profile
                        </NavLink>
                         <button onClick={() => { logout(); closeProfileDropdown(); }} className={`${dropdownItemStyles} w-full text-left`}>
                            Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Button onClick={() => setIsAuthModalOpen(true)} variant="primary" size="sm" className="ml-2 hidden lg:inline-flex">
                  Login / Register
                </Button>
              )}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="ml-1 lg:hidden p-2 rounded-md text-indigo-200 hover:text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? <CloseIconMenu /> : <MenuIcon />}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div 
            className="lg:hidden absolute top-20 right-0 w-64 bg-indigo-800 shadow-lg pb-3 max-h-[calc(100vh-5rem)] overflow-y-auto" 
            id="mobile-menu"
          >
            <nav className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {installPrompt && (
                <Button onClick={() => { onInstallClick(); setIsMobileMenuOpen(false); }} variant="primary" className="w-full mb-2 flex items-center justify-center">
                  <HeroArrowDownTrayIcon className="w-4 h-4 mr-2" />
                  Install App
                </Button>
              )}
              <button
                onClick={() => { setIsSearchModalOpen(true); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center px-3 py-2 rounded-md text-base font-medium text-indigo-200 hover:bg-indigo-700 hover:text-white"
              >
                <HeroMagnifyingGlassIcon className="inline-block w-4 h-4 mr-1.5 align-text-bottom" />
                Search
              </button>
              {allNavItems.map((item) => (
                item.children ? (
                  <MobileNavCollapsible key={item.label} item={item} closeMobileMenu={() => setIsMobileMenuOpen(false)} />
                ) : (
                  <NavLink
                    key={item.label}
                    to={item.path!}
                    className={({isActive}) => `block px-3 py-2 rounded-md text-base font-medium transition-colors duration-150 ${isActive ? 'bg-teal-500 text-white' : 'text-indigo-200 hover:bg-indigo-700 hover:text-white'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.icon && React.createElement(item.icon, { className: "inline-block w-4 h-4 mr-1.5 align-text-bottom" })}
                    {item.label}
                  </NavLink>
                )
              ))}
              {!isAuthenticated && (
                  <Button onClick={() => { setIsAuthModalOpen(true); setIsMobileMenuOpen(false); }} variant="primary" className="w-full mt-2">
                    Login / Register
                  </Button>
              )}
              {isAuthenticated && (
                  <>
                    <div className="border-t border-indigo-700 my-2"></div>
                     <NavLink
                        to="/profile"
                        className={({isActive}) => `block px-3 py-2 rounded-md text-base font-medium transition-colors duration-150 ${isActive ? 'bg-teal-500 text-white' : 'text-indigo-200 hover:bg-indigo-700 hover:text-white'}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                       Profile
                      </NavLink>
                    <Button onClick={() => { logout(); setIsMobileMenuOpen(false); }} variant="ghost" className="w-full mt-1 hover:!bg-indigo-700 text-indigo-200">
                      Logout
                    </Button>
                  </>
              )}
            </nav>
          </div>
        )}
      </header>
      {isAuthModalOpen && <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />}
      {isSearchModalOpen && <GlobalSearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />}
    </>
  );
};

export default Header;