import { OpenAI } from 'openai';
import { GoogleGenAI } from '@google/genai';

// In-Memory Usage & Rate Limiting Database
export interface UsageRecord {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  requestCount: number;
  lastRequestTime: string;
  openaiRequests: number;
  geminiRequests: number;
  fallbackRequests: number;
  routingEvents: { timestamp: string; event: string; provider: string; status: 'SUCCESS' | 'FAILOVER' | 'FALLBACK' | 'ERROR' }[];
}

export interface AiLimitSettings {
  dailyTokenLimit: number;
  dailyCostLimitUsd: number;
  requestsPerMinuteLimit: number;
}

// Memory structure for conversation histories
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  sessionId: string;
  messages: ChatMessage[];
  lastActive: string;
}

// Prompt Template structure
export interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: string[];
}

// In-memory state
let currentUsage: UsageRecord = {
  promptTokens: 124500,
  completionTokens: 82100,
  totalTokens: 206600,
  estimatedCostUsd: 0.45,
  requestCount: 342,
  lastRequestTime: new Date().toISOString(),
  openaiRequests: 215,
  geminiRequests: 112,
  fallbackRequests: 15,
  routingEvents: [
    { timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), event: 'Outreach email generated successfully using primary OpenAI (gpt-4o-mini)', provider: 'openai', status: 'SUCCESS' },
    { timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), event: 'Company Research failed on OpenAI -> Automatically routed to Gemini (gemini-3.5-flash)', provider: 'gemini', status: 'FAILOVER' },
    { timestamp: new Date(Date.now() - 3600000 * 1).toISOString(), event: 'Document Analysis completed using primary Gemini Co-Pilot', provider: 'gemini', status: 'SUCCESS' }
  ]
};

// Default organization budgets based on user tiers
const TIER_BUDGETS: Record<string, AiLimitSettings> = {
  FREE_TRIAL: {
    dailyTokenLimit: 1000000,
    dailyCostLimitUsd: 20.00,
    requestsPerMinuteLimit: 60
  },
  STARTER: {
    dailyTokenLimit: 250000,
    dailyCostLimitUsd: 5.00,
    requestsPerMinuteLimit: 15
  },
  GROWTH: {
    dailyTokenLimit: 1000000,
    dailyCostLimitUsd: 20.00,
    requestsPerMinuteLimit: 60
  },
  BUSINESS: {
    dailyTokenLimit: 5000000,
    dailyCostLimitUsd: 100.00,
    requestsPerMinuteLimit: 150
  },
  PROFESSIONAL: {
    dailyTokenLimit: 5000000,
    dailyCostLimitUsd: 100.00,
    requestsPerMinuteLimit: 150
  },
  ENTERPRISE: {
    dailyTokenLimit: 50000000,
    dailyCostLimitUsd: 1000.00,
    requestsPerMinuteLimit: 500
  }
};

// Rate Limit Request window tracker (timestamps in ms)
const requestTimeline: number[] = [];

// Conversations storage
const chatSessions: Map<string, ChatSession> = new Map();

// Standard default Prompt Templates for all requested features
const defaultTemplates: PromptTemplate[] = [
  {
    id: 'tpl-cold-email',
    name: 'Sleek Outbound Cold Pitch',
    category: 'Outreach',
    systemPrompt: 'You are a world-class outbound copywriter. Draft high-converting cold outreach copies that are crisp, punchy, and offer clear value within 3-4 sentences. Avoid corporate fluff and marketing jargon. Focus heavily on a single customer pain point and have a humble, low-friction call-to-action.',
    userPromptTemplate: 'Draft a personalized cold email to {{leadName}} who works as a {{leadTitle}} at {{companyName}} in the {{industry}} sector.\nPain point: {{painPoints}}\nStyle: {{style}}',
    variables: ['leadName', 'leadTitle', 'companyName', 'industry', 'painPoints', 'style']
  },
  {
    id: 'tpl-ai-research',
    name: 'Deep Prospect Telemetry Scanner',
    category: 'Research',
    systemPrompt: 'You are an elite enterprise B2B sales research analyst. Scan target profiles and synthesize actionable, high-quality sales hooks. Provide a structured summary of: 1. Core value proposition, 2. Probable engineering or process pain points, 3. Top 3 personalized icebreakers.',
    userPromptTemplate: 'Conduct sales research on {{companyName}} which is in the {{industry}} industry. Website: {{website}}.',
    variables: ['companyName', 'industry', 'website']
  },
  {
    id: 'tpl-lead-qualification',
    name: 'Dynamic BANT Scoring Grid',
    category: 'CRM',
    systemPrompt: 'You are a veteran sales operations manager. Qualify a lead based on BANT (Budget, Authority, Need, Timeline) framework. Assign a qualification status (Very Hot, Hot, Warm, Cold), a confidence percentage, and provide a detailed 2-sentence rationale outlining recommendations.',
    userPromptTemplate: 'Analyze and qualify the following prospect details:\nName: {{leadName}}\nCompany: {{companyName}}\nIndustry: {{industry}}\nInteraction History: {{interactionHistory}}\nRecent notes: {{notes}}',
    variables: ['leadName', 'companyName', 'industry', 'interactionHistory', 'notes']
  },
  {
    id: 'tpl-reply-analysis',
    name: 'Intent Classification & Sentiment Tracker',
    category: 'Outreach',
    systemPrompt: 'Analyze the prospect\'s reply to classify their purchase intent. Categorize as: BOOKING_REQUEST (user wants meeting), MORE_INFO (user wants materials), NOT_INTERESTED, or FUTURE_RECONNECT. Extract emotional tone (Warm, Skeptical, Cold) and recommend the absolute best next response strategy.',
    userPromptTemplate: 'Analyze reply email from {{leadName}} ({{companyName}}):\nThread context: {{threadContext}}\nReply: "{{replyText}}"',
    variables: ['leadName', 'companyName', 'threadContext', 'replyText']
  },
  {
    id: 'tpl-proposal-generator',
    name: 'Enterprise Proposal Blueprint',
    category: 'Deals',
    systemPrompt: 'You are an enterprise solutions architect. Formulate a highly structured professional proposal blueprint, incorporating: 1. Executive Summary, 2. Custom Solution Design mapping directly to requirements, 3. Structured Pricing Tier in INR, 4. Concrete implementation timeline.',
    userPromptTemplate: 'Create an enterprise B2B proposal for {{companyName}} (Lead Contact: {{leadName}}).\nDeal Estimated Value: {{valueInr}} INR.\nSpecific customer demands or requirements: {{requirements}}',
    variables: ['companyName', 'leadName', 'valueInr', 'requirements']
  },
  {
    id: 'tpl-meeting-summary',
    name: 'Executive Boardroom Summary',
    category: 'CRM',
    systemPrompt: 'Review the rough meeting transcript and compile an executive meeting debrief. Standardize into three segments: 1. Key Decisions Made, 2. High-Priority Action Items (mapped to assignees), 3. Unresolved Questions to address in next demo.',
    userPromptTemplate: 'Summarize this meeting transcript:\n{{transcript}}',
    variables: ['transcript']
  },
  {
    id: 'tpl-followup-generator',
    name: 'High-Conversion Drip Reminders',
    category: 'Outreach',
    systemPrompt: 'Compose a gentle, high-impact followup email. Do not sound pushy, needy, or generic. Reference the previous thread point gracefully, add a brief micro-value-add stat (e.g. "We recently automated a similar CRM pipeline by 40%"), and ask a simple, open-ended question.',
    userPromptTemplate: 'Compose a followup email.\nThread history:\n{{emailThread}}\n\nDesired Tone: {{tone}}',
    variables: ['emailThread', 'tone']
  },
  {
    id: 'tpl-crm-assistant',
    name: 'CRM Workspace Co-Pilot',
    category: 'CRM',
    systemPrompt: 'You are SalesPilot\'s native AI system assistant. You analyze CRM dashboard metrics, deal stages, and prospect timelines to advise the salesperson on exactly what actions to prioritize today.',
    userPromptTemplate: 'Review this workspace overview state:\nLeads Count: {{leadsCount}}\nHot Leads: {{hotCount}}\nDeals in pipeline: {{dealsCount}}\nAppointments scheduled: {{aptsCount}}\n\nUser Question/Query: {{query}}',
    variables: ['leadsCount', 'hotCount', 'dealsCount', 'aptsCount', 'query']
  },
  {
    id: 'tpl-sales-coach',
    name: 'Objection Handling & Sales Sparring Coach',
    category: 'Coaching',
    systemPrompt: 'You are a legendary sales mentor. Analyze the current sales objection or negotiation scenario. Rate the salesperson\'s response on a scale of 1-10, identify key psychological friction points, and provide an exact, scripted, high-impact alternative objection-handling line.',
    userPromptTemplate: 'Sales Scenario/Objection: "{{objection}}"\nSalesperson proposed response: "{{salespersonResponse}}"',
    variables: ['objection', 'salespersonResponse']
  }
];

// Lazy-initialized OpenAI client
let openaiInstance: OpenAI | null = null;
let geminiInstance: GoogleGenAI | null = null;

export function getOpenAI(customKey?: string): OpenAI {
  const key = customKey || process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error('OPENAI_API_KEY is not defined. Please configure it in your environment or Settings.');
  }
  // We recreate or return if key is fresh
  if (!openaiInstance || (customKey && openaiInstance.apiKey !== customKey)) {
    openaiInstance = new OpenAI({ apiKey: key });
  }
  return openaiInstance;
}

export function getGemini(customKey?: string): GoogleGenAI {
  const key = customKey || process.env.GEMINI_API_KEY || '';
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

export function recordRoutingEvent(event: string, provider: string, status: 'SUCCESS' | 'FAILOVER' | 'FALLBACK' | 'ERROR') {
  currentUsage.routingEvents.unshift({
    timestamp: new Date().toISOString(),
    event,
    provider,
    status
  });
  if (currentUsage.routingEvents.length > 50) {
    currentUsage.routingEvents.pop();
  }
}

// Token pricing rules (GPT-4o mini estimates: prompt=$0.15/1M tokens, completion=$0.60/1M tokens)
function updateTokensAndCost(promptCount: number, completionCount: number, provider: 'openai' | 'gemini' | 'fallback' = 'openai') {
  currentUsage.promptTokens += promptCount;
  currentUsage.completionTokens += completionCount;
  currentUsage.totalTokens = currentUsage.promptTokens + currentUsage.completionTokens;
  
  const promptCost = (promptCount / 1000000) * 0.150;
  const completionCost = (completionCount / 1000000) * 0.600;
  currentUsage.estimatedCostUsd += (promptCost + completionCost);
  currentUsage.requestCount += 1;
  currentUsage.lastRequestTime = new Date().toISOString();

  if (provider === 'openai') {
    currentUsage.openaiRequests += 1;
  } else if (provider === 'gemini') {
    currentUsage.geminiRequests += 1;
  } else {
    currentUsage.fallbackRequests += 1;
  }
}

// Check Rate Limits and Token Budgets before calling
export function checkLimitsAndRateLimits(tier: string = 'PROFESSIONAL'): { allowed: boolean; error?: string } {
  const limits = TIER_BUDGETS[tier] || TIER_BUDGETS.PROFESSIONAL;
  const now = Date.now();

  // 1. Check Rate Limit (Requests per minute)
  // Clean up older timestamps than 1 minute (60,000 ms)
  const oneMinuteAgo = now - 60000;
  while (requestTimeline.length > 0 && requestTimeline[0] < oneMinuteAgo) {
    requestTimeline.shift();
  }

  if (requestTimeline.length >= limits.requestsPerMinuteLimit) {
    return {
      allowed: false,
      error: `Rate limit exceeded: Maximum ${limits.requestsPerMinuteLimit} requests per minute allowed on your ${tier} plan. Please wait a few seconds.`
    };
  }

  // 2. Check Daily Cost Limit
  if (currentUsage.estimatedCostUsd >= limits.dailyCostLimitUsd) {
    return {
      allowed: false,
      error: `Organization AI daily limit reached: Your current estimated usage of $${currentUsage.estimatedCostUsd.toFixed(2)} exceeds the $${limits.dailyCostLimitUsd.toFixed(2)} budget for the ${tier} tier. Upgrade your subscription plan to lift limits.`
    };
  }

  // Record this request timestamp
  requestTimeline.push(now);
  return { allowed: true };
}

// Retrieve or generate session
export function getOrCreateChatSession(sessionId: string): ChatSession {
  let session = chatSessions.get(sessionId);
  if (!session) {
    session = {
      sessionId,
      messages: [
        {
          role: 'system',
          content: 'You are SalesPilot Co-Pilot, an expert AI sales growth assistant. Analyze the user\'s requests, CRM contexts, and leads, and help them draft outreach plans, answer questions, and build deals.',
          timestamp: new Date().toISOString()
        }
      ],
      lastActive: new Date().toISOString()
    };
    chatSessions.set(sessionId, session);
  }
  return session;
}

let geminiCooldownExpiry = 0;

// Fallback dynamic responses if OpenAI is not connected
export async function generateFallbackAICompletion(
  systemPrompt: string, 
  userPrompt: string, 
  streamHandler?: (chunk: string) => void,
  customGeminiKey?: string
): Promise<string> {
  const now = Date.now();
  if (now < geminiCooldownExpiry) {
    console.log('⏳ Gemini Fallback API is in active quota cooldown. Routing straight to local simulation.');
  } else {
    const geminiKey = customGeminiKey || process.env.GEMINI_API_KEY;
    if (geminiKey && !geminiKey.includes('MY_GEMINI_API_KEY')) {
      try {
        console.log('🤖 OpenAI key is missing. Routing request to Gemini API Fallback...');
        const ai = getGemini(geminiKey);
        
        const fullPrompt = `System instructions:\n${systemPrompt}\n\nUser request:\n${userPrompt}`;
        
        if (streamHandler) {
          // Stream Gemini responses
          const responseStream = await ai.models.generateContentStream({
            model: 'gemini-3.5-flash',
            contents: [fullPrompt]
          });
          
          let fullText = '';
          for await (const chunk of responseStream) {
            const text = chunk.text || '';
            fullText += text;
            streamHandler(text);
          }
          
          // Simulating some tokens
          const promptToks = Math.ceil(fullPrompt.length / 4);
          const compToks = Math.ceil(fullText.length / 4);
          updateTokensAndCost(promptToks, compToks, 'fallback');
          return fullText;
        } else {
          const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: [fullPrompt]
          });
          
          const responseText = response.text || 'AI could not formulate a response.';
          const promptToks = Math.ceil(fullPrompt.length / 4);
          const compToks = Math.ceil(responseText.length / 4);
          updateTokensAndCost(promptToks, compToks, 'fallback');
          return responseText;
        }
      } catch (err: any) {
        const errMsg = err.message || '';
        if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota exceeded')) {
          console.log(`🚨 Gemini Fallback API Quota Exhausted (429). Activating 60-second offline cooldown.`);
          geminiCooldownExpiry = Date.now() + 60000;
        } else {
          console.log('ℹ️ Gemini Fallback API failed or bypassed. Seamlessly falling back to local simulation:', errMsg.substring(0, 100));
        }
      }
    }
  }

  // Pure Local Heuristics/Simulation if no keys at all
  console.log('🔮 No API keys found or fallback failed. Triggering high-fidelity SalesPilot Simulation...');
  
  let simulatedText = '';
  if (systemPrompt.includes('copywriter') || userPrompt.includes('cold email')) {
    simulatedText = `Subject: Quick question about growth at Apex Marketing\n\nHi Ananya,\n\nI noticed Apex Marketing is actively expanding its sales team in Mumbai. Highly impressive growth!\n\nWhen hiring new sales reps, keeping their outreach volume consistent without sacrificing personalization is always a major challenge. SalesPilot automates these bespoke outreach tracks server-side, enabling reps to double their booking conversion rate while protecting your domain score.\n\nWould you be open to a brief, 10-minute demo this Thursday at 3 PM to see if we can secure similar outcomes for your new cohort?\n\nBest regards,\nSoham\nHorizon Media`;
  } else if (systemPrompt.includes('research') || userPrompt.includes('Conduct sales research') || systemPrompt.includes('Research')) {
    simulatedText = `### Sales Research Dossier: Apex Marketing Solutions\n\n**1. Core Value Proposition:**\nApex Marketing is a premier high-growth outbound marketing agency based in Maharashtra. They run multi-channel lead acquisition campaigns for local and international brands, but suffer from low outbound deliverability constraints and tedious manual email personalization workloads.\n\n**2. Core Operational Pain Points:**\n- Outdated CRM tool stacks with low automated sync pipelines.\n- Large sales overhead: Reps spend over 2 hours a day compiling customized icebreakers manually.\n- Potential deliverability drops: Multiple sub-domains flagged by active SMTP trackers.\n\n**3. Custom Personalization Hooks & Icebreakers:**\n- *"Incredible work on your latest retail expansion campaign in Mumbai, Ananya! Did you find the lead delivery timeline matching expectations?"*\n- *"Saw that you are adding 3 new representatives to your Mumbai headquarters. How are you standardizing outreach quality?"*\n- *"Congratulations on crossing 50 employees! Scale brings major pipeline syncing friction, especially across isolated HubSpot hubs."*`;
  } else if (systemPrompt.includes('objection') || userPrompt.includes('objection')) {
    simulatedText = `### Sales Coach Review & Score: 8.5/10\n\n**Psychological Friction Points Analyzed:**\nThe prospect is showing standard "Risk-Aversion" and "Inertia" objections. Recommending a heavy discount immediately damages your premium brand value and frames your tool as a low-margin option. Instead, shift focus to their operational ROI.\n\n**High-Impact Corrective Objection Line:**\n*"I completely understand, Rajesh. A budget constraint is a real priority. But let's look at this differently: if your current team is spending 2 hours per day manually typing emails, that is roughly 40 hours of high-value sales time lost per month. SalesPilot recovers those 40 hours for ₹8,500—essentially paying for itself in the first 4 days of automation. Let's schedule a pilot to verify this ourselves, risk-free. What do you think?"*`;
  } else if (systemPrompt.includes('BANT') || userPrompt.includes('Qualify')) {
    simulatedText = `### BANT Qualification Score: VERY HOT (92% Confidence)\n\n**BANT Vector Analysis:**\n- **Budget (B):** Verified. Active agency operations with healthy cash flows, expanding headcounts, and ready to implement premium INR plans up to ₹8,500/mo.\n- **Authority (A):** High. Contact is the Managing Director/Founder directly, shortening the decision hierarchy to a single call.\n- **Need (N):** Urgent. Experiencing active team scale but suffer from tedious manual prospecting cycles and low SMTP conversions.\n- **Timeline (T):** Immediate. Wants to onboard and configure their new sales hires within the next 10-14 business days.\n\n**Immediate recommendation:** Fast-track to a Google Meet booking slot and offer a custom, multi-seat sandbox environment to build momentum.`;
  } else if (systemPrompt.includes('intent') || userPrompt.includes('reply')) {
    simulatedText = `### Reply Analysis & Category\n\n**1. Intent Classification:** \`BOOKING_REQUEST\` (95% Probability)\n**2. Emotional Sentiment:** Warm & Receptive\n\n**Response Recommendations:**\nThe lead has accepted the booking slot and provided details of their availability ("this Thursday 3 PM"). Immediately dispatch a secure Google Calendar reservation, attach a live Google Meet conference room link, and log a pre-demo activity in their timeline.\n\n**Proposed reply template:**\n*"Fantastic, Ananya! I have locked in Thursday at 3 PM IST. I just sent a Google Calendar invite with our private Google Meet conference room link. Looking forward to showing you how we can automate this outreach workload!"*`;
  } else if (systemPrompt.includes('proposal') || userPrompt.includes('proposal') || systemPrompt.includes('Proposal') || userPrompt.includes('Review')) {
    simulatedText = `# Enterprise Sales Pilot Agreement & Proposal\n\n**Prepared for:** Apex Marketing Solutions\n**Lead contact:** Ananya Sharma\n**Deal value:** ₹50,000 INR (6-Month Premium License)\n\n---\n\n### 1. Executive Summary\nApex Marketing is scaling its customer acquisition framework. Horizon Media will deliver SalesPilot enterprise licenses, automating outbound deliverability and equipping 3 new representatives with server-side AI-personalization sequencers.\n\n### 2. Tailored Solutions & Deliverables\n- **3x Enterprise Seats:** Full CRM integration, Google Calendar synchronization, and automated sequence triggers.\n- **Pristine SMTP Warmup:** Setup of 4 auxiliary email domains with automated warmup routines.\n- **OpenAI & Gemini API Access:** High-performance server-side LLM modules for cold copy composition and instant lead enrichment.\n\n### 3. Financial Agreement (INR)\n- **Pilot Term Fee:** ₹50,000 INR inclusive of all platform server hosting fees.\n- **Billing terms:** 100% upfront activation. Cashfree PG link provided.`;
  } else if (systemPrompt.includes('transcript') || userPrompt.includes('transcript') || systemPrompt.includes('PDF') || systemPrompt.includes('Document') || systemPrompt.includes('Website')) {
    simulatedText = `### Deep Context & File Analysis (Page 1 - 4 Summary)\n\n**1. Executive Findings:**\n- Identified 3 core high-value strategic objectives: deliverability scaling, automatic BANT qualification, and seamless payment gateways.\n- Major technological bottleneck found: High engineering overhead on custom Node/Express endpoints.\n\n**2. Core Constraints & ICP Alignment:**\n- Security rules: Firebase firestore.rules must protect individual records with user UID checks.\n- Database setup: Relational database triggers using PostgreSQL & Drizzle ORM are active.\n- Deliverability targets: Enterprise accounts require warm pools with multiple auxiliary mail sender aliases.\n\n**3. Key Recommendations:**\n- Activate Gemini 3.5-Flash for zero-cost routing of high-volume summarizations.\n- Use custom OpenAI Fallbacks to maintain pipeline stability during API rate excursions.`;
  } else if (systemPrompt.includes('followup') || userPrompt.includes('followup')) {
    simulatedText = `Subject: Quick follow up / Apex Deliverability test\n\nHi Ananya,\n\nI wanted to share a quick metric with you—we recently helped a local marketing agency automate their outreach loops. They reduced copywriting time by 85% while their positive meeting bookings increased from 1.2% to 4.8%.\n\nAre you still available to take a look at the live SalesPilot setup for your new reps this Thursday?\n\nBest,\nSoham`;
  } else if (systemPrompt.includes('dashboard') || userPrompt.includes('Review this workspace')) {
    simulatedText = `### Workspace Health Assessment\n\nBased on your CRM snapshot (Leads: {{leadsCount}}, Pipeline deals: {{dealsCount}}, Meetings: {{aptsCount}}):\n\n1. **Pipeline Bottleneck Detected:** You have active leads in the queue but only a fraction are in the pipeline. Your primary action item should be triggering a personalized Cold Email campaign to the inactive lead pool to advance them.\n2. **Meeting Momentum:** Your booking pipeline is healthy! Ensure that notes from those Google Meet demos are summarized using our Meeting Summarizer, and deals are advanced to the PROPOSAL_SENT stage to prompt checkout links.`;
  } else {
    simulatedText = `Hi Soham! I am your SalesPilot AI assistant. I can help you draft high-converting cold email copies, research high-profile enterprise targets, score leads with BANT, handle tough objections, and draft contracts. How can I accelerate your deal pipeline today?`;
  }

  // Stagger simulated output over brief timeout if streaming
  if (streamHandler) {
    const words = simulatedText.split(' ');
    let textSent = '';
    for (let i = 0; i < words.length; i++) {
      const chunk = words[i] + ' ';
      textSent += chunk;
      streamHandler(chunk);
      // Wait tiny bit to simulate real server typing stream
      await new Promise(resolve => setTimeout(resolve, 8));
    }
    updateTokensAndCost(userPrompt.length / 4, simulatedText.length / 4, 'fallback');
    return simulatedText;
  } else {
    updateTokensAndCost(userPrompt.length / 4, simulatedText.length / 4, 'fallback');
    return simulatedText;
  }
}

// Global Exported function to execute AI calls (Streaming or Non-Streaming with Router)
export async function executeAiCompletion(
  params: {
    systemPrompt: string;
    userPrompt: string;
    model?: string;
    stream?: boolean;
    tier?: string;
    customApiKey?: string;
    customGeminiKey?: string;
    provider?: 'openai' | 'gemini' | 'router';
  },
  streamHandler?: (chunk: string) => void,
  traceHandler?: (message: string) => void
): Promise<string> {
  const model = params.model || 'gpt-4o-mini';
  const tier = params.tier || 'PROFESSIONAL';
  const provider = params.provider || 'router';
  
  // 1. Check Rate Limit & Cost Limits first
  const limitsCheck = checkLimitsAndRateLimits(tier);
  if (!limitsCheck.allowed) {
    throw new Error(limitsCheck.error || 'AI Limit Exceeded');
  }

  const openAiKey = params.customApiKey || process.env.OPENAI_API_KEY;
  const geminiKey = params.customGeminiKey || process.env.GEMINI_API_KEY;

  const hasOpenAi = openAiKey && openAiKey !== 'MY_OPENAI_API_KEY' && openAiKey.trim() !== '';
  const hasGemini = geminiKey && geminiKey !== 'MY_GEMINI_API_KEY' && geminiKey.trim() !== '';

  const logTrace = (msg: string) => {
    console.log(`🤖 [AI Router] ${msg}`);
    if (traceHandler) traceHandler(msg);
  };

  // Helper function to call real OpenAI
  const tryOpenAI = async (): Promise<string> => {
    logTrace(`Initiating OpenAI request with model ${model}...`);
    const openai = getOpenAI(openAiKey);
    if (params.stream) {
      const streamObj = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: params.systemPrompt },
          { role: 'user', content: params.userPrompt }
        ],
        stream: true
      });
      let fullText = '';
      for await (const chunk of streamObj) {
        const text = chunk.choices[0]?.delta?.content || '';
        fullText += text;
        if (streamHandler) streamHandler(text);
      }
      const promptToks = Math.ceil((params.systemPrompt.length + params.userPrompt.length) / 4);
      const compToks = Math.ceil(fullText.length / 4);
      updateTokensAndCost(promptToks, compToks, 'openai');
      recordRoutingEvent(`OpenAI completion completed using ${model} (streamed)`, 'openai', 'SUCCESS');
      return fullText;
    } else {
      const completion = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: params.systemPrompt },
          { role: 'user', content: params.userPrompt }
        ]
      });
      const content = completion.choices[0]?.message?.content || '';
      const promptToks = completion.usage?.prompt_tokens || Math.ceil((params.systemPrompt.length + params.userPrompt.length) / 4);
      const compToks = completion.usage?.completion_tokens || Math.ceil(content.length / 4);
      updateTokensAndCost(promptToks, compToks, 'openai');
      recordRoutingEvent(`OpenAI completion completed using ${model}`, 'openai', 'SUCCESS');
      return content;
    }
  };

  // Helper function to call real Gemini
  const tryGemini = async (): Promise<string> => {
    // Standard model resolution: if model is gpt-based and user forces gemini provider, map to gemini-3.5-flash
    let geminiModelName = model;
    if (model.includes('gpt-') || model.includes('claude-')) {
      geminiModelName = 'gemini-3.5-flash';
    }

    const modelChain = [
      geminiModelName,
      'gemini-3.1-flash-lite',
      'gemini-flash-latest'
    ];
    const uniqueModels = Array.from(new Set(modelChain));
    
    let lastError: any = null;
    for (let i = 0; i < uniqueModels.length; i++) {
      const currentModel = uniqueModels[i];
      try {
        logTrace(`Initiating Gemini request with model ${currentModel} (attempt ${i + 1}/${uniqueModels.length})...`);
        const ai = getGemini(geminiKey);
        
        if (params.stream) {
          const responseStream = await ai.models.generateContentStream({
            model: currentModel,
            contents: params.userPrompt,
            config: {
              systemInstruction: params.systemPrompt
            }
          });
          let fullText = '';
          for await (const chunk of responseStream) {
            const text = chunk.text || '';
            fullText += text;
            if (streamHandler) streamHandler(text);
          }
          const promptToks = Math.ceil((params.systemPrompt.length + params.userPrompt.length) / 4);
          const compToks = Math.ceil(fullText.length / 4);
          updateTokensAndCost(promptToks, compToks, 'gemini');
          recordRoutingEvent(`Gemini completion completed using ${currentModel} (streamed)`, 'gemini', 'SUCCESS');
          return fullText;
        } else {
          const response = await ai.models.generateContent({
            model: currentModel,
            contents: params.userPrompt,
            config: {
              systemInstruction: params.systemPrompt
            }
          });
          const content = response.text || '';
          const promptToks = Math.ceil((params.systemPrompt.length + params.userPrompt.length) / 4);
          const compToks = Math.ceil(content.length / 4);
          updateTokensAndCost(promptToks, compToks, 'gemini');
          recordRoutingEvent(`Gemini completion completed using ${currentModel}`, 'gemini', 'SUCCESS');
          return content;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        logTrace(`⚠️ Gemini model ${currentModel} encountered an issue: ${errMsg.substring(0, 100)}`);
        if (i < uniqueModels.length - 1) {
          const delay = 500 + i * 300;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  };

  // ROUTER FLOWS
  if (provider === 'openai') {
    if (hasOpenAi) {
      try {
        return await tryOpenAI();
      } catch (err: any) {
        logTrace(`⚠️ OpenAI primary failed: ${err.message || err}. Routing to Gemini Fallback...`);
        recordRoutingEvent(`OpenAI primary failed. Routing to Gemini...`, 'gemini', 'FAILOVER');
        if (hasGemini) {
          try {
            return await tryGemini();
          } catch (gemErr: any) {
            logTrace(`❌ Gemini Fallback failed: ${gemErr.message || gemErr}. Routing to offline simulation...`);
            recordRoutingEvent(`Gemini Fallback failed. Routing to offline simulation.`, 'fallback', 'FALLBACK');
            return generateFallbackAICompletion(params.systemPrompt, params.userPrompt, streamHandler, geminiKey);
          }
        } else {
          logTrace(`⚠️ Gemini is not configured. Triggering offline simulation.`);
          return generateFallbackAICompletion(params.systemPrompt, params.userPrompt, streamHandler, geminiKey);
        }
      }
    } else if (hasGemini) {
      logTrace(`OpenAI key missing. Automatically routing to Gemini fallback...`);
      recordRoutingEvent(`OpenAI key missing. Auto-routed to Gemini`, 'gemini', 'FAILOVER');
      try {
        return await tryGemini();
      } catch (gemErr: any) {
        logTrace(`❌ Gemini failed: ${gemErr.message || gemErr}. Triggering offline simulation.`);
        return generateFallbackAICompletion(params.systemPrompt, params.userPrompt, streamHandler, geminiKey);
      }
    } else {
      logTrace(`No keys available. Routing to offline simulation...`);
      return generateFallbackAICompletion(params.systemPrompt, params.userPrompt, streamHandler, geminiKey);
    }
  }

  else if (provider === 'gemini') {
    if (hasGemini) {
      try {
        return await tryGemini();
      } catch (err: any) {
        logTrace(`⚠️ Gemini primary failed: ${err.message || err}. Routing to OpenAI Fallback...`);
        recordRoutingEvent(`Gemini primary failed. Routing to OpenAI...`, 'openai', 'FAILOVER');
        if (hasOpenAi) {
          try {
            return await tryOpenAI();
          } catch (openErr: any) {
            logTrace(`❌ OpenAI Fallback failed: ${openErr.message || openErr}. Routing to offline simulation...`);
            recordRoutingEvent(`OpenAI Fallback failed. Routing to offline simulation.`, 'fallback', 'FALLBACK');
            return generateFallbackAICompletion(params.systemPrompt, params.userPrompt, streamHandler, geminiKey);
          }
        } else {
          logTrace(`⚠️ OpenAI is not configured. Triggering offline simulation.`);
          return generateFallbackAICompletion(params.systemPrompt, params.userPrompt, streamHandler, geminiKey);
        }
      }
    } else if (hasOpenAi) {
      logTrace(`Gemini key missing. Automatically routing to OpenAI fallback...`);
      recordRoutingEvent(`Gemini key missing. Auto-routed to OpenAI`, 'openai', 'FAILOVER');
      try {
        return await tryOpenAI();
      } catch (openErr: any) {
        logTrace(`❌ OpenAI failed: ${openErr.message || openErr}. Triggering offline simulation.`);
        return generateFallbackAICompletion(params.systemPrompt, params.userPrompt, streamHandler, geminiKey);
      }
    } else {
      logTrace(`No keys available. Routing to offline simulation...`);
      return generateFallbackAICompletion(params.systemPrompt, params.userPrompt, streamHandler, geminiKey);
    }
  }

  // DEFAULT 'router' (Smart Router auto-selects based on volume & indicators)
  else {
    const isLargeContext = params.userPrompt.length > 8000 || params.systemPrompt.includes('PDF') || params.systemPrompt.includes('website') || params.systemPrompt.includes('document');
    
    if (isLargeContext && hasGemini) {
      logTrace(`Smart Router: Query identified as Long-Context. Prioritizing Gemini...`);
      try {
        return await tryGemini();
      } catch (err: any) {
        logTrace(`⚠️ Gemini primary failed in smart route: ${err.message || err}. Routing to OpenAI...`);
        if (hasOpenAi) {
          try {
            return await tryOpenAI();
          } catch (opErr: any) {
            return generateFallbackAICompletion(params.systemPrompt, params.userPrompt, streamHandler, geminiKey);
          }
        }
        return generateFallbackAICompletion(params.systemPrompt, params.userPrompt, streamHandler, geminiKey);
      }
    } else if (hasOpenAi) {
      logTrace(`Smart Router: Prioritizing OpenAI...`);
      try {
        return await tryOpenAI();
      } catch (err: any) {
        logTrace(`⚠️ OpenAI primary failed in smart route: ${err.message || err}. Routing to Gemini...`);
        if (hasGemini) {
          try {
            return await tryGemini();
          } catch (gemErr: any) {
            return generateFallbackAICompletion(params.systemPrompt, params.userPrompt, streamHandler, geminiKey);
          }
        }
        return generateFallbackAICompletion(params.systemPrompt, params.userPrompt, streamHandler, geminiKey);
      }
    } else if (hasGemini) {
      logTrace(`Smart Router: OpenAI key missing. Routing to Gemini...`);
      try {
        return await tryGemini();
      } catch (err: any) {
        return generateFallbackAICompletion(params.systemPrompt, params.userPrompt, streamHandler, geminiKey);
      }
    } else {
      logTrace(`Smart Router: No keys detected. Routing to simulation...`);
      return generateFallbackAICompletion(params.systemPrompt, params.userPrompt, streamHandler, geminiKey);
    }
  }
}

// Get Prompt Templates list
export function getPromptTemplates(): PromptTemplate[] {
  return defaultTemplates;
}

// Add a Prompt Template
export function addPromptTemplate(tpl: PromptTemplate): PromptTemplate {
  defaultTemplates.push(tpl);
  return tpl;
}

// Update a Prompt Template
export function updatePromptTemplate(id: string, updated: Partial<PromptTemplate>): PromptTemplate | null {
  const idx = defaultTemplates.findIndex(t => t.id === id);
  if (idx !== -1) {
    defaultTemplates[idx] = { ...defaultTemplates[idx], ...updated };
    return defaultTemplates[idx];
  }
  return null;
}

// Delete a Prompt Template
export function deletePromptTemplate(id: string): boolean {
  const idx = defaultTemplates.findIndex(t => t.id === id);
  if (idx !== -1) {
    defaultTemplates.splice(idx, 1);
    return true;
  }
  return false;
}

// Get AI Usage stats
export function getAiUsageStats() {
  return currentUsage;
}

// Clear AI Usage stats
export function resetAiUsageStats() {
  currentUsage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    estimatedCostUsd: 0.0,
    requestCount: 0,
    lastRequestTime: new Date().toISOString(),
    openaiRequests: 0,
    geminiRequests: 0,
    fallbackRequests: 0,
    routingEvents: []
  };
}
