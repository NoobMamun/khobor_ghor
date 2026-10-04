// Canonical sections shared by every newspaper. Each newspaper maps its own
// categories/URLs onto these ids (see newspapers/*.js), so the UI can render
// "Politics" the same way regardless of source. Order here = display order.
export const SECTIONS = [
  { id: 'bangladesh', label: { bn: 'বাংলাদেশ', en: 'Bangladesh' } },
  { id: 'politics', label: { bn: 'রাজনীতি', en: 'Politics' } },
  { id: 'world', label: { bn: 'বিশ্ব', en: 'World' } },
  { id: 'business', label: { bn: 'অর্থনীতি', en: 'Business' } },
  { id: 'sports', label: { bn: 'খেলা', en: 'Sports' } },
  { id: 'entertainment', label: { bn: 'বিনোদন', en: 'Entertainment' } },
  { id: 'opinion', label: { bn: 'মতামত', en: 'Opinion' } },
  { id: 'lifestyle', label: { bn: 'জীবনযাপন', en: 'Lifestyle' } },
  { id: 'technology', label: { bn: 'প্রযুক্তি', en: 'Technology' } },
  { id: 'education', label: { bn: 'শিক্ষা', en: 'Education' } },
  { id: 'religion', label: { bn: 'ধর্ম', en: 'Religion' } },
  { id: 'video', label: { bn: 'ভিডিও', en: 'Video' } },
  { id: 'other', label: { bn: 'অন্যান্য', en: 'More' } },
];

export const SECTION_BY_ID = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));
