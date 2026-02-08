/**
 * Standalone SSE activity server for real-time Claude Code monitoring.
 *
 * Scans ~/.claude directory for file changes and streams events
 * to the 3D visualization client via Server-Sent Events.
 *
 * Usage:  node scripts/activity-server.mjs
 * Port:   3099 (configurable via ACTIVITY_PORT env)
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const PORT = parseInt(process.env.ACTIVITY_PORT || '3099', 10);
const POLL_INTERVAL = 2000;

function getClaudeDir() {
  return path.join(os.homedir(), '.claude');
}

function classifyChange(filePath) {
  const rel = filePath.toLowerCase().replace(/\\/g, '/');
  if (rel.includes('/rules/')) return { nodeType: 'rule', type: 'Rule updated' };
  if (rel.includes('/agents/')) return { nodeType: 'agent', type: 'Agent activity' };
  if (rel.includes('settings.json')) return { nodeType: 'hook', type: 'Config changed' };
  if (rel.includes('/memory/') || rel.includes('/learning/') || rel.includes('/cache/'))
    return { nodeType: 'memory', type: 'Memory updated' };
  if (rel.includes('/skills/')) return { nodeType: 'skill', type: 'Skill loaded' };
  if (rel.includes('/plugins/')) return { nodeType: 'plugin', type: 'Plugin activity' };
  if (rel.includes('/mcp/') || rel.includes('mcp')) return { nodeType: 'mcp', type: 'MCP activity' };
  if (rel.includes('/projects/')) return { nodeType: 'claude', type: 'Project activity' };
  return { nodeType: 'claude', type: 'Claude activity' };
}

function scanForChanges(dir, since, depth = 0) {
  if (depth > 3) return [];
  const changes = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (depth > 0 && entry.name.startsWith('.')) continue;
      if (entry.name === 'node_modules' || entry.name === '.git') continue;

      const fullPath = path.join(dir, entry.name);

      try {
        const stat = fs.statSync(fullPath);

        if (stat.mtimeMs > since && entry.isFile()) {
          const classified = classifyChange(fullPath);
          changes.push({
            path: fullPath,
            type: classified.type,
            nodeType: classified.nodeType,
            timestamp: stat.mtimeMs,
          });
        }

        if (entry.isDirectory()) {
          changes.push(...scanForChanges(fullPath, since, depth + 1));
        }
      } catch {
        // Skip inaccessible files
      }
    }
  } catch {
    // Directory not accessible
  }

  return changes;
}

const server = http.createServer((req, res) => {
  // CORS headers for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url !== '/events') {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found. Use GET /events for SSE stream.');
    return;
  }

  // SSE response
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const claudeDir = getClaudeDir();
  let lastCheck = Date.now();

  // Send connected event
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);

  const intervalId = setInterval(() => {
    try {
      const now = Date.now();
      const changes = scanForChanges(claudeDir, lastCheck);
      lastCheck = now;

      if (changes.length > 0) {
        const event = {
          type: 'activity',
          changes: changes.slice(0, 10),
          timestamp: now,
        };
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }

      // Heartbeat
      res.write(`: heartbeat ${now}\n\n`);
    } catch {
      // Silently continue
    }
  }, POLL_INTERVAL);

  req.on('close', () => {
    clearInterval(intervalId);
  });
});

server.listen(PORT, () => {
  console.log(`Activity server running on http://localhost:${PORT}/events`);
  console.log(`Monitoring: ${getClaudeDir()}`);
  console.log('Press Ctrl+C to stop.');
});
