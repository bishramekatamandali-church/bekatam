import React, { useMemo } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';
import { useContent } from '../../contexts/ContentContext';
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import { formatDateADBS } from '../../dateConverter';

import { MegaphoneIconOutline,
  PencilSquareIcon,
  CalendarDaysIconOutline
} from '../icons/GenericIcons';

const RightSidebar: React.FC = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const { prayerRequests, events } = useContent();
  const navigate = useNavigate();
  
  const recentPublicPrayers = useMemo(() => {
    return prayerRequests
      .filter(p => p.visibility === 'public' || p.visibility === 'anonymous')
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 3);
  }, [prayerRequests]);
  
  const upcomingEvents = useMemo(() => {
    return events
      .filter(event => event.date && new Date(event.date) >= new Date())
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
      .slice(0, 3);
  }, [events]);

  if (!isAuthenticated || !currentUser) {
    return (
      <aside className="hidden lg:block w-[320px] flex-shrink-0 text-slate-700 p-4 border-l border-slate-200 h-screen sticky top-20 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
        <div className="space-y-6">
          <section>
            <h3 className="text-md font-semibold text-slate-800 mb-2 border-b pb-1.5 border-slate-300">
              Welcome
            </h3>
            <Card>
              <CardContent>
                <p className="text-sm text-center text-slate-500 py-8">
                  Sign in to see personalized updates and your profile activity.
                </p>
              </CardContent>
            </Card>
          </section>
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden lg:block w-[320px] flex-shrink-0 text-slate-700 p-4 border-l border-slate-200 h-screen sticky top-20 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
      <div className="space-y-6">
        <Card>
          <CardHeader className="!p-3 border-b">
            <h3 className="font-semibold text-slate-700 text-sm">Quick Actions</h3>
          </CardHeader>
          <CardContent className="!p-2 grid grid-cols-2 gap-2">
            <Button onClick={() => navigate('/')} variant="ghost" size="sm" className="flex-col !h-16 text-xs"><MegaphoneIconOutline className="w-5 h-5 mb-1"/> Home Feed</Button>
            <Button onClick={() => navigate('/profile')} variant="ghost" size="sm" className="flex-col !h-16 text-xs">
                <img src={currentUser.profileImageUrl || ''} className="w-5 h-5 rounded-full mb-1 object-cover" alt="Profile"/> My Profile
            </Button>
            <Button onClick={() => navigate('/blog')} variant="ghost" size="sm" className="flex-col !h-16 text-xs"><PencilSquareIcon className="w-5 h-5 mb-1"/> Blog</Button>
            <Button onClick={() => navigate('/donate')} variant="ghost" size="sm" className="flex-col !h-16 text-xs"><MegaphoneIconOutline className="w-5 h-5 mb-1"/> Donate</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="!p-3 border-b flex items-center space-x-2">
            <CalendarDaysIconOutline className="w-4 h-4 text-slate-500" />
            <h3 className="font-semibold text-slate-700 text-sm">Upcoming Events</h3>
          </CardHeader>
          <CardContent className="!p-2 space-y-2">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map(event => (
                <div key={event.id} className="flex items-start space-x-2 p-2 rounded-md hover:bg-slate-50">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{event.title}</p>
                    <p className="text-[11px] text-slate-500">{formatDateADBS(event.date!)}
                    </p>
                  </div>
                  <Button asLink to={`/events/${event.id}`} variant="ghost" size="xs" className="ml-auto text-[11px]">View</Button>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 p-2 text-center">No upcoming events.</p>
            )}          
          </CardContent>
          <div className="border-t border-slate-200 px-3 py-2 text-center">
            <Button asLink to="/events" variant="ghost" size="sm" className="text-xs w-full">View All Events</Button>
          </div>     
        </Card>

        <Card>
          <CardHeader className="!p-3 border-b flex items-center space-x-2">
            <MegaphoneIconOutline className="w-4 h-4 text-slate-500" />
            <h3 className="font-semibold text-slate-700 text-sm">Latest Public Prayers</h3>
          </CardHeader>
          <CardContent className="!p-2 space-y-2">
            {recentPublicPrayers.length > 0 ? (
              recentPublicPrayers.map(prayer => (
                <div key={prayer.id} className="p-2 rounded-md hover:bg-slate-50">
                  <p className="text-xs font-semibold text-slate-800 truncate">{prayer.title}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{prayer.requestText}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 p-2 text-center">No recent public prayers.</p>
            )} 
          </CardContent>
        <div className="border-t border-slate-200 px-3 py-2 text-center">
            <Button asLink to="/" variant="ghost" size="sm" className="text-xs w-full">Visit Home</Button>
          </div>
        </Card>
      </div>
    </aside>
  );
};

export default RightSidebar;
