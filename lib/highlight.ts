import { codeToHtml } from 'shiki';

const LANGUAGE_ALIASES: Record<string, string> = {
  'plain text': 'text',
  plaintext: 'text',
  'c#': 'csharp',
  'c++': 'cpp',
};

export async function highlightCode(code: string, language: string) {
  const normalized = language.toLowerCase();
  const requested = LANGUAGE_ALIASES[normalized] ?? (normalized || 'text');

  try {
    return await codeToHtml(code, {
      lang: requested,
      theme: 'github-dark',
    });
  } catch {
    return await codeToHtml(code, {
      lang: 'text',
      theme: 'github-dark',
    });
  }
}
