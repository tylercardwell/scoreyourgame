import { ImageResponse } from 'next/og';
export const alt = 'ScoreYourGame: a free golf scorecard and live score tracker';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 80,
        background: '#0a2240',
        color: '#fff',
      }}
    >
      <div style={{ fontSize: 34, color: '#6fd08f', letterSpacing: 4 }}>SCOREYOURGAME</div>
      <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1.02, marginTop: 24 }}>
        The leaderboard for your group
      </div>
      <div style={{ fontSize: 36, color: '#c9d6e8', marginTop: 32 }}>
        Free golf scoring. No app to download.
      </div>
    </div>,
    size,
  );
}
