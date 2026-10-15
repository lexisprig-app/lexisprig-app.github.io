import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

const slots = [
  {
    index: '01',
    zh: {
      badge: '痛点 02 · 生活入词',
      title: '拍下眼前物品',
      subtitle: '主体自动抠图贴纸 · 生成多语词卡',
      cardTitle: '手冲咖啡壶 · Pour-over Kettle',
      cardSub: 'English · 日本語 · 中文 同步生成',
      chips: ['视觉主体识别', '透明贴纸发光描边', '场景词卡']
    },
    en: {
      badge: 'Pain Point 02 · Real-Life Scenes',
      title: 'Snap What You See',
      subtitle: 'Subject Sticker Cutout · Multi-Language Cards',
      cardTitle: 'Pour-over Kettle · ドリップケトル',
      cardSub: 'Generated in English · Japanese · Chinese',
      chips: ['Vision Subject Focus', 'Sticker Cutout', 'Scene Card']
    }
  },
  {
    index: '02',
    zh: {
      badge: '痛点 03 · 在语境中理解词汇',
      title: '场景短文与词语理解',
      subtitle: '串联照片中的词汇 · 下划线标出目标词',
      cardTitle: '复习答题后查看句子讲解',
      cardSub: '结合译文理解关键词组在句子里的含义',
      chips: ['词条例句与朗读', '场景短文', '更多例句']
    },
    en: {
      badge: 'Pain Point 03 · Vocabulary in Context',
      title: 'Scene Passages & Explanations',
      subtitle: 'Connect words from one photo · Underline target words',
      cardTitle: 'Scene Passage (Target Words Underlined)',
      cardSub: 'Review answer explanations to understand key phrases',
      chips: ['Vocabulary Examples', 'Scene Passage', 'More Examples']
    }
  },
  {
    index: '03',
    zh: {
      badge: '痛点 03 · 在复习中理解用法',
      title: '复习解析与更多例句',
      subtitle: '看懂句中关键表达 · 按需生成例句',
      cardTitle: '结合语境理解本题答案',
      cardSub: '查看译文、重点讲解和更多例句',
      chips: ['句子讲解', '例句译文', '朗读例句']
    },
    en: {
      badge: 'Pain Point 03 · Understand During Review',
      title: 'Review Explanations & More Examples',
      subtitle: 'Understand key phrases in context · Generate examples when useful',
      cardTitle: 'Understand the answer in context',
      cardSub: 'See the translation, explanation, and more examples',
      chips: ['Sentence Explanation', 'Example Translation', 'Read Aloud']
    }
  },
  {
    index: '04',
    zh: {
      badge: '痛点 02 · 交流自带话题',
      title: '联动灵感树洞 · 延伸表达',
      subtitle: '场景图 + 多词短文一键送入灵感树洞写成日常随笔',
      cardTitle: '发送到灵感树洞 (InspirationDraft)',
      cardSub: '将今日咖啡馆词汇与场景短文转化为聊天话题与随笔',
      chips: ['跨应用无缝接力', '附图与短文同步', '积累真实话题']
    },
    en: {
      badge: 'Pain Point 02 · Conversation Topics',
      title: 'Send to InspirationDraft',
      subtitle: 'Turn Scene Photos & Passages into Personal Stories',
      cardTitle: 'Handoff to InspirationDraft',
      cardSub: 'Carry your scene image and vocabulary passage into a draft',
      chips: ['One-Tap Handoff', 'Photo + Passage Sync', 'Conversation Ready']
    }
  },
  {
    index: '05',
    zh: {
      badge: '痛点 01 · 一景多语不切 App',
      title: '多语种同屏对照学习',
      subtitle: '学习语言（多选）与解释语言（单选）彻底解耦',
      cardTitle: 'English · 日本語 · 中文 同卡切换',
      cardSub: '新增学习语种后，历史场景卡片自动补齐对应词条',
      chips: ['多学习语种并列', '统一母语释义', '历史词卡自动补齐']
    },
    en: {
      badge: 'Pain Point 01 · Multi-Language Sync',
      title: 'One Scene, Multiple Languages',
      subtitle: 'Multi-Select Learning Languages + Single Explanation Language',
      cardTitle: 'English · 日本語 · 中文 Side by Side',
      cardSub: 'Adding a new language automatically backfills past cards',
      chips: ['Side-by-Side Tabs', 'Unified Explanation', 'Automatic Backfill']
    }
  },
  {
    index: '06',
    zh: {
      badge: '痛点 01 · 语种独立记忆曲线',
      title: '三阶复习与记忆衰减曲线',
      subtitle: '带图巩固 → 打乱检阅 → 藏图盲测',
      cardTitle: 'FSRS 语种独立记忆排程',
      cardSub: '每个语种独立计算熟练度与下次复习时间，互不干扰',
      chips: ['三阶段渐进脱敏', '按语种独立排程', '可视化记忆曲线']
    },
    en: {
      badge: 'Pain Point 01 · Per-Language Memory',
      title: '3-Stage Review & Memory Curve',
      subtitle: 'With Photo → Shuffled → Hidden Photo Recall',
      cardTitle: 'Independent Per-Language FSRS Curve',
      cardSub: 'Each language tracks its own retention and review schedule',
      chips: ['3-Stage Recall', 'Per-Language Schedule', 'Retention Curve']
    }
  }
];

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderSvg(slot, localeKey) {
  const copy = slot[localeKey];
  const slotLabel = localeKey === 'zh' ? `预留截图槽位 ${slot.index}` : `Reserved Screenshot Slot ${slot.index}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1320" height="2868" viewBox="0 0 1320 2868">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#053D2A"/>
      <stop offset="52%" stop-color="#082B1E"/>
      <stop offset="100%" stop-color="#041911"/>
    </linearGradient>
    <linearGradient id="card" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FAF3E0"/>
      <stop offset="100%" stop-color="#EFF6F0"/>
    </linearGradient>
  </defs>
  <rect width="1320" height="2868" fill="url(#bg)"/>
  <circle cx="660" cy="420" r="380" fill="#27AA60" fill-opacity="0.14"/>
  <rect x="96" y="136" width="1128" height="84" rx="42" fill="#0B3B29" stroke="#27AA60" stroke-opacity="0.45" stroke-width="3"/>
  <text x="660" y="192" text-anchor="middle" fill="#8CEC90" font-family="-apple-system, PingFang SC, SF Pro Display, sans-serif" font-size="38" font-weight="700">${escapeXml(copy.badge)}</text>
  <text x="660" y="340" text-anchor="middle" fill="#FAF3E0" font-family="-apple-system, PingFang SC, SF Pro Display, sans-serif" font-size="76" font-weight="700">${escapeXml(copy.title)}</text>
  <text x="660" y="430" text-anchor="middle" fill="#B8D8C4" font-family="-apple-system, PingFang SC, SF Pro Text, sans-serif" font-size="40" font-weight="500">${escapeXml(copy.subtitle)}</text>

  <!-- Phone Mockup Card Surface -->
  <rect x="110" y="540" width="1100" height="1960" rx="72" fill="#0A291D" stroke="#27AA60" stroke-opacity="0.4" stroke-width="4"/>
  <rect x="166" y="620" width="988" height="680" rx="48" fill="url(#card)"/>
  <rect x="220" y="680" width="260" height="58" rx="29" fill="#053D2A"/>
  <text x="350" y="720" text-anchor="middle" fill="#8CEC90" font-family="-apple-system, PingFang SC, SF Pro Text, sans-serif" font-size="28" font-weight="700">LexiSprig · ${slot.index}</text>
  <text x="220" y="850" fill="#053D2A" font-family="-apple-system, PingFang SC, SF Pro Display, sans-serif" font-size="52" font-weight="700">${escapeXml(copy.cardTitle)}</text>
  <text x="220" y="940" fill="#2C5443" font-family="-apple-system, PingFang SC, SF Pro Text, sans-serif" font-size="36" font-weight="500">${escapeXml(copy.cardSub)}</text>

  <!-- Language / Feature Pills inside Mockup -->
  <rect x="220" y="1040" width="280" height="72" rx="36" fill="#053D2A" fill-opacity="0.1"/>
  <text x="360" y="1088" text-anchor="middle" fill="#053D2A" font-family="-apple-system, PingFang SC, SF Pro Text, sans-serif" font-size="30" font-weight="600">${escapeXml(copy.chips[0])}</text>

  <rect x="524" y="1040" width="280" height="72" rx="36" fill="#053D2A" fill-opacity="0.1"/>
  <text x="664" y="1088" text-anchor="middle" fill="#053D2A" font-family="-apple-system, PingFang SC, SF Pro Text, sans-serif" font-size="30" font-weight="600">${escapeXml(copy.chips[1])}</text>

  <rect x="828" y="1040" width="270" height="72" rx="36" fill="#053D2A" fill-opacity="0.1"/>
  <text x="963" y="1088" text-anchor="middle" fill="#053D2A" font-family="-apple-system, PingFang SC, SF Pro Text, sans-serif" font-size="30" font-weight="600">${escapeXml(copy.chips[2])}</text>

  <!-- Secondary Card Preview -->
  <rect x="166" y="1360" width="988" height="480" rx="44" fill="#103828" stroke="#27AA60" stroke-opacity="0.35" stroke-width="3"/>
  <circle cx="266" cy="1480" r="42" fill="#27AA60" fill-opacity="0.25"/>
  <path d="M248 1480 L262 1494 L288 1466" fill="none" stroke="#8CEC90" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="340" y="1444" width="680" height="32" rx="16" fill="#8CEC90" fill-opacity="0.32"/>
  <rect x="340" y="1504" width="520" height="26" rx="13" fill="#FAF3E0" fill-opacity="0.22"/>
  <rect x="226" y="1600" width="868" height="160" rx="28" fill="#082419"/>
  <text x="660" y="1695" text-anchor="middle" fill="#8CEC90" font-family="-apple-system, PingFang SC, SF Pro Text, sans-serif" font-size="36" font-weight="600">${slotLabel}</text>

  <!-- Bottom Slot Indicator -->
  <rect x="166" y="1900" width="988" height="480" rx="44" fill="#0E3123" stroke="#FAF3E0" stroke-opacity="0.18" stroke-width="2"/>
  <text x="660" y="2110" text-anchor="middle" fill="#FAF3E0" font-family="-apple-system, PingFang SC, SF Pro Display, sans-serif" font-size="54" font-weight="700">iphone-6.9-${slot.index}.png</text>
  <text x="660" y="2195" text-anchor="middle" fill="#9BC4AE" font-family="-apple-system, PingFang SC, SF Pro Text, sans-serif" font-size="34">1320 × 2868 · ${localeKey === 'zh' ? '支持一键替换为最终真机/模拟器截图' : 'Ready for drop-in App Store screenshot replacement'}</text>
</svg>`;
}

for (const [localeKey, folder] of [['zh', 'zh-Hans'], ['en', 'en']]) {
  const outDir = resolve(root, 'appstore/fancy-screenshots/output', folder);
  mkdirSync(outDir, { recursive: true });
  for (const slot of slots) {
    const svgPath = resolve(outDir, `iphone-6.9-${slot.index}.svg`);
    const pngPath = resolve(outDir, `iphone-6.9-${slot.index}.png`);
    writeFileSync(svgPath, renderSvg(slot, localeKey), 'utf8');
    execFileSync('rsvg-convert', ['-w', '1320', '-h', '2868', svgPath, '-o', pngPath]);
  }
}

console.log('Generated 12 bilingual placeholder screenshots (01-06 in zh-Hans and en).');
