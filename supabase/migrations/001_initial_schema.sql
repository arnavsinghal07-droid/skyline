-- =============================================================================
-- PM Copilot — Initial Schema
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- provides gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE public.user_role      AS ENUM ('admin', 'pm', 'viewer');
CREATE TYPE public.source_type    AS ENUM ('gong', 'zoom', 'csv', 'intercom', 'zendesk');
CREATE TYPE public.source_status  AS ENUM ('pending', 'syncing', 'active', 'error');
CREATE TYPE public.document_status AS ENUM ('pending', 'processing', 'processed', 'error');

-- =============================================================================
-- Tables
-- =============================================================================

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
CREATE TABLE public.organizations (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT        NOT NULL,
  plan               TEXT        NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- users  (profile table — id mirrors auth.users.id)
-- ---------------------------------------------------------------------------
CREATE TABLE public.users (
  id         UUID             PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  org_id     UUID             NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  email      TEXT             NOT NULL,
  role       public.user_role NOT NULL DEFAULT 'pm',
  created_at TIMESTAMPTZ      NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Helper: returns the org_id of the currently authenticated user.
-- Defined after public.users so PostgreSQL can resolve the table reference.
-- SECURITY DEFINER + search_path lock prevents RLS recursion on the users
-- table when this function is called from within an RLS policy.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auth_user_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.users WHERE id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- Helper: returns the role of the currently authenticated user.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- workspaces
-- ---------------------------------------------------------------------------
CREATE TABLE public.workspaces (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  product_context TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- sources
-- ---------------------------------------------------------------------------
CREATE TABLE public.sources (
  id               UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID                  NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  workspace_id     UUID                  NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  type             public.source_type    NOT NULL,
  status           public.source_status  NOT NULL DEFAULT 'pending',
  connector_config JSONB                 NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ           NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------
CREATE TABLE public.documents (
  id           UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id    UUID                   NOT NULL REFERENCES public.sources (id) ON DELETE CASCADE,
  org_id       UUID                   NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  workspace_id UUID                   NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  type         TEXT                   NOT NULL,
  status       public.document_status NOT NULL DEFAULT 'pending',
  metadata     JSONB                  NOT NULL DEFAULT '{}',
  raw_url      TEXT,
  created_at   TIMESTAMPTZ            NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- chunks
-- ---------------------------------------------------------------------------
CREATE TABLE public.chunks (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  UUID        NOT NULL REFERENCES public.documents (id) ON DELETE CASCADE,
  org_id       UUID        NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  workspace_id UUID        NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  text         TEXT        NOT NULL,
  qdrant_id    TEXT,
  tags         JSONB       NOT NULL DEFAULT '[]',
  sentiment    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- queries
-- ---------------------------------------------------------------------------
CREATE TABLE public.queries (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID        NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  org_id        UUID        NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  text          TEXT        NOT NULL,
  response_json JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- briefs
-- ---------------------------------------------------------------------------
CREATE TABLE public.briefs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id     UUID        NOT NULL REFERENCES public.queries (id) ON DELETE CASCADE,
  org_id       UUID        NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  workspace_id UUID        NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  content_json JSONB       NOT NULL DEFAULT '{}',
  exports      JSONB       NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- decisions
-- ---------------------------------------------------------------------------
CREATE TABLE public.decisions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id     UUID        NOT NULL REFERENCES public.briefs (id) ON DELETE CASCADE,
  org_id       UUID        NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  workspace_id UUID        NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  rationale    TEXT,
  evidence_ids TEXT[]      NOT NULL DEFAULT '{}',
  confidence   NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  outcome      TEXT,
  outcome_date DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Indexes
-- =============================================================================
CREATE INDEX ON public.users        (org_id);
CREATE INDEX ON public.workspaces   (org_id);
CREATE INDEX ON public.sources      (org_id);
CREATE INDEX ON public.sources      (workspace_id);
CREATE INDEX ON public.documents    (source_id);
CREATE INDEX ON public.documents    (org_id);
CREATE INDEX ON public.documents    (workspace_id);
CREATE INDEX ON public.chunks       (document_id);
CREATE INDEX ON public.chunks       (org_id);
CREATE INDEX ON public.chunks       (workspace_id);
CREATE INDEX ON public.chunks       (qdrant_id);
CREATE INDEX ON public.queries      (workspace_id);
CREATE INDEX ON public.queries      (org_id);
CREATE INDEX ON public.queries      (user_id);
CREATE INDEX ON public.briefs       (query_id);
CREATE INDEX ON public.briefs       (org_id);
CREATE INDEX ON public.briefs       (workspace_id);
CREATE INDEX ON public.decisions    (brief_id);
CREATE INDEX ON public.decisions    (org_id);
CREATE INDEX ON public.decisions    (workspace_id);

-- =============================================================================
-- Row Level Security
-- =============================================================================

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orgs: members can read own org"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (id = public.auth_user_org_id());

CREATE POLICY "orgs: admins can update own org"
  ON public.organizations FOR UPDATE
  TO authenticated
  USING (id = public.auth_user_org_id() AND public.auth_user_role() = 'admin')
  WITH CHECK (id = public.auth_user_org_id());

-- INSERT is intentionally omitted — orgs are created via service role during
-- onboarding so that org_id can be set before the user profile is written.

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Members can read everyone in their org.
-- auth_user_org_id() is SECURITY DEFINER so it bypasses RLS on this table,
-- preventing infinite recursion.
CREATE POLICY "users: read same-org members"
  ON public.users FOR SELECT
  TO authenticated
  USING (org_id = public.auth_user_org_id());

-- A new user can insert only their own profile row.
CREATE POLICY "users: insert own profile"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Users can update their own row; admins can update anyone in the org.
CREATE POLICY "users: update self or admin"
  ON public.users FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
    OR (org_id = public.auth_user_org_id() AND public.auth_user_role() = 'admin')
  )
  WITH CHECK (org_id = public.auth_user_org_id());

-- Only admins can remove users from the org.
CREATE POLICY "users: admins can delete"
  ON public.users FOR DELETE
  TO authenticated
  USING (org_id = public.auth_user_org_id() AND public.auth_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- Macro: all remaining tables use the same four-policy pattern scoped to org_id
-- ---------------------------------------------------------------------------

-- workspaces
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspaces: org read"   ON public.workspaces FOR SELECT TO authenticated USING (org_id = public.auth_user_org_id());
CREATE POLICY "workspaces: org insert" ON public.workspaces FOR INSERT TO authenticated WITH CHECK (org_id = public.auth_user_org_id());
CREATE POLICY "workspaces: org update" ON public.workspaces FOR UPDATE TO authenticated USING (org_id = public.auth_user_org_id()) WITH CHECK (org_id = public.auth_user_org_id());
CREATE POLICY "workspaces: org delete" ON public.workspaces FOR DELETE TO authenticated USING (org_id = public.auth_user_org_id());

-- sources
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sources: org read"   ON public.sources FOR SELECT TO authenticated USING (org_id = public.auth_user_org_id());
CREATE POLICY "sources: org insert" ON public.sources FOR INSERT TO authenticated WITH CHECK (org_id = public.auth_user_org_id());
CREATE POLICY "sources: org update" ON public.sources FOR UPDATE TO authenticated USING (org_id = public.auth_user_org_id()) WITH CHECK (org_id = public.auth_user_org_id());
CREATE POLICY "sources: org delete" ON public.sources FOR DELETE TO authenticated USING (org_id = public.auth_user_org_id());

-- documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documents: org read"   ON public.documents FOR SELECT TO authenticated USING (org_id = public.auth_user_org_id());
CREATE POLICY "documents: org insert" ON public.documents FOR INSERT TO authenticated WITH CHECK (org_id = public.auth_user_org_id());
CREATE POLICY "documents: org update" ON public.documents FOR UPDATE TO authenticated USING (org_id = public.auth_user_org_id()) WITH CHECK (org_id = public.auth_user_org_id());
CREATE POLICY "documents: org delete" ON public.documents FOR DELETE TO authenticated USING (org_id = public.auth_user_org_id());

-- chunks
ALTER TABLE public.chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chunks: org read"   ON public.chunks FOR SELECT TO authenticated USING (org_id = public.auth_user_org_id());
CREATE POLICY "chunks: org insert" ON public.chunks FOR INSERT TO authenticated WITH CHECK (org_id = public.auth_user_org_id());
CREATE POLICY "chunks: org update" ON public.chunks FOR UPDATE TO authenticated USING (org_id = public.auth_user_org_id()) WITH CHECK (org_id = public.auth_user_org_id());
CREATE POLICY "chunks: org delete" ON public.chunks FOR DELETE TO authenticated USING (org_id = public.auth_user_org_id());

-- queries
ALTER TABLE public.queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "queries: org read"   ON public.queries FOR SELECT TO authenticated USING (org_id = public.auth_user_org_id());
CREATE POLICY "queries: org insert" ON public.queries FOR INSERT TO authenticated WITH CHECK (org_id = public.auth_user_org_id());
CREATE POLICY "queries: org update" ON public.queries FOR UPDATE TO authenticated USING (org_id = public.auth_user_org_id()) WITH CHECK (org_id = public.auth_user_org_id());
CREATE POLICY "queries: org delete" ON public.queries FOR DELETE TO authenticated USING (org_id = public.auth_user_org_id());

-- briefs
ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "briefs: org read"   ON public.briefs FOR SELECT TO authenticated USING (org_id = public.auth_user_org_id());
CREATE POLICY "briefs: org insert" ON public.briefs FOR INSERT TO authenticated WITH CHECK (org_id = public.auth_user_org_id());
CREATE POLICY "briefs: org update" ON public.briefs FOR UPDATE TO authenticated USING (org_id = public.auth_user_org_id()) WITH CHECK (org_id = public.auth_user_org_id());
CREATE POLICY "briefs: org delete" ON public.briefs FOR DELETE TO authenticated USING (org_id = public.auth_user_org_id());

-- decisions
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "decisions: org read"   ON public.decisions FOR SELECT TO authenticated USING (org_id = public.auth_user_org_id());
CREATE POLICY "decisions: org insert" ON public.decisions FOR INSERT TO authenticated WITH CHECK (org_id = public.auth_user_org_id());
CREATE POLICY "decisions: org update" ON public.decisions FOR UPDATE TO authenticated USING (org_id = public.auth_user_org_id()) WITH CHECK (org_id = public.auth_user_org_id());
CREATE POLICY "decisions: org delete" ON public.decisions FOR DELETE TO authenticated USING (org_id = public.auth_user_org_id());
