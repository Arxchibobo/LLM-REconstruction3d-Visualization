import type {
  ChatMessage,
  SessionAnalysis,
  SuggestedAction,
  WorkspaceModule,
  ModuleRecommendation,
  Session,
} from '@/types/workspace';
import { computeModuleRecommendations } from './recommendations';

// Bilingual keyword → intent mapping
const INTENT_MAP: Record<string, string[]> = {
  'code-review': [
    'review', 'code review', 'check code', 'lint', 'quality',
    '代码审查', '审查', '代码质量', '检查代码',
  ],
  'testing': [
    'test', 'unit test', 'e2e', 'coverage', 'tdd',
    '测试', '单元测试', '端到端', '覆盖率',
  ],
  'deployment': [
    'deploy', 'ci/cd', 'pipeline', 'release', 'publish',
    '部署', '发布', '上线', '流水线',
  ],
  'debugging': [
    'debug', 'bug', 'fix', 'error', 'issue', 'crash',
    '调试', '错误', '修复', 'bug', '问题', '崩溃',
  ],
  'frontend': [
    'react', 'next', 'ui', 'component', 'css', 'tailwind', 'page', 'layout',
    '前端', '组件', '界面', '页面', '布局', '样式',
  ],
  'backend': [
    'api', 'server', 'database', 'endpoint', 'rest', 'graphql', 'auth',
    '后端', '接口', '数据库', '服务器', '认证',
  ],
  'data': [
    'data', 'analytics', 'sql', 'query', 'report', 'chart', 'visualization',
    '数据', '分析', '查询', '报告', '图表', '可视化',
  ],
  'automation': [
    'automate', 'script', 'bot', 'scrape', 'crawl', 'schedule',
    '自动化', '脚本', '爬虫', '定时',
  ],
  'security': [
    'security', 'auth', 'oauth', 'vulnerability', 'encrypt',
    '安全', '认证', '授权', '漏洞', '加密',
  ],
  'documentation': [
    'doc', 'readme', 'document', 'guide', 'tutorial',
    '文档', '说明', '指南', '教程',
  ],
  'performance': [
    'performance', 'optimize', 'speed', 'cache', 'latency', 'slow',
    '性能', '优化', '速度', '缓存', '延迟', '慢',
  ],
  'refactoring': [
    'refactor', 'cleanup', 'restructure', 'migrate', 'modernize',
    '重构', '清理', '迁移', '现代化',
  ],
};

function detectIntents(text: string): string[] {
  const lower = text.toLowerCase();
  const detected: string[] = [];

  for (const [intent, keywords] of Object.entries(INTENT_MAP)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      detected.push(intent);
    }
  }

  return detected.length > 0 ? detected : ['general'];
}

function generateSummary(
  intents: string[],
  messageCount: number,
  moduleCount: number,
  recCount: number,
): string {
  const intentLabels: Record<string, string> = {
    'code-review': 'Code Review',
    'testing': 'Testing',
    'deployment': 'Deployment',
    'debugging': 'Debugging',
    'frontend': 'Frontend Development',
    'backend': 'Backend Development',
    'data': 'Data & Analytics',
    'automation': 'Automation',
    'security': 'Security',
    'documentation': 'Documentation',
    'performance': 'Performance Optimization',
    'refactoring': 'Refactoring',
    'general': 'General',
  };

  const intentNames = intents.map((i) => intentLabels[i] || i).join(', ');

  if (messageCount <= 1) {
    if (recCount > 0) {
      return `Detected focus area: **${intentNames}**. Found ${recCount} recommended module${recCount > 1 ? 's' : ''} based on your requirement.${moduleCount > 0 ? ` You currently have ${moduleCount} module${moduleCount > 1 ? 's' : ''} attached.` : ''}`;
    }
    return `Detected focus area: **${intentNames}**. Describe your requirement in more detail for better module recommendations.`;
  }

  return `Updated analysis — focus: **${intentNames}**. ${recCount} recommended module${recCount > 1 ? 's' : ''} available. ${moduleCount} module${moduleCount > 1 ? 's' : ''} attached so far.`;
}

function generateActions(
  intents: string[],
  recs: ModuleRecommendation[],
  session: Session,
): SuggestedAction[] {
  const actions: SuggestedAction[] = [];

  // Action: add high-scoring modules
  const topRecs = recs.filter((r) => r.score >= 0.3).slice(0, 3);
  if (topRecs.length > 0) {
    actions.push({
      label: `Add ${topRecs.length} module${topRecs.length > 1 ? 's' : ''}`,
      description: `Add top recommended modules to this session`,
      type: 'add-modules',
      moduleIds: topRecs.map((r) => r.moduleId),
    });
  }

  // Action: mark as ready when enough modules
  if (session.moduleIds.length >= 3 && session.status === 'drafting') {
    actions.push({
      label: 'Mark as Ready',
      description: 'Session has enough modules — mark it ready to run',
      type: 'change-status',
      targetStatus: 'ready',
    });
  }

  // Action: refine if vague
  if (intents.includes('general') && intents.length === 1) {
    actions.push({
      label: 'Be more specific',
      description: 'Try mentioning specific technologies or goals for better results',
      type: 'refine-requirement',
    });
  }

  // Always add an info tip
  const tips = [
    'Drag modules from the left palette to add them manually.',
    'You can keep chatting to refine recommendations.',
    'Modules are matched by keywords in your description.',
    'Try mentioning specific tools like "React", "PostgreSQL", or "Playwright".',
  ];
  actions.push({
    label: 'Tip',
    description: tips[Math.floor(Math.random() * tips.length)],
    type: 'info',
  });

  return actions;
}

export function generateChatResponse(
  session: Session,
  allModules: WorkspaceModule[],
): SessionAnalysis {
  // Aggregate all user messages
  const userTexts = session.messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join(' ');

  const fullText = `${session.name} ${session.description} ${userTexts}`;

  // Detect intents
  const detectedIntents = detectIntents(fullText);

  // Compute module recommendations
  const sessionModuleIds = new Set(session.moduleIds);
  // Create a virtual session with aggregated text for better matching
  const virtualSession: Session = {
    ...session,
    description: fullText,
  };
  const recommendedModules = computeModuleRecommendations(
    virtualSession,
    allModules,
    sessionModuleIds,
  );

  // Generate summary
  const summary = generateSummary(
    detectedIntents,
    session.messages.filter((m) => m.role === 'user').length,
    session.moduleIds.length,
    recommendedModules.length,
  );

  // Generate suggested actions
  const suggestedActions = generateActions(
    detectedIntents,
    recommendedModules,
    session,
  );

  return {
    summary,
    detectedIntents,
    recommendedModules,
    suggestedActions,
  };
}
