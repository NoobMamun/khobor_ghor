// Prothom Alo — one rich RSS feed (images, Bangla categories). Sections are
// derived from the first segment of the article URL.
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

  // URL first-segment -> canonical section id
  sectionByPath: {
    bangladesh: 'bangladesh',
    politics: 'politics',
    world: 'world',
    business: 'business',
    sports: 'sports',
    entertainment: 'entertainment',
    opinion: 'opinion',
    lifestyle: 'lifestyle',
    technology: 'technology',
    education: 'education',
    religion: 'religion',
    video: 'video',
  },

};
