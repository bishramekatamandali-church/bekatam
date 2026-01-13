import React, { useMemo, useState } from 'react';
import { BS_MONTH_NAMES_EN, convertDate, getLocalToday } from '../../dateConverter';
import Button from '../ui/Button';

const NumberInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    type="number"
    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
    {...props}
  />
);

const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
    {...props}
  />
);

const DateConverterPanel: React.FC = () => {
  const todayAd = useMemo(() => getLocalToday(), []);
  const todayBs = useMemo(() => convertDate({ direction: 'AD_TO_BS', adDate: todayAd }).bsDate!, [todayAd]);

  const formatDateInput = (date: Date) => date.toLocaleDateString('en-CA');
  const [adInput, setAdInput] = useState<string>(formatDateInput(todayAd));
  const [adToBsResult, setAdToBsResult] = useState<string>('');

  const [bsYear, setBsYear] = useState<number>(todayBs.year);
  const [bsMonth, setBsMonth] = useState<number>(todayBs.month);
  const [bsDay, setBsDay] = useState<number>(todayBs.day);
  const [bsToAdResult, setBsToAdResult] = useState<string>('');

  const [dayOffset, setDayOffset] = useState<number>(0);
  const [offsetResult, setOffsetResult] = useState<string>('');

  const handleConvert = (direction: 'AD_TO_BS' | 'BS_TO_AD') => {
    try {
      if (direction === 'AD_TO_BS') {
        const { bsDate } = convertDate({ direction, adDate: adInput });
        if (!bsDate) throw new Error('Missing BS result');
        setAdToBsResult(`${bsDate.day} ${BS_MONTH_NAMES_EN[bsDate.month - 1]} ${bsDate.year} BS`);
        return;
      }

  const { adDate } = convertDate({ direction, bsDay, bsMonth, bsYear });
      if (!adDate) throw new Error('Missing AD result');
      setBsToAdResult(`${adDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} AD`);
    } catch (error) {
      if (direction === 'AD_TO_BS') {
        setAdToBsResult('Invalid AD date.');
      } else {
        setBsToAdResult('Invalid BS date.');
      }
    }
  };

  const handleOffsetCalc = () => {
    try {
      const adDate = new Date(`${adInput}T00:00:00`);
      const shifted = new Date(adDate.getTime());
      shifted.setUTCDate(shifted.getUTCDate() + dayOffset);
      const { bsDate } = convertDate({ direction: 'AD_TO_BS', adDate: shifted });
      if (!bsDate) throw new Error('Missing BS result');
      const adLabel = shifted.toISOString().slice(0, 10);
      setOffsetResult(`${adLabel} AD → ${bsDate.day} ${BS_MONTH_NAMES_EN[bsDate.month - 1]} ${bsDate.year} BS`);
    } catch (error) {
      setOffsetResult('Could not calculate offset.');
    }
  };

  return (
    <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-blue-50 px-4 py-3">
        <h3 className="text-lg font-semibold text-blue-800">Date converter</h3>
        <p className="text-sm text-blue-700">Quickly translate between AD and BS dates or shift a date by days.</p>
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-3">
        <div className="space-y-2 rounded-md border border-slate-200 p-3">
          <h4 className="text-sm font-semibold text-slate-800">AD → BS</h4>
          <TextInput
            type="date"
            value={adInput}
            onChange={(e) => setAdInput(e.target.value)}
            aria-label="AD date to convert"
          />
          <Button size="sm" variant="primary" onClick={() => handleConvert('AD_TO_BS')} className="w-full">
            Convert to BS
          </Button>
          {adToBsResult && <p className="text-sm text-slate-700">{adToBsResult}</p>}
        </div>

        <div className="space-y-2 rounded-md border border-slate-200 p-3">
          <h4 className="text-sm font-semibold text-slate-800">BS → AD</h4>
          <div className="grid grid-cols-3 gap-2">
            <NumberInput
              value={bsYear}
              onChange={(e) => setBsYear(parseInt(e.target.value, 10))}
              min={2000}
              aria-label="BS year"
              placeholder="Year"
            />
            <NumberInput
              value={bsMonth}
              onChange={(e) => setBsMonth(parseInt(e.target.value, 10))}
              min={1}
              max={12}
              aria-label="BS month"
              placeholder="Month"
            />
            <NumberInput
              value={bsDay}
              onChange={(e) => setBsDay(parseInt(e.target.value, 10))}
              min={1}
              max={32}
              aria-label="BS day"
              placeholder="Day"
            />
          </div>
          <Button size="sm" variant="primary" onClick={() => handleConvert('BS_TO_AD')} className="w-full">
            Convert to AD
          </Button>
          {bsToAdResult && <p className="text-sm text-slate-700">{bsToAdResult}</p>}
        </div>

        <div className="space-y-2 rounded-md border border-slate-200 p-3">
          <h4 className="text-sm font-semibold text-slate-800">Add / subtract days</h4>
          <div className="grid grid-cols-1 gap-2">
            <TextInput
              type="date"
              value={adInput}
              onChange={(e) => setAdInput(e.target.value)}
              aria-label="Base AD date"
            />
            <NumberInput
              value={dayOffset}
              onChange={(e) => setDayOffset(parseInt(e.target.value, 10) || 0)}
              aria-label="Days offset"
              placeholder="Days (e.g., 5 or -3)"
            />
          </div>
          <Button size="sm" variant="secondary" onClick={handleOffsetCalc} className="w-full">
            Apply offset
          </Button>
          {offsetResult && <p className="text-sm text-slate-700">{offsetResult}</p>}
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        Today: <strong>{todayBs.day} {BS_MONTH_NAMES_EN[todayBs.month - 1]} {todayBs.year} BS</strong> •{' '}
        <strong>{formatDateInput(todayAd)} AD</strong>
      </div>
    </div>
  );
};

export default DateConverterPanel;
