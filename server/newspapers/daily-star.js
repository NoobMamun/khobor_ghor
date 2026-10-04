// The Daily Star — official per-section RSS feeds. `sections` is an allowlist.
// Feed order matters: when an article appears in two feeds, the first wins.
const f = (path, section) => ({ url: `https://www.thedailystar.net/${path}/rss.xml`, section });

export default {
  id: 'daily-star',
  name: 'The Daily Star',
  nativeName: 'The Daily Star',
  language: 'en',
  logo: null,
  monogram: 'DS',
  brandColor: '#0b5cab',
  homepage: 'https://www.thedailystar.net',

  // Only these sections are shown.
  sections: ['bangladesh', 'opinion'],

  feeds: [
    f('news/bangladesh/politics', 'bangladesh'), // politics is a sub-section of Bangladesh news
    f('news/bangladesh', 'bangladesh'),
    f('opinion', 'opinion'),
  ],
};
