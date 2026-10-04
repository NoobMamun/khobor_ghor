// Prothom Alo — one RSS feed with every section; sections are derived from the first
// segment of the article URL. `sections` is an allowlist: everything else is dropped.
export default {
  id: 'prothom-alo',
  name: 'Prothom Alo',
  nativeName: 'প্রথম আলো',
  language: 'bn',
  logo: null, // optional image URL; the UI falls back to a monogram badge
  monogram: 'প্র',
  brandColor: '#d7263d',
  homepage: 'https://www.prothomalo.com',
  feeds: [{ url: 'https://www.prothomalo.com/feed/' }],

  // Only these sections are shown (রাজনীতি, অর্থনীতি).
  sections: ['politics', 'business'],

  // URL first-segment -> canonical section id
  sectionByPath: {
    politics: 'politics',
    business: 'business',
  },
};
