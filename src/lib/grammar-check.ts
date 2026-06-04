export interface GrammarIssue {
  message: string;
  offset: number;
  length: number;
  bad: string;
  suggestions: string[];
  context: string;
}

export async function checkGrammar(plainText: string): Promise<GrammarIssue[]> {
  if (!plainText || plainText.trim().length < 15) return [];

  try {
    const body = new URLSearchParams({ text: plainText, language: 'en-US' });
    const res = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return [];

    const data = await res.json();
    return (data.matches || [])
      .filter((m: any) => m.replacements?.length > 0)
      .map((m: any) => ({
        message: m.message,
        offset: m.offset,
        length: m.length,
        bad: plainText.slice(m.offset, m.offset + m.length),
        suggestions: (m.replacements || []).slice(0, 3).map((r: any) => r.value),
        context: m.context?.text || '',
      }));
  } catch {
    return [];
  }
}
