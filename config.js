// config.js
export const config = {
  siteTitle: "星霜の项目集",
  siteSubtitle: "实验 · 工具 · 玩具 · 以及一些深夜的灵感",

  githubUsername: "xiaobaiweinuli",

  copyrightStartYear: "2025",

  // 站点说明区域开关 + 内容
  siteInfo: {
    enabled: true,  // ← 改成 false 即可完全关闭说明区域（不占位）
    title: "关于这个页面",
    paragraphs: [
      "折腾的一些小项目，大部分是实验性质的玩具，或者半夜突发奇想搞出来的东西。",
      "如果某个链接打不开或功能异常，欢迎通过 GitHub 提 issue，或者在我的频道留言告诉我。"
    ]
  },

  projects: [
  {
    "title": "Rin",
    "links": [
      {
        "url": "https://docs.openrin.org",
        "display": "docs.openrin.org"
      },
      {
        "url": "https://github.com/CF-Works/Rin",
        "display": "CF-Works/Rin"
      }
    ],
    "description": "⚡Dynamic blog based on Cloudflare Pages + Workers + D1 + R2"
  },
  {
    "title": "cloud-mail",
    "links": [
      {
        "url": "https://skymail.ink",
        "display": "skymail.ink"
      },
      {
        "url": "https://github.com/CF-Works/cloud-mail",
        "display": "CF-Works/cloud-mail"
      }
    ],
    "description": "cloudflare email 邮箱  临时邮箱 邮件发送 mail"
  },
  {
    "title": "CF-Works.github.io",
    "links": [
      {
        "url": "https://cf-works.github.io/",
        "display": "cf-works.github.io"
      },
      {
        "url": "https://github.com/CF-Works/CF-Works.github.io",
        "display": "CF-Works/CF-Works.github.io"
      }
    ],
    "description": "暂无项目描述"
  },
  {
    "title": "cloudflare-manager",
    "links": [
      {
        "url": "https://github.com/CF-Works/cloudflare-manager",
        "display": "CF-Works/cloudflare-manager"
      }
    ],
    "description": "一个强大的Cloudflare多账号Workers批量管理系统，支持账号管理、批量操作、实时监控和Workers脚本管理。"
  },
  {
    "title": "WARP-Clash-API",
    "links": [
      {
        "url": "https://github.com/CF-Works/WARP-Clash-API",
        "display": "CF-Works/WARP-Clash-API"
      }
    ],
    "description": "该项目可以让你通过订阅的方式使用Cloudflare WARP+，自动获取流量。This project enables you to use Cloudflare WARP+ through subscription, automatically acquiring traffic."
  },
  {
    "title": "SM-Survey-System",
    "links": [
      {
        "url": "https://github.com/CF-Works/SM-Survey-System",
        "display": "CF-Works/SM-Survey-System"
      }
    ],
    "description": "本系统是基于Cloudflare全栈技术构建的企业级实名认证问卷和SM任务管理系统，支持完全自动化的GitHub到Cloudflare部署流程。"
  },
  {
    "title": "friend-cleanup",
    "links": [
      {
        "url": "https://haoyou.xingshuang.xyz",
        "display": "haoyou.xingshuang.xyz"
      },
      {
        "url": "https://github.com/CF-Works/friend-cleanup",
        "display": "CF-Works/friend-cleanup"
      }
    ],
    "description": "一个基于 Cloudflare Workers 的安全、高效的好友管理系统，支持 QQ、微信、手机号等多种账号类型，具备完整的前后台功能、移动端适配、安全防护和数据可视化。"
  },
  {
    "title": "cloudflare-blog-system",
    "links": [
      {
        "url": "https://github.com/CF-Works/cloudflare-blog-system",
        "display": "CF-Works/cloudflare-blog-system"
      }
    ],
    "description": "使用Next.js创建的一个博客--cloud flare后端认证与文件储存--GitHub oauth角色分配"
  },
  {
    "title": "chanfana-openapi-template",
    "links": [
      {
        "url": "https://github.com/CF-Works/chanfana-openapi-template",
        "display": "CF-Works/chanfana-openapi-template"
      }
    ],
    "description": "这是现代化博客系统的 Cloudflare Workers 后端服务，提供完整的 API 支持。"
  }
]
};