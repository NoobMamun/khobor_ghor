// Feed order matters: when an article appears in two feeds, the first wins,
// so more specific feeds (politics) come before broader ones (bangladesh).
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
  feeds: [
    f('news/bangladesh/politics', 'politics'),
    f('news/bangladesh', 'bangladesh'),
    f('news/world', 'world'),
    f('business', 'business'),
    f('sports', 'sports'),
    f('entertainment', 'entertainment'),
    f('opinion', 'opinion'),
    f('lifestyle', 'lifestyle'),
    f('tech-startup', 'technology'),
  ],
};
