/*
  # Question Bank Application Schema

  ## Overview
  Complete schema for a medical question bank application similar to UWorld USMLE Qbank.

  ## New Tables

  ### `systems`
  Medical systems for organizing questions (e.g., Cardiovascular, Respiratory)
  - `id` (uuid, primary key)
  - `name` (text, unique, not null)
  - `description` (text)
  - `created_at` (timestamptz)

  ### `categories`
  Categories within each system for granular organization
  - `id` (uuid, primary key)
  - `system_id` (uuid, foreign key to systems)
  - `name` (text, not null)
  - `created_at` (timestamptz)

  ### `questions`
  Question bank with detailed content
  - `id` (uuid, primary key)
  - `system_id` (uuid, foreign key to systems)
  - `category_id` (uuid, foreign key to categories)
  - `question_text` (text, not null)
  - `question_type` (text, single_choice/multiple_choice)
  - `difficulty` (text, easy/medium/hard)
  - `clinical_vignette` (text) - Patient scenario
  - `image_url` (text) - Optional question image
  - `created_at` (timestamptz)

  ### `answer_choices`
  Multiple choice options for each question
  - `id` (uuid, primary key)
  - `question_id` (uuid, foreign key to questions)
  - `choice_text` (text, not null)
  - `is_correct` (boolean, default false)
  - `order_position` (integer)
  - `created_at` (timestamptz)

  ### `explanations`
  Detailed explanations for answers
  - `id` (uuid, primary key)
  - `question_id` (uuid, foreign key to questions)
  - `correct_answer_explanation` (text, not null)
  - `incorrect_answers_explanation` (text)
  - `educational_objective` (text)
  - `reference_links` (text)
  - `created_at` (timestamptz)

  ### `tests`
  Custom tests created by users
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `title` (text, not null)
  - `test_mode` (text, timed/tutor/unused) 
  - `total_questions` (integer)
  - `completed` (boolean, default false)
  - `score` (integer)
  - `time_limit_minutes` (integer)
  - `created_at` (timestamptz)
  - `completed_at` (timestamptz)

  ### `test_questions`
  Junction table linking tests to questions
  - `id` (uuid, primary key)
  - `test_id` (uuid, foreign key to tests)
  - `question_id` (uuid, foreign key to questions)
  - `order_position` (integer)
  - `created_at` (timestamptz)

  ### `user_answers`
  Track user responses to questions
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `test_id` (uuid, foreign key to tests)
  - `question_id` (uuid, foreign key to questions)
  - `selected_choice_id` (uuid, foreign key to answer_choices)
  - `is_correct` (boolean)
  - `time_spent_seconds` (integer)
  - `marked_for_review` (boolean, default false)
  - `answered_at` (timestamptz)

  ### `flashcards`
  User-created flashcards from questions
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `question_id` (uuid, foreign key to questions)
  - `front_text` (text, not null)
  - `back_text` (text, not null)
  - `last_reviewed` (timestamptz)
  - `created_at` (timestamptz)

  ### `study_plans`
  User study schedules and goals
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `target_exam_date` (date)
  - `daily_question_goal` (integer, default 50)
  - `total_questions_to_complete` (integer)
  - `questions_completed` (integer, default 0)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `user_performance`
  Aggregate performance metrics per system/category
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `system_id` (uuid, foreign key to systems)
  - `category_id` (uuid, foreign key to categories)
  - `total_questions_answered` (integer, default 0)
  - `correct_answers` (integer, default 0)
  - `percentage` (decimal)
  - `updated_at` (timestamptz)

  ## Security
  All tables have RLS enabled with appropriate policies for authenticated users.
*/

-- Create systems table
CREATE TABLE IF NOT EXISTS systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id uuid REFERENCES systems(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id uuid REFERENCES systems(id) ON DELETE SET NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  question_text text NOT NULL,
  question_type text DEFAULT 'single_choice',
  difficulty text DEFAULT 'medium',
  clinical_vignette text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Create answer_choices table
CREATE TABLE IF NOT EXISTS answer_choices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  choice_text text NOT NULL,
  is_correct boolean DEFAULT false,
  order_position integer,
  created_at timestamptz DEFAULT now()
);

-- Create explanations table
CREATE TABLE IF NOT EXISTS explanations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  correct_answer_explanation text NOT NULL,
  incorrect_answers_explanation text,
  educational_objective text,
  reference_links text,
  created_at timestamptz DEFAULT now()
);

-- Create tests table
CREATE TABLE IF NOT EXISTS tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  test_mode text DEFAULT 'tutor',
  total_questions integer DEFAULT 0,
  completed boolean DEFAULT false,
  score integer,
  time_limit_minutes integer,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create test_questions table
CREATE TABLE IF NOT EXISTS test_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid REFERENCES tests(id) ON DELETE CASCADE,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  order_position integer,
  created_at timestamptz DEFAULT now()
);

-- Create user_answers table
CREATE TABLE IF NOT EXISTS user_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  test_id uuid REFERENCES tests(id) ON DELETE CASCADE,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  selected_choice_id uuid REFERENCES answer_choices(id) ON DELETE SET NULL,
  is_correct boolean,
  time_spent_seconds integer,
  marked_for_review boolean DEFAULT false,
  answered_at timestamptz DEFAULT now()
);

-- Create flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  front_text text NOT NULL,
  back_text text NOT NULL,
  last_reviewed timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create study_plans table
CREATE TABLE IF NOT EXISTS study_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  target_exam_date date,
  daily_question_goal integer DEFAULT 50,
  total_questions_to_complete integer,
  questions_completed integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_performance table
CREATE TABLE IF NOT EXISTS user_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  system_id uuid REFERENCES systems(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  total_questions_answered integer DEFAULT 0,
  correct_answers integer DEFAULT 0,
  percentage decimal,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for systems (public read)
CREATE POLICY "Anyone can view systems"
  ON systems FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for categories (public read)
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for questions (public read)
CREATE POLICY "Anyone can view questions"
  ON questions FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for answer_choices (public read)
CREATE POLICY "Anyone can view answer choices"
  ON answer_choices FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for explanations (public read)
CREATE POLICY "Anyone can view explanations"
  ON explanations FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for tests
CREATE POLICY "Users can view own tests"
  ON tests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tests"
  ON tests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tests"
  ON tests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tests"
  ON tests FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for test_questions
CREATE POLICY "Users can view test questions for own tests"
  ON test_questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tests
      WHERE tests.id = test_questions.test_id
      AND tests.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create test questions for own tests"
  ON test_questions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tests
      WHERE tests.id = test_questions.test_id
      AND tests.user_id = auth.uid()
    )
  );

-- RLS Policies for user_answers
CREATE POLICY "Users can view own answers"
  ON user_answers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own answers"
  ON user_answers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own answers"
  ON user_answers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for flashcards
CREATE POLICY "Users can view own flashcards"
  ON flashcards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own flashcards"
  ON flashcards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcards"
  ON flashcards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcards"
  ON flashcards FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for study_plans
CREATE POLICY "Users can view own study plans"
  ON study_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own study plans"
  ON study_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study plans"
  ON study_plans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_performance
CREATE POLICY "Users can view own performance"
  ON user_performance FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own performance"
  ON user_performance FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own performance"
  ON user_performance FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_categories_system_id ON categories(system_id);
CREATE INDEX IF NOT EXISTS idx_questions_system_id ON questions(system_id);
CREATE INDEX IF NOT EXISTS idx_questions_category_id ON questions(category_id);
CREATE INDEX IF NOT EXISTS idx_answer_choices_question_id ON answer_choices(question_id);
CREATE INDEX IF NOT EXISTS idx_explanations_question_id ON explanations(question_id);
CREATE INDEX IF NOT EXISTS idx_tests_user_id ON tests(user_id);
CREATE INDEX IF NOT EXISTS idx_test_questions_test_id ON test_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_user_id ON user_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_test_id ON user_answers(test_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_study_plans_user_id ON study_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_performance_user_id ON user_performance(user_id);