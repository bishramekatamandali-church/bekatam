#!/usr/bin/env bash
set -euo pipefail

BACKEND="/var/www/Bekatam/backend"
TSCONFIG="$BACKEND/tsconfig.json"
PDFKIT_DTS_DIR="$BACKEND/src/types"
PDFKIT_DTS="$PDFKIT_DTS_DIR/pdfkit.d.ts"
DONATION_API="$BACKEND/src/api/donationRecords.ts"

echo "==> 1) Ensure pdfkit.d.ts exists in src/types"
mkdir -p "$PDFKIT_DTS_DIR"
cat <<'DTS' > "$PDFKIT_DTS"
declare module "pdfkit" {
  import { EventEmitter } from "events";
  import { Readable } from "stream";

  class PDFDocument extends Readable implements EventEmitter {
    constructor(options?: any);

    fontSize(size: number): this;
    text(text: string, x?: number, y?: number, options?: any): this;
    moveDown(lines?: number): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    stroke(color?: any): this;
    fillColor(color: string): this;
    end(): void;

    on(event: "data", listener: (chunk: Buffer) => void): this;
    on(event: "end", listener: () => void): this;
    on(event: "error", listener: (err: Error) => void): this;
  }

  export default PDFDocument;
}
DTS

echo "==> 2) Patch tsconfig.json to include .d.ts files"
if [ ! -f "$TSCONFIG" ]; then
  echo "ERROR: tsconfig.json not found at $TSCONFIG"
  exit 1
fi

cp -a "$TSCONFIG" "$TSCONFIG.bak.$(date +%F_%H%M%S)"

# If include already contains **/*.d.ts, do nothing.
if grep -qE '"\s*src/\*\*/\*\.d\.ts\s*"' "$TSCONFIG"; then
  echo "tsconfig already includes src/**/*.d.ts"
else
  # Insert src/**/*.d.ts into the include array (best-effort).
  # Works for typical: "include": ["src/**/*.ts", ...]
  perl -0777 -pi -e '
    if ($ARGV[0] =~ /tsconfig\.json$/) {
      if ($_ !~ /"include"\s*:\s*\[/s) { exit 0; }
      # Add after src/**/*.ts if present
      if ($_ =~ /"include"\s*:\s*\[[^\]]*"src\/\*\*\/\*\.ts"[^\]]*\]/s) {
        $_ =~ s/("include"\s*:\s*\[[^\]]*"src\/\*\*\/\*\.ts")(\s*,?)/$1, "src\/\*\*\/\*\.d\.ts"$2/s;
      } else {
        # Otherwise, just add to start of include array
        $_ =~ s/"include"\s*:\s*\[/"include": ["src\/\*\*\/\*\.d\.ts", /s;
      }
    }
  ' "$TSCONFIG"
fi

echo "==> 3) Fix implicit any in donationRecords.ts (doc.on data chunk)"
if [ -f "$DONATION_API" ]; then
  cp -a "$DONATION_API" "$DONATION_API.bak.$(date +%F_%H%M%S)"
  # (c) =>  (c: Buffer) =>
  perl -pi -e "s/doc\\.on\\('data',\\s*\\(c\\)\\s*=>/doc.on('data', (c: Buffer) =>/g" "$DONATION_API"
  # optional: (e) => (e: Error) => if you have it
  perl -pi -e "s/doc\\.on\\('error',\\s*\\(e\\)\\s*=>/doc.on('error', (e: Error) =>/g" "$DONATION_API"
else
  echo "NOTE: $DONATION_API not found, skipped implicit-any patch."
fi

echo "✅ Done."
echo "Backups created with .bak.YYYY-MM-DD_HHMMSS"
