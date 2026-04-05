import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { CropAIStatus } from '../models/Crop';
import fs from 'fs';

// ─────────────────────────────────────────────────────────────────────────────
// Custom AI Service Error — lets controllers respond with precise HTTP codes
// ─────────────────────────────────────────────────────────────────────────────

export type AIErrorCode =
  | 'API_UNAVAILABLE'
  | 'INVALID_KEY'
  | 'RATE_LIMITED'
  | 'PARSE_ERROR'
  | 'MODEL_NOT_FOUND'
  | 'INVALID_IMAGE';

export class AIServiceError extends Error {
  constructor(
    public readonly code: AIErrorCode,
    message: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Result types
// ─────────────────────────────────────────────────────────────────────────────

/** Simplified scan result — aligned with the user-facing DiagnosisCard */
export interface ScanResult {
  condition: string;          // "Early Blight", "Healthy", etc.
  plantName: string;          // detected plant/crop name
  confidenceScore: number;    // 0–100
  severity: 'healthy' | 'mild' | 'moderate' | 'severe' | 'critical';
  symptoms: string[];
  recommendedTreatment: string;
  organicRemedies: string[];
  chemicalTreatments: string[];
  affectedArea: string;
  description: string;
  aiModel: string;
  processingTimeMs: number;
}

/** Legacy full diagnosis (kept for backward-compat with existing /analyze route) */
export interface CropDiagnosisResult {
  disease: string;
  plantName: string;
  confidence: number;
  severity: 'healthy' | 'mild' | 'moderate' | 'severe' | 'critical';
  affectedArea: string;
  description: string;
  symptoms: string[];
  treatmentPlan: {
    urgency: 'immediate' | 'within_week' | 'routine';
    steps: Array<{ step: number; action: string; timing: string; product?: string }>;
    preventionTips: string[];
    estimatedRecoveryDays: number;
  };
  aiModel: string;
  processingTimeMs: number;
}

export interface HarvestPredictionResult {
  cropName: string;
  predictedHarvestDate: Date;
  confidenceLevel: number;
  daysFromNow: number;
  factors: string[];
  yieldEstimate: number;
  yieldUnit: string;
  recommendations: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Gemini Vision — model candidates (tried in order, first success wins)
// ─────────────────────────────────────────────────────────────────────────────

// Model candidates in priority order. The env var can override the first choice.
// Latest Gemini models that support vision + generateContent:
const MODEL_CANDIDATES: string[] = process.env.GEMINI_MODEL
  ? [process.env.GEMINI_MODEL, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-pro-vision']
  : ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-pro-vision'];

// Deduplicate while preserving order
const UNIQUE_MODEL_CANDIDATES = [...new Set(MODEL_CANDIDATES)];

const SCAN_PROMPT = (lang: string) => `You are an expert agricultural pathologist and botanist. Analyze this crop/plant image carefully.

CRITICAL INSTRUCTION: You MUST respond ONLY with valid JSON. Do not include markdown blocks, no backticks, and absolutely no conversational text. Start directly with { and end with }.

IMPORTANT: Your JSON values (the content, not the keys) MUST be translated into the following language: ${lang}.
CRITICAL: ALL JSON KEYS (like "plantName", "condition", etc.) MUST REMAIN IN ENGLISH. DO NOT TRANSLATE THE KEYS!
EXCEPTION FOR SEVERITY: The "severity" field MUST ONLY be exactly one of these lowercase English words: "healthy", "mild", "moderate", "severe", "critical". Do NOT translate the severity field value!

Respond ONLY with valid JSON matching this exact structure:
{
  "plantName": "Common name of the plant or crop",
  "condition": "Disease name or 'Healthy' if no disease found",
  "confidenceScore": 87,
  "severity": "mild",
  "symptoms": ["symptom 1", "symptom 2", "symptom 3"],
  "recommendedTreatment": "Single concise treatment recommendation",
  "organicRemedies": ["Jaivik upay 1", "Jaivik upay 2"],
  "chemicalTreatments": ["Suggested fertilizer 1", "Suggested spray 2"],
  "affectedArea": "Percentage or description of affected area",
  "description": "2–3 sentence clinical description of what you observe"
}

Rules:
- plantName MUST be the common name of the plant/crop visible in the image
- severity MUST be one of: healthy, mild, moderate, severe, critical
- confidenceScore MUST be an integer between 0 and 100
- symptoms MUST be an array of 2–5 strings
- recommendedTreatment MUST be a single, actionable sentence
- organicRemedies MUST be an array of organic or traditional methods (Jaivik Upay)
- chemicalTreatments MUST evaluate potential fertilizers, pesticides, or sprays if applicable
- If the crop appears healthy, set condition to "Healthy" and severity to "healthy"
- If you cannot identify the plant, set plantName to "Unknown Plant"`;

// ─────────────────────────────────────────────────────────────────────────────
// No Mock Data - Real AI Only
// This service requires a valid GEMINI_API_KEY to function
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// tryModelOnce — attempt a single Gemini model, returns null if model not found
// ─────────────────────────────────────────────────────────────────────────────

async function tryModelOnce(
  genAI: GoogleGenerativeAI,
  modelName: string,
  base64Image: string,
  mimeType: string,
  startTime: number,
  language: string
): Promise<ScanResult | null> {
  try {
    console.log(`[AIService] Trying model: ${modelName}`);
    const model = genAI.getGenerativeModel({
      model: modelName,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
      generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
    });

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
      },
    };

    const result = await model.generateContent([SCAN_PROMPT(language), imagePart]);
    const rawText = result.response.text();

    console.log(`[AIService] ✅ Model ${modelName} succeeded. Response length:`, rawText.length);
    console.log(`[AIService] Response preview:`, rawText.substring(0, 200));

    // Strip markdown code fences and extract JSON body
    let cleanJson = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();
      
    // Robust extraction: find the first { and last }
    const start = cleanJson.indexOf('{');
    const end = cleanJson.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      cleanJson = cleanJson.substring(start, end + 1);
    }

    // Try to parse JSON
    let parsed: Omit<ScanResult, 'aiModel' | 'processingTimeMs'>;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('[AIService] JSON parse failed, attempting recovery...');
      
      // Try to fix common JSON issues
      let fixedJson = cleanJson
        // Remove trailing commas
        .replace(/,\s*([}\]])/g, '$1')
        // Fix unclosed strings (add closing quote if missing)
        .replace(/(:\s*"[^"]*)([,}\]])/g, (match, p1, p2) => {
          if (p1.endsWith('"')) return match;
          return p1 + '"' + p2;
        });
      
      // If JSON is truncated, try to close it
      const openBraces = (fixedJson.match(/\{/g) || []).length;
      const closeBraces = (fixedJson.match(/\}/g) || []).length;
      const openBrackets = (fixedJson.match(/\[/g) || []).length;
      const closeBrackets = (fixedJson.match(/\]/g) || []).length;
      
      // Add missing closing brackets/braces
      while (closeBrackets < openBrackets) {
        fixedJson += ']';
      }
      while (closeBraces < openBraces) {
        fixedJson += '}';
      }
      
      try {
        parsed = JSON.parse(fixedJson);
        console.log('[AIService] ✅ JSON recovery successful');
      } catch {
        console.error('[AIService] JSON recovery failed. Raw response:', rawText.substring(0, 500));
        throw new AIServiceError('PARSE_ERROR', 'Gemini returned malformed JSON. Please try again with a clearer image.', rawText);
      }
    }

    return {
      plantName: String(parsed.plantName || 'Unknown Plant'),
      condition: String(parsed.condition || 'Unknown'),
      confidenceScore: Math.min(100, Math.max(0, Number(parsed.confidenceScore) || 0)),
      severity: parsed.severity || 'mild',
      symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms.map(String) : [],
      recommendedTreatment: String(parsed.recommendedTreatment || ''),
      organicRemedies: Array.isArray(parsed.organicRemedies) ? parsed.organicRemedies.map(String) : [],
      chemicalTreatments: Array.isArray(parsed.chemicalTreatments) ? parsed.chemicalTreatments.map(String) : [],
      affectedArea: String(parsed.affectedArea || 'N/A'),
      description: String(parsed.description || ''),
      aiModel: modelName,
      processingTimeMs: Date.now() - startTime,
    };
  } catch (err) {
    if (err instanceof AIServiceError) throw err;  // re-throw domain errors (parse, image etc.)

    const errMsg = (err as Error).message || '';

    // 404 = model not available for this key → try next
    if (errMsg.includes('404') || errMsg.includes('NOT_FOUND') || errMsg.includes('not found') || errMsg.includes('not supported')) {
      console.warn(`[AIService] ⚠️  Model ${modelName} not available (404) — trying next candidate`);
      return null;
    }
    // Auth / key errors — no point trying other models
    if (errMsg.includes('API_KEY_INVALID') || (errMsg.includes('invalid') && errMsg.includes('key')) || errMsg.includes('403')) {
      throw new AIServiceError('INVALID_KEY', 'Gemini API key is invalid or lacks permission', err);
    }
    // Rate limit — no point trying other models right now
    if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota')) {
      throw new AIServiceError('RATE_LIMITED', 'Gemini API rate limit exceeded. Please retry in a moment.', err);
    }
    // Image-specific error — no point trying other models
    if (errMsg.includes('400') || errMsg.includes('INVALID_ARGUMENT')) {
      throw new AIServiceError('INVALID_IMAGE', 'The image could not be processed by the AI. Try a clearer photo.', err);
    }

    // Unknown error — log and try next model
    console.warn(`[AIService] ⚠️  Model ${modelName} failed with unknown error: ${errMsg} — trying next`);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// analyzeImageBuffer — PRIMARY public method (memory-storage, no disk I/O)
// Tries each model candidate in order; throws error if AI is unavailable
// ─────────────────────────────────────────────────────────────────────────────

export const analyzeImageBuffer = async (
  buffer: Buffer,
  mimeType: string,
  language: string = 'English'
): Promise<ScanResult> => {
  const startTime = Date.now();
  const apiKey = process.env.GEMINI_API_KEY;

  // ── Security: validate MIME type ──────────────────────────────────────────
  const ALLOWED_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!ALLOWED_MIMES.includes(mimeType)) {
    throw new AIServiceError('INVALID_IMAGE', `Unsupported image type: ${mimeType}`);
  }

  // ── No API key → throw error ──────────────────────────────────────────────
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new AIServiceError(
      'API_UNAVAILABLE',
      'GEMINI_API_KEY is not configured. Please set a valid API key in your environment variables.'
    );
  }

  const base64Image = buffer.toString('base64');
  const genAI = new GoogleGenerativeAI(apiKey);

  console.log('[AIService] Starting model fallback chain:', UNIQUE_MODEL_CANDIDATES);
  console.log('[AIService] Image:', `${Math.round(buffer.length / 1024)}KB`, mimeType);

  // ── Try each model in sequence ────────────────────────────────────────────
  for (const modelName of UNIQUE_MODEL_CANDIDATES) {
    const result = await tryModelOnce(genAI, modelName, base64Image, mimeType, startTime, language);
    if (result !== null) return result;
  }

  // ── All models exhausted — throw error ────────────────────────────────────
  throw new AIServiceError(
    'API_UNAVAILABLE',
    'All AI models failed to process the image. Please check your GEMINI_API_KEY permissions at https://aistudio.google.com'
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Legacy analyzeImageWithGemini (kept for backward-compat with /analyze route)
// Internally delegates to analyzeImageBuffer
// ─────────────────────────────────────────────────────────────────────────────

export const analyzeImageWithGemini = async (
  imagePath: string,
  mimeType: string = 'image/jpeg'
): Promise<CropDiagnosisResult> => {
  const buffer = fs.readFileSync(imagePath);
  const scan = await analyzeImageBuffer(buffer, mimeType);

  return {
    disease: scan.condition,
    plantName: scan.plantName,
    confidence: scan.confidenceScore,
    severity: scan.severity,
    affectedArea: scan.affectedArea,
    description: scan.description,
    symptoms: scan.symptoms,
    treatmentPlan: {
      urgency: scan.severity === 'critical' || scan.severity === 'severe'
        ? 'immediate'
        : scan.severity === 'healthy'
          ? 'routine'
          : 'within_week',
      steps: [
        { step: 1, action: scan.recommendedTreatment, timing: 'Immediately', product: undefined },
      ],
      preventionTips: ['Monitor weekly', 'Maintain good drainage', 'Rotate crops annually'],
      estimatedRecoveryDays: scan.severity === 'healthy' ? 0 : 14,
    },
    aiModel: scan.aiModel,
    processingTimeMs: scan.processingTimeMs,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Mock AI — Harvest Date Prediction
// ─────────────────────────────────────────────────────────────────────────────

const CROP_GROWTH_DAYS: Record<string, { min: number; max: number }> = {
  wheat: { min: 90, max: 120 },
  corn: { min: 70, max: 100 },
  rice: { min: 110, max: 150 },
  soybean: { min: 80, max: 120 },
  cotton: { min: 150, max: 180 },
  tomato: { min: 60, max: 80 },
  potato: { min: 70, max: 120 },
  sugarcane: { min: 270, max: 365 },
  default: { min: 90, max: 150 },
};

export const predictHarvestDate = async (params: {
  cropName: string;
  plantedDate: Date;
  areaAcres: number;
  soilPh?: number;
  rainfall?: number;
}): Promise<HarvestPredictionResult> => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const { cropName, plantedDate, areaAcres } = params;
  const key = cropName.toLowerCase();
  const growthRange = CROP_GROWTH_DAYS[key] || CROP_GROWTH_DAYS['default'];

  const soilFactor = params.soilPh
    ? params.soilPh >= 6.0 && params.soilPh <= 7.0 ? 0.95 : 1.05
    : 1.0;
  const rainfallFactor = params.rainfall ? (params.rainfall > 500 ? 0.97 : 1.03) : 1.0;

  const baseDays = Math.round(
    ((growthRange.min + growthRange.max) / 2) * soilFactor * rainfallFactor
  );

  const predictedDate = new Date(plantedDate);
  predictedDate.setDate(predictedDate.getDate() + baseDays);

  const daysFromNow = Math.max(
    0,
    Math.ceil((predictedDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  const yieldEstimate = parseFloat((areaAcres * (2.5 + Math.random() * 1.5)).toFixed(2));

  return {
    cropName,
    predictedHarvestDate: predictedDate,
    confidenceLevel: Math.round(75 + Math.random() * 20),
    daysFromNow,
    factors: [
      `Soil pH factor: ${soilFactor.toFixed(2)}`,
      `Rainfall factor: ${rainfallFactor.toFixed(2)}`,
      `Estimated growth cycle: ${baseDays} days`,
    ],
    yieldEstimate,
    yieldUnit: 'tons',
    recommendations: [
      `Monitor for pest activity starting day ${Math.round(baseDays * 0.6)}`,
      'Apply nitrogen top-dressing 3 weeks before predicted harvest',
      'Ensure irrigation uniformity for consistent ripening',
    ],
  };
};

// ─── Helper: map severity → CropAIStatus ─────────────────────────────────────
export const mapSeverityToAIStatus = (severity: string): CropAIStatus => {
  const map: Record<string, CropAIStatus> = {
    healthy: 'HEALTHY',
    mild: 'STRESSED',
    moderate: 'STRESSED',
    severe: 'DISEASED',
    critical: 'DISEASED',
  };
  return map[severity.toLowerCase()] ?? 'UNKNOWN';
};
