# Remaining Files to Translate

Due to context limitations, the following files need manual translation following the established pattern:

## Pattern to Follow

1. Import statements:
```typescript
import { useLanguageStore } from '@/stores/useLanguageStore';
import { getTranslation } from '@/i18n/translations';
```

2. Inside component:
```typescript
const { language } = useLanguageStore();
const t = (key: string) => getTranslation(language, key);
```

3. Replace all hardcoded Chinese text with `t('key')` calls

## Files Needing Translation

### High Priority (User-facing)
- [ ] `src/app/login/page.tsx` - Login page
- [ ] `src/app/workspace/page.tsx` - Workspace main page
- [ ] `src/components/workspace-ui/ModulePalette.tsx` - Module list
- [ ] `src/components/workspace-ui/SessionPanel.tsx` - Session details
- [ ] `src/components/workspace-ui/WorkspaceTopBar.tsx` - Workspace top bar
- [ ] `src/components/workspace-ui/WorkspaceStatusBar.tsx` - Status bar
- [ ] `src/components/workspace-ui/CreateSessionDialog.tsx` - Create session dialog

### Medium Priority (3D Scene Labels)
- [ ] `src/components/scene/HooksLayerDetail.tsx` - Hooks labels
- [ ] `src/components/scene/CategoryNode.tsx` - Category labels (if exists)

### Low Priority (Internal)
- [ ] `src/components/workspace-ui/ChatInput.tsx`
- [ ] `src/components/workspace-ui/MessageBubble.tsx`
- [ ] `src/components/workspace-ui/RecommendationCard.tsx`
- [ ] `src/components/workspace-ui/SystemAnalysisCard.tsx`

## Translation Keys Already Available

All necessary translation keys are defined in `src/i18n/translations.ts`:
- `login.*` - Login page strings
- `workspace.*` - Workspace strings
- `createSession.*` - Create session dialog
- `v3.scene.*` - 3D scene labels
- `common.*` - Common UI strings

## Quick Reference

Chinese → English mapping examples:
- "登录" → `t('login.title')`
- "用户名" → `t('login.username')`
- "密码" → `t('login.password')`
- "模块" → `t('workspace.modules')`
- "会话" → `t('workspace.sessionName')`
- "创建" → `t('common.create')`
- "取消" → `t('common.cancel')`
- "关闭" → `t('common.close')`

## Status

✅ Completed:
- `src/stores/useLanguageStore.ts` - Language state management
- `src/i18n/translations.ts` - All translations defined
- `src/components/ui-v3/ModernTopBar.tsx` - Top bar with language switcher
- `src/components/ui-v3/ProfileModal.tsx` - Profile modal
- `src/components/ui-v3/SettingsModal.tsx` - Settings modal

⏳ In Progress:
- Login page and remaining workspace components need translation

## Quick Command to Check Remaining Chinese Text

```bash
# Find all Chinese characters in TSX files
cd "E:/Bobo's Coding cache/reconstruction-3d"
grep -rn "[\u4e00-\u9fff]" src/app src/components --include="*.tsx" --include="*.ts"
```

## Default Language

System now defaults to **English (en-US)**. Users can switch to Chinese using the language toggle button (🌐 icon) in the top bar.
