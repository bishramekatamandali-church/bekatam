import { pdfTextMixed, registerPdfFonts } from "../utils/pdfFonts";
import { formatDateADBS, formatDateADBSShort } from "../utils/dateFormatters";
import express, { Request } from 'express';
import PDFDocument from 'pdfkit';
import { prisma } from '../db';
import { handleDatabaseFallback } from '../utils/databaseFallback';

const router = express.Router();

type DonorDonationEntry = {
  amount: number;
  date: Date;
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

type RefinedDonorEntry = {
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

const normalizeDateRange = (startDate?: string, endDate?: string) => {
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

const normalizeMatchValue = (value?: string | null) => (value ?? '').trim().toLowerCase();

const escapeXmlValue = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const safeXmlText = (value?: string | null) => escapeXmlValue((value ?? '').toString());

const findMatchingDonor = (
  donorsByName: Map<string, DonorListEntry[]>,
  donorName: string,
  address?: string | null,
  contact?: string | null
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

const addDonorDonation = (
  donorsByName: Map<string, DonorListEntry[]>,
  donorName: string,
  address: string | null | undefined,
  contact: string | null | undefined,
  donationEntry: DonorDonationEntry
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

const buildRefinedDonorList = (donors: DonorListEntry[]): RefinedDonorEntry[] => {
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

const buildDonorListPdfBuffer = (
  params: {
    title: string;
    churchName: string;
    dateRangeLabel: string;
  },
  donors: DonorListEntry[],
  refinedDonors: RefinedDonorEntry[]
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const fontRegistry = registerPdfFonts(doc);

      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const line = (text: string, options?: Record<string, unknown>) => {
        pdfTextMixed(doc, fontRegistry, text, options as any);
      };

      // Title
      doc.fontSize(18);
      line(params.churchName, { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(14);
      line(params.title, { align: 'center' });
      doc.moveDown(0.2);
      doc.fontSize(11).fillColor('#555555');
      line(params.dateRangeLabel, { align: 'center' });
      doc.fillColor('#000000');
      doc.moveDown(1);

      // Donors list
      donors.forEach((donor, index) => {
        if (index > 0) {
          doc.moveDown(0.5);
          doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
          doc.moveDown(0.6);
        }

        doc.fontSize(12);
        line(donor.donorName);

        doc.fontSize(10).fillColor('#555555');
        if (donor.address) line(`Address: ${donor.address}`);
        if (donor.contact) line(`Contact: ${donor.contact}`);
        line(`Total Donated: NPR ${Number(donor.totalAmount || 0).toFixed(2)}`);
        doc.fillColor('#000000');

        if (donor.donations.length > 0) {
          doc.moveDown(0.3);
          donor.donations.forEach((donation) => {
            const purposeLabel = donation.purpose ? ` - ${donation.purpose}` : '';
            const bullet = `• ${formatDateADBS(donation.date)} - NPR ${Number(donation.amount || 0).toFixed(2)}${purposeLabel}`;
            doc.fontSize(9);
            line(bullet);
          });
        }
      });

      // Refined donors (merged)
      if (refinedDonors.length > 0) {
        doc.addPage();
        const heading = 'Refined donors list';
        doc.fontSize(16);
        line(heading);
        doc.moveDown(0.6);

        refinedDonors.forEach((donor, index) => {
          if (index > 0) {
            doc.moveDown(0.4);
            doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
            doc.moveDown(0.4);
          }

          const mergedLabel = donor.mergedCount > 1 ? ` (merged ${donor.mergedCount})` : '';
          const purposes = donor.purposes.length > 0 ? donor.purposes.join(', ') : '—';

          line(`${donor.donorName}${mergedLabel}`);
          doc.fontSize(10).fillColor('#555555');
          line(`Address: ${donor.address ?? '—'}`);
          line(`Contact: ${donor.contact ?? '—'}`);
          line(`Total Donated: NPR ${Number(donor.totalAmount || 0).toFixed(2)}`);
          line(`Purposes: ${purposes}`);
          doc.fillColor('#000000');
        });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

const buildDonorListXml = (title: string, donors: DonorListEntry[], refinedDonors: RefinedDonorEntry[]) => {
  const donorsXml = donors
    .map((donor) => {
      const donationsXml = donor.donations
        .map(
          (donation) =>
            `      <donation>
        <date>${formatDateADBS(donation.date)}</date>
        <amount>${donation.amount.toFixed(2)}</amount>
        <collectionId>${safeXmlText(donation.collectionId)}</collectionId>
        <purpose>${safeXmlText(donation.purpose)}</purpose>
      </donation>`
        )
        .join('\n');

      return `    <donor>
      <name>${safeXmlText(donor.donorName)}</name>
      <address>${safeXmlText(donor.address)}</address>
      <contact>${safeXmlText(donor.contact)}</contact>
      <totalAmount>${donor.totalAmount.toFixed(2)}</totalAmount>
      <donations>
${donationsXml}
      </donations>
    </donor>`;
    })
    .join('\n');

  const refinedXml = refinedDonors
    .map((donor) => {
      const purposesXml = donor.purposes
        .map((purpose) => `        <purpose>${safeXmlText(purpose)}</purpose>`)
        .join('\n');
      return `    <refinedDonor>
      <name>${safeXmlText(donor.donorName)}</name>
      <address>${safeXmlText(donor.address)}</address>
      <contact>${safeXmlText(donor.contact)}</contact>
      <totalAmount>${donor.totalAmount.toFixed(2)}</totalAmount>
      <mergedCount>${donor.mergedCount}</mergedCount>
      <purposes>
${purposesXml}
      </purposes>
    </refinedDonor>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<donorsList>
  <title>${safeXmlText(title)}</title>
  <donors>
${donorsXml}
  </donors>
  <refinedDonorsHeader>refined doners list</refinedDonorsHeader>
  <refinedDonors>
${refinedXml}
  </refinedDonors>
</donorsList>`;
};

type DonorListQuery = {
  startDate?: string;
  endDate?: string;
  format?: string;
};

router.get('/', async (req: Request<Record<string, never>, unknown, unknown, DonorListQuery>, res) => {
  const { startDate, endDate, format } = req.query;
  const { start, end } = normalizeDateRange(startDate, endDate);

  if ((startDate && !start) || (endDate && !end)) {
    return res.status(400).json({ error: 'Invalid startDate or endDate.' });
  }

  if (start && end && start > end) {
    return res.status(400).json({ error: 'startDate must be before endDate.' });
  }

  try {
    const [collectionRecords, donationRecords] = await Promise.all([
      prisma.collectionrecord.findMany({
        where: {
          ...(start || end
            ? {
                collectionDate: {
                  ...(start ? { gte: start } : {}),
                  ...(end ? { lte: end } : {}),
                },
              }
            : {}),
        },
        include: {
          donordetail: true,
        },
        orderBy: {
          collectionDate: 'asc',
        },
      }),
      prisma.donationrecord.findMany({
        where: {
          ...(start || end
            ? {
                donationDate: {
                  ...(start ? { gte: start } : {}),
                  ...(end ? { lte: end } : {}),
                },
              }
            : {}),
        },
        orderBy: {
          donationDate: 'asc',
        },
      }),
    ]);

    const donorsByName = new Map<string, DonorListEntry[]>();
    collectionRecords.forEach((record) => {
      record.donordetail.forEach((donor) => {
        const donationEntry: DonorDonationEntry = {
          amount: Number(donor.amount ?? 0),
          date: record.collectionDate,
          collectionId: record.id,
          purpose: record.purpose,
        };
        addDonorDonation(donorsByName, donor.donorName, donor.address, donor.contact, donationEntry);
      });
    });

    donationRecords.forEach((record) => {
      const donationEntry: DonorDonationEntry = {
        amount: Number(record.amount ?? 0),
        date: record.donationDate,
        collectionId: record.id,
        purpose: record.purpose,
      };
      addDonorDonation(donorsByName, record.donorName, null, record.donorPhone ?? null, donationEntry);
    });

    const donors = Array.from(donorsByName.values())
      .flat()
      .sort((a, b) => b.totalAmount - a.totalAmount);
    const titleParts = [
      start ? formatDateADBS(start) : 'All time',
      end ? formatDateADBS(end) : 'Present',
    ];
    const title = `Donors list on ${titleParts[0]} - ${titleParts[1]}`;
    const dateRangeLabel = `${start ? formatDateADBSShort(start) : 'Start'} to ${
      end ? formatDateADBSShort(end) : 'Present'
    }`;
    const refinedDonors = buildRefinedDonorList(donors);

    if (format === 'pdf') {
      const pdfBuffer = await buildDonorListPdfBuffer(
        {
          title,
          churchName: 'Bishram Ekata Mandali',
          dateRangeLabel,
        },
        donors,
        refinedDonors
      );
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="donors_list.pdf"');
      return res.status(200).send(pdfBuffer);
    }

    if (format === 'xml') {
      const xmlPayload = buildDonorListXml(title, donors, refinedDonors);
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="donors_list.xml"');
      return res.status(200).send(xmlPayload);
    }

    return res.json({
      title,
      startDate: start ? start.toISOString() : null,
      endDate: end ? end.toISOString() : null,
      donors,
    });
  } catch (error) {
    if (handleDatabaseFallback(req, res, error)) return;
    return res.status(500).json({ error: 'Failed to fetch donors list.' });
  }
});

export default router;  
 
