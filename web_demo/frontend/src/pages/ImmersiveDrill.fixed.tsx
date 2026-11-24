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
  _categoryKey?: string;
  onClose: () => void;
  onNextRandom?: () => void;
}

const RESULT_TITLES: Record<string, string> = {
  correct: '鎿嶄綔姝ｇ‘',
  warning: '瀛樺湪闅愭偅',
  danger: '涓ラ噸杩濊',
};

const RESULT_ICONS: Record<string, string> = {
  correct: '鉁?,
  warning: '鈿?,
  danger: '鉁?,
};

function getOverlayColor(iconName: string, fallback: string): string {
  if (iconName.includes('鐏嫍')) return '#fb923c';
  if (iconName.includes('闂數')) return '#facc15';
  if (iconName.includes('鐏间激')) return '#fb7185';
  if (iconName.includes('鎶ょ洰闀?) || iconName.includes('鎵嬪')) return '#67e8f9';
  if (iconName.includes('搴熸恫')) return '#a78bfa';
  return fallback;
}

// 鎵撳瓧鏈烘晥鏋?Hook
function useTypewriter(text: string, speed = 30, start = true) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!start) return;
    setDisplayed('');
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      if (i >= text.length) {
        setDisplayed(text);
        setDone(true);
        clearInterval(timer);
      } else {
        setDisplayed(text.slice(0, i));
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed, start]);

  return { displayed, done };
}

// 鐢熸垚绮掑瓙
function generateParticles(count: number) {
  const arr = [];
  for (let i = 0; i < count; i++) {
    arr.push({
      left: Math.random() * 100,
      delay: Math.random() * 12,
      duration: 10 + Math.random() * 12,
      size: 1 + Math.random() * 2.5,
    });
  }
  return arr;
}

export default function ImmersiveDrill({ scenarioId, mode = 'single', _categoryKey = '', onClose, onNextRandom }: ImmersiveDrillProps) {
  const {
    load: loadDetail,
    loading: detailLoading,
    error: detailError,
  } = useDrillDetail();
  const {
    submit,
    loading: submitLoading,
    error: submitError,
  } = useDrillSubmit();

  const [phase, setPhase] = useState<'entering' | 'narrative' | 'options' | 'result' | 'exiting'>('entering');
  const [scenario, setScenario] = useState<DrillScenarioDetail | null>(null);
  const [score, setScore] = useState(100);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<DrillSubmitResponse | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [robotState, setRobotState] = useState<'idle' | 'run' | 'shatter' | 'rebuild' | 'cheer'>('idle');
  const [progressSteps, setProgressSteps] = useState(0); // 鍒嗙被闂叧妯″紡锛?-10 姝?
  const [completed, setCompleted] = useState(false);

  const particles = useMemo(() => generateParticles(50), []);

  // 鍔犺浇鍦烘櫙
  useEffect(() => {
    let cancelled = false;
    let enterTimer: ReturnType<typeof setTimeout> | null = null;
    setPhase('entering');
    setScenario(null);
    setSelectedId(null);
    setResult(null);
    setShowOptions(false);
    setScore(100);
    setCompleted(false);
    // 鍗曞満鏅ā寮忔瘡娆￠噸缃繘搴?
    if (mode === 'single') {
      setProgressSteps(0);
    }

    loadDetail(scenarioId)
      .then((data) => {
        if (cancelled) return;
        setScenario(data);
        // 鍏ュ満鍔ㄧ敾鍚庡紑濮嬪彊浜?
        enterTimer = setTimeout(() => {
          if (!cancelled) setPhase('narrative');
        }, 800);
      })
      .catch(() => {
        /* handle error */
      });
    return () => {
      cancelled = true;
      if (enterTimer) clearTimeout(enterTimer);
    };
  }, [scenarioId, loadDetail]);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  // 鍙欎簨鎵撳瓧缁撴潫鍚庢樉绀洪€夐」
  const { displayed: narrativeText, done: narrativeDone } = useTypewriter(
    scenario?.narrative || '',
    28,
    phase === 'narrative',
  );

  useEffect(() => {
    if (narrativeDone && phase === 'narrative') {
      // 绋嶄綔鍋滈】鍚庢樉绀洪€夐」
      const t = setTimeout(() => {
        setPhase('options');
        setShowOptions(true);
      }, 800);
      return () => clearTimeout(t);
    }
  }, [narrativeDone, phase]);

  const handleSelect = useCallback(
    async (optionId: string) => {
      if (!scenario || selectedId || submitLoading || phase !== 'options') return;
      setSelectedId(optionId);
      setShowOptions(false);

      // 绛夊緟涓€灏忔"绯荤粺鍙嶅簲"鏃堕棿
      await new Promise((r) => setTimeout(r, 500));

      try {
        const res = await submit(scenarioId, optionId);
        setResult(res);
        const nextScore = Math.max(0, score + res.score_delta);
        setScore(nextScore);

        // 鏈哄櫒浜虹姸鎬佷笌杩涘害鏇存柊
        if (mode === 'category') {
          // 鍒嗙被闂叧锛氱瓟瀵?+2 姝ワ紝绛旈敊 -1 姝ワ紝鍏?10 姝?
          if (res.feedback_type === 'correct') {
            setRobotState('run');
            setProgressSteps((prev) => {
              const next = Math.min(10, prev + 2);
              if (next >= 10) {
                setTimeout(() => setCompleted(true), 1000);
              }
              return next;
            });
            setTimeout(() => setRobotState('cheer'), 900);
          } else {
            // danger / warning 閮介€€ 1 姝ワ紝鏈哄櫒浜哄厛纰庡悗閲嶇粍
            setRobotState('shatter');
            setProgressSteps((prev) => Math.max(0, prev - 1));
            const delay = res.feedback_type === 'danger' ? 1200 : 800;
            setTimeout(() => {
              setRobotState('rebuild');
              setTimeout(() => setRobotState('idle'), 900);
            }, delay);
          }
        } else {
          // 鍗曞満鏅ā寮忥細鍙敼鏈哄櫒浜虹姸鎬侊紝杩涘害鏉′繚鎸佸湪鍗曢鐘舵€?
          if (res.feedback_type === 'correct') {
            setRobotState('run');
            setTimeout(() => setRobotState('cheer'), 900);
          } else if (res.feedback_type === 'danger') {
            setRobotState('shatter');
            setTimeout(() => {
              setRobotState('rebuild');
              setTimeout(() => setRobotState('idle'), 900);
            }, 1200);
          } else {
            setRobotState('shatter');
            setTimeout(() => {
              setRobotState('rebuild');
              setTimeout(() => setRobotState('idle'), 700);
            }, 800);
          }
        }

        // 淇濆瓨鏈€浣虫垚缁?
        try {
          const raw = localStorage.getItem('drill_best_scores');
          const all = raw ? JSON.parse(raw) : {};
          if (nextScore > (all[scenarioId] ?? 0)) {
            all[scenarioId] = nextScore;
            localStorage.setItem('drill_best_scores', JSON.stringify(all));
          }
        } catch {
          /* ignore */
        }

        setPhase('result');
      } catch {
        /* error */
      }
    },
    [scenario, selectedId, submitLoading, phase, submit, scenarioId, score],
  );

  const handleRetry = useCallback(() => {
    setSelectedId(null);
    setResult(null);
    setShowOptions(false);
    setScore(100);
    setPhase('narrative');
    setRobotState('idle');
    setProgressSteps(0);
  }, []);

  const handleExit = useCallback(() => {
    setPhase('exiting');
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    exitTimerRef.current = setTimeout(() => onClose(), 700);
  }, [onClose]);

  const activeBackground = result?.next_background ?? scenario?.background ?? 'A';
  // 娓叉煋杩涘害鐧惧垎姣?
  const progress = mode === 'category' ? (progressSteps / 10) * 100 : 0;

  const progress = mode === "category" ? (progressSteps / 10) * 100 : 0;

  const activeSvgs = useMemo(
    () => (result ? result.next_svgs : scenario?.overlay_svgs ?? []),
    [result, scenario],
  );
  const visibleSvgs = useMemo(
    () => activeSvgs.filter((name) => !name.includes('鍏夋檿')),
    [activeSvgs],
  );
  const mainIconName = visibleSvgs[0] || '鐑ф澂';
  const secondaryIconNames = visibleSvgs.slice(1);
  const MainIcon = SVG_ICON_MAP[mainIconName] || SVG_ICON_MAP['鐑ф澂'];

  const iconColor = useMemo(() => {
    if (phase === 'result' && result) {
      if (result.feedback_type === 'danger') return '#ef4444';
      if (result.feedback_type === 'warning') return '#f59e0b';
      return '#10b981';
    }
    return getOverlayColor(mainIconName, '#38bdf8');
  }, [mainIconName, phase, result]);

  const hasGlow = activeSvgs.some((name) => name.includes('鍏夋檿'));

  if (!scenario && (detailLoading || !detailError)) {
    return (
      <div className="drill-immersive enter">
        <div className="drill-load-state">
          <div className="drill-load-kicker">SCENE INITIALIZING</div>
          <div className="drill-load-title">鍔犺浇鍦烘櫙涓€?/div>
        </div>
      </div>
    );
  }

  const phaseClass = phase === 'entering' ? 'enter' : phase === 'exiting' ? 'exit' : '';

  if (!scenario) {
    return (
      <div className="drill-immersive enter">
        <div className="drill-load-state">
          <div className="drill-load-kicker">SCENE OFFLINE</div>
          <div className="drill-load-title">鍦烘櫙鍔犺浇澶辫触</div>
          <div className="drill-load-error">{detailError || '璇风◢鍚庨噸璇?}</div>
          <button className="drill-result-btn ghost" onClick={onClose}>
            杩斿洖鍦烘櫙鍒楄〃
          </button>
        </div>
      </div>
    );
  }

  const selectedOption = selectedId
    ? scenario.options.find((option) => option.id === selectedId)
    : null;

  return (
    <div className={`drill-immersive scene-${activeBackground.toLowerCase()} ${phaseClass}`}>
      {/* 绮掑瓙鑳屾櫙 */}
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

      {/* 鑳屾櫙姘涘洿 */}
      <div className="drill-immersive-bg" />
      <div className="drill-immersive-scene" aria-hidden="true">
        <div className="drill-scene-back-wall" />
        <div className="drill-scene-light-strip" />
        <div className="drill-scene-counter" />
        <div className="drill-scene-rail" />
      </div>
      <div className="drill-immersive-grid" />

      {/* 涓ぎ澶у浘鏍?*/}
      {(phase === 'narrative' || phase === 'options' || phase === 'result') && (
        <>
          {hasGlow && (
            <div
              className="drill-immersive-glow"
              style={{ color: iconColor }}
            />
          )}
          {visibleSvgs.length > 0 && (
            <div className="drill-immersive-icon-wrap">
              <div
                className={`drill-immersive-main-icon ${
                  result?.feedback_type === 'danger' ? 'danger' : ''
                }`}
                style={{ color: iconColor }}
              >
                {MainIcon && <MainIcon size={120} />}
              </div>
              {secondaryIconNames.map((iconName, index) => {
                const Icon = SVG_ICON_MAP[iconName] || SVG_ICON_MAP['鐑ф澂'];
                return (
                  <div
                    key={`${iconName}-${index}`}
                    className={`drill-immersive-secondary-icon secondary-${index % 3}`}
                    style={{ color: getOverlayColor(iconName, iconColor) }}
                  >
                    <Icon size={58} />
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* 椤堕儴杩涘害璺戦亾 + 灏忔満鍣ㄤ汉 */}
      {(phase === 'narrative' || phase === 'options' || phase === 'result') && (
        <div className="drill-progress-track">
          <div className="drill-progress-bg" />
          <div
            className="drill-progress-fill"
            style={{ width: `${progress}%` }}
          />
          <div className="drill-progress-markers">
            {[0, 25, 50, 75, 100].map((p) => (
              <div
                key={p}
                className="drill-progress-marker"
                style={{ left: `${p}%` }}
              />
            ))}
          </div>
          <div
            className={`drill-progress-robot labbot-state-${robotState}`}
            style={{ left: `calc(${progress}% - 36px)` }}
          >
            <LabBotIcon size={72} />
            {robotState === 'shatter' && (
              <div className="drill-robot-shatter-parts">
                <span /> <span /> <span /> <span /> <span /> <span />
              </div>
            )}
          </div>
          <div className="drill-progress-label">
            {mode === 'category' ? progressSteps + ' / 10 鍏? : '瀹夊叏闂叧杩涘害'}
          </div>
        </div>
      )}

      {/* 椤堕儴淇℃伅 */}
      {(phase === 'narrative' || phase === 'options' || phase === 'result') && (
        <div className="drill-immersive-topbar">
          <div>
            <div className="drill-immersive-label">SCENARIO</div>
            <div className="drill-immersive-title">{scenario?.title}</div>
          </div>
          <div className="drill-immersive-score">
            <div className="drill-immersive-score-value">{score}</div>
            <div className="drill-immersive-score-label">瀹夊叏鍒?/div>
          </div>
        </div>
      )}

      {/* 鍏抽棴鎸夐挳 */}
      <button
        className="drill-immersive-close"
        onClick={handleExit}
        title="閫€鍑?
      >
        脳
      </button>

      {/* 搴曢儴鍖哄煙 */}
      <div className="drill-immersive-bottom">
        {/* 鍙欎簨鏂囧瓧 */}
        {(phase === 'narrative' || phase === 'options' || phase === 'result') && (
          <div className="drill-narrative-panel enter">
            <div className="drill-narrative-label">鍦烘櫙鎻忚堪</div>
            <p className="drill-narrative-text">
              {narrativeText}
              {!narrativeDone && <span className="drill-type-cursor" />}
            </p>
          </div>
        )}

        {selectedId && (
          <aside
            className={`drill-story-panel ${result?.feedback_type || 'pending'}`}
            aria-live="polite"
          >
            <div className="drill-story-kicker">FIELD REPLAY</div>
            <div className="drill-story-title">鐜板満鍥炴斁</div>
            <div className="drill-story-track">
              <div className="drill-story-step">
                <div className="drill-story-step-label">01 路 鍦烘櫙璧风偣</div>
                <p className="drill-story-step-text">{scenario.narrative}</p>
              </div>
              <div className="drill-story-step">
                <div className="drill-story-step-label">02 路 浣犵殑鎿嶄綔</div>
                <p className="drill-story-step-text">
                  浣犻€夋嫨浜嗏€渰selectedOption?.text || '褰撳墠閫夐」'}鈥濓紝鐜板湪寮€濮嬫墽琛岃繖涓€鎿嶄綔銆?
                </p>
              </div>
              <div className="drill-story-step">
                <div className="drill-story-step-label">
                  {result ? '03 路 鐜板満鍚庢灉' : '03 路 绯荤粺鍒嗘瀽'}
                </div>
                <p className="drill-story-step-text">
                  {result?.result_text ||
                    (submitError
                      ? `鏆傛椂鏃犳硶鑾峰彇鍚庢灉鍙嶉锛?{submitError}`
                      : '鎿嶄綔姝ｅ湪鍙戠敓锛岀郴缁熸鍦ㄤ緷鎹湰鍦烘櫙鐨勫畨鍏ㄨ鍒欏垎鏋愬悗鏋溾€?)}
                </p>
              </div>
            </div>
          </aside>
        )}

        {/* 閫夐」姘旀场 */}
        {phase === 'options' && showOptions && scenario && (
          <div className="drill-options-immersive">
            {scenario.options.map((opt, i) => {
              return (
                <button
                  key={opt.id}
                  className="drill-option-immersive opt-enter"
                  style={{ animationDelay: `${i * 0.12}s` }}
                  onClick={() => handleSelect(opt.id)}
                  disabled={!!selectedId || submitLoading}
                >
                  {opt.text}
                </button>
              );
            })}
          </div>
        )}

        {selectedId && !result && (
          <div className="drill-submit-state" role="status">
            <span className="drill-submit-state-dot" />
            {submitError ? `鎻愪氦澶辫触锛?{submitError}` : '姝ｅ湪鍒嗘瀽鎿嶄綔鍚庢灉鈥?}
            {submitError && (
              <button
                className="drill-submit-retry"
                onClick={() => {
                  setSelectedId(null);
                  setShowOptions(true);
                }}
              >
                杩斿洖閫夐」
              </button>
            )}
          </div>
        )}

        {/* 缁撴灉闈㈡澘 */}
        {phase === 'result' && result && (
          <div className="drill-result-panel">
            <div className={`drill-result-header ${result.feedback_type}`}>
              <div className={`drill-result-icon ${result.feedback_type}`}>
                {RESULT_ICONS[result.feedback_type]}
              </div>
              <div>
                <div className="drill-result-title">
                  {RESULT_TITLES[result.feedback_type]}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  浣犵殑閫夋嫨锛歿result.option_text}
                </div>
              </div>
              <div
                className={`drill-result-score ${
                  result.score_delta >= 0 ? 'positive' : 'negative'
                }`}
              >
                {result.score_delta >= 0 ? '+' : ''}
                {result.score_delta}
              </div>
            </div>

            <div className="drill-result-body">
              <p className="drill-result-story">{result.result_text}</p>

              {result.kb_references.length > 0 && (
                <>
                  <div className="drill-result-kb-title">
                    馃摎 鐭ヨ瘑渚濇嵁 路 {result.kb_references.length} 鏉?
                  </div>
                  <div className="drill-result-kb-list">
                    {result.kb_references.slice(0, 3).map((ref) => (
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
              <button className="drill-result-btn ghost" onClick={handleExit}>
                杩斿洖鍒楄〃
              </button>
              {mode === 'category' ? (
                <button
                  className="drill-result-btn primary"
                  onClick={onNextRandom}
                  disabled={completed}
                >
                  {completed ? '闂叧鎴愬姛 馃帀' : '涓嬩竴棰?鈫?}
                </button>
              ) : (
                <button className="drill-result-btn primary" onClick={handleRetry}>
                  鍐嶈瘯涓€娆?
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 搴曢儴鎻愮ず */}
      {phase === 'narrative' && narrativeDone && (
        <div className="drill-immersive-hint">閫夋嫨浣犺涓烘纭殑鎿嶄綔</div>
      )}

      {/* 闂叧鎴愬姛瑕嗙洊灞?*/}
      {completed && mode === 'category' && (
        <div className="drill-clear-overlay">
          <div className="drill-clear-card">
            <div className="drill-clear-badge">馃帀</div>
            <div className="drill-clear-title">闂叧鎴愬姛</div>
            <div className="drill-clear-desc">
              浣犲畬鎴愪簡 10 鍏冲畨鍏ㄩ棷鍏宠繘搴︼紝瀹夊叏鍒?{score} 鍒嗐€?
            </div>
            <div className="drill-clear-actions">
              <button className="drill-result-btn ghost" onClick={handleExit}>
                杩斿洖澶у巺
              </button>
              <button
                className="drill-result-btn primary"
                onClick={() => {
                  setCompleted(false);
                  setProgressSteps(0);
                  if (onNextRandom) onNextRandom();
                }}
              >
                鍐嶆潵涓€杞?
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
