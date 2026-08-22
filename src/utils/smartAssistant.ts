import type { IssueCategory, IssueSeverity } from '../types';

interface SuggestionResult {
  category: IssueCategory | null;
  severity: IssueSeverity | null;
  confidence: number;
  reason: string;
}

export function analyzeSmartSuggestions(text: string, mediaNames: string[] = []): SuggestionResult | null {
  const combined = `${text} ${mediaNames.join(' ')}`.toLowerCase();
  if (combined.trim().length < 4) return null;

  let category: IssueCategory | null = null;
  let severity: IssueSeverity | null = null;
  let reason = '';

  // 1. Water keywords
  if (/\b(water|flood|flooding|waterlog|waterlogged|drain|drainage|pipe|burst|leak|tap|sewer|monsoon)\b/i.test(combined)) {
    category = 'Water';
    reason = 'Identified water or drainage related indicators';
  }
  // 2. Roads keywords
  else if (/\b(road|pothole|street|highway|asphalt|tar|crack|pavement|traffic|bridge|pathway|lane)\b/i.test(combined)) {
    category = 'Roads';
    reason = 'Identified road or surface transit indicators';
  }
  // 3. Electricity keywords
  else if (/\b(wire|electric|electricity|power|transformer|spark|sparking|shock|blackout|pole|cable)\b/i.test(combined)) {
    category = 'Electricity';
    reason = 'Identified electrical grid or live wire indicators';
  }
  // 4. Sanitation keywords
  else if (/\b(garbage|trash|waste|dump|stench|smell|litter|dustbin|unhygienic|debris)\b/i.test(combined)) {
    category = 'Sanitation';
    reason = 'Identified sanitation or solid waste indicators';
  }
  // 5. Schools keywords
  else if (/\b(school|classroom|student|child|children|playground|desk|chalkboard|bench)\b/i.test(combined)) {
    category = 'Schools';
    reason = 'Identified educational infrastructure indicators';
  }
  // 6. Agriculture keywords
  else if (/\b(crop|farm|farmer|agriculture|fertilizer|pest|soil|irrigation|harvest)\b/i.test(combined)) {
    category = 'Agriculture';
    reason = 'Identified agricultural or farming indicators';
  }
  // 7. Environment keywords
  else if (/\b(tree|forest|river|lake|pollution|smoke|chemical|wildlife|erosion|air)\b/i.test(combined)) {
    category = 'Environment';
    reason = 'Identified ecological or environmental indicators';
  }
  // 8. Public Services
  else if (/\b(hospital|clinic|bus|transit|park|government|counter|water tank)\b/i.test(combined)) {
    category = 'Public Services';
    reason = 'Identified public facility indicators';
  }

  // Severity analysis
  if (/\b(danger|dangerous|spark|sparking|collapse|fatal|fire|electrocute|emergency|critical|hazard|deep water|live wire)\b/i.test(combined)) {
    severity = 'Dangerous';
  } else if (/\b(severe|serious|heavy|overflow|completely|major|urgent|blocked|damaged|frequent)\b/i.test(combined)) {
    severity = 'Serious';
  } else if (/\b(small|minor|slight|slow|beginning|low)\b/i.test(combined)) {
    severity = 'Low';
  } else if (category) {
    severity = 'Moderate';
  }

  if (!category && !severity) return null;

  return {
    category,
    severity,
    confidence: 0.88,
    reason: reason || 'Pattern detected from incident description'
  };
}
