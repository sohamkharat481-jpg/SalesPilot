/**
 * SalesPilot Clean Architecture Type Definitions
 * Represents the domain entities for the SaaS sales automation system.
 */

export type SubscriptionTier = 'STARTER' | 'GROWTH' | 'BUSINESS' | 'ENTERPRISE' | 'PROFESSIONAL' | 'AGENCY';
export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'SALES' | 'VIEWER' | 'SUPER_ADMIN' | 'CLIENT';

export interface Organization {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  companyName?: string;
  slug?: string;
  owner?: string;
  website?: string;
  gstNumber?: string;
  country?: string;
  timezone?: string;
  currency?: string;
  logo?: string;
  ownerId?: string;
  subscriptionPlan?: string;
  status?: string;
  createdAt: string;
}

export interface WorkspaceUser {
  id: string;
  email: string;
  fullName: string;
  companyName: string;
  industry: string;
  tier: SubscriptionTier;
  role: UserRole;
  organizationId?: string;
  isVerified?: boolean;
  avatarUrl?: string;
  title?: string;
  phone?: string;
  timezone?: string;
  language?: string;
  mfaEnabled?: boolean;
  createdAt: string;
  isFounder?: boolean;
  subscriptionStatus?: 'ACTIVE' | 'INACTIVE' | 'PAUSED' | 'CANCELLED' | 'LIFETIME';
}

export interface TeamMember {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  joinedAt?: string;
}

export type LeadStatus = 'NEW' | 'RESEARCH' | 'READY' | 'OUTREACH' | 'INTERESTED' | 'MEETING_BOOKED' | 'WON' | 'LOST' | 'CONTACTED' | 'QUALIFIED' | 'NURTURING' | 'UNSUBSCRIBED';

export interface LeadNote {
  id: string;
  text: string;
  createdAt: string;
}

export interface LeadTask {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
}

export interface LeadTimelineEvent {
  id: string;
  event: string;
  details: string;
  createdAt: string;
}

export interface LeadEnrichment {
  companySize?: string;
  techStack?: string[];
  fundingRound?: string;
  linkedInUrl?: string;
  aiBrief?: string;
  industryGroup?: string;
  annualRevenue?: string;
  website?: string;
  country?: string;
  industry?: string;
  companyLinkedIn?: string;
  companyOverview?: string;
  painPoints?: string[];
  whyGoodProspect?: string;
  decisionMakerInfo?: string;
  socialLinks?: string[];
  latitude?: number;
  longitude?: number;
  googlePlaceId?: string;
  address?: string;
}

export interface LeadResearchProfile {
  companySummary: string;
  websiteAnalysis: string;
  industryAnalysis: string;
  painPoints: string[];
  decisionMakerSummary: string;
  businessOpportunities: string[];
  salesAngleSuggestions: string[];
  objectionPredictions: string[];
  competitorNotes: string;
  buyingSignals: string[];
  aiInsights: string;
  generatedAt: string;

  // Rich AI Research Engine additions
  businessModel?: string;
  products?: string[];
  services?: string[];
  targetCustomers?: string[];
  industriesServed?: string[];
  businessSize?: string;
  yearsInBusiness?: string | number;
  employeeGrowth?: string;
  revenueEstimate?: string;
  techStack?: string[];
  socialPresence?: string[];
  businessCategory?: string;
  usp?: string;
  mission?: string;
  vision?: string;

  // Website details
  extractedKeywords?: string[];
  extractedOffers?: string[];
  extractedForms?: string[];
  extractedCTAs?: string[];
  customerTypes?: string[];

  // Decision maker details
  dmName?: string;
  dmRole?: string;
  dmDepartment?: string;
  dmResponsibilities?: string;
  dmBuyingAuthority?: string;
  dmPainPoints?: string[];
  dmGoals?: string[];
  dmInterests?: string[];
  dmPreferredCommunication?: string;
  dmInfluenceScore?: number;

  // Business Pain point analysis
  predictedProblems?: { problem: string; severity: 'LOW' | 'MEDIUM' | 'HIGH'; reasoning: string }[];

  // Sales Opportunity
  salesOppWhyBuy?: string;
  salesOppRecommendedProduct?: string;
  salesOppScore?: number;
  salesOppBudgetRange?: string;
  salesOppTimeline?: string;
  salesOppPriorityLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  salesOppRecommendedOffer?: string;

  // Competitors list
  detailedCompetitors?: { name: string; marketPosition: string; differentiation: string; strengths: string; weaknesses: string; potentialOpportunity: string }[];

  // Sales Strategy
  strategyFirstMessage?: string;
  strategyOutreachChannel?: string;
  strategyBestContactPerson?: string;
  strategyRecommendedOffer?: string;
  strategyFollowUpSequence?: string[];
  strategyMeetingAngle?: string;
  strategyExpectedObjections?: string[];
  strategyObjectionHandling?: string[];

  // AI Summary
  executiveSummary?: string;

  // Lead Insights
  insightsHotnessScore?: number;
  insightsBuyingIntent?: 'LOW' | 'MEDIUM' | 'HIGH';
  insightsUrgency?: 'LOW' | 'MEDIUM' | 'HIGH';
  insightsRevenuePotential?: string;
  insightsReplyProbability?: number;
  insightsMeetingProbability?: number;
  insightsConversionProbability?: number;
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company: string;
  title?: string;
  status: LeadStatus;
  enrichment?: LeadEnrichment;
  researchProfile?: LeadResearchProfile;
  researchHistory?: LeadResearchProfile[];
  researchStatus?: 'PENDING' | 'RESEARCHING' | 'COMPLETED' | 'FAILED';
  researchProgress?: number;
  researchStatusText?: string;
  researchError?: string;
  createdAt: string;
  campaignId?: string;
  leadScore?: 'Very Hot' | 'Hot' | 'Warm' | 'Cold';
  confidenceScore?: number;
  scoreReason?: string;
  tags?: string[];
  lastUpdated?: string;
  notesList?: LeadNote[];
  tasksList?: LeadTask[];
  timelineList?: LeadTimelineEvent[];
  source?: string;
  provider?: string;
}

export type SequenceType = 'EMAIL' | 'LINKEDIN_MESSAGE' | 'LINKEDIN_CONNECT';

export interface SequenceStep {
  id: string;
  stepNumber: number;
  type: SequenceType;
  subject?: string;
  bodyTemplate: string;
  delayDays: number;
}

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';

export interface Campaign {
  id: string;
  name: string;
  targetAudience: 'MARKETING_AGENCY' | 'SAAS' | 'IT_COMPANY' | 'WEB_DEV' | 'REAL_ESTATE' | 'RECRUITMENT' | 'GENERAL';
  status: CampaignStatus;
  steps: SequenceStep[];
  totalSent: number;
  totalOpened: number;
  totalReplied: number;
  createdAt: string;
}

export type DealStage = 'PROSPECTING' | 'QUALIFIED' | 'DEMO_SCHEDULED' | 'PROPOSAL_SENT' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';

export interface Deal {
  id: string;
  leadId: string;
  leadName: string;
  company: string;
  valueInr: number;
  stage: DealStage;
  updatedAt: string;
  notes?: string;
}

export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export interface Appointment {
  id: string;
  leadId: string;
  leadName: string;
  company: string;
  email: string;
  dateTime: string;
  durationMins: number;
  status: AppointmentStatus;
  meetingLink: string;
  notes?: string;
  timezone?: string;
  googleSynced?: boolean;
  googleEventId?: string;
  gmailMessageId?: string;
  reminderSent?: boolean;
  timelineList?: { id: string; event: string; details: string; createdAt: string }[];
}

export interface IntegrationCredentials {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  geminiApiKey?: string;
  n8nWebhookUrl?: string;
  cashfreeAppId?: string;
  cashfreeSecretKey?: string;
}

export interface SalesPilotState {
  user: WorkspaceUser | null;
  leads: Lead[];
  campaigns: Campaign[];
  deals: Deal[];
  appointments: Appointment[];
  integrations: IntegrationCredentials;
}
