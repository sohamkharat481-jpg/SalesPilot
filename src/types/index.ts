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
  settings?: any;
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

// --- AI SDR Module Type Definitions ---

export interface AiCompanyResearch {
  id: string;
  leadId: string;
  organizationId: string;
  summary: string;
  industry: string;
  productsServices: string[];
  websiteAnalysis: string;
  teamSize?: string;
  technologies: string[];
  painPoints: string[];
  recentNews?: string[];
  icpFitScore: number; // 0 to 100
  createdAt: string;
}

export interface AiContactProfile {
  id: string;
  leadId: string;
  organizationId: string;
  name: string;
  role: string;
  decisionMakerScore: number; // 0 to 100
  buyingIntentEstimate: 'LOW' | 'MEDIUM' | 'HIGH';
  talkingPoints: string[];
  createdAt: string;
}

export interface AiEmailGeneration {
  id: string;
  leadId: string;
  organizationId: string;
  subject: string;
  body: string;
  tone: 'Formal' | 'Friendly' | 'Startup' | 'Enterprise' | 'Custom';
  promptUsed?: string;
  status: 'DRAFT' | 'SENT' | 'REJECTED';
  createdAt: string;
}

export interface AiFollowup {
  id: string;
  leadId: string;
  organizationId: string;
  sequenceId?: string;
  stepNumber: number;
  subject?: string;
  body: string;
  delayDays: number;
  status: 'PENDING' | 'SENT' | 'SKIPPED';
  createdAt: string;
}

export interface AiMeetingBrief {
  id: string;
  appointmentId: string;
  organizationId: string;
  companyOverview: string;
  contactOverview: string;
  keyDiscussionPoints: string[];
  suggestedQuestions: string[];
  possibleObjections: string[];
  meetingStrategy: string;
  createdAt: string;
}

export interface AiProposal {
  id: string;
  leadId: string;
  organizationId: string;
  title: string;
  scope: string;
  pricingSummary: string;
  nextSteps: string;
  markdownContent: string;
  createdAt: string;
}

export interface AiScore {
  id: string;
  leadId: string;
  organizationId: string;
  scoreType: 'ICP' | 'DECISION_MAKER' | 'BUYING_INTENT' | 'OVERALL';
  scoreValue: number;
  reasoning: string;
  createdAt: string;
}

// --- Enterprise Team Workspace Models ---

export interface OrgRole {
  id: string;
  organizationId: string; // "system" for default roles, or custom org id
  name: string;
  description?: string;
  isCustom: boolean;
  createdAt: string;
}

export interface OrgPermission {
  id: string;
  name: string; // e.g., 'View CRM', 'Edit CRM', 'Delete CRM', 'Manage Campaigns', 'Manage Billing', 'Manage AI', 'Manage Integrations', 'View Reports', 'Manage Team', 'Manage Settings'
  description?: string;
}

export interface OrgMemberPermission {
  id: string;
  memberId: string;
  permissionId: string;
  allowed: boolean;
}

export interface OrgNotification {
  id: string;
  organizationId: string;
  userId: string;
  title: string;
  message: string;
  type: 'assignment' | 'meeting' | 'alert' | 'general' | 'campaign';
  read: boolean;
  createdAt: string;
}

export interface OrgAuditLog {
  id: string;
  organizationId: string;
  userId: string;
  userEmail: string;
  action: string; // 'Login' | 'Lead creation' | 'Lead deletion' | 'Campaign changes' | 'Billing changes' | 'Role changes' | 'Settings changes'
  details: string;
  ipAddress?: string;
  createdAt: string;
}

export interface OrgTeamActivity {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  actionType: string;
  targetId?: string;
  targetType?: 'lead' | 'deal' | 'meeting' | 'campaign' | 'general';
  details: string;
  createdAt: string;
}

export interface OrgInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  invitedBy: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
}

// --- Workflow Automation Engine Models ---

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'delay' | 'branch' | 'loop' | 'end';
  label: string;
  config: {
    triggerType?: string;      // for triggers
    conditionRules?: any;     // for conditions (e.g., field, operator, value)
    actionType?: string;       // for actions (e.g. 'CREATE_LEAD', 'SEND_GMAIL')
    actionConfig?: any;       // action-specific payloads (templates, emails, ids)
    delayMs?: number;         // for delays (minutes, hours, days, seconds)
    delayType?: 'duration' | 'date';
    delayUntilDate?: string;  // delay until timezone-aware date
    loopConfig?: {
      loopCount?: number;
      iteratorField?: string;
    };
    [key: string]: any;
  };
  position?: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  conditionValue?: 'yes' | 'no' | 'default' | string; // Branch condition outcomes
}

export interface AutomationWorkflow {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'PAUSED';
  createdAt: string;
  updatedAt: string;
  version: number;
  triggerType: string; // e.g. 'NEW_LEAD' | 'LEAD_UPDATED' | 'MANUAL' | 'SCHEDULED'
  triggerConfig?: any;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  versionNumber: number;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  updatedAt: string;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  organizationId: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PAUSED';
  triggerType: string;
  contextData: any; // Trigger payload (lead, email, user info)
  currentNodeId?: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  errorMessage?: string;
}

export interface WorkflowLog {
  id: string;
  runId: string;
  workflowId: string;
  nodeId?: string;
  nodeType?: string;
  status: 'SUCCESS' | 'ERROR' | 'RETRYING' | 'PENDING';
  message: string;
  details?: string;
  durationMs?: number;
  createdAt: string;
}

export interface ScheduledJob {
  id: string;
  workflowId: string;
  nodeId: string;
  runId: string;
  organizationId: string;
  executeAt: string; // Date string timezone-aware
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  retryCount: number;
  maxRetries: number;
  contextData: any;
  timezone?: string;
}

export interface AutomationHistory {
  id: string;
  organizationId: string;
  userId: string;
  userEmail: string;
  workflowId: string;
  workflowName: string;
  action: 'CREATE' | 'PUBLISH' | 'PAUSE' | 'RESUME' | 'CLONE' | 'RUN' | 'DELETE' | 'VERSION_RESTORE';
  details: string;
  createdAt: string;
}

// ==================================================
// Developer Portal, Public API & Integrations Types
// ==================================================

export interface ApiKey {
  id: string;
  organizationId: string;
  name: string;
  keyPrefix: string;
  secretKey: string; // Cleartext/masked for demonstration convenience
  scopes: string[];
  status: 'ACTIVE' | 'DISABLED';
  rateLimit: number; // API requests allowed per minute
  expiresAt?: string;
  lastUsedAt?: string;
  createdAt: string;
}

export interface OAuthClient {
  id: string;
  secret: string;
  organizationId: string;
  name: string;
  description?: string;
  redirectUris: string[];
  scopes: string[];
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
}

export interface OAuthToken {
  id: string;
  clientId: string;
  organizationId: string;
  accessToken: string;
  refreshToken: string;
  scopes: string[];
  expiresAt: string;
  createdAt: string;
}

export interface WebhookEndpoint {
  id: string;
  organizationId: string;
  url: string;
  secret: string;
  events: string[];
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
}

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  organizationId: string;
  event: string;
  payload: string;
  statusCode?: number;
  responseBody?: string;
  attemptNumber: number;
  status: 'SUCCESS' | 'FAILED' | 'RETRYING';
  nextAttemptAt?: string;
  createdAt: string;
}

export interface IntegrationConfig {
  id: string;
  organizationId: string;
  integrationId: string;
  status: 'CONNECTED' | 'DISCONNECTED';
  settings: Record<string, any>;
  updatedAt: string;
}

export interface MarketplaceApp {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  category: string;
  developer: string;
  isInstalled: boolean;
  requiredScopes: string[];
}

export interface DeveloperLog {
  id: string;
  organizationId: string;
  type: 'API_REQUEST' | 'WEBHOOK_DELIVERY' | 'OAUTH_FLOW';
  method?: string;
  path?: string;
  statusCode?: number;
  ipAddress?: string;
  durationMs?: number;
  message: string;
  details?: string;
  createdAt: string;
}




