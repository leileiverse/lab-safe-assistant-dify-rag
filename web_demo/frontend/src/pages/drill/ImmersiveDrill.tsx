import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDrillDetail, useDrillSubmit } from '../../hooks/useDrill';
import type {
  DrillScenarioDetail,
  DrillSubmitResponse,
  DrillKbRef,
} from '../../types/drill';
import { SVG_ICON_MAP, LabBotIcon } from '../../components/drill/DrillIcons';
import './drill-immersive.css';

interface ImmersiveDrillProps {
  scenarioId: string;
  mode?: 'single' | 'category';
  categoryKey?: string;
  onClose: () => void;
  onNextRandom?: () => void;
  // 分类闯关模式：外部统一管理进度
  progressSteps?: number;
  robotState?: 'idle' | 'run' | 'shatter' | 'rebuild' | 'cheer';
  showClear?: boolean;
  onProgressChange?: (delta: number, state: 'run' | 'shatter') => void;
  onClearReset?: () => void;
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

const BG_NAMES: Record<string, string> = {
  A: '实验室操作台',
  B: '更衣准入区',
  C: '应急喷淋区',
};

const TOTAL_STEPS = 10;
const STEP_CORRECT = 2;
const STEP_WRONG = -1;

type Phase = 'load' | 'scene' | 'submit' | 'result';

// 打字机 Hook
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

function makeParticles(count: number) {
  const arr = [];
  for (let i = 0; i < count; i++) {
    arr.push({
      left: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 6 + Math.random() * 8,
      size: 1 + Math.random() * 2.5,
    });
  }
  return arr;
}

export default function ImmersiveDrill({
  scenarioId,
  mode = 'single',
  categoryKey = '',
  onClose,
  onNextRandom,
  progressSteps = 0,
  robotState = 'idle',
  showClear = false,
  onProgressChange,
  onClearReset,
}: ImmersiveDrillProps) {
  const { load: loadDetail, loading: detailLoading, error: detailError } = useDrillDetail();
  const { submit, loading: submitLoading } = useDrillSubmit();

  const [scenario, setScenario] = useState<DrillScenarioDetail | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<DrillSubmitResponse | null>(null);
  const [currentBg, setCurrentBg] = useState<'A' | 'B' | 'C'>('A');
  const [currentSvgs, setCurrentSvgs] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>('load');
  const [narrativeEnter, setNarrativeEnter] = useState(false);
  const [storySteps, setStorySteps] = useState<Array<{ label: string; text: string }>>([]);
  const [storyTyping, setStoryTyping] = useState(false);
  const [storyText, setStoryText] = useState('');
  // 单场景模式自己管分数
  const [singleScore, setSingleScore] = useState(100);

  const particles = useMemo(() => makeParticles(30), []);

  // 加载场景
  useEffect(() => {
    let cancelled = false;
    setPhase('load');
    setSelectedId(null);
    setFeedback(null);
    setStorySteps([]);
    setStoryText('');
    setNarrativeEnter(false);
    setSingleScore(100);

    loadDetail(scenarioId)
      .then((data) => {
        if (cancelled) return;
        setScenario(data);
        setCurrentBg(data.background);
        setCurrentSvgs(data.overlay_svgs);
        setPhase('scene');
        setTimeout(() => setNarrativeEnter(true), 300);
      })
      .catch(() => {
        /* error handled in hook */
      });
    return () => {
      cancelled = true;
    };
  }, [scenarioId, loadDetail]);

  const { displayed: narrativeDisplayed, done: narrativeDone } = useTypewriter(
    scenario?.narrative || '',
    28,
    phase === 'scene' && narrativeEnter,
  );

  // 故事文本打字机
  useEffect(() => {
    if (!feedback) return;
    const full = feedback.result_text;
    let i = 0;
    setStoryText('');
    setStoryTyping(true);
    const timer = setInterval(() => {
      i++;
      setStoryText(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(timer);
        setStoryTyping(false);
      }
    }, 22);
    return () => clearInterval(timer);
  }, [feedback]);

  const handleSelect = useCallback(
    async (optionId: string) => {
      if (!scenario || selectedId || submitLoading) return;
      setSelectedId(optionId);
      setPhase('submit');

      const chosen = scenario.options.find((o) => o.id === optionId);
      if (chosen) {
        setStorySteps([
          { label: '场景', text: scenario.title },
          { label: '你的选择', text: chosen.text },
          { label: '后果', text: '正在推演…' },
        ]);
      }

      try {
        const result = await submit(scenarioId, optionId);
        setFeedback(result);
        setCurrentBg(result.next_background);
        setCurrentSvgs(result.next_svgs);

        setStorySteps([
          { label: '场景', text: scenario.title },
          { label: '你的选择', text: chosen?.text || optionId },
          { label: '后果', text: result.result_text },
        ]);

        // 更新进度
        if (mode === 'category' && onProgressChange) {
          const delta = result.feedback_type === 'correct' ? STEP_CORRECT : STEP_WRONG;
          const state = result.feedback_type === 'correct' ? 'run' : 'shatter';
          onProgressChange(delta, state);
        } else {
          setSingleScore((prev) => Math.max(0, prev + result.score_delta));
        }

        setTimeout(() => setPhase('result'), 400);
      } catch {
        setSelectedId(null);
        setPhase('scene');
      }
    },
    [scenario, selectedId, submitLoading, submit, scenarioId, mode, onProgressChange],
  );

  const handleRetry = useCallback(() => {
    if (!scenario) return;
    setSelectedId(null);
    setFeedback(null);
    setStorySteps([]);
    setStoryText('');
    setCurrentBg(scenario.background);
    setCurrentSvgs(scenario.overlay_svgs);
    setPhase('scene');
    setSingleScore(100);
    setNarrativeEnter(false);
    setTimeout(() => setNarrativeEnter(true), 100);
  }, [scenario]);

  const handleNext = useCallback(() => {
    onNextRandom?.();
  }, [onNextRandom]);

  const handleClearResetLocal = useCallback(() => {
    onClearReset?.();
  }, [onClearReset]);

  // 图标颜色
  const iconColor = useMemo(() => {
    if (currentSvgs.some((n) => n.includes('火苗'))) return '#fb923c';
    if (currentSvgs.some((n) => n.includes('闪电'))) return '#facc15';
    if (currentSvgs.some((n) => n.includes('灼伤'))) return '#ef4444';
    return '#38bdf8';
  }, [currentSvgs]);

  const isDanger = useMemo(
    () => currentSvgs.some((n) => n.includes('告警') || n.includes('灼伤') || n.includes('火苗')),
    [currentSvgs],
  );

  const glowIcons = currentSvgs.filter((n) => n.includes('光晕'));
  const normalIcons = currentSvgs.filter((n) => !n.includes('光晕'));
  const progressPct = mode === 'category' ? (progressSteps / TOTAL_STEPS) * 100 : 0;
  const robotLeft = `calc(${progressPct}% - 36px)`;

  const fbType = feedback?.feedback_type || 'pending';
  const displayScore = mode === 'category' ? progressSteps : singleScore;

  return (
    <div className={`drill-immersive scene-${currentBg.toLowerCase()}`}>
      {/* 粒子背景 */}
      <div className="drill-immersive-particles">
        {particles.map((p, i) => (
          <div
            key={i}
            className="drill-immersive-particle"
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              width: `${p.size}px`,
              height: `${p.size}px`,
            }}
          />
        ))}
      </div>

      {/* 背景层 */}
      <div className="drill-immersive-bg" />

      {/* 场景 SVG 图标 */}
      <div className="drill-immersive-scene">
        {glowIcons.map((name, i) => (
          <div
            key={`glow-${i}`}
            className="drill-immersive-glow"
            style={{ color: iconColor }}
          />
        ))}

        <div className="drill-immersive-icon-wrap">
          {normalIcons.length > 0 && (() => {
            const MainIcon = SVG_ICON_MAP[normalIcons[0]];
            return MainIcon ? (
              <div
                className={`drill-immersive-main-icon ${isDanger ? 'danger' : ''}`}
                style={{ color: iconColor }}
              >
                <MainIcon size={120} />
              </div>
            ) : null;
          })()}

          {normalIcons.slice(1, 3).map((name, i) => {
            const Icon = SVG_ICON_MAP[name];
            return Icon ? (
              <div
                key={`sec-${i}`}
                className={`drill-immersive-secondary-icon secondary-${i + 1}`}
                style={{ color: iconColor }}
              >
                <Icon size={56} />
              </div>
            ) : null;
          })}
        </div>
      </div>

      {/* 顶部进度条 + 机器人（分类模式才显示） */}
      {mode === 'category' && (
        <div className="drill-progress-track">
          <div className="drill-progress-label">闯关进度</div>
          <div className="drill-progress-bg" />
          <div
            className="drill-progress-fill"
            style={{ width: `${progressPct}%` }}
          />
          <div className="drill-progress-markers">
            {Array.from({ length: TOTAL_STEPS + 1 }).map((_, i) => (
              <div
                key={i}
                className="drill-progress-marker"
                style={{ left: `${(i / TOTAL_STEPS) * 100}%` }}
              />
            ))}
          </div>
          <div
            className={`drill-progress-robot labbot-state-${robotState}`}
            style={{ left: robotLeft }}
          >
            <LabBotIcon size={72} />
            {robotState === 'shatter' && (
              <div className="drill-robot-shatter-parts">
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 顶部标题栏 */}
      {scenario && (
        <div className="drill-immersive-topbar">
          <div>
            <div className="drill-immersive-label">
              SCENE {BG_NAMES[currentBg]}
            </div>
            <div className="drill-immersive-title">{scenario.title}</div>
          </div>
          <div className="drill-immersive-score">
            <div className="drill-immersive-score-value">{displayScore}</div>
            <div className="drill-immersive-score-label">
              {mode === 'category' ? 'PROGRESS' : 'SAFETY SCORE'}
            </div>
          </div>
        </div>
      )}

      {/* 关闭按钮 */}
      <button className="drill-immersive-close" onClick={onClose} aria-label="close">
        ×
      </button>

      {/* 底部交互区 */}
      <div className="drill-immersive-bottom">
        {/* 左侧叙述面板 */}
        {scenario && phase !== 'load' && (
          <div className={`drill-narrative-panel ${narrativeEnter ? 'enter' : ''}`}>
            <div className="drill-narrative-label">场景描述</div>
            <p className="drill-narrative-text">
              {narrativeDisplayed}
              {!narrativeDone && <span className="drill-type-cursor" />}
            </p>
          </div>
        )}

        {/* 右侧故事面板 */}
        {(phase === 'submit' || phase === 'result') && feedback && (
          <div className={`drill-story-panel ${fbType}`}>
            <div className="drill-story-kicker">LIVE FEED</div>
            <div className="drill-story-title">现场实录</div>
            <div className="drill-story-track">
              {storySteps.slice(0, -1).map((step, i) => (
                <div key={i} className="drill-story-step">
                  <div className="drill-story-step-label">{step.label}</div>
                  <p className="drill-story-step-text">{step.text}</p>
                </div>
              ))}
              {storySteps.length > 0 && (
                <div key="last" className="drill-story-step">
                  <div className="drill-story-step-label">
                    {storySteps[storySteps.length - 1].label}
                  </div>
                  <p className="drill-story-step-text">
                    {phase === 'result' ? storyText : '正在推演…'}
                    {storyTyping && <span className="drill-type-cursor" />}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 加载状态 */}
        {phase === 'load' && (
          <div className="drill-load-state">
            <div className="drill-load-kicker">INITIALIZING</div>
            <div className="drill-load-title">
              {detailError ? '场景加载失败' : '正在载入场景…'}
            </div>
            {detailError && (
              <div className="drill-load-error">{detailError}</div>
            )}
            {detailError && (
              <button className="drill-result-btn primary" onClick={onClose}>
                返回
              </button>
            )}
          </div>
        )}

        {/* 选项气泡 */}
        {(phase === 'scene' || phase === 'submit') && scenario && (
          <div className="drill-options-immersive">
            {scenario.options.map((opt, idx) => {
              const isSelected = selectedId === opt.id;
              const isCorrect = feedback && isSelected && feedback.feedback_type === 'correct';
              const isWrong = feedback && isSelected && feedback.feedback_type !== 'correct';
              return (
                <button
                  key={opt.id}
                  className={`drill-option-immersive opt-enter ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                  onClick={() => handleSelect(opt.id)}
                  disabled={!!selectedId || submitLoading}
                  style={{ animationDelay: `${0.4 + idx * 0.12}s` }}
                >
                  {opt.text}
                </button>
              );
            })}
          </div>
        )}

        {/* 提交中状态 */}
        {phase === 'submit' && (
          <div className="drill-submit-state">
            <div className="drill-submit-state-dot" />
            <span>系统正在推演后果…</span>
          </div>
        )}

        {/* 结果面板 */}
        {phase === 'result' && feedback && (
          <div className="drill-result-panel">
            <div className={`drill-result-header ${feedback.feedback_type}`}>
              <div className={`drill-result-icon ${feedback.feedback_type}`}>
                {RESULT_ICONS[feedback.feedback_type]}
              </div>
              <div>
                <div className="drill-result-title">
                  {RESULT_TITLES[feedback.feedback_type]}
                </div>
              </div>
              <div
                className={`drill-result-score ${feedback.score_delta >= 0 ? 'positive' : 'negative'}`}
              >
                {feedback.score_delta >= 0 ? '+' : ''}
                {feedback.score_delta}
              </div>
            </div>

            <div className="drill-result-body">
              <div className="drill-result-story">{feedback.result_text}</div>

              {!storyTyping && feedback.kb_references.length > 0 && (
                <>
                  <div className="drill-result-kb-title">
                    知识依据 · {feedback.kb_references.length} 条
                  </div>
                  <div className="drill-result-kb-list">
                    {feedback.kb_references.map((ref: DrillKbRef) => (
                      <div key={ref.kb_id} className="drill-result-kb-item">
                        <div className="drill-result-kb-name">
                          [{ref.kb_id}] {ref.title}
                        </div>
                        <div className="drill-result-kb-desc">{ref.snippet}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="drill-result-actions">
              <button className="drill-result-btn ghost" onClick={onClose}>
                返回列表
              </button>
              <button className="drill-result-btn ghost" onClick={handleRetry}>
                再试一次
              </button>
              {mode === 'category' && (
                <button className="drill-result-btn primary" onClick={handleNext}>
                  下一题
                </button>
              )}
            </div>
          </div>
        )}

        {/* 底部提示 */}
        {phase === 'scene' && narrativeDone && (
          <div className="drill-immersive-hint">
            选择下方操作，观察后果
          </div>
        )}
      </div>

      {/* 闯关成功弹窗 */}
      {showClear && (
        <div className="drill-clear-overlay">
          <div className="drill-clear-card">
            <div className="drill-clear-badge">🏆</div>
            <div className="drill-clear-title">闯关成功</div>
            <div className="drill-clear-desc">
              你已完成「{categoryKey}」分类安全挑战
              <br />
              LAB-BOT 安全指数：{progressSteps}/{TOTAL_STEPS}
            </div>
            <div className="drill-clear-actions">
              <button className="drill-result-btn ghost" onClick={onClose}>
                返回大厅
              </button>
              <button className="drill-result-btn primary" onClick={handleClearResetLocal}>
                再来一轮
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}