import React, { useMemo, useState } from 'react';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { formatDateADBS } from '../../dateConverter';
import { API_BASE_URL } from '../../utils/apiConfig';

type DonorDonationEntry = {
  amount: number;
  date: string;
  collectionId: string;
  purpose?: string | null;
};

type DonorListEntry = {
  donorName: string;
  address?: string | null;
  contact?: string | null;
  totalAmount: number;
  donations: DonorDonationEntry[];
};

type DonorListResponse = {
  title: string;
  startDate: string | null;
  endDate: string | null;
  donors: DonorListEntry[];
};

const DonorListReportPage: React.FC = () => {
  const todayIso = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(todayIso);
  const [endDate, setEndDate] = useState<string>(todayIso);
  const [data, setData] = useState<DonorListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const donorCount = useMemo(() => data?.donors.length ?? 0, [data]);
  const totalAmount = useMemo(
    () => data?.donors.reduce((sum, donor) => sum + (Number(donor.totalAmount) || 0), 0) ?? 0,
    [data]
  );

  const buildQuery = (format?: 'pdf' | 'xml') => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (format) params.set('format', format);
    return params.toString();
  };

  const fetchDonorList = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const query = buildQuery();
      const response = await fetch(`${API_BASE_URL}/donor-lists?${query}`);
      if (!response.ok) {
        throw new Error('Failed to fetch donor list.');
      }
      const payload = (await response.json()) as DonorListResponse;
      setData(payload);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load donor list.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReport = async (format: 'pdf' | 'xml') => {
    setErrorMessage(null);
    try {
      const query = buildQuery(format);
      const response = await fetch(`${API_BASE_URL}/donor-lists?${query}`);
      if (!response.ok) {
        throw new Error('Failed to download report.');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = format === 'pdf' ? 'donors_list.pdf' : 'donors_list.xml';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to download report.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Donor List Report</h1>
          <p className="text-sm text-slate-500">Generate donor lists by date period and download PDF/XML files.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadReport('pdf')} disabled={isLoading}>
            Download PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadReport('xml')} disabled={isLoading}>
            Download XML
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-700">Filter by Date</h2>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <label htmlFor="donor-start-date" className="text-xs font-medium text-slate-600">
                Start Date
              </label>
              <input
                id="donor-start-date"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="donor-end-date" className="text-xs font-medium text-slate-600">
                End Date
              </label>
              <input
                id="donor-end-date"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={fetchDonorList} variant="primary" size="sm" disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Generate List'}
              </Button>
            </div>
          </div>
          {errorMessage && <p className="mt-3 text-sm text-red-600">{errorMessage}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-700">Donors</h2>
              {data?.title && <p className="text-xs text-slate-500">{data.title}</p>}
            </div>
            <div className="text-right text-sm text-slate-600">
              <p>Total donors: {donorCount}</p>
              <p>Total amount: NPR {totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!data ? (
            <p className="text-sm text-slate-500">Choose a date range and generate the donor list.</p>
          ) : data.donors.length === 0 ? (
            <p className="text-sm text-slate-500">No donors found for the selected period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Address</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Donated</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Latest Donation</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Latest Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.donors.map((donor) => {
                    const latestDonation = donor.donations[donor.donations.length - 1];
                    return (
                      <tr key={`${donor.donorName}-${donor.address ?? ''}-${donor.contact ?? ''}`}>
                        <td className="px-4 py-2 font-medium text-slate-700">{donor.donorName}</td>
                        <td className="px-4 py-2 text-slate-500">{donor.address || '—'}</td>
                        <td className="px-4 py-2 text-slate-500">{donor.contact || '—'}</td>
                        <td className="px-4 py-2 text-right text-slate-700">NPR {Number(donor.totalAmount).toFixed(2)}</td>
                        <td className="px-4 py-2 text-slate-500">
                          {latestDonation ? formatDateADBS(latestDonation.date) : '—'}
                        </td>
                        <td className="px-4 py-2 text-slate-500">{latestDonation?.purpose || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DonorListReportPage;
