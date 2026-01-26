import React, { useState, useMemo, useEffect } from 'react';
import Button from '../components/ui/Button';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import { useContent } from '../contexts/ContentContext';
import { donationPurposeList, DonationRecord } from '../types';
import { formatDateADBS } from '../dateConverter';
import { jsPDF } from 'jspdf';
import { preparePdfDoc } from '../utils/pdfFonts';
import { useAuth } from '../contexts/AuthContext';

const HeartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 ${className}`}>
    <path d="M11.645 20.91a.75.75 0 0 1-1.29 0A18.373 18.373 0 0 1 1.5 10.5c0-4.418 3.582-8 8-8s8 3.582 8 8a18.373 18.373 0 0 1-9.355 10.41Z" />
  </svg>
);

const BanknotesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.378 1.602a.75.75 0 00-.756 0L3 6.632l9 5.25 9-5.25-8.622-5.03zM21.75 7.903l-9 5.25v9l8.628-5.032a.75.75 0 00.372-.648V7.903zM11.25 22.153v-9l-9-5.25v8.853a.75.75 0 00.372.648l8.628 5.033z" />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path
      fillRule="evenodd"
      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.06-1.06l-3.002 3.001-1.502-1.501a.75.75 0 0 0-1.06 1.06L11.25 13.5l3.36-3.314Z"
      clipRule="evenodd"
    />
  </svg>
);

const GlobeAltIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2.25c-5.434 0-9.974 4.506-9.974 10.046 0 5.21 3.978 9.515 9.128 10.005a.75.75 0 00.846-.678l-.047-.543a.75.75 0 01.694-.638l.564-.047a.75.75 0 00.638-.694l.047-.564a.75.75 0 01.638-.694l.543-.047a.75.75 0 00.678-.846C15.952 12.85 16.5 11.186 16.5 9.415c0-4.087-2.555-7.575-6-8.748a.747.747 0 00-.458-.117h-1.5a.75.75 0 00-.75.75V3a.75.75 0 01-.75.75H6a.75.75 0 00-.75.75V6A.75.75 0 014.5 6.75H3a.75.75 0 00-.75.75V9a.75.75 0 01-.75.75H1.252a.75.75 0 00-.75.75v.298C.29 11.153 0 11.585 0 12.046c0 5.54 4.476 10.046 9.974 10.046 5.175 0 9.47-3.855 9.956-8.886a.75.75 0 00-.733-.862l-.543-.047a.75.75 0 01-.638-.694l-.047-.564a.75.75 0 00-.638-.694l-.564-.047a.75.75 0 01-.694-.638l-.047-.543a.75.75 0 00-.846-.678A9.483 9.483 0 0112 2.25z" />
  </svg>
);

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
      {icon}
    </div>
    <div className="min-w-0">
      <h2 className="text-lg sm:text-xl font-semibold text-slate-900 leading-tight">{title}</h2>
      {subtitle ? <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p> : null}
    </div>
  </div>
);

const PageHeaderWithBackground: React.FC<{ title: string; subtitle: string; imageUrl: string; icon?: React.ReactNode }> = ({
  title,
  subtitle,
  imageUrl,
  icon,
}) => (
  <header className="relative py-8 sm:py-10 lg:py-12 bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }}>
    <div className="absolute inset-0 bg-black/55" />
    <div className="container mx-auto px-4 text-center relative z-10">
      {icon && <div className="mb-2 text-teal-200 flex justify-center">{icon}</div>}
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white drop-shadow">{title}</h1>
      <p className="mt-2 text-sm sm:text-base text-teal-100 max-w-3xl mx-auto drop-shadow-sm">{subtitle}</p>
    </div>
  </header>
);

const DonationReceipt: React.FC<{ record: DonationRecord; verses?: string; onMakeAnother: () => void }> = ({
  record,
  verses,
  onMakeAnother,
}) => {
  const randomVerse = useMemo(() => {
    if (!verses) return null;
    const verseList = verses.split('\n').filter(v => v.trim() !== '');
    if (verseList.length === 0) return null;
    return verseList[Math.floor(Math.random() * verseList.length)];
  }, [verses]);

  const handlePrint = () => window.print();
  const handleDownload = async () => {
    const doc = new jsPDF();
    await preparePdfDoc(doc);
    doc.text(`Donation Receipt`, 10, 10);
    doc.text(`Thank you, ${record.donorName}!`, 10, 20);
    doc.text(`Amount: NPR ${Number(record.amount ?? 0).toFixed(2)}`, 10, 30);
    doc.text(`Purpose: ${record.purpose}`, 10, 40);
    doc.text(`Date: ${formatDateADBS(record.donationDate)}`, 10, 50);
    doc.text(`Transaction ID: ${record.id}`, 10, 60);
    if (randomVerse) {
      doc.text(doc.splitTextToSize(randomVerse, 180), 10, 70);
    }
    doc.save(`Donation_Receipt_${record.id}.pdf`);
  };

  return (
    <Card className="max-w-2xl mx-auto bg-white border border-slate-200 shadow-sm" id="donation-receipt">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #donation-receipt, #donation-receipt * { visibility: visible; }
          #donation-receipt { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <CardHeader className="bg-emerald-600 text-white text-center">
        <CheckCircleIcon className="w-10 h-10 mx-auto mb-2" />
        <h2 className="text-lg sm:text-xl font-semibold">Donation Logged Successfully</h2>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-700">
            Thank you, <span className="font-semibold">{record.donorName}</span>.
          </p>
          <div className="mt-3 grid gap-1 text-sm text-slate-700">
            <p><strong>Amount:</strong> NPR {Number(record.amount ?? 0).toFixed(2)}</p>
            <p><strong>Purpose:</strong> {record.purpose}</p>
            <p><strong>Date:</strong> {formatDateADBS(record.donationDate)}</p>
            <p className="break-all"><strong>Transaction ID:</strong> <span className="font-mono text-xs">{record.id}</span></p>
          </div>
        </div>

        {randomVerse && (
          <blockquote className="text-slate-600 italic border-l-4 border-slate-300 pl-4 py-1">
            {randomVerse}
          </blockquote>
        )}

        <p className="text-xs text-slate-500">
          Please ensure you have completed the actual transfer via your chosen method. This system is for record-keeping purposes.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 no-print">
          <Button variant="outline" size="sm" onClick={handlePrint}>Print</Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>Download PDF</Button>
        </div>

        <Button variant="primary" className="w-full no-print" onClick={onMakeAnother}>
          Make Another Donation
        </Button>
      </CardContent>
    </Card>
  );
};

const DonatePage: React.FC = () => {
  const { addDonationRecord, loadingContent, donatePageContent } = useContent();
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    donorName: '',
    donorEmail: '',
    donorPhone: '',
    amount: '',
    purpose: donationPurposeList[0],
    donationDate: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState('');
  const [submittedRecord, setSubmittedRecord] = useState<DonationRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        donorName: prev.donorName || currentUser.fullName || '',
        donorEmail: prev.donorEmail || currentUser.email || '',
        donorPhone: prev.donorPhone || currentUser.phone || '',
      }));
    }
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!formData.donorName || !formData.donorEmail || !formData.amount || !formData.purpose || !formData.donationDate) {
      setError('Please fill in all required fields (Name, Email, Amount, Purpose, Date).');
      return;
    }

    const amountNumber = parseFloat(formData.amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    setIsSubmitting(true);
    const recordData = {
      donorName: formData.donorName,
      donorEmail: formData.donorEmail,
      donorPhone: formData.donorPhone || undefined,
      amount: amountNumber,
      purpose: formData.purpose,
      donationDate: formData.donationDate,
      isReceiptSent: false,
    };

    const newRecord = await addDonationRecord(recordData);
    if (newRecord) {
      setSubmittedRecord(newRecord);
    } else {
      setError('There was an issue logging your donation. Please try again.');
    }
    setIsSubmitting(false);
  };

  const handleMakeAnotherDonation = () => {
    setSubmittedRecord(null);
    setFormData({
      donorName: currentUser?.fullName || '',
      donorEmail: currentUser?.email || '',
      donorPhone: currentUser?.phone || '',
      amount: '',
      purpose: donationPurposeList[0],
      donationDate: new Date().toISOString().split('T')[0],
    });
    setError('');
  };

  if (loadingContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-base text-slate-600">Loading donation information...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeaderWithBackground
        title={donatePageContent.headerTitle}
        subtitle={donatePageContent.headerSubtitle}
        imageUrl={donatePageContent.headerImageUrl}
        icon={<HeartIcon className="w-12 h-12 text-teal-200" />}
      />

      <div className="container mx-auto px-4 py-7">
        {submittedRecord ? (
          <DonationReceipt
            record={submittedRecord}
            verses={donatePageContent.receiptVerses}
            onMakeAnother={handleMakeAnotherDonation}
          />
        ) : (
          <div className="max-w-4xl mx-auto flex flex-col gap-5">
            {/* Steps */}
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <SectionTitle
                  icon={<BanknotesIcon className="w-5 h-5" />}
                  title="How to give"
                  subtitle="Transfer first, then log your donation."
                />
                <div className="mt-4 grid gap-2 text-sm text-slate-600">
                  <div className="flex gap-2">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">1</span>
                    <p>Send your gift using Bank Transfer or eSewa.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">2</span>
                    <p>Fill the form so we can record and acknowledge your gift.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">3</span>
                    <p>Get a receipt immediately (print or download).</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Local Donations */}
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardContent className="p-4 sm:p-5 space-y-4">
                <SectionTitle
                  icon={<BanknotesIcon className="w-5 h-5" />}
                  title={donatePageContent.localDonationsTitle}
                />

                {/* Bank */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">Bank transfer</p>
                      <div className="mt-2 text-sm text-slate-600 space-y-1">
                        <p><span className="font-semibold text-slate-800">Bank:</span> {donatePageContent.bankName}</p>
                        <p><span className="font-semibold text-slate-800">Account name:</span> {donatePageContent.accountName}</p>
                        <p><span className="font-semibold text-slate-800">Account no:</span> {donatePageContent.accountNumber}</p>
                        <p><span className="font-semibold text-slate-800">Branch:</span> {donatePageContent.branch}</p>
                      </div>
                    </div>

                    {donatePageContent.bankQrImageUrl && (
                      <div className="flex-shrink-0">
                        <img
                          src={donatePageContent.bankQrImageUrl}
                          alt="Bank QR Code"
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border border-slate-200 object-cover bg-slate-50"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* eSewa */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">eSewa</p>
                      <p className="mt-2 text-sm text-slate-600">
                        <span className="font-semibold text-slate-800">ID:</span> {donatePageContent.eSewaId}
                      </p>
                      {!donatePageContent.eSewaQrImageUrl && (
                        <p className="text-xs text-slate-500 mt-1">(QR code not uploaded yet.)</p>
                      )}
                    </div>

                    {donatePageContent.eSewaQrImageUrl && (
                      <div className="flex-shrink-0">
                        <img
                          src={donatePageContent.eSewaQrImageUrl}
                          alt="eSewa QR Code"
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border border-slate-200 object-cover bg-slate-50"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-500">{donatePageContent.localDonationsNote}</p>
              </CardContent>
            </Card>

            {/* International */}
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardContent className="p-4 sm:p-5 space-y-4">
                <SectionTitle
                  icon={<GlobeAltIcon className="w-5 h-5" />}
                  title={donatePageContent.internationalDonationsTitle}
                />

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 text-sm text-slate-600 whitespace-pre-line">
                      <p>{donatePageContent.internationalDonationsContent}</p>
                      {/* Removed the "You can reach us at..." line as requested */}
                    </div>

                    {donatePageContent.internationalQrImageUrl && (
                      <div className="flex-shrink-0">
                        <img
                          src={donatePageContent.internationalQrImageUrl}
                          alt="International Donation QR Code"
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border border-slate-200 object-cover bg-slate-50"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form */}
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <SectionTitle
                  icon={<HeartIcon className="w-5 h-5" />}
                  title="Log your donation"
                  subtitle="We’ll record it and show a receipt instantly."
                />

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="donorName" className="block text-xs font-medium text-slate-700">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="donorName"
                        id="donorName"
                        value={formData.donorName}
                        onChange={handleChange}
                        required
                        className="mt-1 w-full p-2.5 border border-slate-300 rounded-2xl bg-white focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="donorEmail" className="block text-xs font-medium text-slate-700">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="donorEmail"
                        id="donorEmail"
                        value={formData.donorEmail}
                        onChange={handleChange}
                        required
                        className="mt-1 w-full p-2.5 border border-slate-300 rounded-2xl bg-white focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="donorPhone" className="block text-xs font-medium text-slate-700">
                        Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        name="donorPhone"
                        id="donorPhone"
                        value={formData.donorPhone}
                        onChange={handleChange}
                        className="mt-1 w-full p-2.5 border border-slate-300 rounded-2xl bg-white focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="amount" className="block text-xs font-medium text-slate-700">
                        Amount (NPR) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="amount"
                        id="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        required
                        min="1"
                        step="any"
                        className="mt-1 w-full p-2.5 border border-slate-300 rounded-2xl bg-white focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="purpose" className="block text-xs font-medium text-slate-700">
                        Donation Purpose <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="purpose"
                        id="purpose"
                        value={formData.purpose}
                        onChange={handleChange}
                        required
                        className="mt-1 w-full p-2.5 border border-slate-300 rounded-2xl bg-white focus:ring-teal-500 focus:border-teal-500"
                      >
                        {donationPurposeList.map(purpose => (
                          <option key={purpose} value={purpose}>
                            {purpose}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="donationDate" className="block text-xs font-medium text-slate-700">
                        Donation Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="donationDate"
                        id="donationDate"
                        value={formData.donationDate}
                        onChange={handleChange}
                        required
                        className="mt-1 w-full p-2.5 border border-slate-300 rounded-2xl bg-white focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-3">
                      <p className="text-sm text-red-700" role="alert">{error}</p>
                    </div>
                  )}

                  <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isSubmitting || loadingContent}>
                    {isSubmitting ? 'Logging Donation...' : 'Confirm & Log My Donation'}
                  </Button>

                  <p className="text-xs text-slate-500 text-center">
                    You’ll get a receipt right after submitting.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonatePage;
