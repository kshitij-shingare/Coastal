/**
 * Language Processing Service
 * 
 * Text analysis, language detection, and multilingual support.
 * Validates: Requirements 7.4
 */

import { logger } from '../../utils/logger';

// Language detection patterns (simplified)
const LANGUAGE_PATTERNS: Record<string, RegExp[]> = {
  hi: [/[\u0900-\u097F]/, /है|का|की|के|में|से|को|और|एक|यह/], // Hindi
  ta: [/[\u0B80-\u0BFF]/, /இது|என்று|ஒரு|அது|இந்த/], // Tamil
  te: [/[\u0C00-\u0C7F]/, /ఇది|అది|ఒక|మరియు/], // Telugu
  ml: [/[\u0D00-\u0D7F]/, /ഇത്|അത്|ഒരു|എന്ന്/], // Malayalam
  bn: [/[\u0980-\u09FF]/, /এই|একটি|এবং|যে|তার/], // Bengali
  gu: [/[\u0A80-\u0AFF]/, /આ|એક|અને|છે|તે/], // Gujarati
  mr: [/[\u0900-\u097F]/, /हे|आहे|एक|आणि|त्या/], // Marathi (uses Devanagari)
  or: [/[\u0B00-\u0B7F]/, /ଏହା|ଏକ|ଏବଂ|ସେ/], // Odia
  en: [/^[a-zA-Z\s.,!?'"()-]+$/], // English
};

// Common coastal hazard terms in multiple languages
const HAZARD_TERMS: Record<string, Record<string, string[]>> = {
  flooding: {
    en: ['flood', 'flooding', 'inundation', 'waterlogged'],
    hi: ['बाढ़', 'जलभराव', 'पानी भर गया'],
    ta: ['வெள்ளம்', 'நீர் பெருக்கு'],
    te: ['వరదలు', 'నీటి ముంపు'],
  },
  storm_surge: {
    en: ['storm surge', 'surge', 'storm tide'],
    hi: ['तूफान लहर', 'समुद्री तूफान'],
    ta: ['புயல் அலை', 'கடல் புயல்'],
  },
  high_waves: {
    en: ['high waves', 'rough sea', 'big waves'],
    hi: ['ऊंची लहरें', 'तेज लहरें'],
    ta: ['பெரிய அலைகள்', 'கடல் கொந்தளிப்பு'],
  },
  erosion: {
    en: ['erosion', 'eroding', 'coastal erosion'],
    hi: ['कटाव', 'तटीय कटाव'],
    ta: ['அரிப்பு', 'கடற்கரை அரிப்பு'],
  },
};

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  script?: string;
}

export interface TextAnalysisResult {
  language: LanguageDetectionResult;
  wordCount: number;
  sentenceCount: number;
  keywords: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  urgencyLevel?: 'low' | 'medium' | 'high';
}


/**
 * Detect language of input text
 */
export function detectLanguage(text: string): LanguageDetectionResult {
  if (!text || text.trim().length === 0) {
    return { language: 'en', confidence: 0 };
  }

  const cleanText = text.trim();
  let bestMatch = { language: 'en', confidence: 0.5, script: 'Latin' };

  for (const [lang, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
    let matchScore = 0;
    for (const pattern of patterns) {
      if (pattern.test(cleanText)) {
        matchScore += 1;
      }
    }
    
    const confidence = matchScore / patterns.length;
    if (confidence > bestMatch.confidence) {
      bestMatch = {
        language: lang,
        confidence: Math.min(confidence + 0.3, 1),
        script: getScriptName(lang),
      };
    }
  }

  return bestMatch;
}

function getScriptName(lang: string): string {
  const scripts: Record<string, string> = {
    hi: 'Devanagari',
    mr: 'Devanagari',
    ta: 'Tamil',
    te: 'Telugu',
    ml: 'Malayalam',
    bn: 'Bengali',
    gu: 'Gujarati',
    or: 'Odia',
    en: 'Latin',
  };
  return scripts[lang] || 'Unknown';
}

/**
 * Extract keywords from text
 */
export function extractKeywords(text: string, language: string = 'en'): string[] {
  const words = text.toLowerCase().split(/\s+/);
  const keywords: string[] = [];

  // Check for hazard-related terms
  for (const [hazardType, translations] of Object.entries(HAZARD_TERMS)) {
    const terms = translations[language] || translations['en'] || [];
    for (const term of terms) {
      if (text.toLowerCase().includes(term.toLowerCase())) {
        keywords.push(hazardType);
        break;
      }
    }
  }

  // Extract location-related words
  const locationPatterns = /(?:near|at|in|around)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;
  let match;
  while ((match = locationPatterns.exec(text)) !== null) {
    keywords.push(`location:${match[1]}`);
  }

  // Extract urgency indicators
  const urgencyWords = ['urgent', 'emergency', 'immediate', 'critical', 'help', 'danger'];
  for (const word of urgencyWords) {
    if (words.includes(word)) {
      keywords.push(`urgency:${word}`);
    }
  }

  return [...new Set(keywords)];
}

/**
 * Determine urgency level from text
 */
export function determineUrgency(text: string): 'low' | 'medium' | 'high' {
  const lowerText = text.toLowerCase();
  
  const highUrgencyTerms = ['emergency', 'urgent', 'immediate', 'critical', 'life-threatening', 'evacuate', 'help', 'sos', 'danger'];
  const mediumUrgencyTerms = ['warning', 'alert', 'caution', 'concern', 'rising', 'increasing'];
  
  if (highUrgencyTerms.some(term => lowerText.includes(term))) {
    return 'high';
  }
  
  if (mediumUrgencyTerms.some(term => lowerText.includes(term))) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Analyze text comprehensively
 */
export function analyzeText(text: string): TextAnalysisResult {
  const language = detectLanguage(text);
  const keywords = extractKeywords(text, language.language);
  const urgencyLevel = determineUrgency(text);

  // Count words and sentences
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  // Simple sentiment analysis
  const positiveWords = ['safe', 'clear', 'improving', 'better', 'resolved'];
  const negativeWords = ['danger', 'threat', 'damage', 'destroyed', 'severe', 'critical'];
  
  const positiveCount = positiveWords.filter(w => text.toLowerCase().includes(w)).length;
  const negativeCount = negativeWords.filter(w => text.toLowerCase().includes(w)).length;
  
  let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (negativeCount > positiveCount) sentiment = 'negative';
  else if (positiveCount > negativeCount) sentiment = 'positive';

  return {
    language,
    wordCount: words.length,
    sentenceCount: sentences.length,
    keywords,
    sentiment,
    urgencyLevel,
  };
}

/**
 * Translate hazard type to local language (for display)
 */
export function translateHazardType(hazardType: string, targetLanguage: string): string {
  const translations: Record<string, Record<string, string>> = {
    flooding: { hi: 'बाढ़', ta: 'வெள்ளம்', te: 'వరదలు', en: 'Flooding' },
    storm_surge: { hi: 'तूफान लहर', ta: 'புயல் அலை', te: 'తుఫాను అలలు', en: 'Storm Surge' },
    high_waves: { hi: 'ऊंची लहरें', ta: 'பெரிய அலைகள்', te: 'పెద్ద అలలు', en: 'High Waves' },
    erosion: { hi: 'कटाव', ta: 'அரிப்பு', te: 'కోత', en: 'Erosion' },
    rip_current: { hi: 'रिप करंट', ta: 'ரிப் கரண்ட்', te: 'రిప్ కరెంట్', en: 'Rip Current' },
    tsunami: { hi: 'सुनामी', ta: 'சுனாமி', te: 'సునామి', en: 'Tsunami' },
    pollution: { hi: 'प्रदूषण', ta: 'மாசு', te: 'కాలుష్యం', en: 'Pollution' },
    other: { hi: 'अन्य', ta: 'மற்றவை', te: 'ఇతర', en: 'Other' },
  };

  return translations[hazardType]?.[targetLanguage] || translations[hazardType]?.['en'] || hazardType;
}

export const languageProcessingService = {
  detectLanguage,
  extractKeywords,
  determineUrgency,
  analyzeText,
  translateHazardType,
};

export default languageProcessingService;
