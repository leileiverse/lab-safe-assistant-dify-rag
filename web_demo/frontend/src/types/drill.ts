// 安全闯关游戏类型定义

export interface DrillScenarioMeta {
  scenario_id: string;
  title: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  background: 'A' | 'B' | 'C';
  overlay_svgs: string[];
  option_count: number;
}

export interface DrillCategory {
  key: string;
  name: string;
  icon: string;
  scenarios: DrillScenarioMeta[];
}

export interface DrillScenariosResponse {
  total: number;
  category_count: number;
  categories: DrillCategory[];
}

export interface DrillOption {
  id: string;
  text: string;
}

export interface DrillScenarioDetail {
  scenario_id: string;
  title: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  background: 'A' | 'B' | 'C';
  overlay_svgs: string[];
  narrative: string;
  hint?: string;
  options: DrillOption[];
}

export interface DrillKbRef {
  kb_id: string;
  title: string;
  category: string;
  subcategory: string;
  risk_level: string;
  source_title: string;
  source_org: string;
  source_url: string;
  snippet: string;
  steps?: string;
  forbidden?: string;
  first_aid?: string;
  emergency?: string;
}

export interface DrillSubmitResponse {
  scenario_id: string;
  option_id: string;
  option_text: string;
  result_text: string;
  feedback_type: 'correct' | 'warning' | 'danger';
  score_delta: number;
  is_deadly: boolean;
  kb_references: DrillKbRef[];
  next_background: 'A' | 'B' | 'C';
  next_svgs: string[];
}
