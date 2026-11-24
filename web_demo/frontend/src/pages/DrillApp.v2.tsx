import { useEffect, useState } from 'react';
import { useDrillScenarios } from '../../hooks/useDrill';
import DrillHall from './DrillHall';
import ImmersiveDrill from './ImmersiveDrill';
import './drill.css';

interface DrillAppProps {
  onBackToChat: () => void;
}

type View = 'hall' | 'immersive';
type DrillMode = 'single' | 'category';
type RobotState = 'idle' | 'run' | 'shatter' | 'rebuild' | 'cheer';

const TOTAL_STEPS = 10;

export default function DrillApp({ onBackToChat }: DrillAppProps) {
  const { data: scenariosData, load: loadScenarios } = useDrillScenarios();
  const [view, setView] = useState<View>('hall');
  const [currentScenarioId, setCurrentScenarioId] = useState('');
  const [drillMode, setDrillMode] = useState<DrillMode>('single');
  const [currentCategory, setCurrentCategory] = useState('');
  const [visitedScenarioIds, setVisitedScenarioIds] = useState<string[]>([]);

  // 分类闯关模式的全局进度（跨题目保持）
  const [progressSteps, setProgressSteps] = useState(0);
  const [robotState, setRobotState] = useState<RobotState>('idle');
  const [showClear, setShowClear] = useState(false);

  useEffect(() => {
    void loadScenarios();
  }, [loadScenarios]);

  const handleStart = (scenarioId: string, mode: DrillMode = 'single', categoryKey = '') => {
    setDrillMode(mode);
    setCurrentCategory(categoryKey);
    setVisitedScenarioIds([scenarioId]);
    setCurrentScenarioId(scenarioId);
    // 重置分类闯关进度
    if (mode === 'category') {
      setProgressSteps(0);
      setRobotState('idle');
      setShowClear(false);
    }
    setView('immersive');
    const request = document.documentElement.requestFullscreen?.();
    if (request) {
      void request.catch(() => undefined);
    }
  };

  const handleStartRandom = (categoryKey: string, firstScenarioId: string) => {
    handleStart(firstScenarioId, 'category', categoryKey);
  };

  const handleNextRandom = () => {
    if (!scenariosData || !currentCategory) return;
    const cat = scenariosData.categories.find((c) => c.key === currentCategory);
    if (!cat) return;
    const available = cat.scenarios.filter((s) => !visitedScenarioIds.includes(s.scenario_id));
    const pool = available.length > 0 ? available : cat.scenarios;
    const next = pool[Math.floor(Math.random() * pool.length)];
    if (available.length === 0) {
      setVisitedScenarioIds([next.scenario_id]);
    } else {
      setVisitedScenarioIds((prev) => [...prev, next.scenario_id]);
    }
    setCurrentScenarioId(next.scenario_id);
  };

  // ImmersiveDrill 回调：答对/答错时更新进度
  const handleProgressChange = (delta: number, state: RobotState) => {
    if (drillMode !== 'category') return;
    setRobotState(state);
    setProgressSteps((prev) => {
      const next = Math.max(0, Math.min(TOTAL_STEPS, prev + delta));
      if (next >= TOTAL_STEPS) {
        setTimeout(() => {
          setRobotState('cheer');
          setShowClear(true);
        }, 1000);
      } else if (state === 'shatter') {
        setTimeout(() => {
          setRobotState('rebuild');
          setTimeout(() => setRobotState('idle'), 900);
        }, 1000);
      } else if (state === 'run') {
        setTimeout(() => setRobotState('idle'), 1200);
      }
      return next;
    });
  };

  const handleClearReset = () => {
    setShowClear(false);
    setProgressSteps(0);
    setRobotState('idle');
    // 从当前分类重新抽一题
    handleNextRandom();
  };

  const handleBackToHall = () => {
    if (document.fullscreenElement) {
      const exit = document.exitFullscreen?.();
      if (exit) {
        void exit.catch(() => undefined);
      }
    }
    setView('hall');
  };

  if (view === 'immersive') {
    return (
      <ImmersiveDrill
        key={drillMode === 'category' ? `cat-${currentCategory}` : currentScenarioId}
        scenarioId={currentScenarioId}
        mode={drillMode}
        categoryKey={currentCategory}
        onClose={handleBackToHall}
        onNextRandom={handleNextRandom}
        progressSteps={progressSteps}
        robotState={robotState}
        showClear={showClear}
        onProgressChange={handleProgressChange}
        onClearReset={handleClearReset}
      />
    );
  }

  return (
    <DrillHall
      onStart={handleStart}
      onStartRandom={handleStartRandom}
      onBack={onBackToChat}
    />
  );
}