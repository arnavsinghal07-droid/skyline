-- =============================================================================
-- Sightline — Waitlist Schema (Phase 4)
-- =============================================================================
-- Creates the waitlist table for capturing pre-launch email signups.
-- All access is via the service-role client (admin) — anon/authenticated roles
-- have no policies on this table. This is intentional: visitors are unauthenticated
-- and we do not want them reading or modifying waitlist data.

-- ---------------------------------------------------------------------------
-- Waitlist table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.waitlist (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS — service role bypasses it, anon/authenticated have no policies
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT/UPDATE/DELETE policies for anon or authenticated roles.
-- All writes go through the service-role client in the API route.
-- This prevents visitors from reading the waitlist or inserting duplicates
-- through the Supabase client directly.
