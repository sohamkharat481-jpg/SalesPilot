import { Lead } from './index';

export interface LeadIntelligence {
  leadId: string;
  companyName: string;
  companySize: string; // e.g. "50-200 employees"
  industry: string; // e.g. "B2B SaaS / FinTech"
  estimatedRevenue: string; // e.g. "₹25Cr - ₹100Cr ($3M - $12M ARR)"
  techStack: string[]; // e.g. ["React", "AWS", "HubSpot", "Node.js"]
  hiringActivity: string; // e.g. "Active hiring in Sales & Engineering (12 open roles)"
  funding: string; // e.g. "Series B - $15M raised (Sequoia Capital)"
  growthSignals: string[]; // e.g. ["Headcount expansion +35% YoY", "Expanding to APAC"]
  websiteQuality: string; // e.g. "High-converting SaaS landing page with SSL & mobile optimization"
  socialPresence: string; // e.g. "Active LinkedIn page (14.2k followers) & Twitter"
  icpMatchScore: number; // 0 - 100
  icpMatchReason: string;
  buyingIntentIndicators: string[]; // e.g. ["Evaluating outbound CRM tools", "Recent VP Sales hire"]
  decisionMakerLikelihood: string; // e.g. "High (VP of Sales has direct budget authority)"
  competitors: string[]; // e.g. ["Outreach", "Apollo.io", "Salesloft"]
  companySummary: string;
  recommendedOutreachStrategy: string;
  bestChannel: string; // e.g. "LinkedIn Connection + Warm Email"
  bestTiming: string; // e.g. "Tuesday & Thursday 10:30 AM IST"
  confidenceScore: number; // 0 - 100
  generatedAt: string;
  isCached?: boolean;
}
