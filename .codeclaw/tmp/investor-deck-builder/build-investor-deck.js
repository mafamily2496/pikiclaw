const fs = require("node:fs");
const path = require("node:path");
const PptxGenJS = require("pptxgenjs");

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Codex";
pptx.company = "codeclaw";
pptx.subject = "codeclaw investor intro deck";
pptx.title = "codeclaw Investor Deck";
pptx.lang = "zh-CN";
pptx.theme = {
  headFontFace: "PingFang SC",
  bodyFontFace: "PingFang SC",
  lang: "zh-CN",
};

const OUT_DIR = path.resolve(
  __dirname,
  "../../artifacts/telegram-7563076314/current",
);
const PPTX_PATH = path.join(OUT_DIR, "codeclaw-investor-deck-v1.pptx");
const NOTES_PATH = path.join(OUT_DIR, "codeclaw-investor-notes-v1.md");

const W = 13.333;
const H = 7.5;
const C = {
  ink: "111827",
  cream: "F6F0E6",
  warm: "E9D7BE",
  rust: "DE6A4E",
  rustDeep: "BC4F34",
  moss: "264A3F",
  leaf: "62806B",
  mist: "EBEFE8",
  white: "FFFDF9",
  slate: "667085",
  stone: "9D8E7E",
  line: "D9CCBB",
  dark: "0F1720",
  dark2: "17222E",
  amber: "D8A54B",
};
const FONT = "PingFang SC";

function addText(slide, text, opts = {}) {
  slide.addText(text, {
    fontFace: FONT,
    color: C.ink,
    margin: 0,
    breakLine: false,
    fit: "shrink",
    valign: "mid",
    ...opts,
  });
}

function addChrome(slide, idx, dark = false) {
  const lineColor = dark ? "314255" : C.line;
  const pageColor = dark ? "E7DED1" : C.stone;
  slide.addShape(pptx.ShapeType.line, {
    x: 0.6,
    y: 7.02,
    w: 12.1,
    h: 0,
    line: { color: lineColor, pt: 1.2 },
  });
  addText(slide, String(idx).padStart(2, "0"), {
    x: 12.45,
    y: 6.88,
    w: 0.35,
    h: 0.18,
    fontSize: 10,
    color: pageColor,
    align: "right",
  });
}

function addDraftTag(slide, dark = false) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.62,
    y: 0.42,
    w: 1.7,
    h: 0.34,
    rectRadius: 0.08,
    fill: { color: dark ? C.dark2 : C.white, transparency: dark ? 8 : 0 },
    line: { color: dark ? "2A3949" : C.line, pt: 0.8 },
  });
  addText(slide, "Investor Draft", {
    x: 0.82,
    y: 0.485,
    w: 1.3,
    h: 0.16,
    fontSize: 9.5,
    bold: true,
    color: dark ? "EDE5D8" : C.stone,
    align: "center",
  });
}

function addTitle(slide, pageTitle, subtitle, opts = {}) {
  const dark = Boolean(opts.dark);
  const titleColor = dark ? C.white : C.ink;
  const subtitleColor = dark ? "D8D1C6" : C.slate;

  addDraftTag(slide, dark);
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.64,
    y: 1.02,
    w: 0.84,
    h: 0.08,
    fill: { color: C.rust },
    line: { color: C.rust },
  });
  addText(slide, pageTitle, {
    x: 0.64,
    y: 1.22,
    w: 7.9,
    h: 0.62,
    fontSize: opts.titleSize || 26,
    bold: true,
    color: titleColor,
  });
  if (subtitle) {
    addText(slide, subtitle, {
      x: 0.66,
      y: 1.94,
      w: 8.8,
      h: 0.45,
      fontSize: 12.5,
      color: subtitleColor,
      valign: "top",
    });
  }
}

function addPill(slide, x, y, w, text, opts = {}) {
  const fill = opts.fill || C.white;
  const color = opts.color || C.ink;
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h: opts.h || 0.34,
    rectRadius: 0.08,
    fill: { color: fill, transparency: opts.transparency || 0 },
    line: { color: opts.line || fill, pt: 0.8 },
  });
  addText(slide, text, {
    x: x + 0.1,
    y: y + 0.04,
    w: w - 0.2,
    h: 0.18,
    fontSize: opts.fontSize || 9.5,
    bold: opts.bold ?? true,
    color,
    align: "center",
  });
}

function addCard(slide, opts) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: opts.x,
    y: opts.y,
    w: opts.w,
    h: opts.h,
    rectRadius: 0.08,
    fill: { color: opts.fill || C.white },
    line: { color: opts.line || C.line, pt: opts.linePt || 1 },
    shadow: opts.shadow ? { type: "outer", color: "CFC4B3", blur: 2, angle: 45, distance: 1, opacity: 0.14 } : undefined,
  });
  if (opts.kicker) {
    addText(slide, opts.kicker, {
      x: opts.x + 0.18,
      y: opts.y + 0.18,
      w: opts.w - 0.36,
      h: 0.2,
      fontSize: 9,
      color: opts.kickerColor || C.rustDeep,
      bold: true,
    });
  }
  if (opts.title) {
    addText(slide, opts.title, {
      x: opts.x + 0.18,
      y: opts.y + (opts.kicker ? 0.38 : 0.2),
      w: opts.w - 0.36,
      h: 0.34,
      fontSize: opts.titleSize || 16,
      color: opts.titleColor || C.ink,
      bold: true,
      valign: "top",
    });
  }
  if (opts.body) {
    addText(slide, opts.body, {
      x: opts.x + 0.18,
      y: opts.bodyY || opts.y + (opts.kicker ? 0.8 : 0.58),
      w: opts.w - 0.36,
      h: opts.bodyH || (opts.h - (opts.kicker ? 0.98 : 0.78)),
      fontSize: opts.bodySize || 11.2,
      color: opts.bodyColor || C.slate,
      valign: "top",
    });
  }
}

function addBulletLines(lines) {
  return lines.map((line) => `• ${line}`).join("\n");
}

function baseSlide(bg = C.cream, dark = false) {
  const slide = pptx.addSlide();
  slide.background = { color: bg };
  slide.addShape(pptx.ShapeType.ellipse, {
    x: 10.55,
    y: dark ? -0.7 : -0.55,
    w: 3.25,
    h: 3.25,
    fill: { color: dark ? "203142" : C.warm, transparency: dark ? 24 : 18 },
    line: { color: dark ? "203142" : C.warm, transparency: 100 },
  });
  slide.addShape(pptx.ShapeType.ellipse, {
    x: 9.8,
    y: dark ? 4.95 : 5.15,
    w: 2.5,
    h: 2.5,
    fill: { color: dark ? "1B2A39" : C.mist, transparency: dark ? 32 : 10 },
    line: { color: dark ? "1B2A39" : C.mist, transparency: 100 },
  });
  return slide;
}

function slide1() {
  const slide = baseSlide(C.dark, true);
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: W,
    h: H,
    fill: { color: "0F1720" },
    line: { color: "0F1720" },
  });
  slide.addShape(pptx.ShapeType.ellipse, {
    x: 8.8,
    y: -1.1,
    w: 5.4,
    h: 5.4,
    fill: { color: "213445", transparency: 8 },
    line: { color: "213445", transparency: 100 },
  });
  slide.addShape(pptx.ShapeType.ellipse, {
    x: 10.4,
    y: 4.4,
    w: 3.2,
    h: 3.2,
    fill: { color: "1A2835", transparency: 4 },
    line: { color: "1A2835", transparency: 100 },
  });

  addPill(slide, 0.72, 0.6, 2.2, "2026.03 投资人汇报草案", {
    fill: "192532",
    line: "314255",
    color: "E7DED1",
    fontSize: 9.5,
  });
  addText(slide, "codeclaw", {
    x: 0.7,
    y: 1.28,
    w: 5.6,
    h: 0.9,
    fontSize: 30,
    bold: true,
    color: C.white,
  });
  addText(slide, "把本地 AI Agent 变成可随时派活、持续执行、自动回传结果的远程中枢", {
    x: 0.72,
    y: 2.18,
    w: 5.8,
    h: 0.9,
    fontSize: 17.5,
    color: "E6DDD0",
    bold: true,
    valign: "top",
  });
  addText(slide, "一切在本地运行，用 Telegram 连接 Claude Code / Codex，让用户离开电脑也能稳定推进长程任务。", {
    x: 0.74,
    y: 3.1,
    w: 5.35,
    h: 0.72,
    fontSize: 12.5,
    color: "C4CCCF",
    valign: "top",
  });

  addPill(slide, 0.76, 4.22, 1.45, "本地执行", {
    fill: C.rust,
    color: C.white,
    fontSize: 10.5,
  });
  addPill(slide, 2.36, 4.22, 1.45, "长程任务", {
    fill: "213445",
    line: "314255",
    color: "E7DED1",
    fontSize: 10.5,
  });
  addPill(slide, 3.96, 4.22, 1.55, "产物回传", {
    fill: "213445",
    line: "314255",
    color: "E7DED1",
    fontSize: 10.5,
  });

  addCard(slide, {
    x: 7.1,
    y: 1.1,
    w: 5.18,
    h: 1.25,
    fill: "17222E",
    line: "314255",
    kicker: "01",
    kickerColor: C.rust,
    title: "手机里派活",
    titleColor: C.white,
    body: "一句话下任务，也可以直接发送截图、PDF、文档。",
    bodyColor: "C9D0D6",
    bodySize: 11,
  });
  addCard(slide, {
    x: 7.1,
    y: 2.55,
    w: 5.18,
    h: 1.52,
    fill: "17222E",
    line: "314255",
    kicker: "02",
    kickerColor: C.rust,
    title: "电脑在本地持续执行",
    titleColor: C.white,
    body: "直接调用 Claude Code / Codex，保留真实代码、依赖、权限与会话历史。",
    bodyColor: "C9D0D6",
    bodySize: 11,
  });
  addCard(slide, {
    x: 7.1,
    y: 4.32,
    w: 5.18,
    h: 1.3,
    fill: "17222E",
    line: "314255",
    kicker: "03",
    kickerColor: C.rust,
    title: "结果自动回到聊天里",
    titleColor: C.white,
    body: "流式进度、长文本、截图、日志和文件按原生 IM 体验回传。",
    bodyColor: "C9D0D6",
    bodySize: 11,
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 9.64,
    y: 2.33,
    w: 0,
    h: 0.22,
    line: { color: C.rust, pt: 1.5, beginArrowType: "none", endArrowType: "triangle" },
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 9.64,
    y: 4.07,
    w: 0,
    h: 0.25,
    line: { color: C.rust, pt: 1.5, beginArrowType: "none", endArrowType: "triangle" },
  });
  addChrome(slide, 1, true);
}

function slide2() {
  const slide = baseSlide();
  addTitle(slide, "AI Agent 很强，但“长程执行”仍然缺最后一公里", "今天的大模型编码体验，依然严重依赖人守在终端前。");

  addCard(slide, {
    x: 0.7,
    y: 2.6,
    w: 3.9,
    h: 2.15,
    fill: C.white,
    line: C.line,
    kicker: "痛点 01",
    title: "被困在终端",
    body: "Claude Code / Codex 适合重度任务，但人一离开电脑，任务状态和进度就失去控制。",
  });
  addCard(slide, {
    x: 4.72,
    y: 2.6,
    w: 3.9,
    h: 2.15,
    fill: C.white,
    line: C.line,
    kicker: "痛点 02",
    title: "远程方案体验差",
    body: "SSH + tmux 属于工程师 workaround，不是移动办公场景下的产品级体验。",
  });
  addCard(slide, {
    x: 8.74,
    y: 2.6,
    w: 3.9,
    h: 2.15,
    fill: C.white,
    line: C.line,
    kicker: "痛点 03",
    title: "云端 Agent 不够真实",
    body: "私有代码、依赖、权限、历史会话和本地工具链，决定很多复杂任务仍必须在本机完成。",
  });

  addCard(slide, {
    x: 0.72,
    y: 5.1,
    w: 11.88,
    h: 1.22,
    fill: C.moss,
    line: C.moss,
    title: "市场缺的不是另一个聊天入口，而是一层能稳定托管本地 Agent 的执行系统。",
    titleColor: C.white,
    titleSize: 19,
    body: "当任务持续数十分钟到数小时，用户真正想要的是“走开也能继续跑，结果自动回来”。",
    bodyColor: "D9E5DE",
    bodyY: 5.66,
    bodySize: 12,
  });
  addChrome(slide, 2);
}

function slide3() {
  const slide = baseSlide(C.dark, true);
  addTitle(slide, "为什么是现在", "这个机会来自三条趋势的叠加：模型成熟、任务变长、用户开始要求移动端可控。", { dark: true });

  const cards = [
    {
      x: 0.72,
      y: 2.55,
      title: "本地 AI CLI 已成熟",
      body: "Claude Code / Codex 已能稳定处理多步复杂任务，终端从聊天入口升级为执行引擎。",
    },
    {
      x: 4.02,
      y: 2.55,
      title: "长程任务正在增长",
      body: "重构、报告、数据处理、内容生产都呈现“跑更久、上下文更长、步骤更多”的特征。",
    },
    {
      x: 7.32,
      y: 2.55,
      title: "离开工位仍要推进",
      body: "创始人、工程负责人和重度 AI 用户不想被桌面终端绑死，手机成为天然控制台。",
    },
    {
      x: 10.62,
      y: 2.55,
      title: "本地优先重新重要",
      body: "真实代码、文件、权限和隐私边界依然要求大量高价值任务在本地执行。",
    },
  ];
  for (const card of cards) {
    addCard(slide, {
      x: card.x,
      y: card.y,
      w: 2.05,
      h: 2.6,
      fill: "17222E",
      line: "314255",
      title: card.title,
      titleColor: C.white,
      titleSize: 15,
      body: card.body,
      bodyColor: "C9D0D6",
      bodySize: 10.4,
      bodyY: 3.2,
      bodyH: 1.65,
    });
  }

  addCard(slide, {
    x: 1.15,
    y: 5.55,
    w: 11.02,
    h: 0.92,
    fill: "15202C",
    line: "314255",
    title: "如果本地 Agent 是未来的默认工作流，那么远程调度、任务保活和结果回传就是一个独立产品层。",
    titleColor: "F2E9DB",
    titleSize: 18,
  });
  addChrome(slide, 3, true);
}

function slide4() {
  const slide = baseSlide();
  addTitle(slide, "codeclaw = IM 入口 + 本地执行引擎 + 长程任务护航层", "产品不是替代 Agent 本身，而是把最强 Agent 接进真实工作流。");

  const columns = [
    {
      x: 0.82,
      title: "在手机上派活",
      body: addBulletLines([
        "普通文本直接下达任务",
        "支持发送截图、PDF、文档",
        "随时追问、补充约束、继续会话",
      ]),
    },
    {
      x: 4.48,
      title: "在本机深度执行",
      body: addBulletLines([
        "直接调用 Claude Code / Codex",
        "读取真实仓库、依赖、环境变量和权限",
        "系统级防休眠，长任务不断线",
      ]),
    },
    {
      x: 8.14,
      title: "把结果原生回传",
      body: addBulletLines([
        "流式进度持续推送",
        "长文本自动拆分或打包",
        "截图、日志、文件一并发回聊天",
      ]),
    },
  ];

  for (const col of columns) {
    addCard(slide, {
      x: col.x,
      y: 2.65,
      w: 3.08,
      h: 2.5,
      fill: C.white,
      line: C.line,
      title: col.title,
      titleSize: 17,
      body: col.body,
      bodySize: 11.2,
      bodyY: 3.34,
      bodyH: 1.45,
    });
  }

  slide.addShape(pptx.ShapeType.line, {
    x: 3.98,
    y: 3.85,
    w: 0.42,
    h: 0,
    line: { color: C.rust, pt: 1.8, endArrowType: "triangle" },
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 7.64,
    y: 3.85,
    w: 0.42,
    h: 0,
    line: { color: C.rust, pt: 1.8, endArrowType: "triangle" },
  });

  const pills = [
    ["实时流式", 0.94, 5.6, 1.15],
    ["产物回传", 2.2, 5.6, 1.25],
    ["历史会话", 3.58, 5.6, 1.25],
    ["安全模式", 4.95, 5.6, 1.25],
    ["工作目录切换", 6.32, 5.6, 1.65],
    ["多 Agent / 模型", 8.12, 5.6, 1.7],
    ["图片/文件输入", 9.98, 5.6, 1.55],
    ["主机状态查看", 11.68, 5.6, 1.05],
  ];
  for (const [label, x, y, w] of pills) {
    addPill(slide, x, y, w, label, {
      fill: C.mist,
      line: C.mist,
      color: C.moss,
      fontSize: 9.5,
    });
  }
  addChrome(slide, 4);
}

function slide5() {
  const slide = baseSlide();
  addTitle(slide, "典型场景天然偏重度，也天然愿意为结果付费", "共性很清楚：任务长、步骤多、依赖本地文件和工具、输出必须可交付。");

  const cards = [
    {
      x: 0.8,
      y: 2.6,
      title: "工程重构与自动修复",
      body: "“把整个项目从 JavaScript 迁移到 TypeScript，解决所有报错，一直跑到测试通过。”",
    },
    {
      x: 6.88,
      y: 2.6,
      title: "研究与报告生成",
      body: "“下载并阅读多篇论文 / 文档 / 舆情讨论，提炼核心观点，产出结构化报告。”",
    },
    {
      x: 0.8,
      y: 4.65,
      title: "数据与内容批处理",
      body: "“批量转换报表、整理素材、转写音频、做多语言本地化，最后把文件统一回传。”",
    },
    {
      x: 6.88,
      y: 4.65,
      title: "移动办公指挥台",
      body: "“出差、通勤、睡前都能派活。第二天回来，拿到结果而不是未完成的终端窗口。”",
    },
  ];
  for (const card of cards) {
    addCard(slide, {
      x: card.x,
      y: card.y,
      w: 5.65,
      h: 1.58,
      fill: C.white,
      line: C.line,
      title: card.title,
      titleSize: 16,
      body: card.body,
      bodySize: 10.9,
      bodyY: card.y + 0.74,
      bodyH: 0.58,
    });
  }
  addCard(slide, {
    x: 0.82,
    y: 6.52,
    w: 11.86,
    h: 0.34,
    fill: C.rust,
    line: C.rust,
  });
  addChrome(slide, 5);
}

function slide6() {
  const slide = baseSlide();
  addTitle(slide, "产品骨架已经完整，下一步是把“好用”变成“可规模化付费”", "以下能力已能支撑真实使用，不是停留在概念和 demo 层。");

  addCard(slide, {
    x: 0.78,
    y: 2.56,
    w: 7.25,
    h: 3.48,
    fill: C.white,
    line: C.line,
    kicker: "已完成的关键闭环",
    title: "从消息入口到结果回传，核心路径已经跑通",
    body: addBulletLines([
      "Telegram 作为原生 IM 入口，支持命令、普通文本、图片和文件输入",
      "Claude Code / Codex 可切换，支持会话续接与工作目录切换",
      "流式输出、长文本分段、artifact manifest、截图/文件回传已完成",
      "主机状态、历史会话、模型切换、安全模式、白名单等远程控制能力齐备",
    ]),
    bodyY: 3.35,
    bodyH: 2.18,
    bodySize: 11.1,
  });

  addCard(slide, {
    x: 8.3,
    y: 2.56,
    w: 4.2,
    h: 1.55,
    fill: C.moss,
    line: C.moss,
    kicker: "工程质量",
    kickerColor: "DCE9E2",
    title: "架构层分离清楚",
    titleColor: C.white,
    body: "channel / bot / code-agent 分层，便于未来扩展新 IM 渠道和企业能力。",
    bodyColor: "DCE9E2",
    bodySize: 10.8,
    bodyY: 3.2,
  });
  addCard(slide, {
    x: 8.3,
    y: 4.33,
    w: 4.2,
    h: 1.71,
    fill: C.white,
    line: C.line,
    kicker: "事实状态",
    title: "已发布 npm 包，当前版本 v0.2.19",
    body: "代码库包含 unit / e2e 测试，README 和架构文档已形成对外叙事基础。",
    bodySize: 10.8,
    bodyY: 5.0,
  });

  addCard(slide, {
    x: 0.8,
    y: 6.2,
    w: 11.74,
    h: 0.58,
    fill: C.mist,
    line: C.mist,
    title: "判断标准已经从“能不能做”转向“能否形成付费用户与团队协作场景”。",
    titleSize: 14.5,
    titleColor: C.moss,
  });
  addChrome(slide, 6);
}

function slide7() {
  const slide = baseSlide();
  addTitle(slide, "我们卡在一个很清晰的位置", "codeclaw 的独特性不是单点功能，而是同时满足“本地执行真实性”和“移动端可控性”。");

  slide.addShape(pptx.ShapeType.line, {
    x: 2.05,
    y: 5.98,
    w: 8.65,
    h: 0,
    line: { color: C.stone, pt: 1.4, endArrowType: "triangle" },
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 2.05,
    y: 5.98,
    w: 0,
    h: -3.62,
    line: { color: C.stone, pt: 1.4, endArrowType: "triangle" },
  });
  addText(slide, "移动端控制体验", {
    x: 10.82,
    y: 5.74,
    w: 1.5,
    h: 0.22,
    fontSize: 10.5,
    color: C.stone,
    bold: true,
    align: "right",
  });
  addText(slide, "执行环境真实性", {
    x: 0.62,
    y: 2.18,
    w: 1.1,
    h: 0.7,
    fontSize: 10.5,
    color: C.stone,
    bold: true,
    rotate: 270,
    align: "center",
  });

  const points = [
    { label: "终端直跑", x: 3.25, y: 3.18, color: C.leaf, r: 0.22 },
    { label: "SSH + tmux", x: 4.8, y: 3.64, color: C.leaf, r: 0.22 },
    { label: "云端 Agent", x: 9.18, y: 4.8, color: C.amber, r: 0.22 },
    { label: "codeclaw", x: 9.55, y: 2.86, color: C.rust, r: 0.34, highlight: true },
  ];
  for (const point of points) {
    slide.addShape(pptx.ShapeType.ellipse, {
      x: point.x,
      y: point.y,
      w: point.r,
      h: point.r,
      fill: { color: point.color },
      line: { color: point.color },
      shadow: point.highlight ? { type: "outer", color: "E2A492", blur: 2, angle: 45, distance: 1, opacity: 0.4 } : undefined,
    });
    addText(slide, point.label, {
      x: point.x - (point.highlight ? 0.12 : 0.05),
      y: point.y + 0.33,
      w: point.highlight ? 1.3 : 1.05,
      h: 0.22,
      fontSize: point.highlight ? 11.5 : 10.4,
      bold: point.highlight,
      color: point.highlight ? C.rustDeep : C.ink,
      align: "center",
    });
  }

  addCard(slide, {
    x: 1.02,
    y: 6.18,
    w: 11.3,
    h: 0.56,
    fill: C.white,
    line: C.line,
    title: "唯一同时覆盖：本地真实执行 + 手机原生控制 + 长程任务护航 + 结果文件回传",
    titleSize: 14.4,
    titleColor: C.moss,
  });
  addChrome(slide, 7);
}

function slide8() {
  const slide = baseSlide();
  addTitle(slide, "商业化路径清晰，先从重度个人用户切入，再向团队与企业抬升", "本页为建议版，请按你当前真实商业策略做微调。");

  const plans = [
    {
      x: 0.78,
      fill: C.white,
      title: "Pro 订阅",
      body: addBulletLines([
        "多设备与多渠道接入",
        "更长历史会话与 artifact 管理",
        "优先模型适配与高级自动化能力",
      ]),
    },
    {
      x: 4.46,
      fill: C.moss,
      line: C.moss,
      title: "Team 协作版",
      titleColor: C.white,
      body: addBulletLines([
        "共享机器人与共享会话",
        "审批流、权限控制、审计日志",
        "小团队知识沉淀与协作效率工具",
      ]),
      bodyColor: "DDE9E3",
    },
    {
      x: 8.14,
      fill: C.white,
      title: "Enterprise 部署",
      body: addBulletLines([
        "私有部署 / on-prem",
        "SSO、目录策略、合规与审计",
        "定制 IM 渠道和内部系统连接器",
      ]),
    },
  ];
  for (const plan of plans) {
    addCard(slide, {
      x: plan.x,
      y: 2.72,
      w: 3.35,
      h: 2.42,
      fill: plan.fill,
      line: plan.line || C.line,
      title: plan.title,
      titleColor: plan.titleColor || C.ink,
      titleSize: 18,
      body: plan.body,
      bodyColor: plan.bodyColor || C.slate,
      bodyY: 3.45,
      bodyH: 1.4,
      bodySize: 11,
    });
  }

  addText(slide, "增长路径", {
    x: 0.82,
    y: 5.6,
    w: 1.1,
    h: 0.28,
    fontSize: 12,
    bold: true,
    color: C.stone,
  });
  const funnel = [
    ["开源口碑", 0.82, 6.0, 1.8],
    ["重度个人用户", 2.92, 6.0, 2.15],
    ["小团队协作", 5.38, 6.0, 2.0],
    ["企业内网部署", 7.7, 6.0, 2.15],
  ];
  for (const [label, x, y, w] of funnel) {
    addPill(slide, x, y, w, label, {
      fill: C.mist,
      line: C.mist,
      color: C.moss,
      h: 0.4,
      fontSize: 10,
    });
  }
  slide.addShape(pptx.ShapeType.line, {
    x: 2.64,
    y: 6.2,
    w: 0.24,
    h: 0,
    line: { color: C.rust, pt: 1.4, endArrowType: "triangle" },
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 5.12,
    y: 6.2,
    w: 0.24,
    h: 0,
    line: { color: C.rust, pt: 1.4, endArrowType: "triangle" },
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 7.46,
    y: 6.2,
    w: 0.24,
    h: 0,
    line: { color: C.rust, pt: 1.4, endArrowType: "triangle" },
  });
  addChrome(slide, 8);
}

function slide9() {
  const slide = baseSlide(C.dark, true);
  addTitle(slide, "接下来 12 个月，重点是从“能跑”走到“能付费、能协作、能部署”", "本页同样是建议版路线图，建议你按真实节奏替换。", { dark: true, titleSize: 24 });

  const roadmap = [
    {
      x: 0.78,
      quarter: "Q2 2026",
      title: "扩大入口",
      body: addBulletLines([
        "补齐飞书 / Slack 等渠道",
        "优化 artifact 展示与回放",
        "强化会话续接稳定性",
      ]),
    },
    {
      x: 3.93,
      quarter: "Q3 2026",
      title: "进入团队",
      body: addBulletLines([
        "共享机器人与共享工作区",
        "审批中心和权限分层",
        "基础审计日志与协作面板",
      ]),
    },
    {
      x: 7.08,
      quarter: "Q4 2026",
      title: "跑通收费",
      body: addBulletLines([
        "计费、套餐与订阅体系",
        "任务模板和工作流能力",
        "更多 artifact 与任务统计",
      ]),
    },
    {
      x: 10.23,
      quarter: "Q1 2027",
      title: "进入企业",
      body: addBulletLines([
        "SSO / on-prem / 合规能力",
        "内部系统与 API 集成",
        "更稳定的组织级运维能力",
      ]),
    },
  ];
  for (const item of roadmap) {
    addCard(slide, {
      x: item.x,
      y: 2.72,
      w: 2.32,
      h: 3.25,
      fill: "17222E",
      line: "314255",
      kicker: item.quarter,
      kickerColor: C.rust,
      title: item.title,
      titleColor: C.white,
      titleSize: 17,
      body: item.body,
      bodyColor: "D0D7DC",
      bodyY: 3.5,
      bodyH: 2.0,
      bodySize: 10.7,
    });
  }
  addChrome(slide, 9, true);
}

function slide10() {
  const slide = baseSlide();
  addTitle(slide, "这页必须替换成你的真实数据", "我没有虚构用户、收入和融资信息。对外汇报前，请把以下占位补齐。");

  addCard(slide, {
    x: 0.8,
    y: 2.72,
    w: 5.8,
    h: 3.58,
    fill: C.white,
    line: C.line,
    kicker: "需要补齐的牵引力指标",
    title: "Traction",
    body: addBulletLines([
      "活跃用户 / 周活 / 留存：[填写真实数据]",
      "试点客户 / 付费用户：[填写真实数据]",
      "典型使用频次 / 人均任务时长：[填写真实数据]",
      "社区反馈、GitHub、NPM 下载或口碑样本：[填写真实数据]",
    ]),
    bodyY: 3.5,
    bodyH: 2.25,
    bodySize: 11.2,
  });

  addCard(slide, {
    x: 6.82,
    y: 2.72,
    w: 5.72,
    h: 3.58,
    fill: C.moss,
    line: C.moss,
    kicker: "建议融资表达",
    kickerColor: "DDE9E3",
    title: "Fundraising Ask",
    titleColor: C.white,
    body: addBulletLines([
      "本轮轮次 / 金额：[填写真实计划]",
      "12 个月目标：[用户数 / 收入 / 客户数]",
      "资金用途：产品 40% / GTM 35% / 基础设施 15% / 核心招聘 10%",
      "本轮想验证的核心假设：[填写一句话]",
    ]),
    bodyColor: "DDE9E3",
    bodyY: 3.5,
    bodyH: 2.25,
    bodySize: 11.2,
  });

  addCard(slide, {
    x: 0.82,
    y: 6.44,
    w: 11.72,
    h: 0.42,
    fill: C.rust,
    line: C.rust,
    title: "建议你先把第 10 页替换完，再正式发给投资人。",
    titleColor: C.white,
    titleSize: 14,
  });
  addChrome(slide, 10);
}

function slide11() {
  const slide = baseSlide(C.dark, true);
  addText(slide, "codeclaw 正在定义一种新的工作流", {
    x: 0.72,
    y: 1.12,
    w: 7.8,
    h: 0.44,
    fontSize: 14,
    color: C.rust,
    bold: true,
  });
  addText(slide, "把最强的本地 Agent，从“只能在电脑前用”变成“随时可派活的执行网络”", {
    x: 0.7,
    y: 1.7,
    w: 9.1,
    h: 1.02,
    fontSize: 26,
    color: C.white,
    bold: true,
    valign: "top",
  });

  addCard(slide, {
    x: 0.82,
    y: 3.24,
    w: 3.75,
    h: 1.85,
    fill: "17222E",
    line: "314255",
    title: "需求是真实的",
    titleColor: C.white,
    body: "重度 AI 用户正在把越来越多工作交给本地 Agent，但远程控制体验仍然空白。",
    bodyColor: "D0D7DC",
    bodySize: 11.1,
    bodyY: 4.0,
  });
  addCard(slide, {
    x: 4.79,
    y: 3.24,
    w: 3.75,
    h: 1.85,
    fill: "17222E",
    line: "314255",
    title: "切口足够锋利",
    titleColor: C.white,
    body: "codeclaw 不是泛 AI 平台，而是聚焦“本地执行 + IM 控制 + 长程任务”的高频刚需。",
    bodyColor: "D0D7DC",
    bodySize: 11.1,
    bodyY: 4.0,
  });
  addCard(slide, {
    x: 8.76,
    y: 3.24,
    w: 3.75,
    h: 1.85,
    fill: "17222E",
    line: "314255",
    title: "扩展路径清晰",
    titleColor: C.white,
    body: "从个人工具走向团队协作和企业部署，天然具备更高客单价和更深护城河。",
    bodyColor: "D0D7DC",
    bodySize: 11.1,
    bodyY: 4.0,
  });

  addText(slide, "GitHub: github.com/xiaotonng/codeclaw", {
    x: 0.74,
    y: 6.2,
    w: 4.2,
    h: 0.24,
    fontSize: 11,
    color: "E6DDD0",
  });
  addText(slide, "创始人 / 邮箱 / 微信：请补充", {
    x: 8.4,
    y: 6.2,
    w: 4.0,
    h: 0.24,
    fontSize: 11,
    color: "E6DDD0",
    align: "right",
  });
  addChrome(slide, 11, true);
}

function buildNotes() {
  return `# codeclaw 投资人汇报备注

## 使用说明

- 这是一版基于仓库现有公开信息整理的投资人介绍 deck。
- 我没有虚构用户、收入、融资金额等商业数据，第 10 页请你务必替换成真实数字。
- 整体逻辑是：问题 -> 时机 -> 方案 -> 场景 -> 产品成熟度 -> 位置 -> 商业化 -> 路线图 -> 牵引力/融资。

## 逐页建议讲法

### 第 1 页
一句话讲清：codeclaw 不是另一个聊天机器人，而是让本地 Agent 可以被手机随时调度的执行中枢。

### 第 2 页
强调用户真正的痛点不是“AI 不够聪明”，而是“人一离开终端，复杂任务就失去可控性”。

### 第 3 页
把机会归因到三个趋势：本地 AI CLI 成熟、长程任务增长、移动办公成为默认习惯。

### 第 4 页
讲产品闭环：手机派活，本地执行，结果回传。这里最适合配合你自己的真实 demo 口述。

### 第 5 页
挑 2 个你最熟的真实使用场景展开，不要四个都讲满。重点要落在“任务长、结果要交付”。

### 第 6 页
这里是“不是 PPT 产品”的证据页。你可以强调已经有 Telegram、双 Agent、artifact return、safe mode、测试等。

### 第 7 页
这页是定位页。核心结论只有一句：codeclaw 同时占住了“本地真实执行”和“移动原生控制”。

### 第 8 页
如果你已经有明确商业模式，直接替换；如果还在探索，就保留这个建议版并口头说明当前优先验证哪一段。

### 第 9 页
建议只讲未来 2 个季度，不要把太远的路线图讲得像承诺。

### 第 10 页
必须替换为真实数据，包括但不限于：
- 活跃用户 / 试点客户 / 留存
- 典型用户案例
- 本轮融资金额、估值预期、资金用途

### 第 11 页
收束成三个判断：需求真实、切口锋利、扩展路径清晰。最后落到你希望投资人继续聊什么。
`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  slide1();
  slide2();
  slide3();
  slide4();
  slide5();
  slide6();
  slide7();
  slide8();
  slide9();
  slide10();
  slide11();
  await pptx.writeFile({ fileName: PPTX_PATH });
  fs.writeFileSync(NOTES_PATH, buildNotes(), "utf8");
  console.log(`wrote ${PPTX_PATH}`);
  console.log(`wrote ${NOTES_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
