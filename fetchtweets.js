#!/usr/bin/env node
'use strict';

/**
 * Twitter/X API v2 트윗 fetcher
 *
 * 사용법:
 *   1. .env 파일에 TWITTER_BEARER_TOKEN, TWITTER_USERNAME 입력
 *   2. npm run fetch
 *
 * 주의: 타임라인 읽기(GET /2/users/:id/tweets)는 Basic 이상 플랜 필요합니다.
 *       Free 플랜은 403 오류가 발생합니다.
 *       무료로 사용하려면 트위터 아카이브 + 앱의 📂 불러오기 기능을 사용하세요.
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

// ── .env 파일 파싱 ───────────────────────────────────────

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) return;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (key) process.env[key] = val;
  });
}

loadEnv();

const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
const USERNAME     = process.env.TWITTER_USERNAME;
const MAX_TWEETS   = parseInt(process.env.MAX_TWEETS || '500', 10);
const DATA_FILE    = path.join(__dirname, '..', 'data', 'tweets.json');

if (!BEARER_TOKEN) {
  console.error('❌  TWITTER_BEARER_TOKEN 이 .env 파일에 없습니다.');
  process.exit(1);
}
if (!USERNAME) {
  console.error('❌  TWITTER_USERNAME 이 .env 파일에 없습니다.');
  process.exit(1);
}

// ── HTTP 요청 ────────────────────────────────────────────

function apiGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { Authorization: `Bearer ${BEARER_TOKEN}` },
    }, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch (e) { reject(new Error(`JSON 파싱 실패: ${body.slice(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('요청 시간 초과')); });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── API 호출 ─────────────────────────────────────────────

async function getUserInfo(username) {
  const url = `https://api.twitter.com/2/users/by/username/${username}` +
    '?user.fields=profile_image_url,name,description';
  const { status, data } = await apiGet(url);
  if (status !== 200 || !data.data) {
    const msg = data.errors?.[0]?.detail || data.title || JSON.stringify(data);
    throw new Error(`유저 정보 조회 실패 (HTTP ${status}): ${msg}`);
  }
  return data.data;
}

async function fetchTimeline(userId, sinceId) {
  const tweets = [];
  let nextToken = null;
  let page      = 0;

  do {
    let url = `https://api.twitter.com/2/users/${userId}/tweets` +
      '?max_results=100' +
      '&tweet.fields=created_at,public_metrics,entities,text' +
      '&exclude=retweets,replies';
    if (nextToken) url += `&pagination_token=${nextToken}`;
    if (sinceId)   url += `&since_id=${sinceId}`;

    const { status, data } = await apiGet(url);

    if (status === 403) {
      throw new Error(
        'API 접근 권한이 없습니다 (403).\n' +
        '타임라인 읽기는 Twitter Basic 플랜($100/월) 이상이 필요합니다.\n' +
        '대신 트위터 아카이브를 다운로드해서 앱의 📂 불러오기 기능을 사용하세요.'
      );
    }
    if (status === 429) {
      console.log('Rate limit 도달. 15분 대기 중...');
      await sleep(15 * 60 * 1000);
      continue;
    }
    if (status !== 200) {
      const msg = data.errors?.[0]?.detail || data.title || JSON.stringify(data);
      throw new Error(`트윗 조회 실패 (HTTP ${status}): ${msg}`);
    }
    if (!data.data || data.data.length === 0) break;

    tweets.push(...data.data);
    nextToken = data.meta?.next_token || null;
    page++;
    console.log(`  페이지 ${page}: ${tweets.length}개 수집됨`);

    if (tweets.length >= MAX_TWEETS) break;
    if (nextToken) await sleep(1200);
  } while (nextToken);

  return tweets;
}

// ── 트윗 변환 ────────────────────────────────────────────

function parseTweet(t) {
  const tags = (t.entities?.hashtags || []).map(h => h.tag || h.text);
  return {
    id:         t.id,
    text:       t.text,
    created_at: t.created_at,
    tags,
    metrics: {
      likes:    t.public_metrics?.like_count     || 0,
      retweets: t.public_metrics?.retweet_count  || 0,
      replies:  t.public_metrics?.reply_count    || 0,
    },
  };
}

// ── 메인 ─────────────────────────────────────────────────

async function main() {
  console.log(`\n🐦  @${USERNAME} 의 트윗을 가져옵니다...\n`);

  // 기존 데이터 불러오기
  let existing = { user: {}, tweets: [] };
  if (fs.existsSync(DATA_FILE)) {
    try {
      existing = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      console.log(`기존 데이터: ${existing.tweets.length}개 트윗`);
    } catch (_) {
      console.warn('기존 데이터를 읽을 수 없어 새로 시작합니다.');
    }
  }

  // 유저 정보
  const user = await getUserInfo(USERNAME);
  console.log(`✅  유저 확인: ${user.name} (@${user.username})\n`);

  // 가장 최신 트윗 ID (증분 fetch)
  let sinceId = null;
  if (existing.tweets.length > 0) {
    sinceId = existing.tweets.reduce(
      (max, t) => (BigInt(t.id) > BigInt(max) ? t.id : max),
      existing.tweets[0].id
    );
    console.log(`마지막 트윗 ID: ${sinceId} (이후 것만 가져옵니다)`);
  }

  // 트윗 가져오기
  const raw = await fetchTimeline(user.id, sinceId);
  const fresh = raw.map(parseTweet);
  console.log(`\n새 트윗: ${fresh.length}개`);

  // 병합 + 중복 제거 + 정렬
  const all  = [...fresh, ...existing.tweets];
  const seen = new Set();
  const unique = all.filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true; });
  unique.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const result = {
    user: {
      name:              user.name,
      username:          user.username,
      profile_image_url: user.profile_image_url || '',
      description:       user.description || '',
    },
    tweets:     unique,
    fetched_at: new Date().toISOString(),
  };

  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(result, null, 2), 'utf8');

  console.log(`\n✨  완료! 총 ${unique.length}개 트윗 → ${DATA_FILE}`);
  console.log(`   (신규 ${fresh.length}개 추가)\n`);
}

main().catch(err => {
  console.error('\n❌  오류:', err.message, '\n');
  process.exit(1);
});
