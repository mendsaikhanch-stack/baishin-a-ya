-- ============================================================
-- Байшин А-Я — Supabase SQL Schema
-- Run this in Supabase SQL Editor to create all tables
-- ============================================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'paid', 'premium')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Миний байшин',
  questionnaire JSONB,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_projects_profile ON projects(profile_id);

-- Readiness Assessments
CREATE TABLE readiness_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  label TEXT NOT NULL,
  risks JSONB NOT NULL DEFAULT '[]',
  next_steps JSONB NOT NULL DEFAULT '[]',
  recommended_track TEXT NOT NULL,
  budget_notes JSONB NOT NULL DEFAULT '[]',
  expert_suggestions JSONB NOT NULL DEFAULT '[]',
  roadmap_phases JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_assessments_project ON readiness_assessments(project_id);

-- Roadmap Steps
CREATE TABLE roadmap_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  tasks JSONB NOT NULL DEFAULT '[]',
  estimated_duration TEXT,
  expert_needed BOOLEAN NOT NULL DEFAULT FALSE,
  expert_type TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_roadmap_project ON roadmap_steps(project_id);

-- Checklist Items
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase INTEGER NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_checklist_project ON checklist_items(project_id);

-- Chat Messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_chat_project ON chat_messages(project_id);

-- Content Articles (knowledge base)
CREATE TABLE content_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'mn',
  published BOOLEAN NOT NULL DEFAULT FALSE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_articles_category ON content_articles(category);
CREATE INDEX idx_articles_slug ON content_articles(slug);

-- Expert Categories
CREATE TABLE expert_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  when_needed TEXT NOT NULL
);

-- Referrals
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES expert_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  contact TEXT,
  location TEXT,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_referrals_category ON referrals(category_id);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Users can create own projects" ON projects FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Users can view own assessments" ON readiness_assessments
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE profile_id = auth.uid()));

CREATE POLICY "Users can view own roadmap" ON roadmap_steps
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE profile_id = auth.uid()));

CREATE POLICY "Users can view own checklist" ON checklist_items
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE profile_id = auth.uid()));
CREATE POLICY "Users can update own checklist" ON checklist_items
  FOR UPDATE USING (project_id IN (SELECT id FROM projects WHERE profile_id = auth.uid()));

CREATE POLICY "Users can view own chat" ON chat_messages
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE profile_id = auth.uid()));
CREATE POLICY "Users can create chat messages" ON chat_messages
  FOR INSERT WITH CHECK (project_id IN (SELECT id FROM projects WHERE profile_id = auth.uid()));

-- Content articles are publicly readable
ALTER TABLE content_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published articles" ON content_articles FOR SELECT USING (published = true);

-- Expert categories are publicly readable
ALTER TABLE expert_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read expert categories" ON expert_categories FOR SELECT USING (true);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read verified referrals" ON referrals FOR SELECT USING (verified = true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER articles_updated_at BEFORE UPDATE ON content_articles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
