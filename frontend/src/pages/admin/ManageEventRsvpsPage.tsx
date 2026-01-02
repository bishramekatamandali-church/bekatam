import React from 'react';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';

const ManageEventRsvpsPage: React.FC = () => {
  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-slate-100">Manage Event RSVPs</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">View and manage RSVPs for events.</p>
      </div>
      <Card className="dark:bg-slate-800">
        <CardHeader className="dark:border-slate-700">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-200">Event RSVPs</h2>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 dark:text-slate-400 py-8">
            RSVP management functionality is not yet implemented for this page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageEventRsvpsPage;