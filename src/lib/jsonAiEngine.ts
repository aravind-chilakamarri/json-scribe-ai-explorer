/**
 * JSON AI Engine — Client-side intelligence for answering questions about JSON data.
 * 
 * Indexes JSON into flat path→value maps and uses keyword matching + path traversal
 * to answer natural language questions without any external API.
 */

export interface FlatEntry {
  path: string;       // e.g. "meta.environment"
  key: string;        // e.g. "environment"
  value: any;
  type: string;       // "string" | "number" | "boolean" | "null" | "object" | "array"
  depth: number;
  parentPath: string; // e.g. "meta"
}

export interface JsonContext {
  tabName: string;
  tabId: string;
  raw: any;
  entries: FlatEntry[];
}

// ─── Flatten JSON into searchable entries ────────────────────────────────────

function flattenJson(data: any, prefix = '', depth = 0): FlatEntry[] {
  const entries: FlatEntry[] = [];

  if (data === null || data === undefined) {
    entries.push({
      path: prefix || 'root',
      key: prefix.split('.').pop() || 'root',
      value: null,
      type: 'null',
      depth,
      parentPath: prefix.split('.').slice(0, -1).join('.') || '',
    });
    return entries;
  }

  if (Array.isArray(data)) {
    entries.push({
      path: prefix || 'root',
      key: prefix.split('.').pop() || 'root',
      value: data,
      type: 'array',
      depth,
      parentPath: prefix.split('.').slice(0, -1).join('.') || '',
    });
    data.forEach((item, i) => {
      entries.push(...flattenJson(item, `${prefix}[${i}]`, depth + 1));
    });
  } else if (typeof data === 'object') {
    entries.push({
      path: prefix || 'root',
      key: prefix.split('.').pop() || 'root',
      value: data,
      type: 'object',
      depth,
      parentPath: prefix.split('.').slice(0, -1).join('.') || '',
    });
    for (const [key, val] of Object.entries(data)) {
      const newPath = prefix ? `${prefix}.${key}` : key;
      entries.push(...flattenJson(val, newPath, depth + 1));
    }
  } else {
    entries.push({
      path: prefix || 'root',
      key: prefix.split('.').pop() || 'root',
      value: data,
      type: typeof data,
      depth,
      parentPath: prefix.split('.').slice(0, -1).join('.') || '',
    });
  }

  return entries;
}

// ─── Build context from tabs ─────────────────────────────────────────────────

export function buildContexts(
  tabs: Array<{ id: string; name: string; parsedContent?: any; isValid: boolean }>
): JsonContext[] {
  return tabs
    .filter(t => t.isValid && t.parsedContent != null)
    .map(t => ({
      tabName: t.name,
      tabId: t.id,
      raw: t.parsedContent,
      entries: flattenJson(t.parsedContent),
    }));
}

// ─── Question answering engine ───────────────────────────────────────────────

const STOP_WORDS = new Set([
  'what', 'is', 'the', 'a', 'an', 'of', 'in', 'for', 'and', 'or', 'to',
  'my', 'me', 'this', 'that', 'it', 'its', 'are', 'was', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'can', 'may', 'might', 'shall', 'there',
  'their', 'they', 'them', 'which', 'who', 'whom', 'how', 'when', 'where',
  'why', 'all', 'each', 'every', 'any', 'some', 'no', 'not', 'only',
  'same', 'than', 'too', 'very', 'just', 'about', 'also', 'json', 'data',
  'tell', 'show', 'give', 'get', 'find', 'list', 'value', 'please',
]);

function extractKeywords(question: string): string[] {
  return question
    .toLowerCase()
    .replace(/[?!.,;:'"]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

function scoreEntry(entry: FlatEntry, keywords: string[]): number {
  let score = 0;
  const pathLower = entry.path.toLowerCase();
  const keyLower = entry.key.toLowerCase();
  const valStr = String(entry.value ?? '').toLowerCase();

  for (const kw of keywords) {
    // Exact key match is strongest
    if (keyLower === kw) score += 10;
    // Key contains keyword
    else if (keyLower.includes(kw)) score += 6;
    // Path contains keyword
    if (pathLower.includes(kw)) score += 4;
    // Value contains keyword (for filtering)
    if (valStr.includes(kw)) score += 2;
  }

  // Prefer primitive values over containers
  if (entry.type !== 'object' && entry.type !== 'array') score += 3;
  // Prefer shallower paths
  score -= entry.depth * 0.5;

  return score;
}

function formatValue(value: any, depth = 0): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[] (empty array)';
    if (value.length <= 8 && value.every(v => typeof v !== 'object')) {
      return `[${value.map(v => typeof v === 'string' ? `"${v}"` : String(v)).join(', ')}]`;
    }
    if (depth < 1 && value.length <= 5) {
      return `[\n${value.map(v => '  ' + formatValue(v, depth + 1)).join(',\n')}\n]`;
    }
    return `Array with ${value.length} items`;
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) return '{} (empty object)';
    if (depth < 1 && keys.length <= 6) {
      const lines = keys.map(k => `  ${k}: ${formatValue(value[k], depth + 1)}`);
      return `{\n${lines.join(',\n')}\n}`;
    }
    return `Object with keys: ${keys.join(', ')}`;
  }
  return String(value);
}

// ─── Pattern-based question handlers ─────────────────────────────────────────

type QuestionHandler = {
  match: (q: string) => boolean;
  handle: (q: string, contexts: JsonContext[]) => string | null;
};

const handlers: QuestionHandler[] = [
  // Structure / top-level keys
  {
    match: q => /(?:top.?level|root|structure|keys|properties|fields)\b/i.test(q) ||
                /(?:what does .* contain|what.*(?:structure|shape))/i.test(q),
    handle: (_, contexts) => {
      const parts = contexts.map(ctx => {
        const keys = typeof ctx.raw === 'object' && ctx.raw !== null && !Array.isArray(ctx.raw)
          ? Object.keys(ctx.raw)
          : null;
        if (keys) {
          return `**${ctx.tabName}** has ${keys.length} top-level keys:\n${keys.map(k => `  • \`${k}\``).join('\n')}`;
        }
        if (Array.isArray(ctx.raw)) {
          return `**${ctx.tabName}** is an array with ${ctx.raw.length} items.`;
        }
        return `**${ctx.tabName}** is a ${typeof ctx.raw} value.`;
      });
      return parts.join('\n\n');
    },
  },

  // Count questions
  {
    match: q => /how many|count|number of|total/i.test(q),
    handle: (q, contexts) => {
      const keywords = extractKeywords(q).filter(k => !['many', 'count', 'number', 'total', 'much'].includes(k));
      const results: string[] = [];

      for (const ctx of contexts) {
        for (const entry of ctx.entries) {
          if (entry.type === 'array' && keywords.some(kw => entry.path.toLowerCase().includes(kw))) {
            results.push(`**${entry.path}** contains **${(entry.value as any[]).length} items** (in ${ctx.tabName})`);
          }
        }
      }

      if (results.length > 0) return results.join('\n');

      // Fallback: count matching entries
      for (const ctx of contexts) {
        const matches = ctx.entries.filter(e =>
          keywords.some(kw => e.key.toLowerCase().includes(kw) || e.path.toLowerCase().includes(kw))
        );
        if (matches.length > 0) {
          results.push(`Found **${matches.length}** entries matching your query in **${ctx.tabName}**.`);
        }
      }

      return results.length > 0 ? results.join('\n') : null;
    },
  },

  // Comparison / difference between tabs
  {
    match: q => /(?:compare|difference|diff|between.*tab|across.*tab|all tab)/i.test(q),
    handle: (_, contexts) => {
      if (contexts.length < 2) {
        return 'You only have one tab with valid JSON. Open multiple tabs to compare them.';
      }
      const summaries = contexts.map(ctx => {
        const type = Array.isArray(ctx.raw) ? 'array' : typeof ctx.raw;
        const size = ctx.entries.length;
        const topKeys = typeof ctx.raw === 'object' && !Array.isArray(ctx.raw)
          ? Object.keys(ctx.raw).join(', ')
          : 'N/A';
        return `**${ctx.tabName}**: ${type}, ${size} total entries, top keys: ${topKeys}`;
      });
      return `Here's a comparison of your ${contexts.length} tabs:\n\n${summaries.join('\n\n')}`;
    },
  },

  // List / enumerate
  {
    match: q => /(?:list|enumerate|show all|what are)\b/i.test(q),
    handle: (q, contexts) => {
      const keywords = extractKeywords(q);
      const results: string[] = [];

      for (const ctx of contexts) {
        // Find arrays or objects that match
        const matches = ctx.entries
          .filter(e => (e.type === 'array' || e.type === 'object') &&
            keywords.some(kw => e.key.toLowerCase().includes(kw) || e.path.toLowerCase().includes(kw)))
          .sort((a, b) => scoreEntry(b, keywords) - scoreEntry(a, keywords));

        if (matches.length > 0) {
          const best = matches[0];
          results.push(`**${best.path}** (in ${ctx.tabName}):\n${formatValue(best.value)}`);
        }
      }

      return results.length > 0 ? results.join('\n\n') : null;
    },
  },

  // Type questions
  {
    match: q => /(?:type of|what type|is .* (?:a|an) )/i.test(q),
    handle: (q, contexts) => {
      const keywords = extractKeywords(q).filter(k => !['type'].includes(k));
      for (const ctx of contexts) {
        const best = ctx.entries
          .map(e => ({ entry: e, score: scoreEntry(e, keywords) }))
          .filter(x => x.score > 0)
          .sort((a, b) => b.score - a.score)[0];
        if (best) {
          const e = best.entry;
          let desc = `**${e.path}** is a **${e.type}**`;
          if (e.type === 'array') desc += ` with ${(e.value as any[]).length} items`;
          if (e.type === 'object') desc += ` with keys: ${Object.keys(e.value).join(', ')}`;
          return desc + `.`;
        }
      }
      return null;
    },
  },
];

// ─── Main answer function ────────────────────────────────────────────────────

export function answerQuestion(question: string, contexts: JsonContext[]): string {
  if (contexts.length === 0) {
    return 'No valid JSON data found. Please paste valid JSON in the editor.';
  }

  const q = question.trim();

  // Try pattern handlers first
  for (const handler of handlers) {
    if (handler.match(q)) {
      const result = handler.handle(q, contexts);
      if (result) return result;
    }
  }

  // Fallback: keyword-based search across all entries
  const keywords = extractKeywords(q);

  if (keywords.length === 0) {
    // Very generic question — give summary
    const ctx = contexts[0];
    const topKeys = typeof ctx.raw === 'object' && !Array.isArray(ctx.raw)
      ? Object.keys(ctx.raw)
      : [];
    return `Your JSON in **${ctx.tabName}** has ${topKeys.length > 0 ? `these top-level keys: ${topKeys.map(k => `\`${k}\``).join(', ')}` : `${ctx.entries.length} entries`}.\n\nTry asking specific questions like:\n• "What is the environment?"\n• "How many projects are there?"\n• "List all events"\n• "What are the user roles?"`;
  }

  // Score all entries across all contexts
  const scored: Array<{ entry: FlatEntry; ctx: JsonContext; score: number }> = [];
  for (const ctx of contexts) {
    for (const entry of ctx.entries) {
      const s = scoreEntry(entry, keywords);
      if (s > 0) scored.push({ entry, ctx, score: s });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return `I couldn't find anything matching "${keywords.join(', ')}" in your JSON data.\n\nTry rephrasing your question or checking if the key/value exists.`;
  }

  // Return the best match(es)
  const best = scored[0];
  const entry = best.entry;
  const isPrimitive = entry.type !== 'object' && entry.type !== 'array';

  if (isPrimitive) {
    // Direct value answer
    let answer = `**${formatValue(entry.value)}**`;
    answer += `\n\n_Found at path:_ \`${entry.path}\``;

    // If there are other good matches, mention them
    const others = scored
      .slice(1, 4)
      .filter(x => x.score >= best.score * 0.6 && x.entry.type !== 'object' && x.entry.type !== 'array');
    if (others.length > 0) {
      answer += '\n\n_Related values:_';
      for (const o of others) {
        answer += `\n• \`${o.entry.path}\` = ${formatValue(o.entry.value)}`;
      }
    }

    if (contexts.length > 1) {
      answer += `\n\n_(from ${best.ctx.tabName})_`;
    }

    return answer;
  }

  // Container value
  let answer = `**${entry.path}** is a${entry.type === 'array' ? 'n array' : 'n object'}`;
  if (entry.type === 'array') {
    answer += ` with **${(entry.value as any[]).length} items**`;
  } else {
    answer += ` with **${Object.keys(entry.value).length} keys**`;
  }
  answer += `:\n\n${formatValue(entry.value)}`;

  if (contexts.length > 1) {
    answer += `\n\n_(from ${best.ctx.tabName})_`;
  }

  return answer;
}

// ─── Suggested questions generator ───────────────────────────────────────────

export function suggestQuestions(contexts: JsonContext[]): string[] {
  if (contexts.length === 0) return [];

  const suggestions: string[] = [];
  const ctx = contexts[0];
  const raw = ctx.raw;

  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
    const keys = Object.keys(raw);

    // Suggest questions about specific keys
    for (const key of keys.slice(0, 3)) {
      const val = raw[key];
      if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
        suggestions.push(`What is the ${key}?`);
      } else if (Array.isArray(val)) {
        suggestions.push(`How many ${key} are there?`);
      } else if (typeof val === 'object' && val !== null) {
        suggestions.push(`What does ${key} contain?`);
      }
    }

    suggestions.push('What are the top-level keys?');

    // If there are arrays, suggest listing
    for (const entry of ctx.entries) {
      if (entry.type === 'array' && (entry.value as any[]).length > 0 && entry.depth <= 1) {
        suggestions.push(`List all ${entry.key}`);
        break;
      }
    }
  } else if (Array.isArray(raw)) {
    suggestions.push(`How many items are in the array?`);
    suggestions.push('What is the structure of the first item?');
  }

  if (contexts.length > 1) {
    suggestions.push('Compare all tabs');
  }

  return suggestions.slice(0, 5);
}
