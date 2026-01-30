#!/usr/bin/env bash
set -euo pipefail

FILE="/var/www/Bekatam/frontend/src/pages/DonatePage.tsx"
if [ ! -f "$FILE" ]; then
  echo "ERROR: $FILE not found"
  exit 1
fi

cp -a "$FILE" "$FILE.bak.$(date +%F_%H%M%S)"

# 1) Force ONE COLUMN: replace any main "grid ... lg:grid-cols-*" wrapper with flex-col
perl -0777 -pi -e '
  $s =~ s/className="([^"]*?)\bgrid\b([^"]*?)\blg:grid-cols-\[[^"]+\]\b([^"]*?)"/className="$1flex flex-col gap-6$2$3"/g;
  $s =~ s/className="([^"]*?)\bgrid\b([^"]*?)\blg:grid-cols-[0-9]+\b([^"]*?)"/className="$1flex flex-col gap-6$2$3"/g;
  $s =~ s/\bmax-w-6xl\b/max-w-3xl/g;  # keep page narrower on desktop
' "$FILE"

# 2) Reduce HEADER height ~35%: common Tailwind heights
# (You can tweak these numbers later if you want slightly taller/shorter)
perl -pi -e '
  s/\bh-96\b/h-64/g;
  s/\bh-80\b/h-52/g;
  s/\bh-72\b/h-48/g;
  s/\bh-64\b/h-44/g;
  s/\bmd:h-96\b/md:h-64/g;
  s/\bmd:h-80\b/md:h-52/g;
  s/\bmd:h-72\b/md:h-48/g;
  s/\bmd:h-64\b/md:h-44/g;
  s/\blg:h-96\b/lg:h-64/g;
  s/\blg:h-80\b/lg:h-52/g;
  s/\blg:h-72\b/lg:h-48/g;
  s/\blg:h-64\b/lg:h-44/g;
' "$FILE"

# 3) Reduce card padding/spacing a bit (optional but requested)
perl -pi -e '
  s/\bp-8\b/p-5/g;
  s/\bp-6\b/p-4/g;
  s/\bpy-10\b/py-6/g;
  s/\bpy-8\b/py-5/g;
  s/\bspace-y-8\b/space-y-5/g;
  s/\bgap-8\b/gap-6/g;
' "$FILE"

echo "✅ DonatePage now forced to single column + shorter header + tighter cards."
