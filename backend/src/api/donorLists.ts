import express, { Request } from 'express';
import PDFDocument from 'pdfkit';
import { prisma } from '../db';
import { handleDatabaseFallback } from '../utils/databaseFallback';

const router = express.Router();

type DonorDonationEntry = {
  amount: number;
  date: Date;
  collectionId: string;
};

type DonorListEntry = {
  donorName: string;
  address?: string | null;
  contact?: string | null;
  totalAmount: number;
  donations: DonorDonationEntry[];
};

const formatDate = (date: Date) => {
  try {
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
  } catch {
    return date.toISOString().split('T')[0];
  }
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

const buildDonorListPdfBuffer = (title: string, donors: DonorListEntry[]): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).text(title, { align: 'center' });
      doc.moveDown(1);

      donors.forEach((donor, index) => {
        if (index > 0) {
          doc.moveDown(0.5);
          doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
          doc.moveDown(0.6);
        }

        doc.fontSize(12).text(donor.donorName, { continued: false });
        doc.fontSize(10).fillColor('#555555');
        if (donor.address) {
          doc.text(`Address: ${donor.address}`);
        }
        if (donor.contact) {
          doc.text(`Contact: ${donor.contact}`);
        }
        doc.text(`Total Donated: NPR ${donor.totalAmount.toFixed(2)}`);
        doc.fillColor('#000000');

        if (donor.donations.length > 0) {
          doc.moveDown(0.3);
          donor.donations.forEach((donation) => {
            doc.fontSize(9).text(`• ${formatDate(donation.date)} - NPR ${donation.amount.toFixed(2)}`);
          });
        }
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

const buildDonorListXml = (title: string, donors: DonorListEntry[]) => {
  const donorsXml = donors
    .map((donor) => {
      const donationsXml = donor.donations
        .map(
          (donation) =>
            `      <donation>
        <date>${donation.date.toISOString()}</date>
        <amount>${donation.amount.toFixed(2)}</amount>
        <collectionId>${donation.collectionId}</collectionId>
      </donation>`
        )
        .join('\n');

      return `    <donor>
      <name>${donor.donorName}</name>
      <address>${donor.address ?? ''}</address>
      <contact>${donor.contact ?? ''}</contact>
      <totalAmount>${donor.totalAmount.toFixed(2)}</totalAmount>
      <donations>
${donationsXml}
      </donations>
    </donor>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<donorsList>
  <title>${title}</title>
  <donors>
${donorsXml}
  </donors>
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
    const records = await prisma.collectionrecord.findMany({
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
    });

    const donorsMap = new Map<string, DonorListEntry>();
    records.forEach((record) => {
      record.donordetail.forEach((donor) => {
        const key = `${donor.donorName}`.trim().toLowerCase() +
          `|${donor.address ?? ''}`.trim().toLowerCase() +
          `|${donor.contact ?? ''}`.trim().toLowerCase();
        const donationEntry: DonorDonationEntry = {
          amount: Number(donor.amount ?? 0),
          date: record.collectionDate,
          collectionId: record.id,
        };

        const existing = donorsMap.get(key);
        if (existing) {
          existing.totalAmount += donationEntry.amount;
          existing.donations.push(donationEntry);
        } else {
          donorsMap.set(key, {
            donorName: donor.donorName,
            address: donor.address,
            contact: donor.contact,
            totalAmount: donationEntry.amount,
            donations: [donationEntry],
          });
        }
      });
    });

    const donors = Array.from(donorsMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
    const titleParts = [
      start ? formatDate(start) : 'All time',
      end ? formatDate(end) : 'Present',
    ];
    const title = `Donors list on ${titleParts[0]} - ${titleParts[1]}`;

    if (format === 'pdf') {
      const pdfBuffer = await buildDonorListPdfBuffer(title, donors);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="donors_list.pdf"');
      return res.status(200).send(pdfBuffer);
    }

    if (format === 'xml') {
      const xmlPayload = buildDonorListXml(title, donors);
      res.setHeader('Content-Type', 'application/xml');
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
