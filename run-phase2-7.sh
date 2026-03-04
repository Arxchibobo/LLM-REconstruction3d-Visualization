#!/bin/bash
# Phase 2-7 执行脚本

cd ~/.openclaw/workspace/LLM-REconstruction3d-Visualization

# 加载环境变量
source ~/.openclaw/workspace/.claude/env.sh

echo "=== Starting Phase 2-7 Execution ==="
echo "Time: $(date)"
echo "Model: claude-opus-4-6"
echo ""

# 创建执行指令文件
cat > /tmp/claude-phase2-7.txt << 'INSTRUCTIONS'
Continue from Phase 1. Execute Phase 2-7 without stopping:

**Phase 2: Function Testing**
- Test login page (visit /login, try Bobo/bobo123)
- Test /v3 page (3D visualization)
- Test /workspace page (drag & drop)
- Record any bugs in QUESTIONS.md but continue

**Phase 3: UI/UX Polish**
- Add error boundaries
- Improve loading states
- Add user feedback (toasts)

**Phase 4: Documentation**
- Update README.md with /workspace features
- Add screenshots or demo GIFs
- Write usage guide

**Phase 5: Generate Reports**
- Create CHANGELOG.md (all changes made)
- Create NEXT_STEPS.md (future work)
- Update COMPLETION_REPORT.md

**After each phase, commit to git with descriptive message.**

DO NOT STOP between phases. Execute all phases in one go.
Start now!
INSTRUCTIONS

echo "Instructions prepared. Starting Claude Code..."
echo ""

# 启动 Claude Code 并传入指令
claude \
  --model claude-opus-4-6 \
  --settings ~/.openclaw/workspace/.claude/config.json \
  --dangerously-skip-permissions \
  "$(cat /tmp/claude-phase2-7.txt)"

exit_code=$?
echo ""
echo "=== Execution Complete ==="
echo "Exit code: $exit_code"
echo "Time: $(date)"

exit $exit_code
