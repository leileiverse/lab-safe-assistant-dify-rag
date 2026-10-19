import { useEffect, useState } from 'react';
import { useDrillScenarios } from '../../hooks/useDrill';
import DrillHall from './drill/DrillHall';
import ImmersiveDrill from './drill/ImmersiveDrill';
import './drill/drill.css';

interface DrillAppProps {
  onBackToChat: () => void;
}

type View = 'hall' | 'immersive';
type DrillMode = 'single' | 'category';

export default function DrillApp({ onBackToChat }: DrillAppProps) {
  const { data: scenariosData, load: loadScenarios } = useDrillScenarios();
  const [view, setView] = useState<View>('hall');
  const [currentScenarioId, setCurrentScenarioId] = useState('');
  const [drillMode, setDrillMode] = useState<DrillMode>('single');
  const [currentCategory, setCurrentCategory] = useState('');
  const [visitedScenarioIds, setVisitedScenarioIds] = useState<string[]>([]);

  const handleStart = (scenarioId: string, mode: DrillMode = 'single', categoryKey = '') => {
    setDrillMode(mode);
    setCurrentCategory(categoryKey);
    setVisitedScenarioIds([scenarioId]);
    setCurrentScenarioId(scenarioId);
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
    const cat = scenariosData.categories.find((c: any) => c.key === currentCategory);
    if (!cat) return;
    const available = cat.scenarios.filter((s: any) => !visitedScenarioIds.includes(s.scenario_id));
    const pool = available.length > 0 ? available : cat.scenarios;
    const next = pool[Math.floor(Math.random() * pool.length)];
    if (available.length === 0) {
      setVisitedScenarioIds([next.scenario_id]);
    } else {
      setVisitedScenarioIds((prev) => [...prev, next.scenario_id]);
    }
    setCurrentScenarioId(next.scenario_id);
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
        key={currentScenarioId}
        scenarioId={currentScenarioId}
        mode={drillMode}
        categoryKey={currentCategory}
        onClose={handleBackToHall}
        onNextRandom={handleNextRandom}
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
