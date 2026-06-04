export interface GoldenPrompt {
  id: string;
  category: string;
  template: string;
  frequency: number;
  avgTokens: number;
  avgLatency: number;
  cacheTTL: number;
  priority: 'high' | 'medium' | 'low';
  description: string;
}

export const GOLDEN_PROMPTS: GoldenPrompt[] = [
  {
    id: 'gp_001_cv_bullet_improvement',
    category: 'cvWriting',
    template: 'Improve this CV bullet point using STAR method: "{bullet}"',
    frequency: 150,
    avgTokens: 250,
    avgLatency: 450,
    cacheTTL: 604800, // 7 days
    priority: 'high',
    description: 'CV bullet optimization',
  },
  {
    id: 'gp_002_role_title_classifier',
    category: 'jobResearch',
    template: 'Classify this job title and infer role requirements: "{jobTitle}"',
    frequency: 200,
    avgTokens: 400,
    avgLatency: 600,
    cacheTTL: 604800,
    priority: 'high',
    description: 'Job title classification',
  },
  {
    id: 'gp_003_interview_prep_star',
    category: 'careerChat',
    template: 'Generate a STAR-format response for: "{question}"',
    frequency: 120,
    avgTokens: 600,
    avgLatency: 800,
    cacheTTL: 259200, // 3 days
    priority: 'high',
    description: 'Interview prep STAR method',
  },
  {
    id: 'gp_004_ats_score_analysis',
    category: 'atsAnalysis',
    template: 'Score this CV for ATS compatibility: "{cvContent}"',
    frequency: 100,
    avgTokens: 350,
    avgLatency: 700,
    cacheTTL: 604800,
    priority: 'high',
    description: 'ATS compatibility scoring',
  },
];

export const CACHE_TTL_POLICIES: Record<string, number> = {
  default: 3600,
  structuredExtraction: 86400,
  jobResearch: 172800,
  careerChat: 1800,
  atsAnalysis: 604800,
  cvWriting: 86400,
  marketingChat: 3600,
};

export function getCacheTTL(category: string, isGolden: boolean = false): number {
  if (isGolden) return 604800; // 7 days for golden prompts
  return CACHE_TTL_POLICIES[category] || CACHE_TTL_POLICIES.default;
}

export function identifyGoldenPrompt(prompt: string, category: string): boolean {
  return GOLDEN_PROMPTS.some((gp) => 
    gp.category === category && prompt.includes(gp.template.split('{')[0])
  );
}
