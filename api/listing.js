const { readFileSync } = require('fs');
const { join } = require('path');

const LISTINGS = {
  'haus-1':        { title: 'HAUS Canggu – Unit 1',       folder: '1xkEkRprYDCIfSCwCmfuPgcszI5kakOKF', overview: 'Batu Bolong, Canggu · 27jt/mo · 1BR, shared pool, next to Bali Social Club' },
  'haus-2':        { title: 'HAUS Canggu – Unit 2',       folder: '11Pr1akQilpBkgT37BhbajsneP7Ekijmu', overview: 'Batu Bolong, Canggu · 27jt/mo · 1BR, shared pool, next to Bali Social Club' },
  'haus-4':        { title: 'HAUS Canggu – Unit 4',       folder: '1qpdTd5oDxIbGkISxgSTKNJ3BtYM_aDEw', overview: 'Batu Bolong, Canggu · 30jt/mo · 1BR, shared pool, next to Bali Social Club' },
  'haus-5':        { title: 'HAUS Canggu – Unit 5',       folder: '1mxfot6q9JVF2C22wPpVzyNP8zVotJURr', overview: 'Batu Bolong, Canggu · 30jt/mo · 1BR, shared pool, next to Bali Social Club' },
  'lanehaus-1':    { title: 'LaneHAUS – Unit 1',          folder: '1f6mhoH36L-uY5ncGq5LHhq2_dMS_20cd', overview: 'Pererenan · 24jt/mo · 1BR townhouse, shared pool, dedicated workspace' },
  'lanehaus-3':    { title: 'LaneHAUS – Unit 3',          folder: '1OY71DdG07xakOCCMZJAz4CqiI4EQm24F', overview: 'Pererenan · 22jt/mo · 1BR townhouse, shared pool, dedicated workspace' },
  'villa-saturno': { title: 'Villa Saturno',              folder: '19Fh1nnnN6pvR3Ia4Pd2opB-J1D0hj1fZ', overview: 'Padang Linjong, Canggu · 40jt/mo · 3BR, private pool, 5 min. to Pererenan Beach' },
  'tropicana-a4':  { title: 'Tropicana Valley – Unit A4', folder: '1voeHZet0DspSnBeLeAIWarz-FPqUCUAr', overview: 'Buduk · 30jt/mo · 1BR, private pool, 5 min. to Pererenan' },
  'tropicana-a5':  { title: 'Tropicana Valley – Unit A5', folder: '1voeHZet0DspSnBeLeAIWarz-FPqUCUAr', overview: 'Buduk · 30jt/mo · 1BR, private pool, 5 min. to Pererenan' },
  'tropicana-b2':  { title: 'Tropicana Valley – Unit B2', folder: '1voeHZet0DspSnBeLeAIWarz-FPqUCUAr', overview: 'Buduk · 30jt/mo · 1BR, private pool, 5 min. to Pererenan' },
  'tropicana-b3':  { title: 'Tropicana Valley – Unit B3', folder: '1voeHZet0DspSnBeLeAIWarz-FPqUCUAr', overview: 'Buduk · 30jt/mo · 1BR, private pool, 5 min. to Pererenan' },
  'tropicana-b4':  { title: 'Tropicana Valley – Unit B4', folder: '1voeHZet0DspSnBeLeAIWarz-FPqUCUAr', overview: 'Buduk · 30jt/mo · 1BR, private pool, 5 min. to Pererenan' },
  'tropicana-b5':  { title: 'Tropicana Valley – Unit B5', folder: '1voeHZet0DspSnBeLeAIWarz-FPqUCUAr', overview: 'Buduk · 30jt/mo · 1BR, private pool, 5 min. to Pererenan' },
  'tropicana-b6':  { title: 'Tropicana Valley – Unit B6', folder: '1voeHZet0DspSnBeLeAIWarz-FPqUCUAr', overview: 'Buduk · 30jt/mo · 1BR, private pool, 5 min. to Pererenan' },
};

module.exports = async function handler(req, res) {
  const slug = (req.query.slug || '').replace(/^\/+/, '');
  const listing = LISTINGS[slug];

  let html;
  try {
    html = readFileSync(join(__dirname, 'index.html'), 'utf8');
  } catch (e) {
    try {
      html = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');
    } catch (e2) {
      return res.status(500).json({ error: 'Cannot read index.html', paths: [join(__dirname, 'index.html'), join(__dirname, '..', 'index.html')] });
    }
  }

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
};
