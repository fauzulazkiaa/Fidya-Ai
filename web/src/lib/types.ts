export type SourceKind = "public" | "private";

export interface Citation {
  chunk_id: string;
  index: number;
  source_title: string;
  source_url: string;
  author: string;
  snippet: string;
  kind: SourceKind;
  published_at?: string;
}

export interface LearningModule {
  module_id: string;
  week: number;
  day: number;
  order: number;
  title: string;
  domain: string;
  objectives: string[];
  estimated_hours: number;
  status: "locked" | "available" | "in_progress" | "completed";
  completion: number;
  tags: string[];
  content_markdown?: string;
  citations?: Citation[];
}

export interface Milestone {
  id: string;
  title: string;
  date: string;
  week: number;
  kind: string;
}

export interface Syllabus {
  curriculum_id: string;
  target_topic: string;
  current_level: string;
  target_outcome: string;
  target_deadline: string;
  hours_per_week: number;
  learning_style: string;
  milestones: Milestone[];
  modules: LearningModule[];
}

export interface OnboardingPayload {
  target_topic: string;
  current_level: string;
  target_outcome: string;
  target_deadline: string;
  hours_per_week: number;
  learning_style: string;
}

export interface ForgeReview {
  summary: string;
  strengths: string[];
  vulnerabilities: { line?: number; paragraph?: number; note: string }[];
  suggested_refactors: { title: string; diff: string }[];
  rubric_scores: { name: string; score: number; max: number }[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "inquisitor";
  content: string;
  mastery?: number;
  hint?: string;
}

export interface ActivityDay {
  date?: string;
  label: string;
  /** Pre-aggregated total (used by summary views); wins over split hours. */
  hours?: number;
  lessons_hours?: number;
  practice_hours?: number;
}

export interface AnalyticsProgress {
  streak_days: number;
  weekly_xp_goal: number;
  xp_earned: number;
  overall_completion: number;
  velocity: ActivityDay[];
  citation_clicks: number;
  sessions_with_citations: number;
  total_sessions: number;
  mastery_scores: { concept: string; score: number }[];
}
