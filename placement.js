// ★ 배치/장식 설정 파일 — UI 요소를 자유롭게 바꾸세요! ★
const PLACEMENT = {

  // 헤더 장식 텍스트
  header: {
    showTopDeco:    true,
    topDecoText:    '★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★',
    showBottomDeco: true,
    bottomDecoText: '· · ───────────────── · ·',
  },

  // 프로필 오른쪽에 떠다니는 장식 이모지
  // animate: 'spin' | 'bounce' | 'pulse' | 'none'
  decorations: [
    { id: 'deco-1', emoji: '⭐', animate: 'spin'   },
    { id: 'deco-2', emoji: '🌸', animate: 'bounce' },
    { id: 'deco-3', emoji: '💫', animate: 'pulse'  },
  ],

  // 배경 패턴
  // pattern: 'hearts' | 'stars' | 'dots' | 'grid' | 'none'
  background: {
    pattern:      'hearts',
    patternColor: 'rgba(255, 105, 180, 0.18)',
    patternSize:  '28px 28px',
  },

  // 트윗 카드 구분선 문자
  tweetCard: {
    dividerChar: '· · ──────── · ·',
  },

  // 푸터
  footer: {
    text:      'made with ♥',
    decoText:  '☆.。.:*・°☆.。.:*・°☆.。.:*・°☆',
    showSince: true,
  },

  // BGM 플레이어
  // 사용하려면 enabled: true 로 바꾸고 src 에 음악 파일 경로를 넣으세요
  bgm: {
    enabled:  false,
    src:      '',            // 예: 'assets/bgm/my-song.mp3'
    autoplay: false,
    loop:     true,
  },
};
