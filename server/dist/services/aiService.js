"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapSeverityToAIStatus = exports.predictHarvestDate = exports.analyzeImageWithGemini = exports.analyzeImageBuffer = exports.AIServiceError = void 0;
const generative_ai_1 = require("@google/generative-ai");
const fs_1 = __importDefault(require("fs"));
class AIServiceError extends Error {
    constructor(code, message, originalError) {
        super(message);
        this.code = code;
        this.originalError = originalError;
        this.name = 'AIServiceError';
    }
}
exports.AIServiceError = AIServiceError;
// ─────────────────────────────────────────────────────────────────────────────
// Gemini Vision — model candidates (tried in order, first success wins)
// ─────────────────────────────────────────────────────────────────────────────
// Model candidates in priority order. The env var can override the first choice.
// Latest Gemini models that support vision + generateContent:
const MODEL_CANDIDATES = process.env.GEMINI_MODEL
    ? [process.env.GEMINI_MODEL, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-pro-vision']
    : ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-pro-vision'];
// Deduplicate while preserving order
const UNIQUE_MODEL_CANDIDATES = [...new Set(MODEL_CANDIDATES)];
const SCAN_PROMPT = (lang, context) => `You are an expert agricultural pathologist and botanist. Analyze this crop/plant image carefully.

USER PROVIDED CONTEXT:
${context?.cropName ? `- Identified Crop: ${context.cropName}` : ''}
${context?.cropAge ? `- Crop Age/Stage: ${context.cropAge}` : ''}
${context?.description ? `- Farmer's Observations: ${context.description}` : ''}
Take this context into extreme consideration when making your diagnosis. It represents the ground truth provided by the farmer. Use this to predict a deeply accurate diagnosis and provide very genuine, targeted information tailored to this particular crop's stage.

CRITICAL INSTRUCTION: You MUST respond ONLY with valid JSON. Do not include markdown blocks, no backticks, and absolutely no conversational text. Start directly with { and end with }. NEVER include unescaped newlines inside string values.

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
  "sprayInstructions": "Specific instructions on HOW and WHAT QUANTITY to spray per acre or land area based on standard agricultural practices",
  "requiredNutrients": ["Specific Nutrient 1 required to improve plant health", "Nutrient 2"],
  "preventionTips": ["Specific prevention tip 1 for this crop", "Prevention tip 2"],
  "estimatedRecoveryDays": 14,
  "affectedArea": "Percentage or description of affected area",
  "description": "2-3 sentence extremely accurate clinical description using the provided context and visual cues"
}

Rules:
- plantName MUST be the common name of the plant/crop visible in the image
- severity MUST be one of: healthy, mild, moderate, severe, critical
- confidenceScore MUST be an integer between 0 and 100
- symptoms MUST be an array of 2–5 strings
- recommendedTreatment MUST be a single, actionable sentence
- organicRemedies MUST be an array of organic or traditional methods (Jaivik Upay)
- chemicalTreatments MUST evaluate potential fertilizers, pesticides, or sprays if applicable
- sprayInstructions MUST contain specific dosage (e.g. ml/liter or kg/acre) and application method
- requiredNutrients MUST be an array of micro or macro nutrients the plant is currently lacking
- preventionTips MUST be an array of 2-4 specific, actionable tips to prevent future disease for this crop
- estimatedRecoveryDays MUST be a realistic integer number of days for recovery; 0 if plant is healthy
- Use the user's provided description and crop age to make the recommendation as genuine and specific as possible
- If the crop appears healthy, set condition to "Healthy" and severity to "healthy"
- If you cannot identify the plant, set plantName to "Unknown Plant"`;
// ─────────────────────────────────────────────────────────────────────────────
// No Mock Data - Real AI Only
// This service requires a valid GEMINI_API_KEY to function
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// tryModelOnce — attempt a single Gemini model, returns null if model not found
// ─────────────────────────────────────────────────────────────────────────────
async function tryModelOnce(genAI, modelName, base64Image, mimeType, startTime, language, context) {
    try {
        console.log(`[AIService] Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({
            model: modelName,
            safetySettings: [
                { category: generative_ai_1.HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_NONE },
                { category: generative_ai_1.HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_NONE },
                { category: generative_ai_1.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_NONE },
                { category: generative_ai_1.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_NONE },
            ],
            generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
        });
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: mimeType,
            },
        };
        const result = await model.generateContent([SCAN_PROMPT(language, context), imagePart]);
        const rawText = result.response.text();
        console.log(`[AIService] ✅ Model ${modelName} succeeded. Response length:`, rawText.length);
        console.log(`[AIService] Response preview:`, rawText.substring(0, 200));
        // Strip markdown code fences and extract JSON body
        let cleanJson = rawText
            .replace(/^```(?:json)?\s*/i, '')
            .replace(/\s*```\s*$/i, '')
            .trim();
        // Robust extraction: find the first { and last }
        const startIdx = cleanJson.indexOf('{');
        const endIdx = cleanJson.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            cleanJson = cleanJson.substring(startIdx, endIdx + 1);
        }
        // ── Sanitize bare newlines / carriage returns inside JSON string values ──
        // Strategy: regex matches each complete "quoted string" including any
        // embedded newlines (the `s` dotAll flag makes . match \n too), then
        // replaces the bare control characters inside only that matched region.
        // This is O(n) with no string concatenation in user code → safe for large
        // payloads and any language (Marathi, Hindi, English, etc.)
        function sanitizeJson(raw) {
            return raw.replace(/"((?:[^"\\]|\\[\s\S])*)"/g, (_match, inner) => {
                const cleaned = inner
                    .replace(/\n/g, ' ')
                    .replace(/\r/g, ' ')
                    .replace(/\t/g, ' ');
                return `"${cleaned}"`;
            });
        }
        // Try to parse JSON
        let parsed;
        try {
            parsed = JSON.parse(sanitizeJson(cleanJson));
        }
        catch (parseError) {
            console.error('[AIService] JSON parse failed, attempting recovery...');
            // Fallback: sanitize + structural repairs
            let fixedJson = sanitizeJson(cleanJson)
                // Remove trailing commas
                .replace(/,\s*([}\]])/g, '$1');
            // Close any truncated open string at end of doc
            const quoteCount = (fixedJson.match(/(?<!\\)"/g) || []).length;
            if (quoteCount % 2 !== 0)
                fixedJson += '"';
            // Count and close unclosed brackets/braces — cap iterations to avoid runaway loop
            const maxClose = 20;
            let iters = 0;
            while ((fixedJson.match(/\[/g) || []).length > (fixedJson.match(/\]/g) || []).length && iters++ < maxClose) {
                fixedJson += ']';
            }
            iters = 0;
            while ((fixedJson.match(/\{/g) || []).length > (fixedJson.match(/\}/g) || []).length && iters++ < maxClose) {
                fixedJson += '}';
            }
            try {
                parsed = JSON.parse(fixedJson);
                console.log('[AIService] ✅ JSON recovery successful');
            }
            catch {
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
            sprayInstructions: String(parsed.sprayInstructions || ''),
            requiredNutrients: Array.isArray(parsed.requiredNutrients) ? parsed.requiredNutrients.map(String) : [],
            preventionTips: Array.isArray(parsed.preventionTips) ? parsed.preventionTips.map(String) : [],
            estimatedRecoveryDays: typeof parsed.estimatedRecoveryDays === 'number' ? parsed.estimatedRecoveryDays : 14,
            affectedArea: String(parsed.affectedArea || 'N/A'),
            description: String(parsed.description || ''),
            aiModel: modelName,
            processingTimeMs: Date.now() - startTime,
        };
    }
    catch (err) {
        if (err instanceof AIServiceError)
            throw err; // re-throw domain errors (parse, image etc.)
        const errMsg = err.message || '';
        // 404 = model not available for this key → try next
        if (errMsg.includes('404') || errMsg.includes('NOT_FOUND') || errMsg.includes('not found') || errMsg.includes('not supported')) {
            console.warn(`[AIService] ⚠️  Model ${modelName} not available (404) — trying next candidate`);
            return null;
        }
        // Auth / key errors — no point trying other models
        if (errMsg.includes('API_KEY_INVALID') || (errMsg.includes('invalid') && errMsg.includes('key'))) {
            throw new AIServiceError('INVALID_KEY', 'Gemini API key is invalid or lacks permission', err);
        }
        // 403 Forbidden could mean the specific model isn't enabled for this key (common with new/preview models)
        if (errMsg.includes('403')) {
            console.warn(`[AIService] ⚠️  Model ${modelName} returned 403 (Forbidden) — trying next. Details: ${errMsg}`);
            return null;
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
const analyzeImageBuffer = async (buffer, mimeType, language = 'English', context) => {
    const startTime = Date.now();
    const apiKey = process.env.GEMINI_API_KEY;
    // ── Security: validate MIME type ──────────────────────────────────────────
    const ALLOWED_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!ALLOWED_MIMES.includes(mimeType)) {
        throw new AIServiceError('INVALID_IMAGE', `Unsupported image type: ${mimeType}`);
    }
    // ── No API key → throw error ──────────────────────────────────────────────
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        throw new AIServiceError('API_UNAVAILABLE', 'GEMINI_API_KEY is not configured. Please set a valid API key in your environment variables.');
    }
    const base64Image = buffer.toString('base64');
    const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    console.log('[AIService] Starting model fallback chain:', UNIQUE_MODEL_CANDIDATES);
    console.log('[AIService] Image:', `${Math.round(buffer.length / 1024)}KB`, mimeType);
    // ── Try each model in sequence ────────────────────────────────────────────
    for (const modelName of UNIQUE_MODEL_CANDIDATES) {
        const result = await tryModelOnce(genAI, modelName, base64Image, mimeType, startTime, language, context);
        if (result !== null)
            return result;
    }
    // ── All models exhausted — throw error ────────────────────────────────────
    throw new AIServiceError('API_UNAVAILABLE', 'All AI models failed to process the image. Please check your GEMINI_API_KEY permissions at https://aistudio.google.com');
};
exports.analyzeImageBuffer = analyzeImageBuffer;
// ─────────────────────────────────────────────────────────────────────────────
// Legacy analyzeImageWithGemini (kept for backward-compat with /analyze route)
// Internally delegates to analyzeImageBuffer
// ─────────────────────────────────────────────────────────────────────────────
const analyzeImageWithGemini = async (imagePath, mimeType = 'image/jpeg') => {
    const buffer = fs_1.default.readFileSync(imagePath);
    const scan = await (0, exports.analyzeImageBuffer)(buffer, mimeType);
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
exports.analyzeImageWithGemini = analyzeImageWithGemini;
// ─────────────────────────────────────────────────────────────────────────────
// Mock AI — Harvest Date Prediction
// ─────────────────────────────────────────────────────────────────────────────
const CROP_GROWTH_DAYS = {
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
const predictHarvestDate = async (params) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const { cropName, plantedDate, areaAcres } = params;
    const key = cropName.toLowerCase();
    const growthRange = CROP_GROWTH_DAYS[key] || CROP_GROWTH_DAYS['default'];
    const soilFactor = params.soilPh
        ? params.soilPh >= 6.0 && params.soilPh <= 7.0 ? 0.95 : 1.05
        : 1.0;
    const rainfallFactor = params.rainfall ? (params.rainfall > 500 ? 0.97 : 1.03) : 1.0;
    const baseDays = Math.round(((growthRange.min + growthRange.max) / 2) * soilFactor * rainfallFactor);
    const predictedDate = new Date(plantedDate);
    predictedDate.setDate(predictedDate.getDate() + baseDays);
    const daysFromNow = Math.max(0, Math.ceil((predictedDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
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
exports.predictHarvestDate = predictHarvestDate;
// ─── Helper: map severity → CropAIStatus ─────────────────────────────────────
const mapSeverityToAIStatus = (severity) => {
    const map = {
        healthy: 'HEALTHY',
        mild: 'STRESSED',
        moderate: 'STRESSED',
        severe: 'DISEASED',
        critical: 'DISEASED',
    };
    return map[severity.toLowerCase()] ?? 'UNKNOWN';
};
exports.mapSeverityToAIStatus = mapSeverityToAIStatus;
//# sourceMappingURL=aiService.js.map