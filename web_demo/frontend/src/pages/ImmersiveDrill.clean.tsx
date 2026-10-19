import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDrillDetail, useDrillSubmit } from '../../hooks/useDrill';
import type {
  DrillScenarioDetail,
  DrillSubmitResponse,
} from '../../types/drill';
import { SVG_ICON_MAP, LabBotIcon } from '../../components/drill/DrillIcons';
import './drill-immersive.css';

interface ImmersiveDrillProps {
  scenarioId: string;
  mode?: 'single' | 'category';
  categoryKey?: string;
  onClose: () => void;
  onNextRandom?: () => void;
}

const RESULT_TITLES: Record<string, string> = {
  correct: '操作正确',
  warning: '存在隐患',
  danger: '严重违规',
};

const RESULT_ICONS: Record<string, string> = {
  correct: '\u2713',
  warning: '\u26A0',
  danger: '\u2717',
};

function getOverlayColor(iconName: string, fallback: string): string {
  if (iconName.includes('火苗')) return '#fb923c';
  if (iconName.includes('闪电')) return '#facc15';
  if (iconName.includes('灼伤')) return '#fb7185';
  if (iconName.includes('护目镜') || iconName.includes('手套')) return '#67e8f9';
  if (iconName.includes('废液')) return '#a78bfa';
  return fallback;
}

// 打字机效果 Hook
function useTypewriter(text: string, speed = 30, start = true) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!start) {
      setDisplayed('');
      setDone(false);
      return;
    }
    setDisplayed('');
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed, start]);

  return { displayed, done };
}

const TOTAL_STEPS = 10;
const STEP_CORRECT = 2;
const STEP_WRONG = -1;

type RobotState = 'idle' | 'run' | 'shatter' | 'rebuild' | 'cheer';

export default function ImmersiveDrill({
  scenarioId,
  mode = 'single',
  categoryKey = '',
  onClose,
  onNextRandom,
}: ImmersiveDrillProps) {
  const { load: loadDetail, loading: detailLoading, error: detailError } = useDrillDetail();
  const { submit, loading: submitLoading } = useDrillSubmit();

  const [scenario, setScenario] = useState<DrillScenarioDetail | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<DrillSubmitResponse | null>(null);
  const [currentBg, setCurrentBg] = useState<'A' | 'B' | 'C'>('A');
  const [currentSvgs, setCurrentSvgs] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [storyTyping, setStoryTyping] = useState(false);

  // 进度与机器人状态
  const [progressSteps, setProgressSteps] = useState(0);
  const [robotState, setRobotState] = useState<RobotState>('idle');
  const [showClear, setShowClear] = useState(false);
  const [sceneTransition, setSceneTransition] = useState<'idle' | 'out' | 'in'>('in');

  const resultRef = useRef<HTMLDivElement>(null);

  // 加载场景
  useEffect(() => {
    let cancelled = false;
    setSelectedId(null);
    setFeedback(null);
    setShowResult(false);
    setStoryText('');
    setSceneTransition('out');

    loadDetail(scenarioId)
      .then((data) => {
        if (cancelled) return;
        setScenario(data);
        setCurrentBg(data.background);
        setCurrentSvgs(data.overlay_svgs);
        setTimeout(() => {
          setSceneTransition('in');
          setTimeout(() => setSceneTransition('idle'), 700);
        }, 100);
      })
      .catch(() => {
        /* error handled in hook */
      });
    return () => {
      cancelled = true;
    };
  }, [scenarioId, loadDetail]);

  const { displayed: narrativeText, done: narrativeDone } = useTypewriter(
    scenario?.narrative || '',
    28,
    !!scenario && sceneTransition === 'idle',
  );

  // 故事旁白打字机
  useEffect(() => {
    if (!storyText) return;
    setStoryTyping(true);
    const fullText = storyText;
    let i = 0;
    setStoryText('');
    const timer = setInterval(() => {
      i++;
      setStoryText(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(timer);
        setStoryTyping(false);
      }
    }, 25);
    return () => clearInterval(timer);
  }, [feedback]);

  const handleSelect = useCallback(
    async (optionId: string) => {
      if (!scenario || selectedId || submitLoading) return;
      setSelectedId(optionId);

      try {
        const result = await submit(scenarioId, optionId);
        setFeedback(result);
        setCurrentBg(result.next_background);
        setCurrentSvgs(result.next_svgs);

        // 构建故事化旁白
        const chosenOption = scenario.options.find((o) => o.id === optionId);
        const storyPrefix = chosenOption
          ? `你选择了「${chosenOption.text}」……\n\n`
          : '';
        setStoryText(storyPrefix + result.result_text);

        // 进度与机器人动画
        if (mode === 'category') {
          if (result.feedback_type === 'correct') {
            setRobotState('run');
            setProgressSteps((prev) => {
              const next = Math.min(TOTAL_STEPS, prev + STEP_CORRECT);
              if (next >= TOTAL_STEPS) {
                setTimeout(() => {
                  setRobotState('cheer');
                  setShowClear(true);
                }, 800);
              } else {
                setTimeout(() => setRobotState('idle'), 1200);
              }
              return next;
            });
          } else {
            // 错误：破碎 → 重建
            setRobotState('shatter');
            setProgressSteps((prev) => Math.max(0, prev + STEP_WRONG));
            setTimeout(() => {
              setRobotState('rebuild');
              setTimeout(() => setRobotState('idle'), 800);
            }, 900);
          }
        }

        // 延迟显示结果面板
        setTimeout(() => setShowResult(true), 600);
      } catch {
        setSelectedId(null);
      }
    },
    [scenario, selectedId, submitLoading, submit, scenarioId, mode],
  );

  const handleRetry = useCallback(() => {
    if (!scenario) return;
    setSelectedId(null);
    setFeedback(null);
    setShowResult(false);
    setStoryText('');
    setCurrentBg(scenario.background);
    setCurrentSvgs(scenario.overlay_svgs);
    setRobotState('idle');
  }, [scenario]);

  const handleNext = useCallback(() => {
    setShowClear(false);
    setProgressSteps(0);
    setRobotState('idle');
    onNextRandom?.();
  }, [onNextRandom]);

  // 图标颜色
  const iconColor = useMemo(() => {
    if (currentSvgs.some((n) => n.includes('火苗'))) return '#fb923c';
    if (currentSvgs.some((n) => n.includes('闪电'))) return '#facc15';
    if (currentSvgs.some((n) => n.includes('灼伤'))) return '#fb7185';
    return '#38bdf8';
  }, [currentSvgs]);

  const glowIcons = currentSvgs.filter((n) => n.includes('光晕'));
  const normalIcons = currentSvgs.filter((n) => !n.includes('光晕'));

  const progressPct = (progressSteps / TOTAL_STEPS) * 100;

  if (detailLoading) {
    return (
      <div className="drill-immersive">
        <div className="immersive-loading">正在载入场景…</div>
      </div>
    );
  }

  if (detailError || !scenario) {
    return (
      <div className="drill-immersive">
        <div className="immersive-loading" style={{ color: '#fb7185' }}>
          场景加载失败：{detailError}
        </div>
        <button className="drill-back-btn" onClick={onClose} style={{ position: 'absolute', top: 24, left: 24 }}>
          ← 返回
        </button>
      </div>
    );
  }

  return (
    <div className={`drill-immersive scene-${currentBg.toLowerCase()}`}>
      {/* 穿梭光效 */}
      <div className={`warp-overlay ${sceneTransition === 'in' ? 'active' : ''}`} />

      {/* 背景层 */}
      <div className="immersive-bg">
        {/* 光晕图标（底层） */}
        {glowIcons.map((name, i) => {
          const Icon = SVG_ICON_MAP[name];
          if (!Icon) return null;
          return (
            <div
              key={`glow-${i}`}
              className="immersive-glow-icon"
              style={{ color: iconColor }}
            >
              <Icon size={420} />
            </div>
          );
        })}
      </div>

      {/* 顶部 HUD 栏 */}
      <div className="immersive-topbar">
        <button className="immersive-close-btn" onClick={onClose}>
          × 退出
        </button>

        <div className="immersive-progress-wrap">
          <div className="immersive-progress-track">
            <div
              className="immersive-progress-fill"
              style={{ width: `${progressPct}%` }}
            />
            {Array.from({ length: TOTAL_STEPS + 1 }).map((_, i) => (
              <div
                key={i}
                className={`immersive-progress-marker ${i <= progressSteps ? 'active' : ''}`}
                style={{ left: `${(i / TOTAL_STEPS) * 100}%` }}
              />
            ))}
          </div>
          <div
            className={`immersive-robot-marker labbot-${robotState}`}
            style={{ left: `${progressPct}%` }}
          >
            <LabBotIcon size={48} />
          </div>
        </div>

        <div className="immersive-scene-tag">
          <span className="tag-dot" />
          {scenario.title}
        </div>
      </div>

      {/* 主内容区 */}
      <div className="immersive-main">
        {/* 左侧：场景描述 */}
        <div className="immersive-left-panel">
          <div className="immersive-panel-label">场景情报</div>
          <div className="immersive-narrative-box">
            <p className="immersive-narrative-text">{narrativeText}</p>
            {!narrativeDone && <span className="typing-cursor" />}
          </div>
          {scenario.hint && narrativeDone && (
            <div className="immersive-hint">
              <span className="hint-icon">💡</span>
              <span>{scenario.hint}</span>
            </div>
          )}

          {/* 叠加图标展示区 */}
          <div className="immersive-overlay-icons">
            {normalIcons.map((name, i) => {
              const Icon = SVG_ICON_MAP[name];
              if (!Icon) return null;
              const color = getOverlayColor(name, iconColor);
              return (
                <div
                  key={i}
                  className="overlay-icon-item"
                  style={{
                    color,
                    animationDelay: `${i * 0.15}s`,
                  }}
                >
                  <Icon size={44} />
                  <span className="overlay-icon-label">{name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 右侧：故事化反馈 */}
        <div className="immersive-right-panel">
          <div className="immersive-panel-label">现场实录</div>
          <div className="immersive-story-box" ref={resultRef}>
            {showResult && feedback ? (
              <>
                <div className={`story-result-header ${feedback.feedback_type}`}>
                  <span className="result-icon">{RESULT_ICONS[feedback.feedback_type]}</span>
                  <span className="result-title">{RESULT_TITLES[feedback.feedback_type]}</span>
                  <span
                    className="result-score"
                    style={{
                      color:
                        feedback.score_delta >= 0
                          ? 'var(--drill-success, #4ade80)'
                          : 'var(--drill-danger-2, #fb7185)',
                    }}
                  >
                    {feedback.score_delta >= 0 ? '+' : ''}
                    {feedback.score_delta}
                  </span>
                </div>
                <div className="story-content">
                  {storyText}
                  {storyTyping && <span className="typing-cursor" />}
                </div>

                {!storyTyping && feedback.kb_references.length > 0 && (
                  <div className="story-kb-section">
                    <div className="story-kb-title">📚 知识依据 · {feedback.kb_references.length} 条</div>
                    <div className="story-kb-list">
                      {feedback.kb_references.map((ref) => (
                        <div key={ref.kb_id} className="story-kb-item">
                          <div className="kb-item-id">[{ref.kb_id}]</div>
                          <div className="kb-item-title">{ref.title}</div>
                          <div className="kb-item-snippet">{ref.snippet}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="story-placeholder">
                <div className="placeholder-dot" />
                等待你的操作选择…
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 底部：选项区 */}
      <div className="immersive-options-wrap">
        <div className="immersive-options">
          {scenario.options.map((opt, idx) => {
            const isSelected = selectedId === opt.id;
            const fbType = feedback && isSelected ? feedback.feedback_type : null;
            const btnClass = fbType ? `opt-${fbType}` : '';
            return (
              <button
                key={opt.id}
                className={`immersive-opt-btn ${btnClass}`}
                onClick={() => handleSelect(opt.id)}
                disabled={!!selectedId || submitLoading}
                style={{
                  animation: `opt-rise 0.5s cubic-bezier(0.4, 0, 0.2, 1) both`,
                  animationDelay: `${0.3 + idx * 0.12}s`,
                }}
              >
                <span className="opt-letter">{opt.id}</span>
                <span className="opt-text">{opt.text}</span>
              </button>
            );
          })}
        </div>

        {/* 结果操作按钮 */}
        {showResult && feedback && (
          <div className="immersive-result-actions">
            <button className="immersive-act-btn secondary" onClick={onClose}>
              返回列表
            </button>
            <button className="immersive-act-btn secondary" onClick={handleRetry}>
              再试一次
            </button>
            {mode === 'category' && (
              <button className="immersive-act-btn primary" onClick={handleNext}>
                下一题 →
              </button>
            )}
          </div>
        )}
      </div>

      {/* 闯关成功弹窗 */}
      {showClear && (
        <div className="immersive-clear-overlay">
          <div className="clear-card">
            <div className="clear-trophy">🏆</div>
            <h2 className="clear-title">闯关成功</h2>
            <p className="clear-subtitle">
              你已完成 {mode === 'category' ? categoryKey : ''} 分类全部挑战
            </p>
            <div className="clear-stats">
              <div className="clear-stat">
                <div className="stat-value">{TOTAL_STEPS}</div>
                <div className="stat-label">满分进度</div>
              </div>
              <div className="clear-stat">
                <div className="stat-value">{progressSteps}</div>
                <div className="stat-label">你的成绩</div>
              </div>
            </div>
            <div className="clear-actions">
              <button className="immersive-act-btn secondary" onClick={onClose}>
                返回大厅
              </button>
              <button className="immersive-act-btn primary" onClick={handleNext}>
                再来一轮
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}