import { IntegrationPlugin } from '../types/integrations';

export const INTEGRATION_PLUGINS: IntegrationPlugin[] = [
  // --- LEAD PROVIDERS ---
  {
    id: 'clearbit',
    name: 'Clearbit',
    category: 'Lead Providers',
    description: 'Enrich anonymous visitor IP addresses, domain details, and find decision-maker contact emails.',
    iconName: 'Building',
    authType: 'API_KEY',
    authFields: [
      {
        key: 'apiKey',
        label: 'Clearbit API Key',
        type: 'password',
        placeholder: 'sk_xxxxxxxxxxxxxxxxxxxxxxxx',
        required: true,
        helpText: 'Your secret API key can be found in your Clearbit Dashboard settings.'
      }
    ],
    defaultUsageLimit: 2500,
    usageUnit: 'Enrichments'
  },
  {
    id: 'hunter',
    name: 'Hunter.io',
    category: 'Lead Providers',
    description: 'Verify outbound sales email deliverability, guess professional patterns, and parse domain emails.',
    iconName: 'Search',
    authType: 'API_KEY',
    authFields: [
      {
        key: 'apiKey',
        label: 'Hunter.io API Key',
        type: 'password',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        required: true,
        helpText: 'Access your API key from the Hunter.io API dashboard tab.'
      }
    ],
    defaultUsageLimit: 10000,
    usageUnit: 'Verifications'
  },
  {
    id: 'peopledatalabs',
    name: 'People Data Labs',
    category: 'Lead Providers',
    description: 'Enterprise resume, social profile, and resume-level employment history enrichment provider.',
    iconName: 'Users',
    authType: 'API_KEY',
    authFields: [
      {
        key: 'apiKey',
        label: 'PDL API Key',
        type: 'password',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        required: true,
        helpText: 'Get your API key from your People Data Labs account dashboard.'
      }
    ],
    defaultUsageLimit: 1000,
    usageUnit: 'Profiles'
  },
  {
    id: 'crunchbase',
    name: 'Crunchbase',
    category: 'Lead Providers',
    description: 'Track corporate investment rounds, funding triggers, board updates, and high-growth target startups.',
    iconName: 'Activity',
    authType: 'API_KEY',
    authFields: [
      {
        key: 'apiKey',
        label: 'Crunchbase User Key',
        type: 'password',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        required: true,
        helpText: 'Acquire your CB User Key from Crunchbase Developer settings.'
      }
    ],
    defaultUsageLimit: 1000,
    usageUnit: 'Queries'
  },
  {
    id: 'googlemaps',
    name: 'Google Maps',
    category: 'Lead Providers',
    description: 'Find localized physical businesses, address coordinates, and perform geographic routing search.',
    iconName: 'Globe',
    authType: 'API_KEY',
    authFields: [
      {
        key: 'apiKey',
        label: 'Google Maps API Key',
        type: 'password',
        placeholder: 'AIzaSyxxxxxxxxxxxxxxxxxxxxxxxx',
        required: true,
        helpText: 'Enable Geocoding and Places API in your Google Cloud Platform console.'
      }
    ],
    defaultUsageLimit: 20000,
    usageUnit: 'Requests'
  },
  {
    id: 'serper',
    name: 'Serper API',
    category: 'Lead Providers',
    description: 'Scrape Google Search, News, Images, and Local Map listings to extract real-time search engine data.',
    iconName: 'Globe',
    authType: 'API_KEY',
    authFields: [
      {
        key: 'apiKey',
        label: 'Serper Dev Key',
        type: 'password',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        required: true,
        helpText: 'Create a free account on serper.dev and paste your API key here.'
      }
    ],
    defaultUsageLimit: 5000,
    usageUnit: 'Scrapes'
  },

  // --- CRM ---
  {
    id: 'hubspot',
    name: 'HubSpot CRM',
    category: 'CRM',
    description: 'Synchronize leads, pipeline deal stages, engagement history, and logs to your corporate HubSpot hub.',
    iconName: 'Network',
    authType: 'BOTH',
    authFields: [
      {
        key: 'accessToken',
        label: 'Private App Access Token',
        type: 'password',
        placeholder: 'pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        required: true,
        helpText: 'Create a Private App in your HubSpot Settings > Integrations and grant contact/deal scopes.'
      },
      {
        key: 'portalId',
        label: 'HubSpot Portal ID',
        type: 'text',
        placeholder: '8172639',
        required: false
      }
    ],
    defaultUsageLimit: 50000,
    usageUnit: 'Syncs'
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    category: 'CRM',
    description: 'Sync customer accounts, custom objects, leads, and sales pipelines to your enterprise Salesforce instance.',
    iconName: 'Cloud',
    authType: 'OAUTH',
    authFields: [
      {
        key: 'instanceUrl',
        label: 'Salesforce Instance URL',
        type: 'text',
        placeholder: 'https://na12.salesforce.com',
        required: true,
        helpText: 'Your custom domain or standard instance URL (e.g. login.salesforce.com).'
      },
      {
        key: 'clientId',
        label: 'Connected App Consumer Key',
        type: 'text',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        required: true
      },
      {
        key: 'clientSecret',
        label: 'Consumer Secret',
        type: 'password',
        placeholder: 'xxxxxxxxxxxxxxxxxxxx',
        required: true
      }
    ],
    defaultUsageLimit: 100000,
    usageUnit: 'API Calls'
  },
  {
    id: 'zoho',
    name: 'Zoho CRM',
    category: 'CRM',
    description: 'Export sales opportunities, schedule calls, and record client profiles in your global Zoho account.',
    iconName: 'Briefcase',
    authType: 'OAUTH',
    authFields: [
      {
        key: 'clientId',
        label: 'Zoho Client ID',
        type: 'text',
        placeholder: '1000.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        required: true,
        helpText: 'Obtained from the Zoho Developer Console.'
      },
      {
        key: 'clientSecret',
        label: 'Zoho Client Secret',
        type: 'password',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        required: true
      },
      {
        key: 'domain',
        label: 'Zoho Data Center (TLD)',
        type: 'text',
        placeholder: 'com',
        required: true,
        helpText: 'Use "com", "eu", "in", or "com.cn" depending on your Zoho register region.'
      }
    ],
    defaultUsageLimit: 25000,
    usageUnit: 'Requests'
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    category: 'CRM',
    description: 'A visual, activity-based sales pipeline CRM. Automate contact additions and stage shifts.',
    iconName: 'Layout',
    authType: 'API_KEY',
    authFields: [
      {
        key: 'apiKey',
        label: 'Pipedrive API Token',
        type: 'password',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        required: true,
        helpText: 'Find this token under Pipedrive Settings > Personal preferences > API.'
      },
      {
        key: 'companyDomain',
        label: 'Company Subdomain',
        type: 'text',
        placeholder: 'yourcompany',
        required: true,
        helpText: 'The subdomain of your Pipedrive login url: yourcompany.pipedrive.com'
      }
    ],
    defaultUsageLimit: 20000,
    usageUnit: 'Calls'
  },

  // --- EMAIL ---
  {
    id: 'gmail',
    name: 'Gmail',
    category: 'Email',
    description: 'Dispatches outbound drip sales campaigns, detects threads, analyzes replies, and handles unread alerts.',
    iconName: 'Mail',
    authType: 'OAUTH',
    authFields: [
      {
        key: 'clientId',
        label: 'Google OAuth Client ID',
        type: 'text',
        placeholder: 'xxxxxx-xxxxxxxx.apps.googleusercontent.com',
        required: true,
        helpText: 'Create OAuth Credentials in Google Cloud Console with Gmail scopes enabled.'
      },
      {
        key: 'clientSecret',
        label: 'Google OAuth Client Secret',
        type: 'password',
        placeholder: 'GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx',
        required: true
      }
    ],
    defaultUsageLimit: 1000,
    usageUnit: 'Emails'
  },
  {
    id: 'outlook_email',
    name: 'Outlook Mail',
    category: 'Email',
    description: 'Connect your corporate Microsoft 365 or Outlook inbox to dispatch and parse pipeline threads.',
    iconName: 'Mail',
    authType: 'OAUTH',
    authFields: [
      {
        key: 'clientId',
        label: 'Microsoft App (Client) ID',
        type: 'text',
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        required: true,
        helpText: 'Register an App in Microsoft Azure Portal with Mail.Send and Mail.Read scopes.'
      },
      {
        key: 'clientSecret',
        label: 'Azure Secret Value',
        type: 'password',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxx',
        required: true
      },
      {
        key: 'tenantId',
        label: 'Azure Tenant ID',
        type: 'text',
        placeholder: 'common',
        required: true,
        helpText: 'Use "common" for multi-tenant accounts or your specific Active Directory GUID.'
      }
    ],
    defaultUsageLimit: 1000,
    usageUnit: 'Emails'
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    category: 'Email',
    description: 'High-throughput transactional email server. Ideal for massive newsletters and outbound sequences.',
    iconName: 'Send',
    authType: 'API_KEY',
    authFields: [
      {
        key: 'apiKey',
        label: 'SendGrid API Key',
        type: 'password',
        placeholder: 'SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        required: true,
        helpText: 'Generate an API key with Mail Send permissions inside your SendGrid dashboard.'
      },
      {
        key: 'senderEmail',
        label: 'Verified Sender Email',
        type: 'text',
        placeholder: 'sales@yourdomain.com',
        required: true,
        helpText: 'The sender address must pass SendGrid Single Sender Verification or Domain Authentication.'
      }
    ],
    defaultUsageLimit: 50000,
    usageUnit: 'Dispatches'
  },

  // --- CALENDAR ---
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    category: 'Calendar',
    description: 'Sync active sales consultations, block employee hours, and auto-generate Google Meet conference links.',
    iconName: 'Calendar',
    authType: 'OAUTH',
    authFields: [
      {
        key: 'clientId',
        label: 'Google Client ID',
        type: 'text',
        placeholder: 'xxxxxx-xxxxxxxx.apps.googleusercontent.com',
        required: true,
        helpText: 'Requires Google Calendar API enabled on your GCP project.'
      },
      {
        key: 'clientSecret',
        label: 'Google Client Secret',
        type: 'password',
        placeholder: 'GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx',
        required: true
      }
    ],
    defaultUsageLimit: 1000,
    usageUnit: 'Events'
  },
  {
    id: 'outlook_calendar',
    name: 'Outlook Calendar',
    category: 'Calendar',
    description: 'Sync events, check teammate availability, and auto-book Microsoft Teams invites directly from CRM.',
    iconName: 'Calendar',
    authType: 'OAUTH',
    authFields: [
      {
        key: 'clientId',
        label: 'Microsoft Client ID',
        type: 'text',
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        required: true,
        helpText: 'Registered inside Azure AD console with Calendars.ReadWrite scope.'
      },
      {
        key: 'clientSecret',
        label: 'Microsoft Client Secret',
        type: 'password',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxx',
        required: true
      }
    ],
    defaultUsageLimit: 1000,
    usageUnit: 'Events'
  },
  {
    id: 'calendly',
    name: 'Calendly',
    category: 'Calendar',
    description: 'Track Calendly bookings, parse client answers, and instantly feed them to the SalesPilot lead router.',
    iconName: 'Clock',
    authType: 'API_KEY',
    authFields: [
      {
        key: 'accessToken',
        label: 'Calendly Personal Access Token',
        type: 'password',
        placeholder: 'eyxxxxxxxxxxxxxxxxxxxxxxxx',
        required: true,
        helpText: 'Generate a Personal Access Token in Calendly > Integrations tab.'
      }
    ],
    defaultUsageLimit: 5000,
    usageUnit: 'Polls'
  },

  // --- PAYMENTS ---
  {
    id: 'cashfree',
    name: 'Cashfree Payments',
    category: 'Payments',
    description: 'GST-compliant Indian checkout gateway. Collect subscription fees in Indian Rupees (INR) with ease.',
    iconName: 'CreditCard',
    authType: 'API_KEY',
    authFields: [
      {
        key: 'appId',
        label: 'Cashfree App ID (Merchant Identifier)',
        type: 'text',
        placeholder: 'TEST817293817a92...',
        required: true,
        helpText: 'Acquire App ID from Cashfree Merchant Dashboard under API Keys.'
      },
      {
        key: 'secretKey',
        label: 'Cashfree Secret Key',
        type: 'password',
        placeholder: 'cf_secret_xxxxxxxxxxxxxxxxxxxxxxxx',
        required: true
      },
      {
        key: 'environment',
        label: 'Environment (TEST or PROD)',
        type: 'text',
        placeholder: 'TEST',
        required: true,
        helpText: 'Specify TEST for Sandbox debugging, or PROD for active credit card payments.'
      }
    ],
    defaultUsageLimit: 100000,
    usageUnit: 'INR Volume'
  },

  // --- AI ---
  {
    id: 'openai',
    name: 'OpenAI GPT Suite',
    category: 'AI',
    description: 'Generates bulk sales outreach email copy, evaluates purchase intent, and scores incoming deals.',
    iconName: 'Sparkles',
    authType: 'API_KEY',
    authFields: [
      {
        key: 'apiKey',
        label: 'OpenAI API Key',
        type: 'password',
        placeholder: 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx',
        required: true,
        helpText: 'Retrieve your API key from your OpenAI Developer Platform account settings.'
      },
      {
        key: 'defaultModel',
        label: 'Default Model (e.g. gpt-4o-mini)',
        type: 'text',
        placeholder: 'gpt-4o-mini',
        required: false
      }
    ],
    defaultUsageLimit: 1000000,
    usageUnit: 'Tokens'
  },
  {
    id: 'gemini',
    name: 'Gemini Co-Pilot Suite',
    category: 'AI',
    description: 'Multi-modal research analyst, company website parser, and backup failover LLM router.',
    iconName: 'Brain',
    authType: 'API_KEY',
    authFields: [
      {
        key: 'apiKey',
        label: 'Gemini API Key',
        type: 'password',
        placeholder: 'AIzaSyxxxxxxxxxxxxxxxxxxxxxxxx',
        required: true,
        helpText: 'Create your API key inside Google AI Studio.'
      },
      {
        key: 'defaultModel',
        label: 'Default Model (e.g. gemini-1.5-flash)',
        type: 'text',
        placeholder: 'gemini-1.5-flash',
        required: false
      }
    ],
    defaultUsageLimit: 2000000,
    usageUnit: 'Tokens'
  },

  // --- AUTOMATION ---
  {
    id: 'n8n',
    name: 'n8n.io',
    category: 'Automation',
    description: 'Self-hosted or Cloud node-based workflows. Receive webhooks on events and coordinate CRM records.',
    iconName: 'Network',
    authType: 'API_KEY',
    authFields: [
      {
        key: 'webhookRootUrl',
        label: 'n8n Webhook Root URL',
        type: 'text',
        placeholder: 'https://n8n.yourbrand.com',
        required: true,
        helpText: 'The root address where your active workflows are hosted.'
      },
      {
        key: 'apiKey',
        label: 'n8n API Key (Optional)',
        type: 'password',
        placeholder: 'n8n_api_xxxxxxxxxxxxxxxxxxxxxx',
        required: false
      }
    ],
    defaultUsageLimit: 10000,
    usageUnit: 'Triggers'
  },
  {
    id: 'zapier',
    name: 'Zapier',
    category: 'Automation',
    description: 'Link SalesPilot directly to over 5,000+ app connectors through simple Zapier Webhook nodes.',
    iconName: 'Network',
    authType: 'API_KEY',
    authFields: [
      {
        key: 'webhookUrl',
        label: 'Zapier Webhook Target URL',
        type: 'text',
        placeholder: 'https://hooks.zapier.com/hooks/catch/xxxxxx/yyyyyy/',
        required: true,
        helpText: 'Acquired when you create a "Webhooks by Zapier" Catch Trigger inside a new Zap.'
      }
    ],
    defaultUsageLimit: 5000,
    usageUnit: 'Zaps'
  },
  {
    id: 'make',
    name: 'Make.com',
    category: 'Automation',
    description: 'Build complex automation maps. Trigger scenarios with payload JSON packets from SalesPilot.',
    iconName: 'Network',
    authType: 'API_KEY',
    authFields: [
      {
        key: 'webhookUrl',
        label: 'Make Custom Webhook URL',
        type: 'text',
        placeholder: 'https://hook.us1.make.com/xxxxxxxxxxxxxxxxxxxxxxxx',
        required: true,
        helpText: 'The Webhook listener URL created inside your Make.com scenario.'
      }
    ],
    defaultUsageLimit: 5000,
    usageUnit: 'Triggers'
  },

  // --- COMMUNICATION ---
  {
    id: 'slack',
    name: 'Slack Alerts',
    category: 'Communication',
    description: 'Posts daily lead activities, high-value meeting bookings, and customer transaction wins to Slack feeds.',
    iconName: 'MessageSquare',
    authType: 'API_KEY',
    authFields: [
      {
        key: 'webhookUrl',
        label: 'Slack Incoming Webhook URL',
        type: 'text',
        placeholder: 'https://hooks.slack.com/services/Txxx/Bxxx/Xxxx',
        required: true,
        helpText: 'Add an Incoming Webhook connector app inside your Slack channel settings.'
      },
      {
        key: 'channelName',
        label: 'Default Channel Name',
        type: 'text',
        placeholder: '#sales-alerts',
        required: false
      }
    ],
    defaultUsageLimit: 10000,
    usageUnit: 'Alerts'
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    category: 'Communication',
    description: 'Post notification cards and activity roundups inside your Microsoft Teams work chats.',
    iconName: 'MessageSquare',
    authType: 'API_KEY',
    authFields: [
      {
        key: 'webhookUrl',
        label: 'Teams Incoming Webhook Connector',
        type: 'text',
        placeholder: 'https://yourtenant.webhook.office.com/webhookb2/xxxx...',
        required: true,
        helpText: 'Add a Workflows webhook connector inside your designated Teams Channel.'
      }
    ],
    defaultUsageLimit: 10000,
    usageUnit: 'Alerts'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business API',
    category: 'Communication',
    description: 'Direct WhatsApp message alerts to customers to remind them about consultations or checkout receipts.',
    iconName: 'Smartphone',
    authType: 'API_KEY',
    authFields: [
      {
        key: 'phoneNumberId',
        label: 'Phone Number ID',
        type: 'text',
        placeholder: 'xxxxxxxxxxxxxxx',
        required: true,
        helpText: 'Found on the Getting Started screen of WhatsApp Business Cloud developer panel.'
      },
      {
        key: 'accessToken',
        label: 'Permanent System Access Token',
        type: 'password',
        placeholder: 'EAABxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        required: true,
        helpText: 'Generate a Permanent Access Token under Meta Business Manager settings.'
      },
      {
        key: 'businessAccountId',
        label: 'WhatsApp Business Account ID',
        type: 'text',
        placeholder: 'xxxxxxxxxxxxxxx',
        required: true
      }
    ],
    defaultUsageLimit: 2000,
    usageUnit: 'Messages'
  }
];
