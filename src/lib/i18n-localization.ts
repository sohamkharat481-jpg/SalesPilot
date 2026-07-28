export type SupportedLanguage = 'en' | 'es' | 'de' | 'fr' | 'hi' | 'ja' | 'zh' | 'pt';
export type SupportedCurrency = 'USD' | 'EUR' | 'GBP' | 'INR' | 'JPY' | 'AUD' | 'CAD';

export interface TranslationDictionary {
  [key: string]: {
    [lang in SupportedLanguage]: string;
  };
}

export const DICTIONARY: TranslationDictionary = {
  appName: {
    en: 'SalesPilot Enterprise OS',
    es: 'SalesPilot Sistema Operativo Enterprise',
    de: 'SalesPilot Enterprise Vertriebs-BS',
    fr: 'SalesPilot Système d\'Exploitation Enterprise',
    hi: 'सेल्सपायलट एंटरप्राइज ऑपरेटिंग सिस्टम',
    ja: 'SalesPilot エンタープライズ OS',
    zh: 'SalesPilot 企业级销售操作系统',
    pt: 'SalesPilot Sistema Operacional Enterprise'
  },
  dashboardTitle: {
    en: 'Executive Sales Command Center',
    es: 'Centro de Comando de Ventas Ejecutivas',
    de: 'Vorstands-Vertriebssteuerungszentrale',
    fr: 'Centre de Commandement des Ventes',
    hi: 'कार्यकारी बिक्री कमांड सेंटर',
    ja: 'エグゼクティブ セールス コマンド センター',
    zh: '高管销售指挥中心',
    pt: 'Centro de Comando de Vendas Executivas'
  },
  leadsHeader: {
    en: 'Lead Intelligence Engine',
    es: 'Motor de Inteligencia de Clientes Potenciales',
    de: 'Lead-Intelligence-Engine',
    fr: 'Moteur d\'Intelligence des Prospects',
    hi: 'लीड इंटेलिजेंस इंजन',
    ja: 'リード インテリジェンス エンジン',
    zh: '线索智能引擎',
    pt: 'Motor de Inteligência de Leads'
  },
  aiSdrTitle: {
    en: 'AI SDR Autonomous Agent',
    es: 'Agente Autónomo AI SDR',
    de: 'Autonomer AI-SDR-Agent',
    fr: 'Agent Autonome AI SDR',
    hi: 'एआई एसडीआर स्वायत्त एजेंट',
    ja: 'AI SDR 自律型エージェント',
    zh: 'AI SDR 自主智能体',
    pt: 'Agente Autônomo AI SDR'
  },
  workflowBuilder: {
    en: 'Enterprise Workflow Automation',
    es: 'Automatización de Flujos de Trabajo Enterprise',
    de: 'Enterprise-Workflow-Automatisierung',
    fr: 'Automatisation des Flux de Travail Enterprise',
    hi: 'एंटरप्राइज वर्कफ़्लो स्वचालन',
    ja: 'エンタープライズ ワークフローの自動化',
    zh: '企业工作流自动化',
    pt: 'Automação de Fluxo de Trabalho Enterprise'
  },
  pricingTitle: {
    en: 'Flexible Enterprise Plans & Credits',
    es: 'Planes y Créditos Flexibles para Empresas',
    de: 'Flexible Enterprise-Pläne & Guthaben',
    fr: 'Forfaits et Crédits Entreprise Flexibles',
    hi: 'लचीली एंटरप्राइज योजनाएं और क्रेडिट',
    ja: 'フレキシブルなエンタープライズプランとクレジット',
    zh: '灵活的企业方案与点数',
    pt: 'Planos e Créditos Enterprise Flexíveis'
  }
};

class I18nLocalizationService {
  private currentLang: SupportedLanguage = 'en';
  private currentCurrency: SupportedCurrency = 'USD';
  private currentTimezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  constructor() {
    const savedLang = localStorage.getItem('salespilot_i18n_lang') as SupportedLanguage;
    const savedCurr = localStorage.getItem('salespilot_i18n_curr') as SupportedCurrency;
    if (savedLang) this.currentLang = savedLang;
    if (savedCurr) this.currentCurrency = savedCurr;
  }

  public setLanguage(lang: SupportedLanguage) {
    this.currentLang = lang;
    localStorage.setItem('salespilot_i18n_lang', lang);
  }

  public getLanguage(): SupportedLanguage {
    return this.currentLang;
  }

  public setCurrency(curr: SupportedCurrency) {
    this.currentCurrency = curr;
    localStorage.setItem('salespilot_i18n_curr', curr);
  }

  public getCurrency(): SupportedCurrency {
    return this.currentCurrency;
  }

  public t(key: string, fallback?: string): string {
    if (DICTIONARY[key] && DICTIONARY[key][this.currentLang]) {
      return DICTIONARY[key][this.currentLang];
    }
    return fallback || key;
  }

  public formatCurrency(amount: number): string {
    const rates: Record<SupportedCurrency, number> = {
      USD: 1,
      EUR: 0.92,
      GBP: 0.78,
      INR: 83.5,
      JPY: 155.0,
      AUD: 1.52,
      CAD: 1.37
    };

    const symbols: Record<SupportedCurrency, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      INR: '₹',
      JPY: '¥',
      AUD: 'A$',
      CAD: 'C$'
    };

    const converted = amount * (rates[this.currentCurrency] || 1);
    const symbol = symbols[this.currentCurrency] || '$';

    if (this.currentCurrency === 'INR') {
      return `${symbol}${converted.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    }
    if (this.currentCurrency === 'JPY') {
      return `${symbol}${Math.round(converted).toLocaleString()}`;
    }

    return `${symbol}${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  public formatDateTime(dateInput: string | Date): string {
    const d = new Date(dateInput);
    return new Intl.DateTimeFormat(this.currentLang === 'hi' ? 'hi-IN' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: this.currentTimezone
    }).format(d);
  }

  public generateStructuredSchema() {
    return {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'SalesPilot AI Enterprise OS',
      operatingSystem: 'Web, iOS, Android',
      applicationCategory: 'BusinessApplication',
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: this.currentCurrency,
        price: '49.00',
        highPrice: '499.00',
        offerCount: '4'
      },
      creator: {
        '@type': 'Organization',
        name: 'Horizon Media & SalesPilot Inc.',
        url: 'https://salespilot.ai'
      }
    };
  }
}

export const i18n = new I18nLocalizationService();
