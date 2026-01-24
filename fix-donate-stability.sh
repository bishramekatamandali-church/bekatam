#!/usr/bin/env bash
set -euo pipefail

ROOT="/var/www/Bekatam/frontend/src"
DONATE_PAGE="$ROOT/pages/DonatePage.tsx"
MANAGE_DONATE="$ROOT/pages/admin/ManageDonatePage.tsx"
MANAGE_DONATIONS="$ROOT/pages/admin/ManageDonationsPage.tsx"

for f in "$DONATE_PAGE" "$MANAGE_DONATE" "$MANAGE_DONATIONS"; do
  if [ ! -f "$f" ]; then
    echo "ERROR: missing file $f"
    exit 1
  fi
  cp -a "$f" "$f.bak.$(date +%F_%H%M%S)"
done

###############################################################################
# 1) DonatePage: make desktop single-column + add cache-buster for images
###############################################################################
# Add helper appendVersion() after imports (only if not already present)
perl -0777 -pi -e '
  if ($s !~ /function appendVersion\(/) {
    $s =~ s/(import\s+.*?;\s*\n\n)/$1function appendVersion(url: string, version?: string | null) {\n  if (!url) return url;\n  const v = (version && version.trim()) ? version : String(Date.now());\n  return url.includes(\"?\") ? `${url}&v=${encodeURIComponent(v)}` : `${url}?v=${encodeURIComponent(v)}`;\n}\n\n/s;
  }
' -i "$DONATE_PAGE"

# Make the main layout single column (remove lg:grid-cols split)
perl -0777 -pi -e '
  $s =~ s/className="max-w-6xl mx-auto grid gap-8 lg:grid-cols-\[1\.1fr_0\.9fr\] items-start"/className="max-w-3xl mx-auto space-y-8"/g;
' -i "$DONATE_PAGE"

# Use cache-busted header background image
perl -0777 -pi -e '
  $s =~ s/imageUrl=\{donatePageContent\.headerImageUrl\}/imageUrl={appendVersion(donatePageContent.headerImageUrl, donatePageContent.updatedAt)}/g;
' -i "$DONATE_PAGE"

###############################################################################
# 2) DonatePage: prevent "Log Donation" button stuck (try/catch/finally)
###############################################################################
perl -0777 -pi -e '
  # Replace handleSubmit body in a tolerant way:
  $s =~ s/const handleSubmit = async \(e: React\.FormEvent<HTMLFormElement>\) => \{\n\s*e\.preventDefault\(\);\n\s*setError\(\x27\x27\);\n([\s\S]*?)\n\s*setIsSubmitting\(true\);\n([\s\S]*?)\n\s*const newRecord = await addDonationRecord\(recordData\);\n\s*if \(newRecord\) \{\n\s*    setSubmittedRecord\(newRecord\);\n\s*\} else \{\n\s*    setError\(\x27There was an issue logging your donation\. Please try again\.\x27\);\n\s*\}\n\s*setIsSubmitting\(false\);\n\s*\};/const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {\n    e.preventDefault();\n    setError('''');\n$1\n\n    setIsSubmitting(true);\n    try {\n$2\n      const newRecord = await addDonationRecord(recordData);\n      if (newRecord) {\n        setSubmittedRecord(newRecord);\n      } else {\n        setError('There was an issue logging your donation. Please try again.');\n      }\n    } catch (err) {\n      console.error('Donate submit failed (frontend)', err);\n      setError('There was an issue logging your donation. Please try again.');\n    } finally {\n      setIsSubmitting(false);\n    }\n  };/s;
' -i "$DONATE_PAGE"

###############################################################################
# 3) ManageDonatePage: ensure image updates across devices (cache-bust on save)
#    (No Cloudinary rewrite here; we just guarantee new URL version when saved)
###############################################################################
# Patch handleUrlChange to append ?v=timestamp so all devices refresh images
perl -0777 -pi -e '
  $s =~ s/const handleUrlChange = \(fieldName: keyof DonatePageContentFormData, url: string\) => \{\n\s*setFormData\(prev => \(\{\.\.\.prev, \[fieldName\]: url\}\)\);\n\s*\};/const handleUrlChange = (fieldName: keyof DonatePageContentFormData, url: string) => {\n    const clean = (url || '').trim();\n    const versioned = clean ? (clean.includes('?') ? `${clean}&v=${Date.now()}` : `${clean}?v=${Date.now()}`) : '';\n    setFormData(prev => ({ ...prev, [fieldName]: versioned }));\n  };/s;
' -i "$MANAGE_DONATE"

###############################################################################
# 4) ManageDonationsPage blank screen: guard non-array donationRecords
###############################################################################
perl -0777 -pi -e '
  # After destructuring donationRecords, insert safe array
  $s =~ s/const \{ donationRecords, loadingContent, addContent, updateContent, deleteContent \} = useContent\(\);\n/const { donationRecords, loadingContent, addContent, updateContent, deleteContent } = useContent();\n  const safeDonationRecords: DonationRecord[] = Array.isArray(donationRecords) ? donationRecords : [];\n/s;

  # Replace all "donationRecords" usage where it must be an array
  $s =~ s/\[\.\.\.donationRecords\]/[...safeDonationRecords]/g;
  $s =~ s/\bdonationRecords\.length\b/safeDonationRecords.length/g;
  $s =~ s/\bdonationRecords\]\)/safeDonationRecords])/g;
  $s =~ s/\bdonationRecords\)/safeDonationRecords)/g;

  # Fix the sortedRecords dependency array to use safeDonationRecords
  $s =~ s/\}, \[donationRecords\]\);/}, [safeDonationRecords]);/g;
' -i "$MANAGE_DONATIONS"

echo "✅ Donate stability patch applied."
echo "Backups created next to each file: *.bak.YYYY-MM-DD_HHMMSS"
