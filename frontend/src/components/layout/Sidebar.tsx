


import React, { useState, useEffect, useMemo } from 'react';
import { Link } from "react-router-dom";
import { useContent } from '../../contexts/ContentContext';
import { Sermon, EventItem, BlogPost, NewsItem, Advertisement, AD_SIZES, PrayerRequest } from '../../types';
import SocialIcons from '../ui/SocialIcons';
import Button from '../ui/Button';
import SidebarContentCard from '../sidebar/SidebarContentCard'; 
import { formatDateADBS } from '../../dateConverter';
import { useAuth } from '../../contexts/AuthContext'; // Added useAuth
import { PrayerHandsIcon } from '../icons/GenericIcons'; // Added PrayerHandsIcon
import AdSlot from '../ads/AdSlot';

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-4 h-4"}><path fillRule="evenodd" d="M5.75 2.25A.75.75 0 016.5 3v.75h7V3A.75.75 0 0114.25 3v.75h.75a3 3 0 013 3v9.75a3 3 0 01-3 3H5a3 3 0 01-3-3V7.5a3 3 0 013-3H5.75V3A.75.75 0 015.75 2.25zM4.5 10.5V18A1.5 1.5 0 006 19.5h8a1.5 1.5 0 001.5-1.5v-7.5H4.5z" clipRule="evenodd" /></svg>
);
const GiftIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M10 1a1.5 1.5 0 011.446 1.254l1.085 4.606a.5.5 0 00.475.39h4.606a1.5 1.5 0 011.254 1.446L18.75 10l-.116.116A1.5 1.5 0 0117.25 10h-1.01a3.501 3.501 0 00-2.475-2.475V6.52a1.5 1.5 0 01-1.116-1.446L12.544 1A1.5 1.5 0 0110 1zM3.25 10a1.5 1.5 0 011.116-.616L4.48 9.27v1.254a3.501 3.501 0 002.475 2.475h1.01a1.5 1.5 0 011.384 1.384L10 15.894l-.116.116a1.5 1.5 0 01-1.446-1.254L7.352 10.15A3.5 3.5 0 005.48 8.766l-.22-.006H3.25z" /><path d="M6.204 11.32A3.511 3.511 0 016.5 12.5c0 .347.053.682.151 1H3.375a.75.75 0 010-1.5h2.829zM10 17a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM14.849 11a3.511 3.511 0 01-.296 1.18h2.821a.75.75 0 000-1.5H14.85z" /></svg>
);

const sidebarSocialLinks = [
    { platform: 'facebook', url: 'https://facebook.com/yourchurchpage', label: 'BEM Church on Facebook' },
    { platform: 'youtube', url: 'https://youtube.com/yourchurchchannel', label: 'BEM Church on YouTube' },
    { platform: 'instagram', url: 'https://instagram.com/yourchurchprofile', label: 'BEM Church on Instagram' },
];

interface SidebarCyclingItem {
  id: string;
  title: string;
  linkPath: string;
  imageUrl?: string;
  date?: string;
  category?: string; 
  displayTypeLabel: string; 
  originalItem: EventItem | Sermon | NewsItem | BlogPost; 
}


const Sidebar: React.FC = () => {
  const { events, sermons, newsItems, blogPosts, advertisements, prayerRequests, loadingContent } = useContent();
  const { isAuthenticated } = useAuth(); // Added isAuthenticated
  const currentYear = new Date().getFullYear();

  const [currentCombinedItemIndex, setCurrentCombinedItemIndex] = useState(0);

  const combinedCyclingItems = useMemo<SidebarCyclingItem[]>(() => {
    const items: SidebarCyclingItem[] = [];
    
    events.sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime()).slice(0, 2)
      .forEach(e => items.push({ ...e, date: e.date, displayTypeLabel: "Events", originalItem: e }));
      
    sermons.sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime()).slice(0, 2)
      .forEach(s => items.push({ ...s, date: s.date, displayTypeLabel: "Sermons", originalItem: s }));
      
    newsItems.sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime()).slice(0, 2)
      .forEach(n => items.push({ ...n, date: n.date, displayTypeLabel: "News", originalItem: n }));
      
    blogPosts.sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime()).slice(0, 2)
      .forEach(b => items.push({ ...b, date: b.date, displayTypeLabel: "Blog", originalItem: b }));
      
    return items;
  }, [events, sermons, newsItems, blogPosts]);

  useEffect(() => {
    if (combinedCyclingItems.length > 1) {
      const intervalId = setInterval(() => {
        setCurrentCombinedItemIndex(prev => (prev + 1) % combinedCyclingItems.length);
      }, 2500); 
      return () => clearInterval(intervalId);
    }
  }, [combinedCyclingItems.length]);

  return (
    <aside className="hidden md:block w-[280px] lg:w-[320px] flex-shrink-0 text-slate-700 p-4 border-r border-slate-200 h-screen sticky top-20 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
      <div className="space-y-6">
        
        <section>
          <h3 className="text-md font-semibold text-slate-800 mb-2 border-b pb-1.5 border-slate-300">Latest Updates</h3>
          <div className="h-48"> 
            {loadingContent && combinedCyclingItems.length === 0 && (
                 <div className="p-3 bg-slate-200 rounded-lg animate-pulse h-full flex items-center justify-center">
                    <p className="text-sm text-slate-500">Loading...</p>
                 </div>
            )}
            {!loadingContent && combinedCyclingItems.length === 0 && (
                <p className="text-xs text-center text-slate-500 px-1 py-4 h-full flex items-center justify-center">No recent updates.</p>
            )}
            {!loadingContent && combinedCyclingItems.length > 0 && (
                <SidebarContentCard 
                    item={combinedCyclingItems[currentCombinedItemIndex].originalItem} 
                    typeLabel={combinedCyclingItems[currentCombinedItemIndex].displayTypeLabel} 
                />
            )}
          </div>
        </section>
        
        <AdSlot placementKey="sidebar_main" />

        <section className="text-center p-3 bg-teal-50 rounded-lg border border-teal-200">
            <GiftIcon className="w-6 h-6 mx-auto mb-2 text-teal-600"/>
            <p className="text-xs italic text-teal-700 mb-2">
                "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver." - 2 Cor 9:7
            </p>
            <Button asLink to="/donate" variant="primary" size="sm" className="w-full">
                Support Our Mission
            </Button>
        </section>
        
        <section>
           <Button asLink to="/event-calendar" variant="outline" size="sm" className="w-full">
                <CalendarIcon className="mr-2 w-4 h-4"/> View Event Calendar
            </Button>
        </section>

        <section>
          <h3 className="text-md font-semibold text-slate-800 mb-2 border-b pb-1.5 border-slate-300">Quick Links</h3>
          <ul className="space-y-1 text-sm">
            <li><Link to="/about" className="hover:text-purple-600 transition-colors">About Us</Link></li>
            <li><Link to="/church-history" className="hover:text-purple-600 transition-colors">Church History</Link></li>
            <li><Link to="/branches" className="hover:text-purple-600 transition-colors">Branches</Link></li>
            <li><Link to="/media" className="hover:text-purple-600 transition-colors">Media Library</Link></li>
          </ul>
        </section>

        <section>
          <h3 className="text-md font-semibold text-slate-800 mb-2 border-b pb-1.5 border-slate-300">Connect With Us</h3>
          <div className="text-xs space-y-1">
            <p>Gauri Marg, Sinamangal, Kathmandu</p>
            <p><a href="mailto:shahidsingh1432@gmail.com" className="hover:text-purple-600 transition-colors">shahidsingh1432@gmail.com</a></p>
            <p><a href="tel:+9779865272258" className="hover:text-purple-600 transition-colors">+977-9865272258</a></p>
          </div>
           <SocialIcons links={sidebarSocialLinks} iconClassName="text-slate-400 hover:text-purple-500 transition-colors w-5 h-5" className="flex space-x-3 mt-3" />
        </section>
        
        <div className="pt-3 border-t border-slate-300 text-center text-xs">
          <p>© {currentYear} Bishram Ekata Mandali. All rights reserved.</p>
        </div>
      </div>
       <style>{`
        .custom-scrollbar-sidebar-events::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar-sidebar-events::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar-sidebar-events::-webkit-scrollbar-thumb {
          background: #cbd5e1; /* slate-300 */
          border-radius: 2.5px;
        }
        .dark .custom-scrollbar-sidebar-events::-webkit-scrollbar-thumb {
          background: #4b5563; /* slate-600 */
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;