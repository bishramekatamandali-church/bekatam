import React, { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useContent } from '../contexts/ContentContext';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import { formatTimestampADBS } from '../dateConverter';

const ProfilePage: React.FC = () => {
  const { currentUser, loadingAuthState } = useAuth();
  const { blogPosts, prayerRequests, testimonials } = useContent();

  const activityItems = useMemo(() => {
    if (!currentUser) return [];
    
     return [
      ...blogPosts
        .filter((post) => post.postedByAdminId === currentUser.id)
        .map((post) => ({
          id: post.id,
          title: post.title,
          type: 'Blog Post',
          timestamp: post.publishedAt || post.createdAt,
        })),
      ...prayerRequests
        .filter((request) => request.postedByAdminId === currentUser.id)
        .map((request) => ({
          id: request.id,
          title: request.title,
          type: 'Prayer Request',
          timestamp: request.submittedAt || request.createdAt,
        })),
      ...testimonials
        .filter((testimonial) => testimonial.userId === currentUser.id)
        .map((testimonial) => ({
          id: testimonial.id,
          title: testimonial.title || 'Testimonial',
          type: 'Testimonial',
          timestamp: testimonial.createdAt,
        })),
    ].sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });

    }, [blogPosts, prayerRequests, testimonials, currentUser]);

  if (loadingAuthState) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-xl text-slate-600 dark:text-slate-300">Loading profile...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
 return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 bg-slate-50 dark:bg-slate-800 border-b">
          <div className="flex items-center space-x-4">
            {currentUser.profileImageUrl ? (
              <img
                src={currentUser.profileImageUrl}
                alt={currentUser.fullName}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold">
                {currentUser.fullName.charAt(0).toUpperCase()}
              </div>
            )}
          
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{currentUser.fullName}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-300">Member profile</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">About</h2>
              <p className="mt-2 text-slate-700 dark:text-slate-200 whitespace-pre-line">
                {currentUser.bio || 'No additional details provided yet.'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/70">
                <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{currentUser.email}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/70">
                <p className="text-xs uppercase tracking-wide text-slate-500">Contact Number</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{currentUser.phone || 'Not provided'}</p>
              </div>
            </div>
             </div>
          <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/70 space-y-3">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Profile Snapshot</h3>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Email</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100 break-words">{currentUser.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Contact</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{currentUser.phone || 'Not provided'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

        <Card>
        <CardHeader className="border-b">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Recent Activity</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {activityItems.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-300 py-6">No activity recorded yet.</p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {activityItems.map((item) => (
                <li key={item.id} className="py-3 flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.type}</p>
                  </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 ml-4 whitespace-nowrap">
                    {item.timestamp ? formatTimestampADBS(item.timestamp) : 'No date'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
