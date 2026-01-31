
## Worker 完整代码

```javascript
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
  const sigBytes = Uint8Array.from(sig.match(/.{2}/g).map(b => parseInt(b, 16)));
  return await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(body));
}

/**
 * 事件过滤规则
 */
function shouldTrigger(githubEvent, payload) {
  // 只处理 repository 事件
  if (githubEvent !== 'repository') {
    return false;
  }

  const action = payload.action;
  const allowedActions = ['created', 'deleted', 'edited'];

  // 检查是否是允许的操作
  if (!allowedActions.includes(action)) {
    return false;
  }

  // 如果是 edited 事件，进一步检查修改内容
  if (action === 'edited') {
    const changes = payload.changes || {};
    
    // 只有修改了 description(About) 或 homepage(Website) 才触发
    if (changes.description || changes.homepage) {
      return true;
    }
    
    // 其他修改（如 default_branch, topics 等）不触发
    return false;
  }

  // created 和 deleted 直接通过
  return true;
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

    // 1. 安全校验
    if (!await verifySignature(env.WEBHOOK_SECRET, signature, bodyText)) {
      return new Response('🚫 Invalid Webhook Secret', { status: 401 });
    }

    // 2. 过滤 Ping 事件
    if (githubEvent === 'ping') {
      return new Response('✅ Pong! Webhook is active.', { status: 200 });
    }

    // 3. 解析 Payload
    let payload;
    try {
      payload = JSON.parse(bodyText);
    } catch (e) {
      return new Response('❌ Invalid JSON payload', { status: 400 });
    }

    // 4. 事件过滤（核心逻辑）
    if (!shouldTrigger(githubEvent, payload)) {
      return new Response(
        `⏭️ Ignored: ${githubEvent}/${payload.action || 'unknown'}`, 
        { status: 200 }
      );
    }

    // 5. 解析配置变量
    const [repoPath, branch] = (env.GITHUB_TARGET || "").split('@');
    const token = env.GITHUB_TOKEN;
    const eventType = env.GITHUB_EVENT_TYPE || 'org-webhook';

    if (!token || !repoPath) {
      return new Response('❌ Worker environment variables not configured', { status: 500 });
    }

    try {
      // 6. 调用 GitHub Dispatch API
      const response = await fetch(`https://api.github.com/repos/${repoPath}/dispatches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'CF-Worker-Repo-Monitor'
        },
        body: JSON.stringify({ 
          event_type: eventType,
          client_payload: { 
            ref: branch || 'main',
            source_event: githubEvent,
            action: payload.action,
            repository: {
              name: payload.repository?.name,
              full_name: payload.repository?.full_name,
              description: payload.repository?.description,
              homepage: payload.repository?.homepage,
              url: payload.repository?.html_url
            },
            changes: payload.changes || {} // 传递修改详情
          }
        })
      });

      if (response.status === 204) {
        return new Response(
          `🚀 Triggered: ${githubEvent}/${payload.action} → ${repoPath}`, 
          { status: 200 }
        );
      } else {
        const errorMsg = await response.text();
        return new Response(
          `❌ GitHub API Error: ${response.status} - ${errorMsg}`, 
          { status: response.status }
        );
      }
    } catch (e) {
      return new Response(`Internal Error: ${e.message}`, { status: 500 });
    }
  }
};
```
---

> 此Worker 用于接收 GitHub Organization Webhook，并通过 `repository_dispatch` 安全地触发特定仓库的 Action。

---

## 📊 现在会触发的事件

| 操作 | 触发条件 | 是否触发 |
|------|---------|---------|
| 创建仓库 | `repository.created` | ✅ 是 |
| 删除仓库 | `repository.deleted` | ✅ 是 |
| 修改 About | `repository.edited` + `changes.description` | ✅ 是 |
| 修改 Website | `repository.edited` + `changes.homepage` | ✅ 是 |
| 同时修改 About + Website | `repository.edited` + 两者都有 | ✅ 是 |
| 修改默认分支 | `repository.edited` + `changes.default_branch` | ❌ 否 |
| 修改 Topics | `repository.edited` + `changes.topics` | ❌ 否 |

---

## 🎯 完整的触发逻辑总结

```javascript
function shouldTrigger(githubEvent, payload) {
  // 第 1 层过滤：只处理 repository 事件
  if (githubEvent !== 'repository') return false;
  
  const action = payload.action;
  
  // 第 2 层过滤：只处理 created/deleted/edited
  if (!['created', 'deleted', 'edited'].includes(action)) return false;
  
  // 第 3 层过滤：edited 事件需要进一步检查
  if (action === 'edited') {
    const changes = payload.changes || {};
    // 只有修改了 description 或 homepage 才触发
    return !!(changes.description || changes.homepage);
  }
  
  // created 和 deleted 直接通过
  return true;
}
```

---

## 🔍 如果需要监控更多字段

如果未来需要监控其他字段（比如 Topics、默认分支等），只需修改这一行：

```javascript
// 当前：只监控 About 和 Website
if (changes.description || changes.homepage) {
  return true;
}

// 扩展示例：同时监控 Topics
if (changes.description || changes.homepage || changes.topics) {
  return true;
}

// 扩展示例：监控所有公开字段的修改
const publicFields = ['description', 'homepage', 'topics', 'has_issues', 'has_wiki'];
if (publicFields.some(field => changes[field])) {
  return true;
}
```



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
前往组织设置 (Organization Settings) -> Webhooks -> Add webhook
 * Payload URL: Worker 的访问链接
 * Content type: application/json
 * Secret: 填写上面设置的 WEBHOOK_SECRET
 * Events: 选择 Push

🛡️ 安全说明
本 Worker 强制执行 HMAC-SHA256 签名验证。只有携带正确 Secret 签名的 GitHub 请求才会被转发至 API，有效防止非法调用。

---
