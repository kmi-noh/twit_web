'use strict';

let allTweets = [];
let currentTag = 'all';
let currentSort = 'newest';

// ── 커서 SVG 프리셋 ──────────────────────────────────────────

const CURSOR_SVGS = {
  star: encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">' +
    '<polygon points="16,2 19.5,12 30,12 21.5,18.5 24.5,29 16,22.5 7.5,29 10.5,18.5 2,12 12.5,12"' +
    ' fill="#FFD700" stroke="#FF69B4" stroke-width="1.5"/></svg>'
  ),
  heart: encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">' +
    '<path d="M16 27C8 21 2 15 2 9.5C2 6 4.8 3 8.5 3C11.5 3 14 5 16 7.5C18 5 20.5 3 23.5 3C27.2 3 30 6 30 9.5C30 15 24 21 16 27Z"' +
    ' fill="#FF69B4" stroke="#FF1493" stroke-width="1"/></svg>'
  ),
  wand: encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">' +
    '<line x1="5" y1="27" x2="21" y2="11" stroke="#DDA0DD" stroke-width="3" stroke-linecap="round"/>' +
    '<polygon points="21,3 25,11 17,11" fill="#FFD700"/>' +
    '<circle cx="26" cy="7" r="2.5" fill="#FFD700" opacity="0.8"/>' +
    '<circle cx="9" cy="23" r="1.5" fill="#FFD700" opacity="0.7"/>' +
    '<circle cx="28" cy="22" r="1.2" fill="#FFB3D9"/></svg>'
  ),
};

function buildCursorValue(cfg) {
  if (cfg.cursor === 'custom' && cfg.cursorImagePath) {
    return `url("${cfg.cursorImagePath}") 0 0, auto`;
  }
  const svg = CURSOR_SVGS[cfg.cursor];
  if (!svg) return 'auto';
  const hotspot = cfg.cursor === 'heart' ? '16 27' : '16 16';
  return `url("data:image/svg+xml,${svg}") ${hotspot}, auto`;
}

// ── config.js 적용 ──────────────────────────────────────────

function applyConfig() {
  const c = CONFIG;
  const root = document.documentElement;

  const colors = c.colors || {};
  const map = {
    '--bg-primary':     colors.bgPrimary,
    '--bg-secondary':   colors.bgSecondary,
    '--accent':         colors.accent,
    '--accent-dark':    colors.accentDark,
    '--card-bg':        colors.cardBg,
    '--text-primary':   colors.textPrimary,
    '--text-secondary': colors.textSecondary,
  };
  Object.entries(map).forEach(([prop, val]) => { if (val) root.style.setProperty(prop, val); });

  // 커서
  const cursorValue = buildCursorValue(c);
  const styleEl = document.createElement('style');
  styleEl.id = 'cursor-override';
  styleEl.textContent = `* { cursor: ${cursorValue} !important; } a, button, label, [role=button] { cursor: ${cursorValue} !important; }`;
  document.head.appendChild(styleEl);

  // 제목
  const title = c.title || '나의 미니홈피';
  document.getElementById('hompy-title').textContent = title;
  document.getElementById('page-title').textContent = `★ ${title} ★`;

  // 프로필 핸들
  if (c.twitterHandle) {
    document.getElementById('profile-handle').textContent = `@${c.twitterHandle}`;
  }

  // 프로필 이미지 (config 우선)
  if (c.profileImagePath) {
    const img = document.getElementById('profile-pic');
    img.src = c.profileImagePath;
  }

  // 방문자 카운터
  const counterEl = document.getElementById('visitor-counter');
  if (counterEl) {
    counterEl.style.display = c.showVisitorCounter !== false ? 'flex' : 'none';
    if (c.showVisitorCounter !== false) animateCounter();
  }

  // 오늘 날짜
  const dateEl = document.getElementById('current-date');
  if (dateEl) {
    const n = new Date();
    dateEl.textContent =
      `${n.getFullYear()}.${pad(n.getMonth() + 1)}.${pad(n.getDate())}`;
  }
}

function animateCounter() {
  const digits = document.querySelectorAll('#counter-digits span');
  if (!digits.length) return;
  const seed = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = (parseInt(seed) % 900000) + 100000;
  const str = String(count).padStart(6, '0');
  digits.forEach((d, i) => { d.textContent = str[i]; });
}

// ── placement.js 적용 ──────────────────────────────────────

function applyPlacement() {
  const p = PLACEMENT;

  // 헤더 장식
  const h = p.header || {};
  setTextIf('header-deco-top',    h.showTopDeco    !== false ? h.topDecoText    : '');
  setTextIf('header-deco-bottom', h.showBottomDeco !== false ? h.bottomDecoText : '');

  // 배경 패턴
  if (p.background) applyBgPattern(p.background);

  // 장식 이모지
  const decoContainer = document.getElementById('profile-decorations');
  if (decoContainer && p.decorations) {
    decoContainer.innerHTML = '';
    p.decorations.forEach(d => {
      const el = document.createElement('span');
      el.className = `deco-item deco-${d.animate || 'none'}`;
      el.id = d.id || '';
      el.textContent = d.emoji;
      decoContainer.appendChild(el);
    });
  }

  // 푸터
  const f = p.footer || {};
  setTextIf('footer-deco', f.decoText || '');
  const footerText = document.getElementById('footer-text');
  if (footerText) {
    let txt = f.text || 'made with ♥';
    if (f.showSince && CONFIG.startDate) txt += ` | since ${CONFIG.startDate}`;
    footerText.textContent = txt;
  }

  // BGM
  const bgm = p.bgm || {};
  if (bgm.enabled && bgm.src) {
    const player = document.getElementById('bgm-player');
    const audio  = document.getElementById('bgm-audio');
    const toggle = document.getElementById('bgm-toggle');
    if (player && audio) {
      player.style.display = 'flex';
      audio.src  = bgm.src;
      audio.loop = bgm.loop !== false;
      if (bgm.autoplay) audio.play().catch(() => {});
      toggle.addEventListener('click', () => {
        if (audio.paused) { audio.play(); toggle.textContent = '♫'; }
        else              { audio.pause(); toggle.textContent = '♪'; }
      });
    }
  }
}

function applyBgPattern(bg) {
  const color = bg.patternColor || 'rgba(255,105,180,0.18)';
  const size  = bg.patternSize  || '28px 28px';
  const patterns = {
    hearts: `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><text x="5" y="20" font-size="14" fill="${color}">♥</text></svg>`)}")`,
    stars:  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><text x="4" y="20" font-size="14" fill="${color}">★</text></svg>`)}")`,
    dots:   `radial-gradient(circle, ${color} 2px, transparent 2px)`,
    grid:   `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
    none:   'none',
  };
  document.body.style.backgroundImage = patterns[bg.pattern] || patterns.hearts;
  document.body.style.backgroundSize  = size;
}

// ── 데이터 로드 ────────────────────────────────────────────

async function loadTweets() {
  const feed = document.getElementById('diary-section');
  try {
    const res = await fetch(CONFIG.tweetsDataPath || 'data/tweets.json');
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
    const data = await res.json();
    ingestData(data);
  } catch (err) {
    showSetupMessage(err.message);
  }
}

function ingestData(data) {
  const user = data.user || {};
  let tweets = data.tweets || [];

  // 리트윗 제거
  if (CONFIG.hideRetweets !== false) {
    tweets = tweets.filter(t => !t.text.startsWith('RT @'));
  }

  allTweets = tweets;

  // 프로필 정보 적용 (config 가 없을 때만)
  if (!CONFIG.profileImagePath && user.profile_image_url) {
    const img = document.getElementById('profile-pic');
    img.src = user.profile_image_url.replace('_normal', '_400x400');
  }
  if (user.name) document.getElementById('profile-name').textContent = user.name;
  if (user.username && !CONFIG.twitterHandle) {
    document.getElementById('profile-handle').textContent = `@${user.username}`;
  }

  updateTagFilter(allTweets);
  renderTweets(getSorted());
}

function showSetupMessage(errMsg) {
  document.getElementById('diary-section').innerHTML = `
    <div class="error-msg">
      <p>★ 트윗 데이터를 불러올 수 없어요 ★</p>
      <p class="error-detail">${escHtml(errMsg)}</p>
      <p class="error-hint">아직 데이터가 없다면 아래 방법으로 가져올 수 있어요.</p>
      <div class="setup-steps">
        <strong>방법 1 — 아카이브 파일 불러오기</strong><br>
        상단 📂 버튼으로 트위터 아카이브의 <code>tweets.js</code> 파일을 열어주세요.<br><br>
        <strong>방법 2 — API 자동 fetch</strong><br>
        <code>.env</code> 파일에 Bearer Token 입력 후<br>
        <code>npm run fetch</code> 를 실행하세요.
      </div>
    </div>
  `;
}

// ── 필터 / 정렬 ───────────────────────────────────────────

function getSorted() {
  const list = currentTag === 'all'
    ? [...allTweets]
    : allTweets.filter(t => (t.tags || []).includes(currentTag));

  list.sort((a, b) => {
    const diff = new Date(b.created_at) - new Date(a.created_at);
    return currentSort === 'newest' ? diff : -diff;
  });
  return list;
}

function setActiveTag(tag) {
  currentTag = tag;
  document.querySelectorAll('.tag-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.tag === tag)
  );
  renderTweets(getSorted());
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateTagFilter(tweets) {
  const wrap = document.getElementById('tag-filter-wrap');
  if (!wrap) return;

  const counts = {};
  tweets.forEach(t => (t.tags || []).forEach(tag => { counts[tag] = (counts[tag] || 0) + 1; }));
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([tag]) => tag);

  const allBtn = wrap.querySelector('[data-tag="all"]');
  wrap.innerHTML = '';
  wrap.appendChild(allBtn);

  sorted.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = `tag-btn${tag === currentTag ? ' active' : ''}`;
    btn.dataset.tag = tag;
    btn.textContent = `#${tag} (${counts[tag]})`;
    wrap.appendChild(btn);
  });
}

// ── 렌더링 ────────────────────────────────────────────────

function renderTweets(tweets) {
  const feed = document.getElementById('diary-section');
  if (!tweets.length) {
    feed.innerHTML = `
      <div class="empty-msg">
        <p>★ 표시할 트윗이 없어요 ★</p>
        <p class="empty-hint">다른 태그를 선택해 보세요!</p>
      </div>`;
    return;
  }

  const divider = (PLACEMENT.tweetCard || {}).dividerChar || '· · ──────── · ·';

  feed.innerHTML = tweets.map((tweet, idx) => {
    const metricsHtml = CONFIG.showMetrics !== false ? `
      <div class="tweet-metrics">
        <span>♥ ${tweet.metrics?.likes    ?? 0}</span>
        <span>🔁 ${tweet.metrics?.retweets ?? 0}</span>
        <span>💬 ${tweet.metrics?.replies  ?? 0}</span>
      </div>` : '';

    const tags = tweet.tags || [];
    const tagsHtml = tags.length ? `
      <div class="tweet-tags">
        ${tags.map(tag => `<button class="tweet-tag-btn" data-tag="${escAttr(tag)}">#${escHtml(tag)}</button>`).join('')}
      </div>` : '';

    const sep = idx < tweets.length - 1
      ? `<div class="tweet-divider">${escHtml(divider)}</div>` : '';

    return `
      <article class="tweet-card" data-id="${escAttr(tweet.id)}">
        <div class="tweet-date-header">
          <span class="date-icon">📅</span>
          <span class="date-text">${formatDate(tweet.created_at)}</span>
        </div>
        <div class="tweet-body">
          <p class="tweet-text">${formatText(tweet.text)}</p>
          ${tagsHtml}
          ${metricsHtml}
        </div>
        ${sep}
      </article>`;
  }).join('');

  feed.querySelectorAll('.tweet-tag-btn').forEach(btn =>
    btn.addEventListener('click', () => setActiveTag(btn.dataset.tag))
  );
}

// ── 텍스트 포맷팅 ─────────────────────────────────────────

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} (${days[d.getDay()]}) ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatText(text) {
  let s = escHtml(text);
  s = s.replace(/#([\w가-힣]+)/g, '<span class="tweet-tag-inline">#$1</span>');
  s = s.replace(/(https?:\/\/[^\s<>"]+)/g,
    '<a class="tweet-link" href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  s = s.replace(/@(\w+)/g, '<span class="tweet-mention">@$1</span>');
  return s;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(str) { return escHtml(str); }
function pad(n)       { return String(n).padStart(2, '0'); }

// ── 아카이브 파일 불러오기 ─────────────────────────────────

function handleArchiveFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      let content = e.target.result;
      content = content.replace(/^\s*window\.YTD\.tweets\.part\d+\s*=\s*/, '');
      const raw = JSON.parse(content);
      const tweets = raw.map(item => {
        const t = item.tweet || item;
        const tags = (t.entities?.hashtags || []).map(h => h.text);
        return {
          id:         t.id_str || t.id,
          text:       t.full_text || t.text,
          created_at: new Date(t.created_at).toISOString(),
          tags,
          metrics: {
            likes:    parseInt(t.favorite_count || '0', 10),
            retweets: parseInt(t.retweet_count  || '0', 10),
            replies:  0,
          },
        };
      });
      ingestData({ user: {}, tweets });
    } catch (err) {
      alert('파일을 읽는 중 오류가 발생했어요: ' + err.message);
    }
  };
  reader.readAsText(file);
}

// ── 프로필 이미지 폴백 ────────────────────────────────────

function initProfilePic() {
  const img      = document.getElementById('profile-pic');
  const fallback = document.getElementById('profile-pic-fallback');
  img.addEventListener('error', () => {
    img.style.display = 'none';
    fallback.style.display = 'flex';
  });
  if (!img.src || img.src === window.location.href) {
    img.style.display = 'none';
    fallback.style.display = 'flex';
  }
}

// ── 초기화 ────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  applyConfig();
  applyPlacement();
  initProfilePic();

  // 정렬 버튼
  document.querySelectorAll('.sort-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      currentSort = btn.dataset.sort;
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTweets(getSorted());
    })
  );

  // 태그 필터
  document.getElementById('tag-filter-wrap').addEventListener('click', e => {
    const btn = e.target.closest('.tag-btn');
    if (btn) setActiveTag(btn.dataset.tag);
  });

  // 아카이브 파일 입력
  document.getElementById('archive-input').addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) handleArchiveFile(file);
    e.target.value = '';
  });

  loadTweets();
});
