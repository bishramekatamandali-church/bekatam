#!/usr/bin/env node
// migrate-media-to-storage.mjs
//
// Phase 4 media migration — FINAL SCOPE (confirmed against live data on
// 2026-08-08): there is NO base64 media anywhere in the database. Every
// media reference is already an external Cloudinary URL. This script's
// only job is to re-host those 26 real files into this project's own
// Supabase Storage buckets and repoint the columns, so the app no longer
// depends on a third-party Cloudinary account.
//
// Covers exactly:
//   donatepagecontent.bank_qr_image_url, esewa_qr_image_url  -> donation-qr
//   profiles.profile_image_url                                -> profile-images
//   sermon.image_url                                           -> content-media
//   testimonial.user_profile_image_url                        -> profile-images
//   prayerrequest.media_urls[]  (jsonb array)                  -> content-media
//   testimonial.media_urls[]    (jsonb array)                  -> content-media
//
// Idempotent: any URL that already points at this project's Storage
// domain is skipped, so it's safe to re-run.
//
// USAGE (run from your own machine, not this sandbox — needs network
// access to Cloudinary + Supabase, and your service role key):
//   npm install @supabase/supabase-js
//   SUPABASE_URL="https://asnmqrwshsupnlawjjqq.supabase.co" \
//   SUPABASE_SERVICE_ROLE_KEY="<service role key from Project Settings > API>" \
//   node migrate-media-to-storage.mjs
//
// Add DRY_RUN=1 to the env to print what it would do without writing.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.env.DRY_RUN === '1';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const ownDomain = new URL(SUPABASE_URL).host;

function extGuess(url, contentType) {
  const fromUrl = url.split('?')[0].split('.').pop();
  if (fromUrl && fromUrl.length <= 4 && /^[a-zA-Z0-9]+$/.test(fromUrl)) return fromUrl;
  if (contentType?.includes('jpeg')) return 'jpg';
  if (contentType?.includes('png')) return 'png';
  if (contentType?.includes('webp')) return 'webp';
  if (contentType?.includes('mp4')) return 'mp4';
  return 'bin';
}

let uploaded = 0, skipped = 0, failed = 0;

async function migrateOne(url, bucket, keyPrefix) {
  if (!url || typeof url !== 'string') return null;
  if (url.includes(ownDomain)) {
    skipped++;
    return url; // already migrated
  }
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = extGuess(url, contentType);
    const path = `${keyPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    if (DRY_RUN) {
      console.log(`[dry-run] would upload ${url} -> ${bucket}/${path} (${buf.length} bytes, ${contentType})`);
      return url;
    }

    const { error: upErr } = await supabase.storage.from(bucket).upload(path, buf, { contentType, upsert: false });
    if (upErr) throw upErr;
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    uploaded++;
    console.log(`  uploaded -> ${pub.publicUrl}`);
    return pub.publicUrl;
  } catch (e) {
    failed++;
    console.error(`  FAILED for ${url}: ${e.message}`);
    return url; // leave original URL in place on failure
  }
}

async function migrateColumn(table, idCol, col, bucket, keyPrefix) {
  const { data: rows, error } = await supabase.from(table).select(`${idCol}, ${col}`).not(col, 'is', null);
  if (error) throw error;
  console.log(`\n${table}.${col}: ${rows.length} row(s)`);
  for (const row of rows) {
    const oldUrl = row[col];
    const newUrl = await migrateOne(oldUrl, bucket, keyPrefix);
    if (newUrl && newUrl !== oldUrl && !DRY_RUN) {
      const { error: updErr } = await supabase.from(table).update({ [col]: newUrl }).eq(idCol, row[idCol]);
      if (updErr) console.error(`  DB update failed for ${row[idCol]}: ${updErr.message}`);
    }
  }
}

async function migrateJsonbArrayColumn(table, idCol, col, bucket, keyPrefix) {
  const { data: rows, error } = await supabase.from(table).select(`${idCol}, ${col}`).not(col, 'is', null);
  if (error) throw error;
  console.log(`\n${table}.${col} (jsonb array): ${rows.length} row(s)`);
  for (const row of rows) {
    const arr = row[col];
    if (!Array.isArray(arr) || arr.length === 0) continue;
    const newArr = [];
    for (const oldUrl of arr) {
      newArr.push(await migrateOne(oldUrl, bucket, keyPrefix));
    }
    const changed = JSON.stringify(newArr) !== JSON.stringify(arr);
    if (changed && !DRY_RUN) {
      const { error: updErr } = await supabase.from(table).update({ [col]: newArr }).eq(idCol, row[idCol]);
      if (updErr) console.error(`  DB update failed for ${row[idCol]}: ${updErr.message}`);
    }
  }
}

async function main() {
  console.log(`Media migration starting${DRY_RUN ? ' (DRY RUN)' : ''}...`);

  await migrateColumn('donatepagecontent', 'id', 'bank_qr_image_url', 'donation-qr', 'qr');
  await migrateColumn('donatepagecontent', 'id', 'esewa_qr_image_url', 'donation-qr', 'qr');
  await migrateColumn('profiles', 'id', 'profile_image_url', 'profile-images', 'profiles');
  await migrateColumn('sermon', 'id', 'image_url', 'content-media', 'sermons');
  await migrateColumn('testimonial', 'id', 'user_profile_image_url', 'profile-images', 'testimonial-authors');
  await migrateJsonbArrayColumn('prayerrequest', 'id', 'media_urls', 'content-media', 'prayer-media');
  await migrateJsonbArrayColumn('testimonial', 'id', 'media_urls', 'content-media', 'testimonial-media');

  console.log(`\nDone. uploaded=${uploaded} skipped(already migrated)=${skipped} failed=${failed}`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
