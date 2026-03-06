-- 004_competitive.sql
-- Competitive intelligence module: competitors, scraping jobs, competitive signals

CREATE TABLE public.competitors (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID        NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  workspace_id     UUID        NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  g2_slug          TEXT,
  capterra_slug    TEXT,
  mention_count    INTEGER     NOT NULL DEFAULT 0,
  last_scraped_at  TIMESTAMPTZ,
  deleted_at       TIMESTAMPTZ,           -- soft delete
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE public.scraping_job_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE public.scraping_jobs (
  id              UUID                          PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID                          NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  competitor_id   UUID                          NOT NULL REFERENCES public.competitors (id) ON DELETE CASCADE,
  status          public.scraping_job_status    NOT NULL DEFAULT 'pending',
  attempts        INTEGER                       NOT NULL DEFAULT 0,
  error_message   TEXT,
  signals_extracted INTEGER                     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ                   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ                   NOT NULL DEFAULT now()
);

CREATE TYPE public.competitive_signal_type AS ENUM ('pain_point', 'switching_reason', 'feature_request', 'positive_mention');

CREATE TABLE public.competitive_signals (
  id              UUID                              PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID                              NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  workspace_id    UUID                              NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  competitor_id   UUID                              NOT NULL REFERENCES public.competitors (id) ON DELETE CASCADE,
  quote           TEXT                              NOT NULL,
  signal_type     public.competitive_signal_type    NOT NULL,
  source          TEXT                              NOT NULL, -- 'g2' | 'capterra' | 'csv'
  review_source_id TEXT,                            -- external review ID for dedup
  reviewer_role   TEXT,
  company_size    TEXT,
  review_date     DATE,
  created_at      TIMESTAMPTZ                       NOT NULL DEFAULT now(),
  UNIQUE (competitor_id, review_source_id)          -- prevents re-scrape duplication
);

-- Indexes
CREATE INDEX ON public.competitors (org_id);
CREATE INDEX ON public.competitive_signals (org_id);
CREATE INDEX ON public.competitive_signals (competitor_id);
CREATE INDEX ON public.competitive_signals (signal_type);
CREATE INDEX ON public.scraping_jobs (competitor_id);
CREATE INDEX ON public.scraping_jobs (status);

-- RLS: competitors (standard 4-policy pattern)
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "competitors: org read"   ON public.competitors FOR SELECT TO authenticated USING (org_id = public.auth_user_org_id());
CREATE POLICY "competitors: org insert" ON public.competitors FOR INSERT TO authenticated WITH CHECK (org_id = public.auth_user_org_id());
CREATE POLICY "competitors: org update" ON public.competitors FOR UPDATE TO authenticated USING (org_id = public.auth_user_org_id()) WITH CHECK (org_id = public.auth_user_org_id());
CREATE POLICY "competitors: org delete" ON public.competitors FOR DELETE TO authenticated USING (org_id = public.auth_user_org_id());

-- RLS: competitive_signals (standard 4-policy pattern)
ALTER TABLE public.competitive_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "competitive_signals: org read"   ON public.competitive_signals FOR SELECT TO authenticated USING (org_id = public.auth_user_org_id());
CREATE POLICY "competitive_signals: org insert" ON public.competitive_signals FOR INSERT TO authenticated WITH CHECK (org_id = public.auth_user_org_id());
CREATE POLICY "competitive_signals: org update" ON public.competitive_signals FOR UPDATE TO authenticated USING (org_id = public.auth_user_org_id()) WITH CHECK (org_id = public.auth_user_org_id());
CREATE POLICY "competitive_signals: org delete" ON public.competitive_signals FOR DELETE TO authenticated USING (org_id = public.auth_user_org_id());

-- RLS: scraping_jobs (SELECT, INSERT, UPDATE only — no DELETE)
ALTER TABLE public.scraping_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scraping_jobs: org read"   ON public.scraping_jobs FOR SELECT TO authenticated USING (org_id = public.auth_user_org_id());
CREATE POLICY "scraping_jobs: org insert" ON public.scraping_jobs FOR INSERT TO authenticated WITH CHECK (org_id = public.auth_user_org_id());
CREATE POLICY "scraping_jobs: org update" ON public.scraping_jobs FOR UPDATE TO authenticated USING (org_id = public.auth_user_org_id()) WITH CHECK (org_id = public.auth_user_org_id());
