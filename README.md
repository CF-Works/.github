### Cloudflare Worker 代码
```
/**
 * 验证 GitHub Webhook 签名
 */
async function verifySignature(secret, header, body) {
  if (!header || !secret) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['verify']
  );
  const sig = header.replace('sha256=', '');
  const sigBytes = new Uint8Array(sig.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  return await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(body));
}

export default {
  async fetch(request, env) {
    // 仅允许 POST 请求
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const bodyText = await request.text();
    const signature = request.headers.get('x-hub-signature-256');
    const githubEvent = request.headers.get('x-github-event');

    // 1. 安全校验：防止非法调用
    if (!await verifySignature(env.WEBHOOK_SECRET, signature, bodyText)) {
      return new Response('🚫 Invalid Webhook Secret', { status: 401 });
    }

    // 2. 过滤 Ping 事件：GitHub 激活 Webhook 时的测试请求
    if (githubEvent === 'ping') {
      return new Response('✅ Pong! Webhook is active.', { status: 200 });
    }

    // 3. 解析配置变量
    // 格式要求: GITHUB_TARGET 为 "owner/repo@branch"
    const [repoPath, branch] = (env.GITHUB_TARGET || "").split('@');
    const token = env.GITHUB_TOKEN;
    const eventType = env.GITHUB_EVENT_TYPE || 'org-webhook';

    if (!token || !repoPath) {
      return new Response('❌ Worker environment variables not configured', { status: 500 });
    }

    try {
      // 4. 调用 GitHub Dispatch API 触发 Action
      const response = await fetch(`https://api.github.com/repos/${repoPath}/dispatches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'CF-Worker-Final-Secure'
        },
        body: JSON.stringify({ 
          event_type: eventType,
          client_payload: { 
            ref: branch || 'main',
            source_event: githubEvent // 传递原始事件类型给 Action 调试
          }
        })
      });

      if (response.status === 204) {
        return new Response(`🚀 Success: Triggered ${repoPath}`, { status: 200 });
      } else {
        const errorMsg = await response.text();
        return new Response(`❌ GitHub API Error: ${response.status} - ${errorMsg}`, { status: response.status });
      }
    } catch (e) {
      return new Response(`Internal Error: ${e.message}`, { status: 500 });
    }
  }
};

```


> 此Worker 用于接收 GitHub Organization Webhook，并通过 `repository_dispatch` 安全地触发特定仓库的 Action。

## 🚀 部署步骤

1. GitHub 仓库配置
在目标仓库（例如 `cf-works.github.io`）的 `.github/workflows/sync.yml` 中添加触发器：
```yaml
on:
  repository_dispatch:
    types: [org-webhook]
```
2. Cloudflare Worker 设置
部署代码后，在 Worker 的 Settings -> Variables 中添加以下变量：

| 变量名 | 示例值 | 说明 |
|---|---|---|
| GITHUB_TOKEN | ghp_xxxx | 具有 repo 权限的 Personal Access Token |
| GITHUB_TARGET | CF-Works/cf-works.github.io@main | 格式：用户名/仓库名@分支 |
| WEBHOOK_SECRET | your_secret_key | 在 GitHub Webhook 页面设置的 Secret |
| GITHUB_EVENT_TYPE | org-webhook | 对应的 Action types 暗号 |

3. GitHub Webhook 配置
前往组织设置 (Organization Settings) -> Webhooks -> Add webhook：
 * Payload URL: Worker 的访问链接
 * Content type: application/json
 * Secret: 填写上面设置的 WEBHOOK_SECRET
 * Events: 选择 Repositories 和 Push（重点）

🛡️ 安全说明
本 Worker 强制执行 HMAC-SHA256 签名验证。只有携带正确 Secret 签名的 GitHub 请求才会被转发至 API，有效防止非法调用。

---
好像不支持组织的`.github`仓库
