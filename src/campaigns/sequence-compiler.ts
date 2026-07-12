/**
 * Outbound Outreach Personalizer
 * Compiles dynamic templates substituting client-specific properties.
 */
export class SequenceCompiler {
  /**
   * Replaces placeholders formatted as {field_name} with lead properties.
   */
  public static compileTemplate(template: string, lead: { firstName: string; company: string; title?: string }): string {
    if (!template) return '';
    
    let compiled = template;
    
    // Replace standard tags
    compiled = compiled.replace(/{first_name}/gi, lead.firstName || 'there');
    compiled = compiled.replace(/{company}/gi, lead.company || 'your company');
    compiled = compiled.replace(/{title}/gi, lead.title || 'Director');
    
    // Safety check for leftover template tags
    compiled = compiled.replace(/{[a-zA-Z0-9_-]+}/g, '');

    return compiled;
  }
}
