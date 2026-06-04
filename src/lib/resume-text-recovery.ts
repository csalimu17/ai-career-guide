import { CvDataExtractionOutputSchema, type CvDataExtractionOutput } from "@/types/cv";

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isPlaceholderValue(value: string) {
  return /manual (verification needed|verification required|upload required)/i.test(value);
}

export function normalizeRecoverableText(rawText: string) {
  return rawText
    .replace(/\u0000/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/Ã¢â‚¬Â¢/g, "•")
    .replace(/[•●◦]/g, "•")
    .replace(/ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢|Ã¢â‚¬Â¢|â€¢|â—|â—¦/g, "-")
    .replace(/[\u2022\u25CF\u25E6]/g, "-")
    .replace(/(?:\b[A-Za-z0-9]\s+){2,}[A-Za-z0-9]\b/g, (match) => match.replace(/\s+/g, ""))
    .replace(/^\s*-\s*/gm, "- ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function uniqueStrings(values: Array<string | undefined>) {
  return Array.from(new Set(values.map((value) => normalizeString(value)).filter(Boolean)));
}

function extractFirstMatch(text: string, regex: RegExp) {
  const match = text.match(regex);
  return normalizeString(match?.[0]);
}

function looksLikeSectionHeading(line: string) {
  return /^(summary|profile|professional summary|personal statement|experience|work experience|employment|work history|professional experience|education|education history|academic background|academic history|skills|technical skills|core competencies|projects|certifications?|hobbies(?:\s*&\s*|\s+and\s+)interests?)$/i.test(
    line
  );
}

function looksLikeBullet(line: string) {
  return /^[-•*]\s*/.test(line);
}

function normalizeBullet(line: string) {
  return line.replace(/^[-•*]\s*/, "").trim();
}

function looksLikeDateRange(line: string) {
  return /((19|20)\d{2})/.test(line) || /\b(present|current)\b/i.test(line);
}

function splitDateRange(line: string) {
  const cleaned = normalizeString(line.replace(/\s+/g, " "));
  const parts = cleaned.split(/\s*(?:–|—|-|to)\s*/i);
  return {
    startDate: normalizeString(parts[0]),
    endDate: normalizeString(parts.slice(1).join(" - ")),
  };
}

function getSectionLines(lines: string[], matchers: RegExp[]) {
  const startIndex = lines.findIndex((line) => matchers.some((matcher) => matcher.test(line)));
  if (startIndex < 0) return [];

  const nextIndex = lines.findIndex((line, index) => index > startIndex && looksLikeSectionHeading(line));
  return lines.slice(startIndex + 1, nextIndex > startIndex ? nextIndex : undefined).filter(Boolean);
}

function looksLikeEmploymentDateRange(line: string) {
  const cleaned = normalizeString(line.replace(/\s+/g, " "));
  return /\b(?:\d{1,2}\/\d{4}|\d{4})\s*(?:-|to)\s*(?:\d{1,2}\/\d{4}|\d{4}|present|current)\b/i.test(cleaned);
}

function looksLikeLikelyHeadingOrNoise(line: string) {
  const cleaned = normalizeString(line);
  return (
    !cleaned ||
    looksLikeSectionHeading(cleaned) ||
    /^(thank you\.?)$/i.test(cleaned) ||
    /@|^\+?\d[\d\s().-]{6,}$/.test(cleaned) ||
    /year of graduation/i.test(cleaned)
  );
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/\b[a-z]/g, (char) => char.toUpperCase())
    .trim();
}

function findNameCandidate(lines: string[]) {
  for (let index = 0; index < Math.min(lines.length - 1, 48); index += 1) {
    const first = normalizeString(lines[index]);
    const second = normalizeString(lines[index + 1]);

    if (
      /^[A-Z][A-Z' -]{1,20}$/.test(first) &&
      /^[A-Z][A-Z' -]{1,20}$/.test(second) &&
      !looksLikeSectionHeading(first) &&
      !looksLikeSectionHeading(second)
    ) {
      return `${toTitleCase(first)} ${toTitleCase(second)}`.trim();
    }
  }

  return lines.find((line) =>
    !/@|http|linkedin|github|curriculum vitae|resume|manual/i.test(line) &&
    !looksLikeSectionHeading(line) &&
    !looksLikeDateRange(line) &&
    /^[A-Za-z][A-Za-z ,.'-]{2,}$/.test(line) &&
    line.split(/\s+/).length <= 5
  );
}

function collectDescriptionLines(lines: string[]) {
  return lines
    .map((line) => normalizeString(normalizeBullet(line)))
    .filter((line) =>
      line.length > 18 &&
      !looksLikeLikelyHeadingOrNoise(line) &&
      !looksLikeEmploymentDateRange(line) &&
      !/^(experience|work experience|education|skills|personal statement)$/i.test(line)
    )
    .slice(0, 8);
}

function parseGlobalExperienceEntries(lines: string[]) {
  const entries: NonNullable<CvDataExtractionOutput["workExperience"]> = [];
  const dateIndexes = lines
    .map((line, index) => (looksLikeEmploymentDateRange(line) ? index : -1))
    .filter((index) => index >= 0);

  dateIndexes.forEach((dateIndex, position) => {
    const previousDateIndex = position > 0 ? dateIndexes[position - 1] : -1;
    const nextDateIndex = position < dateIndexes.length - 1 ? dateIndexes[position + 1] : lines.length;
    const title = normalizeString(lines[dateIndex - 2]);
    const company = normalizeString(lines[dateIndex - 1]);
    const dates = splitDateRange(lines[dateIndex]);
    const preDescription = collectDescriptionLines(lines.slice(Math.max(previousDateIndex + 1, dateIndex - 12), Math.max(dateIndex - 2, 0)));
    const postDescription = collectDescriptionLines(lines.slice(dateIndex + 1, Math.max(dateIndex + 1, nextDateIndex - 2)));
    const description = preDescription.length >= postDescription.length ? preDescription : postDescription;

    if (!title || !company || looksLikeLikelyHeadingOrNoise(title) || looksLikeLikelyHeadingOrNoise(company)) {
      return;
    }

    entries.push({
      title,
      company,
      startDate: dates.startDate,
      endDate: dates.endDate,
      description,
    });
  });

  return entries.filter((entry, index, allEntries) => {
    const fingerprint = `${entry.title}|${entry.company}|${entry.startDate}|${entry.endDate}`;
    return allEntries.findIndex((candidate) => `${candidate.title}|${candidate.company}|${candidate.startDate}|${candidate.endDate}` === fingerprint) === index;
  });
}

function parseGlobalEducationEntries(lines: string[]) {
  const entries: NonNullable<CvDataExtractionOutput["education"]> = [];
  const yearIndexes = lines
    .map((line, index) => (/year of graduation/i.test(line) ? index : -1))
    .filter((index) => index >= 0);

  yearIndexes.forEach((yearIndex) => {
    const windowStart = Math.max(0, yearIndex - 4);
    const window = lines.slice(windowStart, yearIndex + 1).map((line) => normalizeString(line)).filter(Boolean);
    const institution = [...window].reverse().find((line) => /(academy|college|university|school|institute)/i.test(line)) || "";
    const institutionIndex = institution ? window.findIndex((line) => line === institution) : -1;
    const degree = window
      .slice(institutionIndex >= 0 ? institutionIndex + 1 : 0, window.length - 1)
      .filter((line) => !/year of graduation/i.test(line))
      .join(" ")
      .trim();
    const graduationDateMatch = window[window.length - 1]?.match(/(19|20)\d{2}/);

    if (!institution && !degree) return;

    entries.push({
      degree,
      institution,
      graduationDate: graduationDateMatch?.[0] || normalizeString(window[window.length - 1]),
    });
  });

  return entries.filter((entry, index, allEntries) => {
    const fingerprint = `${entry.degree}|${entry.institution}|${entry.graduationDate}`;
    return allEntries.findIndex((candidate) => `${candidate.degree}|${candidate.institution}|${candidate.graduationDate}` === fingerprint) === index;
  });
}

function findSummaryCandidate(lines: string[], explicitSummaryLines: string[]) {
  if (explicitSummaryLines.length) {
    return explicitSummaryLines.join(" ").slice(0, 600);
  }

  const personalStatementIndex = lines.findIndex((line) => /^personal statement$/i.test(line));
  if (personalStatementIndex > 0) {
    const candidate = lines
      .slice(Math.max(0, personalStatementIndex - 8), personalStatementIndex)
      .filter((line) =>
        line.length > 24 &&
        !/@|road|academy|college|year of graduation/i.test(line)
      )
      .join(" ");

    if (candidate) {
      return candidate.slice(0, 600);
    }
  }

  return "";
}

export function extractSummaryFromText(rawText: string) {
  const normalizedText = normalizeRecoverableText(rawText);

  if (!normalizedText) return "";

  const lines = normalizedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const headingIndex = (heading: string) =>
    lines.findIndex((line) => new RegExp(`^${heading}\\b`, "i").test(line));

  const summaryIndex = headingIndex("summary|profile|professional summary|personal statement");
  const experienceIndex = headingIndex("experience|employment|work history|professional experience");
  const summarySectionLines = getSectionLines(lines, [
    /^summary$/i,
    /^profile$/i,
    /^professional summary$/i,
    /^personal statement$/i,
  ]);

  const fallbackSummaryLines =
    summaryIndex >= 0
      ? lines.slice(summaryIndex + 1, experienceIndex > summaryIndex ? experienceIndex : summaryIndex + 5)
      : [];

  return findSummaryCandidate(lines, summarySectionLines.length ? summarySectionLines : fallbackSummaryLines);
}

function parseExperienceEntries(sectionLines: string[]) {
  const entries: NonNullable<CvDataExtractionOutput["workExperience"]> = [];
  const dateIndexes = sectionLines
    .map((line, index) => (looksLikeDateRange(line) ? index : -1))
    .filter((index) => index >= 0);

  if (!dateIndexes.length) return entries;

  dateIndexes.forEach((dateIndex, position) => {
    const nextBoundary = position < dateIndexes.length - 1 ? dateIndexes[position + 1] - 2 : sectionLines.length;
    const description = sectionLines
      .slice(dateIndex + 1, nextBoundary)
      .filter((line) => looksLikeBullet(line) || line.length > 20)
      .map((line) => normalizeBullet(line))
      .filter(Boolean)
      .slice(0, 6);
    const dates = splitDateRange(sectionLines[dateIndex]);

    entries.push({
      title: normalizeString(sectionLines[dateIndex - 2]),
      company: normalizeString(sectionLines[dateIndex - 1]),
      startDate: dates.startDate,
      endDate: dates.endDate,
      description,
    });
  });

  return entries.filter((entry) => normalizeString(entry.title) || normalizeString(entry.company));
}

function parseEducationEntries(sectionLines: string[]) {
  const entries: NonNullable<CvDataExtractionOutput["education"]> = [];
  const dateIndexes = sectionLines
    .map((line, index) => (looksLikeDateRange(line) ? index : -1))
    .filter((index) => index >= 0);

  if (!dateIndexes.length && sectionLines.length >= 2) {
    return [
      {
        degree: normalizeString(sectionLines[0]),
        institution: normalizeString(sectionLines[1]),
        graduationDate: normalizeString(sectionLines.find((line) => looksLikeDateRange(line))),
      },
    ];
  }

  dateIndexes.forEach((dateIndex) => {
    entries.push({
      degree: normalizeString(sectionLines[dateIndex - 2]),
      institution: normalizeString(sectionLines[dateIndex - 1]),
      graduationDate: normalizeString(sectionLines[dateIndex]),
      description: normalizeString(sectionLines[dateIndex + 1]),
    });
  });

  return entries.filter((entry) => normalizeString(entry.degree) || normalizeString(entry.institution));
}

function deriveMissingFields(candidate: Partial<CvDataExtractionOutput>) {
  const missingFields: string[] = [];

  if (!normalizeString(candidate.personalDetails?.name)) missingFields.push("name");
  if (!normalizeString(candidate.personalDetails?.email)) missingFields.push("email");
  if (!(candidate.workExperience?.length || 0)) missingFields.push("experience");
  if (!(candidate.education?.length || 0)) missingFields.push("education");
  if (!(candidate.skills?.length || 0)) missingFields.push("skills");

  return missingFields;
}

function countMeaningfulExperienceEntries(entries: Partial<CvDataExtractionOutput["workExperience"]> | undefined) {
  return (entries || []).filter((entry) => {
    const bullets = (entry?.description || []).filter((line) => normalizeString(line)).length;
    return Boolean(
      normalizeString(entry?.title) ||
        normalizeString(entry?.company) ||
        normalizeString(entry?.startDate) ||
        normalizeString(entry?.endDate) ||
        bullets > 0
    );
  }).length;
}

function countMeaningfulEducationEntries(entries: Partial<CvDataExtractionOutput["education"]> | undefined) {
  return (entries || []).filter((entry) =>
    Boolean(
      normalizeString(entry?.degree) ||
        normalizeString(entry?.institution) ||
        normalizeString(entry?.graduationDate)
    )
  ).length;
}

export function getExtractionQuality(data: Partial<CvDataExtractionOutput> | null | undefined) {
  if (!data) {
    return {
      name: "",
      email: "",
      phone: "",
      summaryLength: 0,
      experienceCount: 0,
      educationCount: 0,
      skillsCount: 0,
      score: 0,
      hasSubstantiveSection: false,
      hasMeaningfulExtraction: false,
    };
  }

  const name = normalizeString(data.personalDetails?.name);
  const email = normalizeString(data.personalDetails?.email);
  const phone = normalizeString(data.personalDetails?.phone);
  const summaryLength = normalizeString(data.summary).length;
  const experienceCount = countMeaningfulExperienceEntries(data.workExperience);
  const educationCount = countMeaningfulEducationEntries(data.education);
  const skillsCount = uniqueStrings((data.skills || []).map((item) => normalizeString(item))).length;

  let score = 0;
  if (name && !isPlaceholderValue(name)) score += 2;
  if (email) score += 2;
  if (phone) score += 1;
  if (summaryLength >= 80) score += 1;
  if (experienceCount > 0) score += 3;
  if (educationCount > 0) score += 2;
  if (skillsCount >= 3) score += 1;
  const hasSubstantiveSection = experienceCount > 0 || educationCount > 0 || summaryLength >= 80;

  const hasMeaningful = Boolean(
    (hasSubstantiveSection && score >= 4) ||
      experienceCount > 0 ||
      ((name && !isPlaceholderValue(name)) && (email || phone) && (educationCount > 0 || skillsCount >= 3 || summaryLength >= 80))
  );

  return {
    name,
    email,
    phone,
    summaryLength,
    experienceCount,
    educationCount,
    skillsCount,
    score,
    hasSubstantiveSection,
    hasMeaningfulExtraction: hasMeaningful,
  };
}

export function hasMeaningfulExtraction(data: Partial<CvDataExtractionOutput> | null | undefined) {
  return getExtractionQuality(data).hasMeaningfulExtraction;
}

export function hasRecoverableDraft(data: Partial<CvDataExtractionOutput> | null | undefined) {
  if (!data) return false;

  const quality = getExtractionQuality(data);
  if (quality.hasMeaningfulExtraction) return true;

  const hasIdentity = Boolean(quality.name || quality.email || quality.phone);
  const hasSummary = quality.summaryLength >= 24;
  const hasSkills = quality.skillsCount > 0;
  const hasExperience = quality.experienceCount > 0;
  const hasEducation = quality.educationCount > 0;

  return hasIdentity || hasSummary || hasSkills || hasExperience || hasEducation;
}

export function buildRecoveredExtractionFromText(
  rawText: string,
  options?: {
    jobId?: string;
    strategyUsed?: string;
    parsingMethod?: "fallback" | "text-llm";
    warning?: string;
  }
): CvDataExtractionOutput {
  const normalizedText = normalizeRecoverableText(rawText);

  const lines = normalizedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const headingIndex = (heading: string) =>
    lines.findIndex((line) => new RegExp(`^${heading}\\b`, "i").test(line));

  const summaryIndex = headingIndex("summary|profile|professional summary|personal statement");
  const experienceIndex = headingIndex("experience|employment|work history|professional experience");
  const skillsIndex = headingIndex("skills|technical skills|core competencies");
  const summarySectionLines = getSectionLines(lines, [/^summary$/i, /^profile$/i, /^professional summary$/i, /^personal statement$/i]);
  const experienceLines = getSectionLines(lines, [/^experience$/i, /^employment$/i, /^work history$/i, /^professional experience$/i]);
  const educationLines = getSectionLines(lines, [/^education$/i, /^academic background$/i, /^academic history$/i]);
  const skillSectionLines = getSectionLines(lines, [/^skills$/i, /^technical skills$/i, /^core competencies$/i]);

  const nameCandidate = findNameCandidate(lines);

  const fallbackSummaryLines =
    summaryIndex >= 0
      ? lines.slice(summaryIndex + 1, experienceIndex > summaryIndex ? experienceIndex : summaryIndex + 4)
      : [];

  const skillLines =
    skillSectionLines.length
      ? skillSectionLines
      : skillsIndex >= 0
      ? lines.slice(skillsIndex + 1, skillsIndex + 6)
      : lines.filter((line) => /,/.test(line) && line.length < 140).slice(0, 3);

  const skillText = skillLines.join(", ");
  const skills = uniqueStrings(skillText.split(/,|•|\||;/).map((item) => item.trim())).slice(0, 16);

  const candidate: CvDataExtractionOutput = {
    personalDetails: {
      name: normalizeString(nameCandidate),
      email: extractFirstMatch(normalizedText, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i),
      phone: extractFirstMatch(normalizedText, /(\+?\d[\d\s().-]{7,}\d)/),
      location: normalizeString(lines.find((line) => {
        const clean = line.toLowerCase();
        if (line.length > 60) return false;
        return /(remote|london|manchester|birmingham|leeds|glasgow|uk|united kingdom|new york|california|texas|usa|city|county|state)/i.test(clean) && !/manual/i.test(clean);
      })),
      linkedin: normalizeString(lines.find((line) => /linkedin\.com/i.test(line))),
      website: normalizeString(lines.find((line) => /(https?:\/\/|www\.)/i.test(line) && !/linkedin\.com/i.test(line))),
    },
    summary: findSummaryCandidate(lines, summarySectionLines.length ? summarySectionLines : fallbackSummaryLines),
    workExperience: parseGlobalExperienceEntries(lines).length ? parseGlobalExperienceEntries(lines) : parseExperienceEntries(experienceLines),
    education: parseGlobalEducationEntries(lines).length ? parseGlobalEducationEntries(lines) : parseEducationEntries(educationLines),
    skills,
    languages: [],
    projects: [],
    certifications: [],
    customSections: [],
    metadata: {
      confidence: 0.35,
      sectionConfidence: {},
      parsingMethod: options?.parsingMethod || "fallback",
      missingFields: [],
      warnings: [
        options?.warning || "Recovered a draft from the uploaded document text because the primary extraction path failed.",
      ],
      isWeak: true,
      jobId: options?.jobId,
      strategyUsed: options?.strategyUsed || "client-text-recovery",
      rawTextLength: normalizedText.length,
      guardian: {
        activated: true,
        status: "recovered",
        summary: "Recovered a draft from the uploaded document text.",
        attempts: 1,
        appliedFixes: ["Built a structured draft from the file text after the primary extraction result was unusable."],
      },
    },
  };

  candidate.metadata!.missingFields = deriveMissingFields(candidate);
  return CvDataExtractionOutputSchema.parse(candidate);
}
