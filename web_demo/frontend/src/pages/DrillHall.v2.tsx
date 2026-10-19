import { useEffect, useMemo, useState } from 'react';
import { useDrillScenarios } from '../../hooks/useDrill';
import { SVG_ICON_MAP } from '../../components/drill/DrillIcons';
import type { DrillCategory, DrillScenarioMeta } from '../../types/drill';
import './drill.css';

interface DrillHallProps {
  onStart: (scenarioId: string) => void;
  onStartRandom: (categoryKey: string, firstScenarioId: string) => void;
  onBack: () => void;
}

const DIFF_LABELS: Record<string, string> = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '挑战',
};

function getScenarioIcon(scenario: DrillScenarioMeta): string {
  const icons = scenario.overlay_svgs.filter((n) => !n.includes('光晕'));
  if (icons.length > 0) return icons[0];
  const catMap: Record<string, string> = {
    chemical: '烧杯',
    equipment: '量筒',
    emergency: '化学灼伤抽象警示符号',
    ppe: '护目镜',
    waste: '废液桶',
  };
  return catMap[scenario.category] || '烧杯';
}

// 粒子背景
function ParticleBackground() {
  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 40; i++) {
      arr.push({
        left: Math.random() * 100,
        delay: Math.random() * 10,
        duration: 8 + Math.random() * 10,
        size: 1 + Math.random() * 2.5,
        opacity: 0.3 + Math.random() * 0.7,
      });
    }
    return arr;
  }, []);

  return (
    <div className="drill-particles" style={{ position: 'fixed' }}>
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
            opacity: p.opacity * 0.6,
          }}
        />
      ))}
    </div>
  );
}

export default function DrillHall({ onStart, onStartRandom, onBack }: DrillHallProps) {
  const { load, loading, error, data } = useDrillScenarios();
  const [activeCat, setActiveCat] = useState<string>('all');
  const [bestScores, setBestScores] = useState<Record<string, number>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    void load();
    try {
      const raw = localStorage.getItem('drill_best_scores');
      if (raw) setBestScores(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, [load]);

  const categories: DrillCategory[] = data?.categories || [];
  const allScenarios = categories.flatMap((c) => c.scenarios);

  const displayScenarios =
    activeCat === 'all'
      ? allScenarios
      : categories.find((c) => c.key === activeCat)?.scenarios || [];

  const currentCatName =
    activeCat === 'all'
      ? '全部'
      : categories.find((c) => c.key === activeCat)?.name || '';

  return (
    <div className="drill-app">
      <ParticleBackground />

      <div
        className="drill-content"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* 顶部 */}
        <div className="drill-header" style={{ position: 'relative' }}>
          <button className="drill-back-btn" onClick={onBack}>
            ← 返回对话
          </button>
          <h1 className="drill-title">「安全闯关」实训系统</h1>

          {/* 左上角：随机闯关按钮（选中分类时显示） */}
          {activeCat !== 'all' && (
            <button
              className="drill-random-start-btn"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                marginTop: 48,
              }}
              onClick={() => {
                const cat = categories.find((c) => c.key === activeCat);
                if (cat && cat.scenarios.length > 0) {
                  const first = cat.scenarios[Math.floor(Math.random() * cat.scenarios.length)];
                  onStartRandom(activeCat, first.scenario_id);
                }
              }}
            >
              🎲 随机闯关 · {currentCatName}
            </button>
          )}

          <div style={{ width: 96 }} />
        </div>

        {/* 简介大卡片 */}
        <div
          style={{
            marginTop: activeCat !== 'all' ? 48 : 0,
            marginBottom: 28,
            padding: '28px 32px',
            background: 'var(--drill-surface)',
            border: '1px solid var(--drill-border)',
            borderRadius: 'var(--drill-radius-lg)',
            backdropFilter: 'blur(16px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: '-10px',
              top: '-50px',
              fontSize: '160px',
              fontWeight: 800,
              color: 'rgba(56, 189, 248, 0.04)',
              lineHeight: 1,
              letterSpacing: '-6px',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            LAB SAFETY
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '13px', color: 'var(--drill-text-2)', marginBottom: '8px' }}>
              共 {allScenarios.length} 个实训场景 · 5 大安全领域 · 知识库支撑
            </div>
            <div
              style={{
                fontSize: '16px',
                color: 'var(--drill-text)',
                lineHeight: 1.8,
                maxWidth: 680,
              }}
            >
              通过沉浸式场景模拟，检验你的实验室安全知识储备。
              每个场景均来自真实实验室常见隐患，
              做出你的选择，了解后果，掌握正确处置流程。
            </div>
          </div>
        </div>

        {/* 分类 Tab */}
        <div className="drill-categories">
          <button
            className={`drill-cat-btn ${activeCat === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCat('all')}
          >
            全部
            <span className="drill-cat-count">{allScenarios.length}</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.key}
              className={`drill-cat-btn ${activeCat === cat.key ? 'active' : ''}`}
              onClick={() => setActiveCat(cat.key)}
            >
              {cat.name}
              <span className="drill-cat-count">{cat.scenarios.length}</span>
            </button>
          ))}
        </div>

        {loading && (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 0',
              color: 'var(--drill-text-3)',
            }}
          >
            加载场景中…
          </div>
        )}

        {error && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 0',
              color: 'var(--drill-danger-2)',
            }}
          >
            加载失败：{error}
          </div>
        )}

        {/* 场景卡片网格 */}
        {!loading && !error && (
          <div className="drill-scenario-grid">
            {displayScenarios.map((s, idx) => {
              const IconName = getScenarioIcon(s);
              const Icon = SVG_ICON_MAP[IconName];
              const best = bestScores[s.scenario_id];
              return (
                <div
                  key={s.scenario_id}
                  className="drill-scenario-card"
                  onClick={() => onStart(s.scenario_id)}
                  style={{
                    animation: `drill-slide-up 0.6s cubic-bezier(0.4, 0, 0.2, 1) both`,
                    animationDelay: `${idx * 0.06}s`,
                  }}
                >
                  <div className="drill-scenario-number">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <div
                    className="drill-scenario-card-icon"
                    style={{ color: 'var(--drill-accent-2)' }}
                  >
                    {Icon && <Icon size={32} />}
                  </div>
                  <div className="drill-scenario-card-title">{s.title}</div>
                  <div className="drill-scenario-card-meta">
                    <span className={`drill-diff-tag drill-diff-${s.difficulty}`}>
                      {DIFF_LABELS[s.difficulty]}
                    </span>
                    {typeof best === 'number' && (
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--drill-text-3)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        最佳 {best}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}