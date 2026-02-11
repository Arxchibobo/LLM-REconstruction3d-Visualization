export const translations = {
  'en-US': {
    // Common
    common: {
      close: 'Close',
      cancel: 'Cancel',
      save: 'Save',
      create: 'Create',
      edit: 'Edit',
      delete: 'Delete',
      confirm: 'Confirm',
      loading: 'Loading...',
      search: 'Search',
      filter: 'Filter',
      all: 'All',
      none: 'None',
      required: 'Required',
      optional: 'Optional',
    },

    // Login Page
    login: {
      title: 'Sign In',
      subtitle: 'Access your knowledge base',
      username: 'Username',
      password: 'Password',
      usernamePlaceholder: 'Enter your username',
      passwordPlaceholder: 'Enter your password',
      loginButton: 'Sign In',
      quickLogin: 'Quick Login',
      loggingIn: 'Signing in...',
      invalidCredentials: 'Invalid username or password',
      demoUsers: 'Demo Users',
    },

    // Top Bar
    topBar: {
      knowGraph: 'KnowGraph',
      subtitle: 'Knowledge Base Visualization',
      workspace: 'Workspace',
      claudeConfig: 'Claude Config',
      projectStructure: 'Project Structure',
      settings: 'Settings',
      profile: 'Profile',
      projectSettings: 'Project Settings',
      themeSettings: 'Theme Settings',
      logout: 'Sign Out',
      admin: 'Admin',
      viewer: 'Viewer',
    },

    // Profile Modal
    profile: {
      title: 'User Profile',
      username: 'Username',
      displayName: 'Display Name',
      role: 'Role',
      joinedAt: 'Joined',
      editName: 'Edit Display Name',
      namePlaceholder: 'Enter display name',
      saved: 'Saved!',
      roleAdmin: 'Admin',
      roleViewer: 'Viewer',
    },

    // Settings Modal
    settings: {
      title: 'Project Settings',
      visualEffects: 'Visual Effects',
      particleEffects: 'Particle Effects',
      particleDesc: 'Show floating particles in background',
      gridFloor: 'Grid Floor',
      gridDesc: 'Display grid floor in 3D scene',
      enableAnimations: 'Enable Animations',
      animationsDesc: 'Enable rotation and floating animations',
      performance: 'Performance',
      performanceMode: 'Performance Mode',
      performanceHigh: 'High Quality',
      performanceBalanced: 'Balanced',
      performanceLow: 'Performance',
      appearance: 'Appearance',
      themeMode: 'Theme Mode',
      themeLight: 'Light',
      themeDark: 'Dark',
      themeAuto: 'Auto',
      language: 'Language',
      languageLabel: 'Interface Language',
    },

    // Workspace
    workspace: {
      title: 'Workspace',
      createSession: 'New Session',
      modules: 'MODULES',
      searchModules: 'Search modules...',
      selectedModules: 'modules selected',
      selectedModule: 'module selected',
      clear: 'Clear',
      multiSelectHint: 'Shift+Click to multi-select • Drag to batch add',
      dropToCreate: 'Drop to create new session',

      // Module Types
      skills: 'Skills',
      mcps: 'MCPs',
      plugins: 'Plugins',
      hooks: 'Hooks',
      rules: 'Rules',
      agents: 'Agents',
      memory: 'Memory',

      // Session Panel
      sessionDetails: 'Session Details',
      noSessionSelected: 'No session selected',
      selectSessionPrompt: 'Select a session to view details',
      sessionName: 'Session Name',
      requirement: 'Requirement',
      addedModules: 'Added Modules',
      noModules: 'No modules added yet',
      systemAnalysis: 'System Analysis',
      recommendations: 'Recommendations',
      chat: 'Chat',
      typeSomething: 'Type something...',
      analyzing: 'Analyzing...',

      // Status Bar
      statusBar: {
        totalSessions: 'Total Sessions',
        totalModules: 'Total Modules',
        activeModules: 'Active Modules',
        version: 'Cyberpunk',
      },
    },

    // Create Session Dialog
    createSession: {
      title: 'NEW SESSION',
      sessionName: 'SESSION NAME',
      namePlaceholder: 'e.g. API Development',
      requirement: 'REQUIREMENT',
      requirementPlaceholder: 'Describe the problem you want to solve...',
      autoAddHint: 'Module "{moduleId}" will be auto-added',
      cancel: 'Cancel',
      create: 'Create',
    },

    // V3 Knowledge Graph Page
    v3: {
      title: 'Knowledge Base',
      filters: 'FILTERS',
      nodeStats: 'Node Statistics',
      totalNodes: 'Total Nodes',
      enabledTypes: 'Enabled Types',
      nodeTypes: 'Node Types',
      showNodes: 'Show {count} nodes',
      categories: 'Categories',
      centerView: 'Center View',
      resetView: 'Reset View',

      // 3D Scene Labels
      scene: {
        skills: 'Skills',
        plugins: 'Plugins',
        mcpServers: 'MCP Servers',
        hooks: 'Hooks',
        rules: 'Rules',
        agents: 'Agents',
        memory: 'Memory',
        categories: 'Categories',

        // Hook Architecture
        hooksArchitecture: 'Hook Architecture',
        preToolUse: 'PreToolUse',
        preToolUseDesc: 'Before tool execution',
        postToolUse: 'PostToolUse',
        postToolUseDesc: 'After tool execution',
        stop: 'Stop',
        stopDesc: 'Session end verification',
      },
    },

    // Recommendations
    recommendations: {
      title: 'Recommended Modules',
      addToSession: 'Add to Session',
      relevance: 'Relevance',
      highRelevance: 'High',
      mediumRelevance: 'Medium',
      lowRelevance: 'Low',
    },

    // Chat
    chat: {
      user: 'You',
      assistant: 'Assistant',
      thinking: 'Thinking...',
      noMessages: 'No messages yet. Start a conversation!',
    },
  },

  'zh-CN': {
    // 通用
    common: {
      close: '关闭',
      cancel: '取消',
      save: '保存',
      create: '创建',
      edit: '编辑',
      delete: '删除',
      confirm: '确认',
      loading: '加载中...',
      search: '搜索',
      filter: '筛选',
      all: '全部',
      none: '无',
      required: '必填',
      optional: '可选',
    },

    // 登录页面
    login: {
      title: '登录',
      subtitle: '访问您的知识库',
      username: '用户名',
      password: '密码',
      usernamePlaceholder: '请输入用户名',
      passwordPlaceholder: '请输入密码',
      loginButton: '登录',
      quickLogin: '快速登录',
      loggingIn: '登录中...',
      invalidCredentials: '用户名或密码错误',
      demoUsers: '演示用户',
    },

    // 顶部栏
    topBar: {
      knowGraph: 'KnowGraph',
      subtitle: '工程化知识可视化',
      workspace: 'Workspace',
      claudeConfig: 'Claude 配置',
      projectStructure: '项目结构',
      settings: '设置',
      profile: '个人资料',
      projectSettings: '项目设置',
      themeSettings: '主题设置',
      logout: '退出登录',
      admin: '管理员',
      viewer: '访客',
    },

    // 个人资料弹窗
    profile: {
      title: '个人资料',
      username: '用户名',
      displayName: '显示名称',
      role: '角色',
      joinedAt: '加入时间',
      editName: '编辑显示名称',
      namePlaceholder: '请输入显示名称',
      saved: '已保存！',
      roleAdmin: '管理员',
      roleViewer: '访客',
    },

    // 设置弹窗
    settings: {
      title: '项目设置',
      visualEffects: '视觉效果',
      particleEffects: '粒子特效',
      particleDesc: '在背景显示浮动粒子',
      gridFloor: '网格地板',
      gridDesc: '在 3D 场景中显示网格地板',
      enableAnimations: '启用动画',
      animationsDesc: '启用旋转和浮动动画',
      performance: '性能',
      performanceMode: '性能模式',
      performanceHigh: '高质量',
      performanceBalanced: '平衡',
      performanceLow: '性能优先',
      appearance: '外观',
      themeMode: '主题模式',
      themeLight: '浅色',
      themeDark: '深色',
      themeAuto: '自动',
      language: '语言',
      languageLabel: '界面语言',
    },

    // 工作区
    workspace: {
      title: 'Workspace',
      createSession: '新建会话',
      modules: '模块',
      searchModules: '搜索模块...',
      selectedModules: '个模块已选中',
      selectedModule: '个模块已选中',
      clear: '清除',
      multiSelectHint: 'Shift+点击多选 • 拖拽批量添加',
      dropToCreate: '放置以创建新会话',

      // 模块类型
      skills: 'Skills',
      mcps: 'MCPs',
      plugins: 'Plugins',
      hooks: 'Hooks',
      rules: 'Rules',
      agents: 'Agents',
      memory: 'Memory',

      // 会话面板
      sessionDetails: '会话详情',
      noSessionSelected: '未选择会话',
      selectSessionPrompt: '选择一个会话以查看详情',
      sessionName: '会话名称',
      requirement: '需求描述',
      addedModules: '已添加模块',
      noModules: '暂无模块',
      systemAnalysis: '系统分析',
      recommendations: '推荐模块',
      chat: '对话',
      typeSomething: '输入内容...',
      analyzing: '分析中...',

      // 状态栏
      statusBar: {
        totalSessions: '总会话数',
        totalModules: '总模块数',
        activeModules: '活跃模块',
        version: 'Cyberpunk',
      },
    },

    // 创建会话对话框
    createSession: {
      title: '新建会话',
      sessionName: '会话名称',
      namePlaceholder: '例如：API 开发',
      requirement: '需求描述',
      requirementPlaceholder: '描述你要解决的问题...',
      autoAddHint: '模块 "{moduleId}" 将自动添加',
      cancel: '取消',
      create: '创建',
    },

    // V3 知识图谱页面
    v3: {
      title: '知识库',
      filters: '过滤器',
      nodeStats: '节点统计',
      totalNodes: '总节点',
      enabledTypes: '已启用类型',
      nodeTypes: '节点类型',
      showNodes: '显示 {count} 个节点',
      categories: '分类',
      centerView: '居中',
      resetView: '重置',

      // 3D 场景标签
      scene: {
        skills: 'Skills',
        plugins: 'Plugins',
        mcpServers: 'MCP Servers',
        hooks: 'Hooks',
        rules: 'Rules',
        agents: 'Agents',
        memory: 'Memory',
        categories: '分类',

        // Hook 架构
        hooksArchitecture: 'Hook 架构',
        preToolUse: 'PreToolUse',
        preToolUseDesc: '工具执行前',
        postToolUse: 'PostToolUse',
        postToolUseDesc: '工具执行后',
        stop: 'Stop',
        stopDesc: '会话结束验证',
      },
    },

    // 推荐
    recommendations: {
      title: '推荐模块',
      addToSession: '添加到会话',
      relevance: '相关度',
      highRelevance: '高',
      mediumRelevance: '中',
      lowRelevance: '低',
    },

    // 对话
    chat: {
      user: '你',
      assistant: '助手',
      thinking: '思考中...',
      noMessages: '暂无消息。开始对话吧！',
    },
  },
};

export type TranslationKey = keyof typeof translations['en-US'];

export function getTranslation(lang: 'en-US' | 'zh-CN', key: string): string {
  const keys = key.split('.');
  let value: any = translations[lang];

  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      return key; // Return key if translation not found
    }
  }

  return typeof value === 'string' ? value : key;
}

// Helper hook
export function useTranslation() {
  return { t: getTranslation };
}
