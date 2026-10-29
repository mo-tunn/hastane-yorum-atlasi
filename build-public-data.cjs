'use strict';

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const ROOT = __dirname;
const SOURCE = path.join(ROOT, 'review-universe.json.gz');
const DIST = path.join(ROOT, 'dist');
const PRIVATE_DIR = path.join(DIST, 'private-reviews');
const CHUNK_SIZE = 1000;

function normalizeCity(value) {
  const map = { 'ı':'i', 'ü':'u', 'ş':'s', 'ö':'o', 'ç':'c', 'ğ':'g' };
  return Array.from(String(value || '').toLocaleLowerCase('tr-TR'))
    .map(ch => map[ch] || ch)
    .join('');
}
function gzipJson(value) {
  return zlib.gzipSync(Buffer.from(JSON.stringify(value), 'utf8'), { level: 9 });
}

if (!fs.existsSync(SOURCE)) throw new Error('Kaynak veri paketi bulunamadı: ' + SOURCE);
fs.mkdirSync(DIST, { recursive: true });
fs.rmSync(PRIVATE_DIR, { recursive: true, force: true });
fs.mkdirSync(PRIVATE_DIR, { recursive: true });

const raw = JSON.parse(zlib.gunzipSync(fs.readFileSync(SOURCE)).toString('utf8'));
if (!Array.isArray(raw.points) || !Array.isArray(raw.cities)) {
  throw new Error('Kaynak veri beklenen points/cities alanlarını içermiyor.');
}

const excludedCityIds = new Set(
  raw.cities
    .filter(city => normalizeCity(city.name).includes('turkiye disi'))
    .map(city => Number(city.id))
);
const publicPoints = [];
const reviewTexts = [];

for (const point of raw.points) {
  if (!Array.isArray(point) || point.length < 9) {
    throw new Error('Beklenmeyen yorum kaydı şeması; yayınlama durduruldu.');
  }
  if (excludedCityIds.has(Number(point[4]))) continue;

  const reviewId = reviewTexts.length;
  reviewTexts.push(typeof point[8] === 'string' ? point[8] : '');
  publicPoints.push([...point.slice(0, 8), reviewId]);
}

const publicData = {
  ...raw,
  count: publicPoints.length,
  // Preserve original city indexes because point[4] indexes this array directly.
  // The UI excludes the external-city ID from selectors and visual totals.
  cities: raw.cities,
  points: publicPoints,
  description: 'Public atlas metadata. Review text is served separately by the Worker API when a point is selected.'
};

// The public asset contains coordinates and a numeric review ID, never the review text.
fs.writeFileSync(path.join(DIST, 'review-universe.json.gz'), gzipJson(publicData));

for (let offset = 0, chunkIndex = 0; offset < reviewTexts.length; offset += CHUNK_SIZE, chunkIndex++) {
  const chunk = reviewTexts.slice(offset, offset + CHUNK_SIZE);
  const name = 'chunk-' + String(chunkIndex).padStart(3, '0') + '.json.gz';
  fs.writeFileSync(path.join(PRIVATE_DIR, name), gzipJson(chunk));
}

const manifest = {
  count: reviewTexts.length,
  chunkSize: CHUNK_SIZE,
  chunks: Math.ceil(reviewTexts.length / CHUNK_SIZE)
};
fs.writeFileSync(path.join(PRIVATE_DIR, 'manifest.json'), JSON.stringify(manifest));

const privateBytes = fs.readdirSync(PRIVATE_DIR)
  .filter(name => name.endsWith('.gz'))
  .reduce((sum, name) => sum + fs.statSync(path.join(PRIVATE_DIR, name)).size, 0);
console.log('Public metadata:', publicPoints.length.toLocaleString('tr-TR'), 'points; no review text.');
console.log('Private on-demand review chunks:', manifest.chunks, 'chunks;', (privateBytes / 1024 / 1024).toFixed(2), 'MiB total.');
console.log('Excluded outside-Türkiye records:', (raw.points.length - publicPoints.length).toLocaleString('tr-TR'));
