import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface System {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface Category {
  id: string;
  system_id: string;
  name: string;
  created_at: string;
}

export interface Question {
  id: string;
  system_id: string;
  category_id: string;
  question_text: string;
  question_type: string;
  difficulty: string;
  clinical_vignette: string;
  image_url: string | null;
  created_at: string;
}

export interface AnswerChoice {
  id: string;
  question_id: string;
  choice_text: string;
  is_correct: boolean;
  order_position: number;
  created_at: string;
}

export interface Explanation {
  id: string;
  question_id: string;
  correct_answer_explanation: string;
  incorrect_answers_explanation: string | null;
  educational_objective: string;
  reference_links: string | null;
  created_at: string;
}

export interface Test {
  id: string;
  user_id: string;
  title: string;
  test_mode: 'timed' | 'tutor' | 'unused';
  total_questions: number;
  completed: boolean;
  score: number | null;
  time_limit_minutes: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface UserAnswer {
  id: string;
  user_id: string;
  test_id: string;
  question_id: string;
  selected_choice_id: string;
  is_correct: boolean;
  time_spent_seconds: number;
  marked_for_review: boolean;
  answered_at: string;
}

export interface Flashcard {
  id: string;
  user_id: string;
  question_id: string;
  front_text: string;
  back_text: string;
  last_reviewed: string | null;
  created_at: string;
}

export interface StudyPlan {
  id: string;
  user_id: string;
  target_exam_date: string | null;
  daily_question_goal: number;
  total_questions_to_complete: number;
  questions_completed: number;
  created_at: string;
  updated_at: string;
}

export interface UserPerformance {
  id: string;
  user_id: string;
  system_id: string;
  category_id: string | null;
  total_questions_answered: number;
  correct_answers: number;
  percentage: number;
  updated_at: string;
}
