import { AiOutreachProfile } from '../types';

export function getDefaultAiOutreachProfile(organizationId: string, companyName?: string): AiOutreachProfile {
  return {
    organizationId,
    businessName: companyName || '',
    businessDescription: '',
    productsServices: '',
    targetIcp: '',
    targetIndustries: [],
    targetRoles: [],
    painPoints: [],
    valueProposition: '',
    keyDifferentiators: '',
    offer: '',
    preferredCta: 'Open to a quick 5-minute introductory call this week?',
    toneOfVoice: 'Professional, consultative and value-focused',
    additionalInstructions: 'Keep emails concise (3-4 sentences), personalize using the lead company and industry, and avoid aggressive sales jargon.',
    isConfigured: false
  };
}

export function formatBusinessContextForPrompt(profile: AiOutreachProfile | null | undefined): string {
  if (!profile || !profile.isConfigured && !profile.businessName?.trim()) {
    return `[BUSINESS CONTEXT: Not configured by user. Use neutral consultative B2B approach tailored strictly to the lead's domain. Do NOT assume the sender is SalesPilot unless explicitly specified.]`;
  }

  const sections: string[] = [];
  if (profile.businessName) sections.push(`- Sender Company/Brand: ${profile.businessName}`);
  if (profile.businessDescription) sections.push(`- Business Overview: ${profile.businessDescription}`);
  if (profile.productsServices) sections.push(`- Products & Services Offered: ${profile.productsServices}`);
  if (profile.valueProposition) sections.push(`- Core Value Proposition: ${profile.valueProposition}`);
  if (profile.keyDifferentiators) sections.push(`- Key Differentiators / Competitive Edge: ${profile.keyDifferentiators}`);
  if (profile.targetIcp) sections.push(`- Target Customer Profile (ICP): ${profile.targetIcp}`);
  if (profile.painPoints && profile.painPoints.length > 0) {
    sections.push(`- Client Pain Points Solved: ${Array.isArray(profile.painPoints) ? profile.painPoints.join('; ') : profile.painPoints}`);
  }
  if (profile.offer) sections.push(`- Specific Value Offer / Incentive: ${profile.offer}`);
  if (profile.preferredCta) sections.push(`- Preferred Call to Action (CTA): ${profile.preferredCta}`);
  if (profile.toneOfVoice) sections.push(`- Brand Voice & Tone: ${profile.toneOfVoice}`);
  if (profile.additionalInstructions) sections.push(`- Custom Copywriting Rules: ${profile.additionalInstructions}`);

  return `=== SENDER BUSINESS PROFILE & COMMERCIAL CONTEXT ===\n${sections.join('\n')}\n=====================================================`;
}
