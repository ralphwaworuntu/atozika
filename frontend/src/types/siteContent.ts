export type SiteLink = { label: string; href: string };

export type HomeCopy = {
  hero: {
    title: string;
    subtitle: string;
    ctaPrimary: SiteLink;
    ctaSecondary: SiteLink;
  };
  about: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    advantagesTitle: string;
    advantages: string[];
  };
  challenges: { eyebrow: string; title: string; items: string[] };
  reasonsEyebrow: string;
  reasonsTitle: string;
  reasons: string[];
  pillars: {
    eyebrow: string;
    title: string;
    description: string;
    items: Array<{
      number: string;
      title: string;
      description: string;
      ctaLabel: string;
      ctaHref: string;
      icon: string;
    }>;
  };
  promo: {
    enabled: boolean;
    eyebrow: string;
    badge: string;
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
    endsAt: string;
    quotaTotal: number;
    quotaRemaining: number;
  };
  programs: {
    title: string;
    subtitle: string;
    tiers: Array<{
      tier: string;
      name: string;
      price: number;
      originalPrice: number;
      features: string[];
      ctaLabel: string;
      ctaHref: string;
      ctaVariant: string;
      featured: boolean;
      badge: string;
    }>;
  };
  faq: { eyebrow: string; title: string; description: string };
  videos: { eyebrow: string; title: string };
};

export type ProfileCopy = { title: string; body: string; highlights: string[] };

export type MemberMenuItem = { to: string; label: string; hidden: boolean };

export type MemberTopic = {
  key: string;
  name: string;
  icon: string;
  tint: string;
  bar: string;
  practice: { soal: number; paket: number; description: string; groups: string[] };
  material: { count: number; progress: number };
};

export type MemberCopy = {
  greetingMorning: string;
  greetingAfternoon: string;
  greetingEvening: string;
  greetingNight: string;
  subtitle: string;
  inactiveBadge: string;
  skillsTitle: string;
  continueTitle: string;
  ctaReview: string;
  ctaStart: string;
  ctaInactive: string;
  ctaPayment: string;
  pillarTitle: string;
  pillarDescription: string;
  skillTiles: Array<{ label: string; hint: string; to: string }>;
  newsSections: Array<{ id: string; label: string; title: string }>;
  menu: MemberMenuItem[];
  topics: MemberTopic[];
};

export type SiteBoards = {
  schedules: Array<{ id: string; category: string; kind: string; title: string; time: string }>;
  openings: Array<{ id: string; category: string; agency: string; title: string; window: string }>;
};

export type FitnessCopy = {
  ageTitle: string;
  ageDescription: string;
  bmiTitle: string;
  bmiDescription: string;
  bmiMin: number;
  bmiMax: number;
  physicalTitle: string;
  physicalDescription: string;
  items: Array<{
    key: string;
    label: string;
    unit: string;
    higher: boolean;
    targetL: number;
    targetP: number;
    floorL: number;
    floorP: number;
  }>;
};

export type MemberChrome = {
  member: MemberCopy;
  boards: SiteBoards;
  fitness: FitnessCopy;
};
