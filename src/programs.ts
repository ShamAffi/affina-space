// Programs catalog (SPEC_PROGRAMS_PAGE) — the Launch Program + 4 "coming soon" specialized
// courses. Titles-only outlines for now; full lessons ship later, gated by the subscription
// when they do. Placeholder image = a brand tint (Shamil swaps real images later).
export type ProgramStatus = 'in_progress' | 'coming_soon';

export type Program = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  status: ProgramStatus;
  moduleCount: number;
  tint: string;            // placeholder image tint (Tailwind bg class)
  modules?: string[];      // course outline (specialized) — titles only
};

export const PROGRAMS: Program[] = [
  {
    id: 'launch',
    name: 'The Launch Program',
    tagline: 'Idea → your first paying customer',
    description: 'The core program: 13 modules taking you from a raw idea to real revenue, one honest step at a time.',
    category: 'Core',
    status: 'in_progress',
    moduleCount: 13,
    tint: 'bg-brand-100',
  },
  {
    id: 'digital-marketing',
    name: 'Digital Marketing',
    tagline: 'Get your first customers online',
    description: 'Positioning, content, social, email, ads and analytics — the channels that actually bring customers in.',
    category: 'Growth',
    status: 'coming_soon',
    moduleCount: 7,
    tint: 'bg-accent-50',
    modules: [
      'Marketing foundations for founders (positioning, message-market fit)',
      'Your content engine (organic content, SEO basics)',
      'Social media that converts (pick your platform, sell without being salesy)',
      'Email & your owned audience (list building, welcome sequences)',
      'Paid ads 101 (Meta/Google basics, small-budget testing, reading numbers)',
      'Landing pages & conversion (deeper than the Launch Program)',
      'Analytics & doubling down (tracking, attribution basics, finding your channel)',
    ],
  },
  {
    id: 'ai-for-business',
    name: 'AI for Business',
    tagline: 'Your team of one, powered by AI',
    description: 'Use AI to build, market, operate and understand your customers — the leverage of a whole team, solo.',
    category: 'AI',
    status: 'coming_soon',
    moduleCount: 8,
    tint: 'bg-brand-50',
    modules: [
      'The AI-native founder mindset (where AI helps vs where it doesn\'t)',
      'Your AI toolkit (essential tools and when to use each)',
      'AI for content & marketing (scale content, keep your voice)',
      'AI for building (no-code + AI: MVPs, landing pages, prototypes)',
      'AI for operations (automate admin/support/research — Zapier/Make + AI)',
      'AI for customer insight (analyze interviews, feedback, research with AI)',
      'Build your own AI agents/assistants (custom GPTs, simple agents)',
      'Prompting & judgment (good output, spotting hallucinations, human-in-the-loop)',
    ],
  },
  {
    id: 'founder-finance',
    name: 'Founder Finance',
    tagline: 'Money & numbers, demystified',
    description: 'Pricing confidence, cash flow, unit economics and a forecast you can actually use — no MBA required.',
    category: 'Finance',
    status: 'coming_soon',
    moduleCount: 6,
    tint: 'bg-inset',
    modules: [
      'Money mindset for founders (pricing confidence; the women-founder angle)',
      'Pricing that works (value-based pricing, testing, raising prices)',
      'Cash flow & runway (the number that actually kills businesses)',
      'Unit economics deep dive (LTV, CAC, margins, contribution)',
      'Bookkeeping & taxes basics (what to track, tools, when to get an accountant)',
      'Financial modeling on a napkin (a simple forecast you can actually use)',
    ],
  },
  {
    id: 'personal-brand',
    name: 'Personal Brand & Founder-Led Growth',
    tagline: 'Build the audience that buys',
    description: 'Turn your story into a moat: voice, LinkedIn, short-form, building in public, PR — attention into revenue.',
    category: 'Growth',
    status: 'coming_soon',
    moduleCount: 7,
    tint: 'bg-accent-50',
    modules: [
      'Why founder-led growth wins (your story is your moat)',
      'Finding your voice & niche (content pillars, your unique angle)',
      'LinkedIn for founders (presence that attracts customers & investors)',
      'Short-form & storytelling (Instagram/TikTok/video, your founder story)',
      'Building in public (turn the journey into customers and community)',
      'PR & getting noticed (press, podcasts, features — no PR budget)',
      'Turning audience into revenue (attention → customers, community, list)',
    ],
  },
];
