import { useMemo } from 'react';
import { SVG_ICON_MAP } from '../../components/drill/DrillIcons';

interface SceneCanvasProps {
  background: 'A' | 'B' | 'C';
  overlaySvgs: string[];
  title: string;
  score: number;
  animating?: 'idle' | 'out' | 'in';
}

const BG_NAMES: Record<string, string> = {
  A: '实验室操作台',
  B: '更衣准入区',
  C: '应急喷淋区',
};

// 生成粒子
function generateParticles(count: number): Array<{ left: number; delay: number; duration: number; size: number }> {
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 6 + Math.random() * 8,
      size: 1 + Math.random() * 2,
    });
  }
  return particles;
}

export default function SceneCanvas({ background, overlaySvgs, title, score, animating = 'idle' }: SceneCanvasProps) {
  const particles = useMemo(() => generateParticles(20), []);

  const icons = useMemo(() => {
    const glowIcons = overlaySvgs.filter((n) => n.includes('光晕'));
    const normalIcons = overlaySvgs.filter((n) => !n.includes('光晕'));
    return { glowIcons, normalIcons };
  }, [overlaySvgs]);

  const glowColor = useMemo(() => {
    if (overlaySvgs.some((n) => n.includes('告警'))) return '#f97316';
    if (overlaySvgs.some((n) => n.includes('灼伤'))) return '#ef4444';
    return '#38bdf8';
  }, [overlaySvgs]);

  const normalColor = useMemo(() => {
    if (overlaySvgs.some((n) => n.includes('火苗'))) return '#f97316';
    if (overlaySvgs.some((n) => n.includes('闪电'))) return '#fbbf24';
    if (overlaySvgs.some((n) => n.includes('灼伤'))) return '#ef4444';
    return '#38bdf8';
  }, [overlaySvgs]);

  const canvasClass =
    animating === 'out'
      ? 'shrink-out'
      : animating === 'in'
        ? 'zoom-in'
        : '';

  return (
    <div className="drill-canvas-wrap">
      <div className={`drill-canvas bg-${background} ${canvasClass}`}>
        {/* 粒子 */}
        <div className="drill-particles" style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          {particles.map((p, i) => (
            <div
              key={i}
              className="drill-particle"
              style={{
                left: `${p.left}%`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                color: normalColor,
              }}
            />
          ))}
        </div>

        {/* 顶部标题条 */}
        <div className="drill-canvas-header">
          <span className="drill-canvas-title">{title}</span>
          <span className="drill-canvas-score">安全分 {score}</span>
        </div>

        {/* 背景层 */}
        <div className="drill-canvas-bg">
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '24px',
              fontSize: '11px',
              color: 'rgba(148,163,184,0.4)',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              zIndex: 2,
            }}
          >
            场景环境 · {BG_NAMES[background]}
          </div>
        </div>

        {/* 光晕类图标（底层） */}
        {icons.glowIcons.map((name, i) => {
          const Icon = SVG_ICON_MAP[name];
          if (!Icon) return null;
          return (
            <div
              key={`glow-${i}`}
              className="drill-overlay-glow"
              style={{ color: glowColor }}
            >
              <Icon size={360} />
            </div>
          );
        })}

        {/* 普通图标（上层） */}
        <div className="drill-canvas-overlays" style={{ position: 'relative', zIndex: 3 }}>
          {icons.normalIcons.map((name, i) => {
            const Icon = SVG_ICON_MAP[name];
            if (!Icon) return null;
            return (
              <div
                key={`icon-${i}`}
                className="drill-overlay-icon"
                style={{ color: normalColor }}
              >
                <Icon size={80} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
