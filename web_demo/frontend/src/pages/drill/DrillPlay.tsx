import { useCallback, useEffect, useState } from 'react';
import { useDrillDetail, useDrillSubmit } from '../../hooks/useDrill';
import type { DrillScenarioDetail, DrillSubmitResponse } from '../../types/drill';
import SceneCanvas from './SceneCanvas';
import './drill.css';

interface DrillPlayProps {
  scenarioId: string;
  onBack: () => void;
}

const DIFF_LABELS: Record<string, string> = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '挑战',
};

const FEEDBACK_TITLES: Record<string, string> = {
  correct: '✓ 操作正确',
  warning: '⚠ 存在隐患',
  danger: '✗ 严重违规',
};

type AnimState = 'idle' | 'out' | 'in';

export default function DrillPlay({ scenarioId, onBack }: DrillPlayProps) {
  const { load: loadDetail, loading: detailLoading, error: detailError } = useDrillDetail();
  const { submit, loading: submitLoading } = useDrillSubmit();

  const [scenario, setScenario] = useState<DrillScenarioDetail | null>(null);
  const [score, setScore] = useState(100);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<DrillSubmitResponse | null>(null);
  const [currentBg, setCurrentBg] = useState<'A' | 'B' | 'C'>('A');
  const [currentSvgs, setCurrentSvgs] = useState<string[]>([]);
  const [animState, setAnimState] = useState<AnimState>('in');

  useEffect(() => {
    let cancelled = false;
    loadDetail(scenarioId)
      .then((data) => {
        if (cancelled) return;
        setScenario(data);
        setCurrentBg(data.background);
        setCurrentSvgs(data.overlay_svgs);
        setAnimState('in');
      })
      .catch(() => {
        /* error handled in hook */
      });
    return () => {
      cancelled = true;
    };
  }, [scenarioId, loadDetail]);

  const handleSelect = useCallback(
    async (optionId: string) => {
      if (!scenario || selectedId || submitLoading) return;
      setSelectedId(optionId);
      setAnimState('out');

      // 等缩出动画播一半再请求
      await new Promise((r) => setTimeout(r, 300));

      try {
        const result = await submit(scenarioId, optionId);
        setFeedback(result);
        setScore((prev) => Math.max(0, prev + result.score_delta));
        setCurrentBg(result.next_background);
        setCurrentSvgs(result.next_svgs);

        // 保存最佳成绩
        try {
          const raw = localStorage.getItem('drill_best_scores');
          const all = raw ? JSON.parse(raw) : {};
          const prev = all[scenarioId] ?? 0;
          const newScore = Math.max(0, score + result.score_delta);
          if (newScore > prev) {
            all[scenarioId] = newScore;
            localStorage.setItem('drill_best_scores', JSON.stringify(all));
          }
        } catch {
          /* ignore */
        }

        // 播放进入动画
        setAnimState('in');
        // 动画结束后回到 idle
        setTimeout(() => setAnimState('idle'), 700);
      } catch {
        setAnimState('idle');
      }
    },
    [scenario, selectedId, submitLoading, submit, scenarioId, score],
  );

  const handleRetry = useCallback(() => {
    setScore(100);
    setSelectedId(null);
    setFeedback(null);
    setAnimState('out');
    setTimeout(() => {
      if (scenario) {
        setCurrentBg(scenario.background);
        setCurrentSvgs(scenario.overlay_svgs);
        setAnimState('in');
        setTimeout(() => setAnimState('idle'), 700);
      }
    }, 300);
  }, [scenario]);

  if (detailLoading) {
    return (
      <div className="drill-app">
        <div className="drill-content">
          <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--drill-text-3)' }}>
            加载场景中…
          </div>
        </div>
      </div>
    );
  }

  if (detailError || !scenario) {
    return (
      <div className="drill-app">
        <div className="drill-content">
          <button className="drill-back-btn" onClick={onBack}>← 返回</button>
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--drill-danger-2)' }}>
            场景加载失败：{detailError}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="drill-app">
      {/* 穿梭光效遮罩 */}
      <div className={`drill-warp-overlay ${animState === 'in' ? 'active' : ''}`} />

      <div className="drill-content">
        {/* 顶部 */}
        <div className="drill-header">
          <button className="drill-back-btn" onClick={onBack}>← 返回场景列表</button>
          <h1 className="drill-title">「{scenario.title}」</h1>
          <span
            className={`drill-diff-tag drill-diff-${scenario.difficulty}`}
            style={{ width: 96, textAlign: 'center' }}
          >
            {DIFF_LABELS[scenario.difficulty]}
          </span>
        </div>

        <div className="drill-play">
          {/* 主区域 */}
          <div className="drill-play-main">
            {/* 场景画布 */}
            <SceneCanvas
              background={currentBg}
              overlaySvgs={currentSvgs}
              title={scenario.title}
              score={score}
              animating={animState}
            />

            {/* 场景描述 */}
            {!feedback && (
              <div className="drill-narrative">
                <p className="drill-narrative-text">{scenario.narrative}</p>
                {scenario.hint && (
                  <p className="drill-narrative-hint">💡 提示：{scenario.hint}</p>
                )}
              </div>
            )}

            {/* 选项 */}
            <div className="drill-options">
              {scenario.options.map((opt) => {
                const isSelected = selectedId === opt.id;
                const fbType = feedback && isSelected ? feedback.feedback_type : null;
                const btnClass = fbType
                  ? `selected-${fbType === 'warning' ? 'warning' : fbType}`
                  : '';
                return (
                  <button
                    key={opt.id}
                    className={`drill-option-btn ${btnClass}`}
                    onClick={() => handleSelect(opt.id)}
                    disabled={!!selectedId || submitLoading}
                  >
                    <span className="drill-option-letter">{opt.id}</span>
                    <span>{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {/* 反馈面板 */}
            {feedback && (
              <div className="drill-feedback">
                <div className={`drill-feedback-header ${feedback.feedback_type}`}>
                  <span>{FEEDBACK_TITLES[feedback.feedback_type]}</span>
                  <span className="drill-feedback-score">
                    {feedback.score_delta > 0 ? '+' : ''}
                    {feedback.score_delta} 分
                  </span>
                </div>
                <div className="drill-feedback-body">{feedback.result_text}</div>

                {feedback.kb_references.length > 0 && (
                  <>
                    <div className="drill-feedback-kb-label">
                      📚 知识依据 · 共 {feedback.kb_references.length} 条
                    </div>
                    <div className="drill-feedback-kb-list">
                      {feedback.kb_references.map((ref) => (
                        <div key={ref.kb_id} className="drill-kb-card">
                          <div className="drill-kb-card-title">
                            [{ref.kb_id}] {ref.title}
                          </div>
                          <div className="drill-kb-card-snippet">{ref.snippet}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="drill-feedback-actions">
                  <button className="drill-btn-secondary" onClick={onBack}>
                    返回列表
                  </button>
                  <button className="drill-btn-primary" onClick={handleRetry}>
                    再试一次
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 侧边栏 */}
          <div className="drill-sidebar">
            <div className="drill-side-card">
              <div className="drill-side-title">实训状态</div>
              <div className="drill-stat-row">
                <span className="drill-stat-label">安全分数</span>
                <span
                  className="drill-stat-value"
                  style={{
                    color:
                      score > 80
                        ? 'var(--drill-success)'
                        : score > 60
                          ? 'var(--drill-warning)'
                          : 'var(--drill-danger-2)',
                  }}
                >
                  {score}
                </span>
              </div>
              <div className="drill-stat-row">
                <span className="drill-stat-label">难度</span>
                <span className="drill-stat-value">{DIFF_LABELS[scenario.difficulty]}</span>
              </div>
              <div className="drill-stat-row">
                <span className="drill-stat-label">选项数</span>
                <span className="drill-stat-value">{scenario.options.length}</span>
              </div>
              <div className="drill-stat-row">
                <span className="drill-stat-label">场景分类</span>
                <span className="drill-stat-value">{scenario.category}</span>
              </div>
            </div>

            <div className="drill-side-card">
              <div className="drill-side-title">操作说明</div>
              <div style={{ fontSize: '12px', color: 'var(--drill-text-2)', lineHeight: 1.8 }}>
                仔细阅读场景描述，选择你认为正确的操作方式。
                选错或选对都会立即得到反馈，并关联相应的知识库条目供深入学习。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
