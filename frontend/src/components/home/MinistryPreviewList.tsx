import React from 'react';
import { Link } from 'react-router-dom';
import { Ministry } from '../../types';
import Card, { CardContent } from '../ui/Card';
import Button from '../ui/Button';

interface MinistryPreviewListProps {
  ministries: Ministry[];
  loading: boolean;
  maxItems?: number;
}

const getMinistryExcerpt = (description?: string): string => {
  if (!description) return 'Details about this ministry will be updated soon.';
  return description.replace(/<[^>]+>/g, '').trim();
};

const MinistryPreviewList: React.FC<MinistryPreviewListProps> = ({ ministries, loading, maxItems }) => {
  if (loading && ministries.length === 0) {
    return <p className="text-center text-slate-500 py-6">Loading ministries...</p>;
  }

  if (ministries.length === 0) {
    return <p className="text-center text-slate-500 py-6">No ministries available right now.</p>;
  }

  const visibleMinistries = maxItems ? ministries.slice(0, maxItems) : ministries;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {visibleMinistries.map((ministry) => (
        <Card key={ministry.id} className="flex h-full flex-col overflow-hidden border border-slate-200 shadow-sm">
          {ministry.imageUrl && (
            <Link to={`/ministries/${ministry.id}`} className="block">
              <img src={ministry.imageUrl} alt={ministry.title} className="h-44 w-full object-cover" />
            </Link>
          )}
          <CardContent className="flex flex-1 flex-col gap-3 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">{ministry.category || 'Ministry'}</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-800">
                <Link to={`/ministries/${ministry.id}`} className="hover:text-purple-600 transition-colors">
                  {ministry.title}
                </Link>
              </h3>
            </div>
            <p className="text-sm text-slate-600 line-clamp-3">{getMinistryExcerpt(ministry.description)}</p>
            <div className="mt-auto space-y-1 text-xs text-slate-500">
              {ministry.leader && <p><span className="font-semibold text-slate-700">Leader:</span> {ministry.leader}</p>}
              {ministry.meetingTime && <p><span className="font-semibold text-slate-700">Meets:</span> {ministry.meetingTime}</p>}
            </div>
            <Button asLink to={`/ministries/${ministry.id}`} variant="outline" size="sm" className="mt-2">
              Learn More
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MinistryPreviewList;
