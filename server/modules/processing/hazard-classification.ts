/**
 * Hazard Classification Service
 * 
 * AI-powered classification of hazard reports using OpenAI.
 * Validates: Requirements 7.1, 7.2, 7.3, 7.5
 */

import { logger } from '../../utils/logger';
import { HazardType, SeverityLevel, Report } from '../../../shared/types/report';

// Classification result interface
export interface ClassificationResult {
  hazardType: HazardType;
  severity: SeverityLevel;
  confidence: number;
  reasoning?: string;
  keywords?: string[];
  suggestedActions?: string[];
}

// OpenAI configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
const DEMO_MODE = process.env.DEMO_MODE === 'true';

// Hazard type keywords for fallback classification
const HAZARD_KEYWORDS: Record<HazardType, string[]> = {
  flooding: ['flood', 'water', 'submerged', 'inundation', 'overflow', 'waterlogged', 'rising water'],
  storm_surge: ['storm surge', 'surge', 'storm tide', 'coastal storm', 'cyclone surge'],
  high_waves: ['wave', 'high wave', 'rough sea', 'swell', 'breaker', 'surf'],
  erosion: ['erosion', 'eroding', 'cliff', 'collapse', 'landslide', 'washout', 'undermining'],
  rip_current: ['rip current', 'rip tide', 'undertow', 'current', 'pull', 'swimmer'],
  tsunami: ['tsunami', 'tidal wave', 'seismic wave', 'earthquake wave'],
  pollution: ['pollution', 'oil', 'spill', 'contamination', 'debris', 'waste', 'sewage'],
  other: [],
};

// Severity indicators
const SEVERITY_INDICATORS = {
  high: ['severe', 'extreme', 'dangerous', 'critical', 'emergency', 'life-threatening', 'major', 'massive'],
  moderate: ['moderate', 'significant', 'notable', 'concerning', 'warning'],
  low: ['minor', 'small', 'slight', 'minimal', 'low', 'limited'],
};


/**
 * Classify hazard using keyword-based fallback (when OpenAI is unavailable)
 */
function classifyWithKeywords(text: string): ClassificationResult {
  const lowerText = text.toLowerCase();
  
  // Detect hazard type
  let detectedType: HazardType = 'other';
  let maxMatches = 0;
  const matchedKeywords: string[] = [];

  for (const [type, keywords] of Object.entries(HAZARD_KEYWORDS)) {
    const matches = keywords.filter(kw => lowerText.includes(kw));
    if (matches.length > maxMatches) {
      maxMatches = matches.length;
      detectedType = type as HazardType;
      matchedKeywords.push(...matches);
    }
  }

  // Detect severity
  let severity: SeverityLevel = 'moderate';
  for (const [level, indicators] of Object.entries(SEVERITY_INDICATORS)) {
    if (indicators.some(ind => lowerText.includes(ind))) {
      severity = level as SeverityLevel;
      break;
    }
  }

  // Calculate confidence based on keyword matches
  const confidence = Math.min(50 + maxMatches * 15, 85);

  return {
    hazardType: detectedType,
    severity,
    confidence,
    reasoning: `Keyword-based classification: detected ${maxMatches} matching keywords`,
    keywords: matchedKeywords,
  };
}

/**
 * Classify hazard using OpenAI API
 */
async function classifyWithOpenAI(text: string, mediaUrls?: string[]): Promise<ClassificationResult> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const systemPrompt = `You are a coastal hazard classification expert. Analyze the provided report and classify it.
Return a JSON object with:
- hazardType: one of "flooding", "storm_surge", "high_waves", "erosion", "rip_current", "tsunami", "pollution", "other"
- severity: one of "low", "moderate", "high"
- confidence: number 0-100 indicating classification confidence
- reasoning: brief explanation of classification
- keywords: array of key terms that influenced classification
- suggestedActions: array of recommended immediate actions`;

  const userPrompt = `Classify this coastal hazard report:
"${text}"
${mediaUrls?.length ? `\nMedia files attached: ${mediaUrls.length}` : ''}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const result = JSON.parse(content);

    // Validate and normalize response
    return {
      hazardType: validateHazardType(result.hazardType),
      severity: validateSeverity(result.severity),
      confidence: Math.min(Math.max(result.confidence || 70, 0), 100),
      reasoning: result.reasoning || 'AI classification',
      keywords: result.keywords || [],
      suggestedActions: result.suggestedActions || [],
    };
  } catch (error) {
    logger.error('OpenAI classification failed:', error);
    throw error;
  }
}

function validateHazardType(type: string): HazardType {
  const validTypes: HazardType[] = ['flooding', 'storm_surge', 'high_waves', 'erosion', 'rip_current', 'tsunami', 'pollution', 'other'];
  return validTypes.includes(type as HazardType) ? (type as HazardType) : 'other';
}

function validateSeverity(severity: string): SeverityLevel {
  const validLevels: SeverityLevel[] = ['low', 'moderate', 'high'];
  return validLevels.includes(severity as SeverityLevel) ? (severity as SeverityLevel) : 'moderate';
}


/**
 * Main classification function - uses OpenAI with keyword fallback
 */
export async function classifyHazard(
  text: string,
  mediaUrls?: string[],
  options?: { forceKeywords?: boolean }
): Promise<ClassificationResult> {
  // Use keyword-based classification in demo mode or when forced
  if (DEMO_MODE || options?.forceKeywords || !OPENAI_API_KEY) {
    logger.debug('Using keyword-based classification');
    return classifyWithKeywords(text);
  }

  try {
    logger.debug('Using OpenAI classification');
    return await classifyWithOpenAI(text, mediaUrls);
  } catch (error) {
    logger.warn('OpenAI classification failed, falling back to keywords:', error);
    return classifyWithKeywords(text);
  }
}

/**
 * Batch classify multiple reports
 */
export async function classifyReportsBatch(
  reports: Array<{ id: string; text: string; mediaUrls?: string[] }>
): Promise<Map<string, ClassificationResult>> {
  const results = new Map<string, ClassificationResult>();

  // Process in parallel with concurrency limit
  const concurrencyLimit = 5;
  const chunks: typeof reports[] = [];
  
  for (let i = 0; i < reports.length; i += concurrencyLimit) {
    chunks.push(reports.slice(i, i + concurrencyLimit));
  }

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map(async (report) => {
        try {
          const result = await classifyHazard(report.text, report.mediaUrls);
          return { id: report.id, result };
        } catch (error) {
          logger.error(`Classification failed for report ${report.id}:`, error);
          return {
            id: report.id,
            result: {
              hazardType: 'other' as HazardType,
              severity: 'moderate' as SeverityLevel,
              confidence: 0,
              reasoning: 'Classification failed',
            },
          };
        }
      })
    );

    for (const { id, result } of chunkResults) {
      results.set(id, result);
    }
  }

  return results;
}

/**
 * Generate AI summary for a report
 */
export async function generateReportSummary(report: Report): Promise<string> {
  if (DEMO_MODE || !OPENAI_API_KEY) {
    // Generate simple summary in demo mode
    const hazardLabel = report.classification.hazardType?.replace('_', ' ') || 'hazard';
    const severityLabel = report.classification.severity || 'moderate';
    return `${severityLabel.charAt(0).toUpperCase() + severityLabel.slice(1)} ${hazardLabel} reported in ${report.region}. ${report.content.originalText.slice(0, 100)}...`;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Generate a concise 1-2 sentence summary of this coastal hazard report for emergency responders.',
          },
          {
            role: 'user',
            content: `Report: ${report.content.originalText}\nLocation: ${report.region}\nHazard Type: ${report.classification.hazardType}\nSeverity: ${report.classification.severity}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content || 'Summary unavailable';
  } catch (error) {
    logger.error('Summary generation failed:', error);
    return `${report.classification.severity || 'Moderate'} ${report.classification.hazardType || 'hazard'} reported in ${report.region}.`;
  }
}

export const hazardClassificationService = {
  classifyHazard,
  classifyReportsBatch,
  generateReportSummary,
};

export default hazardClassificationService;
