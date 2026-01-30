import React from 'react';
import { Link } from 'react-router-dom';
import { BranchChurch } from '../../types';
import Card, { CardContent } from '../ui/Card';
import Button from '../ui/Button';

interface BranchChurchPreviewListProps {
  branchChurches: BranchChurch[];
  loading: boolean;
  maxItems?: number;
}

const BranchChurchPreviewList: React.FC<BranchChurchPreviewListProps> = ({ branchChurches, loading, maxItems }) => {
  if (loading && branchChurches.length === 0) {
    return <p className="text-center text-slate-500 py-6">Loading branch churches...</p>;
  }

  if (branchChurches.length === 0) {
    return <p className="text-center text-slate-500 py-6">No branch churches listed yet.</p>;
  }

  const visibleBranches = maxItems ? branchChurches.slice(0, maxItems) : branchChurches;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {visibleBranches.map((branch) => (
        <Card key={branch.id} className="flex h-full flex-col overflow-hidden border border-slate-200 shadow-sm">
          {branch.imageUrl && (
            <Link to={`/branches#${branch.id}`} className="block">
              <img src={branch.imageUrl} alt={branch.name} className="h-44 w-full object-cover" />
            </Link>
          )}
          <CardContent className="flex flex-1 flex-col gap-3 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">Branch Church</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-800">
                <Link to={`/branches#${branch.id}`} className="hover:text-teal-600 transition-colors">
                  {branch.name}
                </Link>
              </h3>
            </div>
            <div className="space-y-1 text-sm text-slate-600">
              <p>{branch.address}</p>
              {branch.serviceTimes && <p className="text-xs text-slate-500">Service Times: {branch.serviceTimes}</p>}
              {branch.pastorName && <p className="text-xs text-slate-500">Pastor: {branch.pastorName}</p>}
            </div>
            <Button asLink to="/branches" variant="outline" size="sm" className="mt-auto">
              View Branch Details
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BranchChurchPreviewList;
