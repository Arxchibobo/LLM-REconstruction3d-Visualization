import type { Session, WorkspaceModule, ModuleRecommendation } from '@/types/workspace';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'to', 'of', 'in',
  'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
  'and', 'but', 'or', 'not', 'no', 'so', 'if', 'then', 'than', 'that',
  'this', 'it', 'its', 'my', 'your', 'our', 'their', 'his', 'her',
  '的', '是', '了', '在', '和', '有', '我', '你', '他', '她', '它',
  '们', '这', '那', '个', '一', '不', '也', '都', '要', '就', '会',
  'use', 'using', 'used', 'want', 'make', 'get',
]);

function tokenize(text: string): Set<string> {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
  return new Set(tokens);
}

export function computeModuleRecommendations(
  session: Session,
  allModules: WorkspaceModule[],
  sessionModuleIds: Set<string>
): ModuleRecommendation[] {
  const allTokens = new Set([
    ...tokenize(session.description),
    ...tokenize(session.name),
  ]);

  if (allTokens.size === 0) return [];

  // Existing module types for affinity scoring
  const existingTypes = new Set<string>();
  for (const mid of sessionModuleIds) {
    const m = allModules.find((mod) => mod.id === mid);
    if (m) existingTypes.add(m.type);
  }

  const candidates = allModules
    .filter((m) => !sessionModuleIds.has(m.id))
    .map((module) => {
      let score = 0;
      const reasons: string[] = [];

      // Tag match (+0.3 per tag)
      const matchedTags = module.tags.filter((tag) =>
        [...allTokens].some((t) => tag.toLowerCase().includes(t) || t.includes(tag.toLowerCase()))
      );
      if (matchedTags.length > 0) {
        score += matchedTags.length * 0.3;
        reasons.push(`Tags: ${matchedTags.join(', ')}`);
      }

      // Name substring match (+0.4)
      const nameLower = module.name.toLowerCase();
      const nameMatch = [...allTokens].some(
        (t) => nameLower.includes(t) || t.includes(nameLower)
      );
      if (nameMatch) {
        score += 0.4;
        reasons.push('名称匹配');
      }

      // Description overlap (+0.1 per word, max 0.3)
      const descTokens = tokenize(module.description);
      const overlap = [...descTokens].filter((t) => allTokens.has(t));
      if (overlap.length > 0) {
        score += Math.min(overlap.length * 0.1, 0.3);
        reasons.push('描述相关');
      }

      // Type affinity (+0.1)
      if (existingTypes.has(module.type)) {
        score += 0.1;
        reasons.push(`同类型: ${module.type}`);
      }

      return {
        moduleId: module.id,
        score: Math.min(score, 1.0),
        reason: reasons.join(' | ') || '通用推荐',
      };
    })
    .filter((r) => r.score > 0.1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return candidates;
}
