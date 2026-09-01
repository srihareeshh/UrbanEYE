import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GeminiProvider } from '../ai/geminiProvider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('🧪 Testing Live Gemini API Connectivity & Scenario-Grounded Analysis...');
console.log('Model configured:', process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite');

// Test with models: gemini-2.5-flash, gemini-1.5-flash, gemini-2.0-flash, gemini-3.1-flash-lite
const candidateModels = [
  process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash'
];

let workingModel = null;
let liveOutput = null;

for (const modelName of candidateModels) {
  console.log(`\nAttempting Live Gemini request with model: "${modelName}"...`);
  const provider = new GeminiProvider({
    apiKey: process.env.GEMINI_API_KEY,
    model: modelName
  });

  try {
    const result = await provider.analyzeReport({
      report: {
        category: 'Electricity',
        description: 'Exposed live transformer sparking near sidewalk and primary school entrance gate.',
        duration: 'A few hours',
        recurrence: 'First time',
        severity: 'Dangerous',
        isRiskPresent: true,
        riskDescription: 'Risk of electrocution to school children and pedestrians'
      },
      location: {
        latitude: 19.0760,
        longitude: 72.8777,
        city: 'Mumbai'
      }
    });

    console.log(`✅ SUCCESS with model: ${modelName}!`);
    console.log('Structured JSON Output:\n', JSON.stringify(result.structuredOutput, null, 2));
    console.log('Token Usage:', result.tokens);
    workingModel = modelName;
    liveOutput = result.structuredOutput;
    break;
  } catch (err) {
    console.log(`⚠️ Model "${modelName}" failed:`, err.message);
  }
}

if (!workingModel) {
  console.error('\n❌ Could not connect to Gemini API with any candidate model. Please check the API key.');
} else {
  console.log(`\n🎉 Live Gemini AI is working perfectly with "${workingModel}"!`);
}
