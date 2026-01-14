import assert from 'node:assert/strict';
import {
  adToBs,
  bsToAd,
  getLocalToday,
  getNepalDateParts,
  toAdIsoString,
  toAD,
  toBS,
} from '../src/dateConverter';

const pad = (value: number): string => value.toString().padStart(2, '0');

const anchorDates = [
  { bs: { year: 2080, month: 1, day: 1 }, ad: '2023-04-14' },
  { bs: { year: 2081, month: 1, day: 1 }, ad: '2024-04-13' },
  { bs: { year: 2079, month: 1, day: 1 }, ad: '2022-04-14' },
  { bs: { year: 2082, month: 9, day: 17 }, ad: '2026-01-01' },
];

anchorDates.forEach(({ bs, ad }) => {
  const adFromBs = toAdIsoString(bsToAd(bs.day, bs.month, bs.year));
  assert.equal(adFromBs, ad, `Expected BS ${bs.year}-${bs.month}-${bs.day} to map to ${ad}`);

  const bsFromAd = adToBs(ad);
  assert.equal(bsFromAd.year, bs.year);
  assert.equal(bsFromAd.month, bs.month);
  assert.equal(bsFromAd.day, bs.day);
});

const adRoundTrips = ['2023-12-25', '2024-04-13', '2025-01-01'];

adRoundTrips.forEach((ad) => {
  const bs = toBS(ad);
  const adRoundTrip = toAdIsoString(bsToAd(bs.day, bs.month, bs.year));
  assert.equal(adRoundTrip, ad, `AD → BS → AD should match for ${ad}`);
});

const bsRoundTrips = [
  { year: 2080, month: 5, day: 15 },
  { year: 2082, month: 2, day: 5 },
  { year: 2078, month: 10, day: 10 },
];

bsRoundTrips.forEach((bs) => {
  const ad = toAD({ ...bs, monthName: '' });
  const bsRoundTrip = adToBs(ad.iso);
  assert.equal(bsRoundTrip.year, bs.year, 'BS year should round trip');
  assert.equal(bsRoundTrip.month, bs.month, 'BS month should round trip');
  assert.equal(bsRoundTrip.day, bs.day, 'BS day should round trip');
});

const today = getLocalToday();
const todayParts = getNepalDateParts(new Date());
assert.equal(toAdIsoString(today), `${todayParts.year}-${pad(todayParts.month)}-${pad(todayParts.day)}`);

console.log('All date conversion tests passed.');
