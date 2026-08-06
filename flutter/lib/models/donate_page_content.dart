class DonatePageContent {
  final String headerTitle;
  final String headerSubtitle;
  final String? headerImageUrl;
  final String localDonationsTitle;
  final String bankName;
  final String accountName;
  final String accountNumber;
  final String branch;
  final String esewaId;
  final String? esewaQrImageUrl;
  final String? bankQrImageUrl;
  final String localDonationsNote;
  final String internationalDonationsTitle;
  final String internationalDonationsContent;
  final String internationalDonationsContactEmail;
  final String? internationalQrImageUrl;
  final String? receiptVerses;

  DonatePageContent({
    required this.headerTitle,
    required this.headerSubtitle,
    this.headerImageUrl,
    required this.localDonationsTitle,
    required this.bankName,
    required this.accountName,
    required this.accountNumber,
    required this.branch,
    required this.esewaId,
    this.esewaQrImageUrl,
    this.bankQrImageUrl,
    required this.localDonationsNote,
    required this.internationalDonationsTitle,
    required this.internationalDonationsContent,
    required this.internationalDonationsContactEmail,
    this.internationalQrImageUrl,
    this.receiptVerses,
  });

  factory DonatePageContent.fromMap(Map<String, dynamic> map) {
    return DonatePageContent(
      headerTitle: map['header_title'] as String? ?? 'Support Our Ministry',
      headerSubtitle: map['header_subtitle'] as String? ?? '',
      headerImageUrl: map['header_image_url'] as String?,
      localDonationsTitle: map['local_donations_title'] as String? ?? 'Local Donations',
      bankName: map['bank_name'] as String? ?? '',
      accountName: map['account_name'] as String? ?? '',
      accountNumber: map['account_number'] as String? ?? '',
      branch: map['branch'] as String? ?? '',
      esewaId: map['esewa_id'] as String? ?? '',
      esewaQrImageUrl: map['esewa_qr_image_url'] as String?,
      bankQrImageUrl: map['bank_qr_image_url'] as String?,
      localDonationsNote: map['local_donations_note'] as String? ?? '',
      internationalDonationsTitle: map['international_donations_title'] as String? ?? 'International Donations',
      internationalDonationsContent: map['international_donations_content'] as String? ?? '',
      internationalDonationsContactEmail: map['international_donations_contact_email'] as String? ?? '',
      internationalQrImageUrl: map['international_qr_image_url'] as String?,
      receiptVerses: map['receipt_verses'] as String?,
    );
  }
}
