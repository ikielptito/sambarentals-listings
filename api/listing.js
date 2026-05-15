import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const LISTINGS = {
  'haus-1':        { title: 'HAUS Canggu – Unit 1',       folder: '1xkEkRprYDCIfSCwCmfuPgcszI5kakOKF', overview: 'Boutique one-bedroom apartment in the heart of Batu Bolong, Canggu. Steps from cafés and nightlife, yet tucked in a quiet residential lane.' },
  'haus-2':        { title: 'HAUS Canggu – Unit 2',       folder: '11Pr1akQilpBkgT37BhbajsneP7Ekijmu', overview: 'Boutique one-bedroom apartment in the heart of Batu Bolong, Canggu. Steps from cafés and nightlife, yet tucked in a quiet residential lane.' },
  'haus-4':        { title: 'HAUS Canggu – Unit 4',       folder: '1qpdTd5oDxIbGkISxgSTKNJ3BtYM_aDEw', overview: 'Boutique one-bedroom apartment in the heart of Batu Bolong, Canggu. Steps from cafés and nightlife, yet tucked in a quiet residential lane.' },
  'haus-5':        { title: 'HAUS Canggu – Unit 5',       folder: '1mxfot6q9JVF2C22wPpVzyNP8zVotJURr', overview: 'Boutique one-bedroom apartment in the heart of Batu Bolong, Canggu. Steps from cafés and nightlife, yet tucked in a quiet residential lane.' },
  'lanehaus-1':    { title: 'LaneHAUS – Unit 1',          folder: '1f6mhoH36L-uY5ncGq5LHhq2_dMS_20cd', overview: 'Boutique one-bedroom townhouse in central Pererenan. Walkable yet private, ideal for long-term living in Canggu.' },
  'lanehaus-3':    { title: 'LaneHAUS – Unit 3',          folder: '1OY71DdG07xakOCCMZJAz4CqiI4EQm24F', overview: 'Boutique one-bedroom townhouse in central Pererenan. Walkable yet private, ideal for long-term living in Canggu.' },
  'villa-saturno': { title: 'Villa Saturno',              folder: '19Fh1nnnN6pvR3Ia4Pd2opB-J1D0hj1fZ', overview: 'Spacious 3-bedroom villa in prime Padang Linjong next to Bali Buddha. Central, walkable, and ideal for long-term living.' },
  'tropicana-a4':  { title: 'Tropicana Valley – Unit A4', folder: '1voeHZet0DspSnBeLeAIWarz-FPqUCUAr', overview: 'Modern private residence in Buduk with private pool, quiet surroundings, and easy access to Pererenan and Canggu.' },
  'tropicana-a5':  { title: 'Tropicana Valley – Unit A5', folder: '1voeHZet0DspSnBeLeAIWarz-FPqUCUAr', overview: 'Modern private residence in Buduk with private pool, quiet surroundings, and easy access to Pererenan and Canggu.' },
  'tropicana-b2':  { title: 'Tropicana Valley – Unit B2', folder: '1voeHZet0DspSnBeLeAIWarz-FPqUCUAr', overview: 'Modern private residence in Buduk with private pool, quiet surroundings, and easy access to Pererenan and Canggu.' },
  'tropicana-b3':  { title: 'Tropicana Valley – Unit B3', folder: '1voeHZet0DspSnBeLeAIWarz-FPqUCUAr', overview: 'Modern private residence in Buduk with private pool, quiet surroundings, and easy access to Pererenan and Canggu.' },
  'tropicana-b4':  { title: 'Tropicana Valley – Unit B4', folder: '1voeHZet0DspSnBeLeAIWarz-FPqUCUAr', overview: 'Modern private residence in Buduk with private pool, quiet surroundings, and easy access to Pererenan and Canggu.' },
  'tropicana-b5':  { title: 'Tropicana Valley – Unit B5', folder: '1voeHZet0DspSnBeLeAIWarz-FPqUCUAr', overview: 'Modern private residence in Buduk with private pool, quiet surroundings, and easy access to Pererenan and Canggu.' },
  'tropicana-b6':  { title: 'Tropicana Valley – Unit B6', folder: '1voeHZet0DspSnBeLeAIWarz-FPqUCUAr', overview: 'Modern private residence in Buduk with private pool, quiet surroundings, and easy access to Pererenan and Canggu.' },
};

const htmlPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'index.html');

export default async function handler(req, res) {
  const slug = (req.query.slug || '').replace(/^\/+/, '');
  const listing = LISTINGS[slug];
  const html = readFileSync(htmlPath, 'utf8');

  if (!listing) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  }

  let ogImage = '';
  const apiKey = process.env.GOOGLE_API_KEY;
  if (apiKey) {
    try {
      const r = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${listing.folder}'+in+parents+and+mimeType+contains+'image/'&fields=files(id)&pageSize=1&key=${apiKey}`
      );
      const d = await r.json();
      if (d.files && d.files[0]) {
        ogImage = `https://lh3.googleusercontent.com/d/${d.files[0].id}`;
      }
    } catch {}
  }

  const pageTitle = `${listing.title} · Samba Rentals`;
  const canonicalUrl = `https://sambarentals-listings.vercel.app/${slug}`;

  const ogTags = [
    ogImage ? `<meta property="og:image" content="${ogImage}">` : '',
    `<meta property="og:title" content="${listing.title}">`,
    `<meta property="og:description" content="${listing.overview}">`,
    `<meta property="og:url" content="${canonicalUrl}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    ogImage ? `<meta name="twitter:image" content="${ogImage}">` : '',
  ].filter(Boolean).join('\n');

  const injected = html.replace(
    '<title>Samba Rentals</title>',
    `<title>${pageTitle}</title>\n${ogTags}`
  );

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).send(injected);
}
