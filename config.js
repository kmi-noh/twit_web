// ★ 설정 파일 — 여기서 미니홈피를 꾸미세요! ★
const CONFIG = {

  // 기본 정보
  title: '나의 트위터 미니홈피',
  twitterHandle: 'your_username',   // @ 없이 입력

  // 마우스 커서
  // 선택지: 'default' | 'star' | 'heart' | 'wand' | 'custom'
  cursor: 'star',
  cursorImagePath: 'assets/cursors/my-cursor.cur', // cursor: 'custom'일 때만 사용

  // 색상 (CSS 색상값 자유롭게 변경)
  colors: {
    bgPrimary:      '#FFF0F8',   // 전체 배경
    bgSecondary:    '#FFE4F0',   // 섹션 배경
    accent:         '#FF69B4',   // 포인트 색
    accentDark:     '#FF1493',   // 포인트 진한 색
    cardBg:         '#FFFEF8',   // 카드 배경
    textPrimary:    '#4A2040',   // 본문 글씨
    textSecondary:  '#8B5080',   // 보조 글씨
  },

  // 프로필 이미지 경로 (비워두면 tweets.json의 이미지 사용)
  profileImagePath: '',

  // 방문자 카운터 표시 여부
  showVisitorCounter: true,

  // 좋아요/리트윗/댓글 수 표시 여부
  showMetrics: true,

  // 리트윗 숨기기 (본인 글만 보기)
  hideRetweets: true,

  // 데이터 파일 경로 (fetch-tweets.js 가 저장하는 파일)
  tweetsDataPath: 'data/tweets.json',

  // 시작 날짜 (푸터에 표시)
  startDate: '2024.01.01',
};
