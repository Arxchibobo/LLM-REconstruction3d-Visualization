# 部署指南

**项目**: LLM REconstruction3D Visualization  
**状态**: ✅ 就绪，已测试  
**日期**: 2026-03-04

---

## 🎯 快速部署

### 选项 1: Vercel (推荐)

**一键部署**:
1. 访问 [vercel.com](https://vercel.com)
2. 点击 "New Project"
3. 导入 GitHub 仓库：`Arxchibobo/LLM-REconstruction3d-Visualization`
4. Framework Preset: **Next.js** (自动检测)
5. 点击 "Deploy"

**环境变量** (可选):
```
NEXT_PUBLIC_CLAUDE_CONFIG_PATH=/path/to/.claude
```

**部署时间**: ~2 分钟  
**URL**: `https://your-project.vercel.app`

---

### 选项 2: Netlify

1. 访问 [netlify.com](https://netlify.com)
2. 新建站点从 Git
3. 选择仓库
4. Build 命令: `npm run build`
5. Publish 目录: `out/`
6. 点击 "Deploy site"

**部署时间**: ~3 分钟  
**URL**: `https://your-project.netlify.app`

---

### 选项 3: 静态托管 (GitHub Pages / Cloudflare Pages)

**生成静态文件**:
```bash
cd ~/.openclaw/workspace/LLM-REconstruction3d-Visualization
npm run build
# 输出目录: out/
```

**GitHub Pages**:
1. 创建 `gh-pages` 分支
2. 将 `out/` 内容推送到该分支
3. 在 GitHub 仓库设置中启用 Pages
4. 选择 `gh-pages` 分支

**Cloudflare Pages**:
1. 连接 GitHub 仓库
2. Build 命令: `npm run build`
3. Output 目录: `out`

---

### 选项 4: Docker 容器

**Dockerfile** (项目已包含):
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

**部署步骤**:
```bash
docker build -t knowgraph .
docker run -p 3000:3000 knowgraph
```

**Docker Compose**:
```yaml
version: '3.8'
services:
  knowgraph:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
```

---

### 选项 5: VPS / 云服务器

**环境要求**:
- Node.js 18+
- npm / yarn
- 2GB+ RAM
- 10GB+ 存储

**部署步骤**:
```bash
# 1. SSH 到服务器
ssh user@your-server.com

# 2. 克隆仓库
git clone https://github.com/Arxchibobo/LLM-REconstruction3d-Visualization.git
cd LLM-REconstruction3d-Visualization

# 3. 安装依赖
npm install

# 4. 构建
npm run build

# 5. 使用 PM2 运行
npm install -g pm2
pm2 start npm --name "knowgraph" -- start
pm2 save
pm2 startup

# 6. 配置 Nginx (可选)
sudo nano /etc/nginx/sites-available/knowgraph
```

**Nginx 配置示例**:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔧 环境变量配置

### 必需变量
无（使用默认配置）

### 可选变量
```bash
# Claude 配置路径
NEXT_PUBLIC_CLAUDE_CONFIG_PATH=/path/to/.claude

# API 密钥（本地开发）
CLAUDE_CONFIG_API_KEY=your-api-key
NEXT_PUBLIC_CLAUDE_CONFIG_API_KEY=your-api-key
```

---

## ✅ 部署前检查清单

- [x] 代码已提交到 Git
- [x] 构建成功（`npm run build`）
- [x] 环境变量已配置（如果需要）
- [x] 域名已配置（如果自定义域名）
- [x] SSL 证书已配置（推荐 Let's Encrypt）
- [ ] 监控已设置（可选）
- [ ] 备份已配置（可选）

---

## 📊 性能优化建议

### 1. CDN 配置
- 使用 Cloudflare / Fastly
- 缓存静态资源（/_next/static）
- 地理分布加速

### 2. 图片优化
- 启用 Next.js Image Optimization
- WebP 格式
- 懒加载

### 3. 缓存策略
```nginx
# Nginx 缓存配置
location /_next/static {
    expires 365d;
    add_header Cache-Control "public, immutable";
}
```

---

## 🔒 安全配置

### 1. HTTPS
```bash
# Let's Encrypt (Certbot)
sudo certbot --nginx -d your-domain.com
```

### 2. 环境变量
- ⚠️ 不要在代码中硬编码密钥
- ✅ 使用 .env.local（已在 .gitignore）
- ✅ 生产环境使用平台的环境变量

### 3. 安全头
```nginx
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
```

---

## 📈 监控和日志

### Vercel Analytics
```bash
npm install @vercel/analytics
# 在 app/layout.tsx 中添加
import { Analytics } from '@vercel/analytics/react';
```

### 错误追踪 (Sentry)
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### 日志服务
- Vercel: 内置日志
- 自托管: Winston / Pino + Loki

---

## 🚀 CI/CD 配置

### GitHub Actions (推荐)

创建 `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm test  # 如果有测试
      # Vercel 部署
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 📞 故障排查

### 问题 1: 构建失败
**检查**:
```bash
npm run build
# 查看错误信息
```

**常见原因**:
- TypeScript 错误
- 依赖冲突
- 内存不足

### 问题 2: 页面空白
**检查**:
- 浏览器控制台错误
- 网络请求失败
- API 端点配置

### 问题 3: 3D 场景不显示
**检查**:
- WebGL 支持
- GPU 加速启用
- Three.js 加载错误

---

## 📚 相关文档

- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [Vercel 文档](https://vercel.com/docs)
- [Three.js 性能优化](https://threejs.org/docs/#manual/introduction/Performance-optimization)

---

## ✅ 部署成功验证

访问部署的 URL，验证：
- [ ] 首页加载正常
- [ ] 登录页面显示
- [ ] 快速登录按钮工作
- [ ] /v3 页面 3D 场景渲染
- [ ] /workspace 页面拖拽功能
- [ ] 语言切换工作
- [ ] 移动端响应式正常

---

**部署完成后，更新 README.md 中的 Live Demo 链接！**

**推荐部署**: Vercel（零配置，自动 HTTPS，全球 CDN）
