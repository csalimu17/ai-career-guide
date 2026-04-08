import { ResumeData } from '@/types/cv';

/**
 * Clean parsed data before saving.
 */
export function cleanParsedData(data: Partial<ResumeData['personalDetails']> & { summary?: string }) {
  const clean = {
    name: isLikelyPersonName(data.name) ? data.name || "" : "",
    email: isValidEmail(data.email) ? data.email || "" : "",
    phone: isLikelyPhone(data.phone) ? data.phone || "" : "",
    location: isLikelyLocation(data.location) ? data.location || "" : "",
    summary: data.summary || "",
  };
  return clean;
}

export function isValidEmail(value: string | undefined = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || "").trim());
}

export function isLikelyPhone(value: string | undefined = "") {
  const digits = (value || "").toString().replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

export function isLikelyPersonName(value: string | undefined = "") {
  const v = (value || "").trim();
  if (!v) return false;
  if (v.length < 2 || v.length > 60) return false;
  if (/@|\d/.test(v)) return false;
  return v.split(/\s+/).length >= 2;
}

export function isLikelyLocation(value: string | undefined = "") {
  const v = (value || "").trim();
  if (!v) return false;
  if (v.length > 80) return false;
  if (/@/.test(v)) return false;
  if (/[.!?]/.test(v)) return false;
  if (/^(summary|profile|professional summary|personal statement|experience|work experience|education|skills|projects|certifications?)$/i.test(v)) return false;
  if (/\b(statement|summary|experience|education|skills|projects|certifications?)\b/i.test(v) && !/,|remote|uk|england|scotland|wales|ireland|usa|canada|australia/i.test(v)) return false;
  return true;
}

/**
 * Scoring system for per-field confidence.
 */
export function scoreFieldConfidence(field: string, value: string | undefined): number {
  if (!value) return 0;

  switch (field) {
    case "email":
      return isValidEmail(value) ? 0.98 : 0.1;
    case "phone":
      return isLikelyPhone(value) ? 0.9 : 0.2;
    case "name":
      return isLikelyPersonName(value) ? 0.8 : 0.2;
    case "location":
      return isLikelyLocation(value) ? 0.75 : 0.15;
    default:
      return 0.5;
  }
}

/**
 * Field-level validation and confidence filtering.
 */
export function validateAndSanitizeResume(data: ResumeData): ResumeData {
  const personal = data.personalDetails || {};
  const cleaned = cleanParsedData({ ...personal, summary: data.summary });

  const finalPersonal = { ...personal };
  let finalSummary = data.summary || "";

  for (const key of Object.keys(cleaned)) {
    const val = (cleaned as any)[key];
    const confidence = scoreFieldConfidence(key, val);
    
    if (confidence < 0.6) {
      if (key === 'summary') finalSummary = "";
      else (finalPersonal as any)[key] = "";
    } else {
      if (key === 'summary') finalSummary = val;
      else (finalPersonal as any)[key] = val;
    }
  }

  return {
    ...data,
    personalDetails: finalPersonal,
    summary: finalSummary
  };
}
