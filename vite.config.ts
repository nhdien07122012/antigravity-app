import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Default Antigravity Remote Link provided by the user
const DEFAULT_REMOTE_LINK =
  'https://accounts.google.com/AccountChooser?Email=dien07122012%40gmail.com&continue=https%3A%2F%2Fantigravity.google.com%2Fr%2F3a713708-cef0-49ba-b842-af9504802f6a-v2';

function antigravityBridgePlugin() {
  const brainDir = path.join(os.homedir(), '.gemini', 'antigravity', 'brain');

  return {
    name: 'antigravity-bridge-plugin',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const url = req.url || '';

        // 1. GET /api/server-info
        if (url === '/api/server-info') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');
          return res.end(
            JSON.stringify({
              serverName: 'Dell PC Server (Windows 11)',
              status: 'online',
              model: 'Gemini 2.5 Flash',
              remoteLink: DEFAULT_REMOTE_LINK,
              sessionId: '3a713708-cef0-49ba-b842-af9504802f6a-v2',
              accountEmail: 'dien07122012@gmail.com',
              brainDirExists: fs.existsSync(brainDir),
            })
          );
        }

        // 2. GET /api/real-sessions
        if (url === '/api/real-sessions') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');

          if (!fs.existsSync(brainDir)) {
            return res.end(JSON.stringify([]));
          }

          try {
            const dirs = fs
              .readdirSync(brainDir)
              .filter((f) => fs.statSync(path.join(brainDir, f)).isDirectory());

            const sessions: any[] = [];
            for (const d of dirs) {
              const logFile = path.join(
                brainDir,
                d,
                '.system_generated',
                'logs',
                'transcript.jsonl'
              );
              if (fs.existsSync(logFile)) {
                const stats = fs.statSync(logFile);
                let title = `Phiên làm việc (${d.slice(0, 8)})`;
                try {
                  const content = fs.readFileSync(logFile, 'utf8');
                  const firstLine = content.split('\n')[0];
                  if (firstLine) {
                    const parsed = JSON.parse(firstLine);
                    const match = parsed.content?.match(
                      /<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/
                    );
                    if (match) {
                      title = match[1].trim().split('\n')[0].slice(0, 60);
                    } else if (parsed.content) {
                      title = parsed.content.slice(0, 60);
                    }
                  }
                } catch {}

                sessions.push({
                  id: d,
                  projectId: 'proj_server_' + d.slice(0, 6),
                  title: title,
                  updatedAt: stats.mtime.toISOString(),
                  createdAt: stats.birthtime.toISOString(),
                });
              }
            }

            sessions.sort(
              (a, b) =>
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );

            return res.end(JSON.stringify(sessions));
          } catch (err: any) {
            return res.end(JSON.stringify({ error: err.message }));
          }
        }

        // 3. GET /api/real-transcript/:id
        if (url.startsWith('/api/real-transcript/')) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');

          const sessionId = url.replace('/api/real-transcript/', '').split('?')[0];
          const logFile = path.join(
            brainDir,
            sessionId,
            '.system_generated',
            'logs',
            'transcript.jsonl'
          );

          if (!fs.existsSync(logFile)) {
            return res.end(JSON.stringify([]));
          }

          try {
            const content = fs.readFileSync(logFile, 'utf8');
            const lines = content.trim().split('\n');
            const messages: any[] = [];

            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const entry = JSON.parse(line);
                if (entry.type === 'USER_INPUT') {
                  let text = entry.content || '';
                  const m = text.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
                  if (m) text = m[1].trim();
                  messages.push({
                    id: 'user_' + entry.step_index,
                    role: 'user',
                    content: text,
                    createdAt: entry.created_at || new Date().toISOString(),
                  });
                } else if (entry.type === 'PLANNER_RESPONSE') {
                  const toolCalls = (entry.tool_calls || []).map(
                    (t: any, idx: number) => ({
                      id: `tc_${entry.step_index}_${idx}`,
                      name: t.name,
                      args: t.args || {},
                      toolSummary: t.args?.toolSummary,
                      status: 'done',
                      output: t.output,
                    })
                  );

                  // Extract clean content without internal tags if any
                  let contentText = entry.content || '';
                  if (
                    !contentText &&
                    toolCalls.length === 0 &&
                    !entry.thinking
                  ) {
                    continue;
                  }

                  messages.push({
                    id: 'asst_' + entry.step_index,
                    role: 'assistant',
                    content:
                      contentText ||
                      (toolCalls.length > 0 ? '' : 'Đã hoàn tất tác vụ.'),
                    thinking: entry.thinking,
                    toolCalls: toolCalls.length ? toolCalls : undefined,
                    status: 'done',
                    createdAt: entry.created_at || new Date().toISOString(),
                  });
                }
              } catch {}
            }

            return res.end(JSON.stringify(messages));
          } catch (err: any) {
            return res.end(JSON.stringify({ error: err.message }));
          }
        }

        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), antigravityBridgePlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
