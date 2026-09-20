import { Lead, LeadGenJob, LeadNote, LeadTimelineEvent } from '../types';
import { validateWebsite, calculateLeadScore, buildDynamicSearchQuery, LeadProviderRegistry, isGenericCompanyName } from './leadProviders';

export interface LeadGenWorkerContext {
  getJobById: (jobId: string, orgId: string) => Promise<LeadGenJob | null>;
  claimJob: (jobId: string, orgId: string, staleTimeoutMs?: number) => Promise<LeadGenJob | null>;
  updateJob: (jobId: string, updates: Partial<LeadGenJob>, orgId: string) => Promise<boolean>;
  getLeads: (orgId: string) => Promise<Lead[]>;
  insertLead: (lead: Lead & { organizationId: string }) => Promise<Lead>;
  triggerOutreachAutomation?: (leadId: string) => void;
  getProviderCredentials?: () => Record<string, any>;
}

export class LeadGenWorker {
  private context: LeadGenWorkerContext;

  constructor(context: LeadGenWorkerContext) {
    this.context = context;
  }

  public setContext(context: LeadGenWorkerContext): void {
    this.context = context;
  }

  /**
   * Enqueue / trigger a job for execution.
   * Persists search criteria in durable database storage, then triggers processing.
   */
  public async enqueueJob(job: LeadGenJob, criteria?: any): Promise<LeadGenJob | null> {
    if (!job || !job.jobId || !job.organizationId) {
      console.error('[LEAD WORKER] Cannot enqueue invalid job:', job);
      return null;
    }

    if (criteria) {
      await this.context.updateJob(job.jobId, { criteria }, job.organizationId);
    }

    return this.processJob(job.jobId, job.organizationId, criteria);
  }

  /**
   * Process a single job with database-backed atomic claiming, stale lock stealing, and strict tenant isolation.
   * Resumable across multiple serverless instances and worker lifecycles.
   */
  public async processJob(
    jobId: string, 
    organizationId: string, 
    criteriaOverride?: any
  ): Promise<LeadGenJob | null> {
    if (!jobId || !organizationId) {
      console.warn('[LEAD WORKER] Missing jobId or organizationId for processing.');
      return null;
    }

    // 1. Atomically claim the job in the database (handles stale locks from crashed instances)
    const claimedJob = await this.context.claimJob(jobId, organizationId, 120000); // 2 min lock timeout
    if (!claimedJob) {
      console.log(`[LEAD WORKER] Job ${jobId} for org ${organizationId} could not be claimed (already running on another instance, completed, or access denied).`);
      return await this.context.getJobById(jobId, organizationId);
    }

    try {
      // 2. Resolve search criteria (persisted in DB or passed override)
      const criteria = criteriaOverride || claimedJob.criteria || {};
      const totalWanted = Math.min(Number(claimedJob.total) || Number(criteria.maxLeads) || 10, 50);
      const alreadyCreated = Number(claimedJob.created) || 0;

      if (alreadyCreated >= totalWanted) {
        console.log(`[LEAD WORKER] Job ${jobId} already reached target lead count (${alreadyCreated}/${totalWanted}). Marking COMPLETED.`);
        await this.context.updateJob(jobId, {
          status: 'COMPLETED',
          progress: 100,
          created: alreadyCreated,
          processed: claimedJob.processed || alreadyCreated,
          errorMessage: null,
          updatedAt: new Date().toISOString()
        }, organizationId);
        return await this.context.getJobById(jobId, organizationId);
      }

      const countToGenerate = totalWanted - alreadyCreated;
      const campaignName = criteria.campaignName || 'Lead Generation';

      if (criteria.simulateFailure || criteria.simulateError || String(campaignName).includes('Failure Diagnostic')) {
        throw new Error('SIMULATED_GEMINI_QUOTA_EXCEEDED: Resource exhausted for tenant');
      }
      const industry = criteria.industry || 'Software';
      const country = criteria.country || 'India';
      const city = criteria.city || 'Bengaluru';
      const keywords = criteria.keywords || '';
      const jobTitles = criteria.jobTitles || 'Managing Director, Founder, CEO, Manager';
      const customApiKey = criteria.customApiKey;
      const providerId = criteria.providerId || 'google-maps';

      const pluginCreds = this.context.getProviderCredentials ? this.context.getProviderCredentials() : {};

      const getProviderKey = (id: string): string | null => {
        if (id === 'google-maps' || id === 'googlemaps') {
          const k = process.env.GOOGLE_MAPS_API_KEY || 
                    process.env.GOOGLE_PLACES_API_KEY || 
                    process.env.GOOGLE_MAPS_KEY || 
                    process.env.GOOGLE_API_KEY || 
                    process.env.VITE_GOOGLE_MAPS_API_KEY || 
                    pluginCreds?.['googlemaps']?.apiKey;
          return k ? String(k).trim().replace(/^["']|["']$/g, '') : null;
        }
        if (id === 'google-search' || id === 'serper') {
          const k = process.env.SERPER_API_KEY || 
                    process.env.SERPER_KEY || 
                    process.env.SERPER_API || 
                    process.env.VITE_SERPER_API_KEY || 
                    pluginCreds?.['serper']?.apiKey;
          return k ? String(k).trim().replace(/^["']|["']$/g, '') : null;
        }
        if (id === 'peopledatalabs') {
          const k = process.env.PDL_API_KEY || pluginCreds?.['peopledatalabs']?.apiKey;
          return k ? String(k).trim().replace(/^["']|["']$/g, '') : null;
        }
        if (id === 'clearbit') {
          const k = process.env.CLEARBIT_API_KEY || pluginCreds?.['clearbit']?.apiKey;
          return k ? String(k).trim().replace(/^["']|["']$/g, '') : null;
        }
        if (id === 'hunter') {
          const k = process.env.HUNTER_API_KEY || pluginCreds?.['hunter']?.apiKey;
          return k ? String(k).trim().replace(/^["']|["']$/g, '') : null;
        }
        if (id === 'crunchbase') {
          const k = process.env.CRUNCHBASE_API_KEY || pluginCreds?.['crunchbase']?.apiKey;
          return k ? String(k).trim().replace(/^["']|["']$/g, '') : null;
        }
        if (id === 'linkedin-extractor') {
          const k = process.env.LINKEDIN_SCRAPER_API_KEY || pluginCreds?.['linkedin']?.apiKey;
          return k ? String(k).trim().replace(/^["']|["']$/g, '') : null;
        }
        return null;
      };

      const gmapsKey = getProviderKey('google-maps') || (customApiKey ? String(customApiKey).trim().replace(/^["']|["']$/g, '') : undefined);
      const serperKey = getProviderKey('google-search') || ((providerId === 'serper' || providerId === 'google-search') && customApiKey ? String(customApiKey).trim().replace(/^["']|["']$/g, '') : undefined);

      // 3. Fetch existing leads for tenant to prevent duplicate insertions
      const existingLeads = await this.context.getLeads(organizationId);
      const seenCompanies = new Set<string>();
      const seenWebsites = new Set<string>();
      const seenEmails = new Set<string>();

      const normalizeString = (str: string): string => {
        if (!str) return '';
        return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
      };

      existingLeads.forEach(l => {
        if (l.company) seenCompanies.add(normalizeString(l.company));
        if (l.enrichment?.website) seenWebsites.add(normalizeString(l.enrichment.website));
        if (l.email) seenEmails.add(normalizeString(l.email));
      });

      const candidates: any[] = [];
      const addCandidate = (cand: any): boolean => {
        const normCompany = normalizeString(cand.company);
        const normWebsite = normalizeString(cand.website);
        if (normCompany && seenCompanies.has(normCompany)) return false;
        if (normWebsite && seenWebsites.has(normWebsite)) return false;
        if (normCompany) seenCompanies.add(normCompany);
        if (normWebsite) seenWebsites.add(normWebsite);
        candidates.push(cand);
        return true;
      };

      const currentProgressBase = Math.min(25, Math.floor((alreadyCreated / totalWanted) * 100));
      await this.context.updateJob(jobId, { progress: Math.max(10, currentProgressBase) }, organizationId);

      // 4. Query Sourcing Providers
      const query = buildDynamicSearchQuery({ industry, keywords, city, country });
      console.log(`[LEAD WORKER] Sourcing candidates with query: "${query}" (Remaining needed: ${countToGenerate})`);

      // 4a. Try Google Places API (New)
      if (gmapsKey) {
        try {
          const textSearchUrl = 'https://places.googleapis.com/v1/places:searchText';
          const response = await fetch(textSearchUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': gmapsKey,
              'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.websiteUri,places.nationalPhoneNumber,places.internationalPhoneNumber,places.primaryType,places.rating'
            },
            body: JSON.stringify({ textQuery: query })
          });
          if (response.ok) {
            const data = await response.json();
            const places = data.places || [];
            for (const place of places) {
              addCandidate({
                source: 'Google Places API (New)',
                company: place.displayName?.text || place.displayName || '',
                website: place.websiteUri || '',
                phone: place.nationalPhoneNumber || place.internationalPhoneNumber || '',
                address: place.formattedAddress || `${city}, ${country}`,
                lat: place.location?.latitude,
                lng: place.location?.longitude,
                placeId: place.id
              });
            }
          }
        } catch (err) {
          console.warn('[LEAD WORKER] Google Places API fetch error:', err);
        }
      }

      await this.context.updateJob(jobId, { progress: Math.max(25, currentProgressBase) }, organizationId);

      // 4b. Try Serper Maps API if more candidates needed
      if (candidates.length < countToGenerate && serperKey) {
        try {
          const serperMapsUrl = 'https://google.serper.dev/maps';
          const response = await fetch(serperMapsUrl, {
            method: 'POST',
            headers: {
              'X-API-KEY': serperKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ q: query, num: Math.min(countToGenerate * 3, 20) })
          });
          if (response.ok) {
            const data = await response.json();
            const serperPlaces = data.maps || data.places || data.organic || [];
            for (const p of serperPlaces) {
              addCandidate({
                source: 'Serper Maps API',
                company: p.title || p.name || p.company || '',
                website: p.website || p.link || '',
                phone: p.phoneNumber || p.phone || '',
                address: p.address || p.formattedAddress || `${city}, ${country}`,
                lat: p.latitude,
                lng: p.longitude,
                placeId: p.placeId || p.cid || ''
              });
            }
          }
        } catch (err) {
          console.warn('[LEAD WORKER] Serper Maps fetch error:', err);
        }
      }

      // 4c. Try pluggable registered providers if still needed
      if (candidates.length < countToGenerate) {
        const registered = LeadProviderRegistry.getProvider(providerId);
        if (registered && registered.id !== 'google-maps' && registered.id !== 'google-search') {
          try {
            const extra = await registered.generateLeads({
              campaignName,
              country,
              industry,
              keywords,
              jobTitles,
              maxLeads: countToGenerate,
              city,
              customApiKey
            });
            for (const cand of extra) {
              if (cand.company) {
                addCandidate({
                  source: registered.name,
                  company: cand.company,
                  website: cand.enrichment?.website || '',
                  phone: cand.phone || '',
                  address: cand.enrichment?.address || `${city}, ${country}`
                });
              }
            }
          } catch (err) {
            console.warn(`[LEAD WORKER] Provider ${registered.name} error:`, err);
          }
        }
      }

      await this.context.updateJob(jobId, { progress: Math.max(50, currentProgressBase) }, organizationId);

      // 5. Validate websites, build enriched leads, and persist step-by-step
      let createdCount = alreadyCreated;
      let skippedCount = Number(claimedJob.skipped) || 0;
      let processedCount = Number(claimedJob.processed) || 0;

      const candidatesToProcess = candidates.slice(0, countToGenerate * 2);
      const totalToProcess = candidatesToProcess.length;

      for (let i = 0; i < totalToProcess && createdCount < totalWanted; i++) {
        const cand = candidatesToProcess[i];
        processedCount++;

        // 1. Reject generic / non-identifying company names
        if (!cand.company || isGenericCompanyName(cand.company)) {
          console.log(`[LEAD WORKER] Candidate discarded: generic or missing company name "${cand.company || 'Unnamed'}"`);
          skippedCount++;
          await this.context.updateJob(jobId, {
            processed: processedCount,
            skipped: skippedCount,
            updatedAt: new Date().toISOString()
          }, organizationId);
          continue;
        }

        // 2. Strict website requirement & validation (NO company.com placeholder synthesis)
        if (!cand.website || typeof cand.website !== 'string' || !cand.website.trim()) {
          console.log(`[LEAD WORKER] Candidate "${cand.company}" discarded: missing website URL`);
          skippedCount++;
          await this.context.updateJob(jobId, {
            processed: processedCount,
            skipped: skippedCount,
            updatedAt: new Date().toISOString()
          }, organizationId);
          continue;
        }

        const valResult = await validateWebsite(cand.website);
        if (!valResult.isValid || !valResult.domain) {
          console.log(`[LEAD WORKER] Candidate "${cand.company}" discarded: website validation failed (${valResult.reason})`);
          skippedCount++;
          await this.context.updateJob(jobId, {
            processed: processedCount,
            skipped: skippedCount,
            updatedAt: new Date().toISOString()
          }, organizationId);
          continue;
        }

        const websiteDomain = valResult.domain;
        const companyClean = cand.company.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

        // 3. Email resolution: Use real provider email if present, or verified domain email
        const email = cand.email ? cand.email.trim() : (websiteDomain ? `contact@${websiteDomain.replace(/^www\./, '')}` : '');

        if (email && seenEmails.has(normalizeString(email))) {
          console.log(`[LEAD WORKER] Candidate "${cand.company}" discarded: duplicate email "${email}"`);
          skippedCount++;
          await this.context.updateJob(jobId, {
            processed: processedCount,
            skipped: skippedCount,
            updatedAt: new Date().toISOString()
          }, organizationId);
          continue;
        }
        if (email) {
          seenEmails.add(normalizeString(email));
        }

        const leadScoreResult = calculateLeadScore({
          company: cand.company,
          phone: cand.phone,
          enrichment: {
            industry,
            website: cand.website,
            address: cand.address
          }
        });

        const newLeadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const noteItem: LeadNote = {
          id: `note_${Date.now()}`,
          text: `Sourced asynchronously via background job ${jobId}. Provider: ${cand.source}. Sourcing query: "${query}".`,
          createdAt: new Date().toISOString()
        };
        const timelineItem: LeadTimelineEvent = {
          id: `time_${Date.now()}`,
          event: 'Lead Sourced Asynchronously',
          details: `Generated via background worker job ${jobId}.`,
          createdAt: new Date().toISOString()
        };

        const leadRecord: Lead & { organizationId: string } = {
          id: newLeadId,
          organizationId: organizationId,
          firstName: cand.firstName || '',
          lastName: cand.lastName || '',
          title: cand.title || '',
          email: email || '',
          phone: cand.phone || '',
          company: cand.company,
          status: 'NEW',
          source: cand.source || 'Lead Engine AI Worker',
          leadScore: leadScoreResult.score,
          confidenceScore: leadScoreResult.numericScore,
          scoreReason: leadScoreResult.reason,
          tags: [industry, country, 'AI Verified', 'Async Sourced'].filter(Boolean),
          notesList: [noteItem],
          timelineList: [timelineItem],
          tasksList: [],
          enrichment: {
            industry,
            country,
            website: cand.website,
            address: cand.address || `${city}, ${country}`,
            companySize: criteria.employeeRange || '',
            annualRevenue: criteria.revenueRange || '',
            socialLinks: cand.enrichment?.socialLinks || (companyClean ? [`https://linkedin.com/company/${companyClean}`] : [])
          },
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };

        try {
          const inserted = await this.context.insertLead(leadRecord);
          createdCount++;
          if (this.context.triggerOutreachAutomation && inserted.id) {
            this.context.triggerOutreachAutomation(inserted.id);
          }
        } catch (insErr: any) {
          if (insErr?.code === '23505' || String(insErr?.message).includes('duplicate')) {
            console.log(`[LEAD WORKER] Concurrent duplicate caught by database constraint for company "${cand.company}". Skipping.`);
          } else {
            console.error(`[LEAD WORKER] Failed to insert lead for company "${cand.company}":`, insErr);
          }
          skippedCount++;
        }

        // Calculate progress based on created leads towards target
        const currentProgress = Math.min(Math.floor((createdCount / totalWanted) * 100), 98);
        await this.context.updateJob(jobId, {
          progress: currentProgress,
          processed: processedCount,
          created: createdCount,
          skipped: skippedCount,
          updatedAt: new Date().toISOString()
        }, organizationId);
      }

      // 6. Transition state to COMPLETED
      console.log(`[LEAD WORKER] Job ${jobId} finished. Created: ${createdCount}/${totalWanted}, Skipped: ${skippedCount}, Processed: ${processedCount}.`);
      
      await this.context.updateJob(jobId, {
        status: 'COMPLETED',
        progress: 100,
        processed: processedCount,
        created: createdCount,
        skipped: skippedCount,
        errorMessage: null,
        updatedAt: new Date().toISOString()
      }, organizationId);

      return await this.context.getJobById(jobId, organizationId);

    } catch (error: any) {
      console.error(`[LEAD WORKER] Error executing job ${jobId}:`, error);
      await this.context.updateJob(jobId, {
        status: 'FAILED',
        errorMessage: error.message || String(error),
        updatedAt: new Date().toISOString()
      }, organizationId);
      return await this.context.getJobById(jobId, organizationId);
    }
  }
}
