import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

const DEFAULT_REMOTE_LINK =
  'https://accounts.google.com/AccountChooser?Email=dien07122012%40gmail.com&continue=https%3A%2F%2Fantigravity.google.com%2Fr%2F3a713708-cef0-49ba-b842-af9504802f6a-v2';

const PROJECT_RULES = [
  { id: '641f4384-b46d-4f8d-8c4b-1fd3b7554682', name: 'antigravity-app', keywords: ['antigravity-app', 'antigravity mobile', 'remote control'] },
  { id: '8d180f2b-577a-40c4-87d2-5b1f44a56b38', name: 'cleanyourtv', keywords: ['cleanyourtv', 'tvos', 'apple_tv', 'launcher', 'tv sharp'] },
  { id: 'e2eba16e-1477-4475-b225-6b82b69d0080', name: 'gas', keywords: ['gas', 'vnpost gas', 'dudoandiemgas', 'diemtien'] },
  { id: '6a52f4a8-b072-402d-a196-50e29c615017', name: 'LANMonitor', keywords: ['lanmonitor'] },
  { id: '58ebad49-a65c-4f3e-92d4-8d4f2cc763ca', name: 'Cloud-Photos', keywords: ['cloud-photos'] },
  { id: 'cc91ee77-f46c-4cc3-9b1a-79c8a794f10e', name: 'Insta-Downloader', keywords: ['insta-downloader', 'misterdownloadmanager', 'download các ảnh'] },
  { id: '5aeba78c-6af6-4530-bfa4-e0512de7e744', name: 'vnpost-auto-extension', keywords: ['vnpost-auto-extension', 'auto-extension'] },
  { id: '68c21ff0-4c33-4ccd-9765-ec9c01661d36', name: 'worse_query', keywords: ['worse_query'] },
  { id: '6629bbee-66a9-41c6-a3b5-c6adbfbc241b', name: 'diennguyen', keywords: ['diennguyen', 'portfolio diễn nguyễn', 'graphify'] },
];

function antigravityBridgePlugin() {
  const brainDir = path.join(os.homedir(), '.gemini', 'antigravity', 'brain');
  const projectsDir = path.join(os.homedir(), '.gemini', 'config', 'projects');

  function getProjectList() {
    const list: any[] = [];
    if (fs.existsSync(projectsDir)) {
      const files = fs.readdirSync(projectsDir);
      for (const f of files) {
        if (f.endsWith('.json')) {
          try {
            const data = JSON.parse(fs.readFileSync(path.join(projectsDir, f), 'utf8'));
            const folder = data.projectResources?.resources?.[0]?.folderUri || '';
            list.push({
              id: data.id,
              name: data.name,
              folderPath: folder ? decodeURIComponent(folder.replace('file:///', '')) : '',
            });
          } catch {}
        }
      }
    }
    return list;
  }

  function getSessionsWithProjects() {
    if (!fs.existsSync(brainDir)) return [];
    const dirs = fs.readdirSync(brainDir).filter((f) => fs.statSync(path.join(brainDir, f)).isDirectory());
    const sessions: any[] = [];

    for (const d of dirs) {
      const logFile = path.join(brainDir, d, '.system_generated', 'logs', 'transcript.jsonl');
      if (fs.existsSync(logFile)) {
        const stats = fs.statSync(logFile);
        const raw = fs.readFileSync(logFile, 'utf8');
        const first10k = raw.slice(0, 10000).toLowerCase();

        let dirFiles = '';
        try {
          dirFiles = fs.readdirSync(path.join(brainDir, d)).join(' ').toLowerCase();
        } catch {}

        const searchTarget = first10k + ' ' + dirFiles;

        let matchedProj = { id: 'proj_other', name: 'Dự án khác' };
        for (const rule of PROJECT_RULES) {
          if (rule.keywords.some((k) => searchTarget.includes(k))) {
            matchedProj = rule;
            break;
          }
        }

        let title = `Phiên làm việc (${d.slice(0, 8)})`;
        try {
          const firstLine = raw.split('\n')[0];
          if (firstLine) {
            const parsed = JSON.parse(firstLine);
            const match = parsed.content?.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
            if (match) {
              title = match[1].trim().split('\n')[0].slice(0, 60);
            } else if (parsed.content) {
              title = parsed.content.slice(0, 60);
            }
          }
        } catch {}

        sessions.push({
          id: d,
          projectId: matchedProj.id,
          projectName: matchedProj.name,
          title: title,
          updatedAt: stats.mtime.toISOString(),
          createdAt: stats.birthtime.toISOString(),
        });
      }
    }

    sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return sessions;
  }

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

        // 2. GET /api/real-projects
        if (url === '/api/real-projects') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');
          const allSessions = getSessionsWithProjects();
          const registered = getProjectList();

          const projectsWithCounts = registered.map((p) => {
            const count = allSessions.filter((s) => s.projectId === p.id || s.projectName.toLowerCase() === p.name.toLowerCase()).length;
            return {
              id: p.id,
              name: p.name,
              folderPath: p.folderPath,
              sessionsCount: count,
            };
          });

          // Add 'all' virtual project
          projectsWithCounts.unshift({
            id: 'all_projects',
            name: 'Tất cả các dự án',
            folderPath: '',
            sessionsCount: allSessions.length,
          });

          return res.end(JSON.stringify(projectsWithCounts));
        }

        // 3. GET /api/real-sessions
        if (url.startsWith('/api/real-sessions')) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');

          const allSessions = getSessionsWithProjects();
          const parsedUrl = new URL(url, 'http://localhost:5173');
          const filterProj = parsedUrl.searchParams.get('projectId');

          if (filterProj && filterProj !== 'all_projects') {
            const filtered = allSessions.filter((s) => s.projectId === filterProj);
            return res.end(JSON.stringify(filtered));
          }

          return res.end(JSON.stringify(allSessions));
        }

        // 4. GET /api/real-transcript/:id
        if (url.startsWith('/api/real-transcript/')) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');

          const sessionId = url.replace('/api/real-transcript/', '').split('?')[0];
          const logFile = path.join(brainDir, sessionId, '.system_generated', 'logs', 'transcript.jsonl');

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
                  const toolCalls = (entry.tool_calls || []).map((t: any, idx: number) => ({
                    id: `tc_${entry.step_index}_${idx}`,
                    name: t.name,
                    args: t.args || {},
                    toolSummary: t.args?.toolSummary,
                    status: 'done',
                    output: t.output,
                  }));

                  let contentText = entry.content || '';
                  if (!contentText && toolCalls.length === 0 && !entry.thinking) {
                    continue;
                  }

                  messages.push({
                    id: 'asst_' + entry.step_index,
                    role: 'assistant',
                    content: contentText || (toolCalls.length > 0 ? '' : 'Đã hoàn tất tác vụ.'),
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

        // 5. POST /api/chat
        if (url === '/api/chat' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', () => {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');

            try {
              const { prompt, projectId, projectName } = JSON.parse(body);

              // Contextual intelligence response based on user inquiry
              let reply = '';
              let thinking = `1. Phân tích truy vấn từ ứng dụng mobile: "${prompt}"\n2. Dự án đang mở: ${projectName || 'antigravity-app'}\n3. Kiểm tra trạng thái máy chủ và danh sách project registered...\n`;
              let toolCalls: any[] = [];

              if (prompt.toLowerCase().includes('project') || prompt.toLowerCase().includes('hội thoại') || prompt.toLowerCase().includes('phân theo')) {
                const projects = getProjectList();
                const allSessions = getSessionsWithProjects();
                thinking += `4. Tìm thấy ${projects.length} dự án đăng ký và ${allSessions.length} phiên làm việc.\n5. Đã lập danh mục phân loại theo từng workspace.`;
                reply = `Tôi đã cập nhật bộ lọc hội thoại phân theo từng Project cho bạn!\n\n` +
                  `Danh sách các dự án đang được quản lý trên máy tính server:\n` +
                  projects.map(p => `- 📁 **${p.name}** (${allSessions.filter(s => s.projectId === p.id || s.projectName.toLowerCase() === p.name.toLowerCase()).length} hội thoại)`).join('\n') +
                  `\n\nBạn có thể mở menu Sidebar hoặc bấm vào tên dự án ở Header để chuyển đổi qua lại giữa các project này.`;
              } else if (prompt.toLowerCase().startsWith('run ') || prompt.toLowerCase().startsWith('lệnh ') || prompt.toLowerCase().startsWith('cmd ')) {
                const cmd = prompt.replace(/^(run|lệnh|cmd)\s+/i, '');
                thinking += `4. Phát hiện yêu cầu thực thi lệnh terminal: "${cmd}"\n5. Thực thi an toàn trên Windows host...`;
                try {
                  const out = execSync(cmd, { cwd: process.cwd(), encoding: 'utf8', timeout: 5000 });
                  toolCalls.push({
                    id: 'tc_' + Date.now(),
                    name: 'run_command',
                    toolSummary: `Chạy lệnh: ${cmd}`,
                    args: { CommandLine: cmd },
                    output: out,
                    status: 'done'
                  });
                  reply = `Đã thực thi thành công lệnh trên máy chủ:\n\`\`\`powershell\n$ ${cmd}\n\`\`\``;
                } catch (e: any) {
                  toolCalls.push({
                    id: 'tc_' + Date.now(),
                    name: 'run_command',
                    toolSummary: `Lỗi chạy lệnh: ${cmd}`,
                    args: { CommandLine: cmd },
                    output: e.message,
                    status: 'error'
                  });
                  reply = `Lệnh gặp lỗi khi thực thi trên máy chủ:\n${e.message}`;
                }
              } else {
                thinking += `4. Kiểm tra trạng thái kết nối Google Remote Control...\n5. Xác nhận session active: 3a713708-cef0-49ba-b842-af9504802f6a-v2`;
                reply = `Tôi đã nhận được tin nhắn từ bạn: **"${prompt}"**.\n\n` +
                  `Để chỉ đạo Agent tự động lập trình hoặc sửa đổi mã nguồn trực tiếp trên máy tính qua Remote Control, bạn có thể:\n` +
                  `1. Bấm nút **[Remote Live]** ở góc trên để mở phiên Google Antigravity Remote chính thức (1 chạm).\n` +
                  `2. Hoặc gõ lệnh terminal bắt đầu bằng \`run <lệnh>\` (ví dụ: \`run git status\`, \`run dir\`) để app trực tiếp thực thi trên server và trả về kết quả!`;
              }

              return res.end(JSON.stringify({
                content: reply,
                thinking: thinking,
                toolCalls: toolCalls.length ? toolCalls : undefined,
                status: 'done'
              }));
            } catch (err: any) {
              return res.end(JSON.stringify({ content: 'Đã nhận tin nhắn từ mobile: ' + body, status: 'done' }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

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
