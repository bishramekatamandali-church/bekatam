export type DonorDonationEntry = {
  amount: number;
  date: Date;
  collectionId: string;
  purpose?: string | null;
};

export type DonorListEntry = {
  donorName: string;
  address?: string | null;
  contact?: string | null;
  totalAmount: number;
  donations: DonorDonationEntry[];
};

export type RefinedDonorEntry = {
  donorName: string;
  address: string | null;
  contact: string | null;
  totalAmount: number;
  purposes: string[];
  mergedCount: number;
};

const parseDateParam = (value?: string) => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const normalizeDateRange = (startDate?: string, endDate?: string) => {
  const start = parseDateParam(startDate);
  const end = parseDateParam(endDate);
  if (!start && !end) {
    return { start: null, end: null };
  }
  if (!start || !end) {
    return { start, end };
  }
  const normalizedEnd = new Date(end);
  normalizedEnd.setHours(23, 59, 59, 999);
  return { start, end: normalizedEnd };
};

const normalizeMatchValue = (value?: string | null) => (value ?? "").trim().toLowerCase();

const findMatchingDonor = (
  donorsByName: Map<string, DonorListEntry[]>,
  donorName: string,
  address?: string | null,
  contact?: string | null,
) => {
  const nameKey = normalizeMatchValue(donorName);
  const candidates = donorsByName.get(nameKey);
  if (!candidates) {
    return null;
  }
  const addressKey = normalizeMatchValue(address);
  const contactKey = normalizeMatchValue(contact);
  return (
    candidates.find((candidate) => {
      const candidateAddress = normalizeMatchValue(candidate.address);
      const candidateContact = normalizeMatchValue(candidate.contact);
      const addressMatches = addressKey && candidateAddress && addressKey === candidateAddress;
      const contactMatches = contactKey && candidateContact && contactKey === candidateContact;
      return addressMatches || contactMatches;
    }) ?? null
  );
};

export const addDonorDonation = (
  donorsByName: Map<string, DonorListEntry[]>,
  donorName: string,
  address: string | null | undefined,
  contact: string | null | undefined,
  donationEntry: DonorDonationEntry,
) => {
  const trimmedName = donorName.trim();
  if (!trimmedName) {
    return;
  }
  const nameKey = normalizeMatchValue(trimmedName);
  const existing = findMatchingDonor(donorsByName, trimmedName, address, contact);
  if (existing) {
    existing.totalAmount += donationEntry.amount;
    existing.donations.push(donationEntry);
    if (!existing.address && address) {
      existing.address = address;
    }
    if (!existing.contact && contact) {
      existing.contact = contact;
    }
    return;
  }
  const newEntry: DonorListEntry = {
    donorName: trimmedName,
    address: address ?? null,
    contact: contact ?? null,
    totalAmount: donationEntry.amount,
    donations: [donationEntry],
  };
  const bucket = donorsByName.get(nameKey);
  if (bucket) {
    bucket.push(newEntry);
  } else {
    donorsByName.set(nameKey, [newEntry]);
  }
};

export const buildRefinedDonorList = (donors: DonorListEntry[]): RefinedDonorEntry[] => {
  const grouped = new Map<string, RefinedDonorEntry>();

  donors.forEach((donor) => {
    const normalizedName = donor.donorName.trim().toLowerCase();
    if (!normalizedName) {
      return;
    }
    const purposes = donor.donations
      .map((donation) => donation.purpose?.trim())
      .filter((purpose): purpose is string => Boolean(purpose))
      .map((purpose) => purpose.toLowerCase());
    const existing = grouped.get(normalizedName);

    if (!existing) {
      grouped.set(normalizedName, {
        donorName: donor.donorName,
        address: donor.address?.trim() || null,
        contact: donor.contact?.trim() || null,
        totalAmount: Number(donor.totalAmount) || 0,
        purposes: [...purposes],
        mergedCount: 1,
      });
      return;
    }

    existing.totalAmount += Number(donor.totalAmount) || 0;
    existing.mergedCount += 1;
    if (!existing.address && donor.address?.trim()) {
      existing.address = donor.address.trim();
    }
    if (!existing.contact && donor.contact?.trim()) {
      existing.contact = donor.contact.trim();
    }
    existing.purposes.push(...purposes);
  });

  return Array.from(grouped.values()).map((entry) => ({
    ...entry,
    purposes: Array.from(new Set(entry.purposes)),
  }));
};
