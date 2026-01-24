#!/usr/bin/env bash
set -euo pipefail

BACKEND="/var/www/Bekatam/backend"
PDFKIT_DTS_DIR="$BACKEND/src/types"
PDFKIT_DTS="$PDFKIT_DTS_DIR/pdfkit.d.ts"
DONATION_API="$BACKEND/src/api/donationRecords.ts"
UTIL_PDF="$BACKEND/src/utils/donationReceiptPdf.ts"

echo "==> 1) Overwrite pdfkit.d.ts with a permissive definition"
mkdir -p "$PDFKIT_DTS_DIR"

cat <<'DTS' > "$PDFKIT_DTS"
declare module "pdfkit" {
  class PDFDocument {
    // Cursor position used by pdfkit
    y: number;

    constructor(options?: any);

    // Common methods used in our code
    fontSize(size: number): this;

    // pdfkit supports multiple signatures for text()
    text(text: string, options?: any): this;
    text(text: string, x?: number, y?: number, options?: any): this;

    moveDown(lines?: number): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    stroke(color?: any): this;
    fillColor(color: any): this;

    // Streams/events
    on(event: string, listener: (...args: any[]) => void): this;
    pipe(dest: any, options?: any): any;

    end(): void;
  }

  export default PDFDocument;
}
DTS

echo "==> 2) Fix implicit any chunk param if still present"
if [ -f "$DONATION_API" ]; then
  # (c) =>  (c: any) =>
  perl -pi -e "s/doc\\.on\\('data',\\s*\\(c\\)\\s*=>/doc.on('data', (c: any) =>/g" "$DONATION_API"
fi

if [ -f "$UTIL_PDF" ]; then
  perl -pi -e "s/doc\\.on\\(\"data\",\\s*\\(c\\)\\s*=>/doc.on(\"data\", (c: any) =>/g" "$UTIL_PDF"
fi

echo "✅ Done. Now re-run backend build."
