import { formatDateADBS, formatDateADBSShort } from "../utils/dateFormatters";
import express, { Request } from "express";
import { prisma } from "../db";
import { handleDatabaseFallback } from "../utils/databaseFallback";
import {
  addDonorDonation,
  buildRefinedDonorList,
  DonorDonationEntry,
  DonorListEntry,
  normalizeDateRange,
  RefinedDonorEntry,
} from "../utils/donorListReport";

const router = express.Router();

const escapeXmlValue = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const safeXmlText = (value?: string | null) => escapeXmlValue((value ?? '').toString());

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

    if (format === "xml") {
      const xmlPayload = buildDonorListXml(title, donors, refinedDonors);
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="donors_list.xml"');
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
