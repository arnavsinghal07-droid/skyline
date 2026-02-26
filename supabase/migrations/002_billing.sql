-- =============================================================================
-- PM Copilot — Billing Schema (Phase 3)
-- =============================================================================
-- Adds billing fields to organizations and creates webhook idempotency table.
-- The `plan` and `stripe_customer_id` columns already exist from 001_initial_schema.sql.

-- ---------------------------------------------------------------------------
-- Add billing columns to organizations
-- ---------------------------------------------------------------------------
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS briefs_used_this_period INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS briefs_period_start TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- Webhook idempotency table
-- ---------------------------------------------------------------------------
-- Tracks processed Stripe webhook event IDs to prevent duplicate processing.
-- Only written/read by the service-role client in the webhook handler.
-- No RLS needed — service role bypasses RLS.
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     TEXT        NOT NULL UNIQUE,
  event_type   TEXT        NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast dedup lookups (UNIQUE already creates an index, but being explicit)
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_id
  ON public.stripe_webhook_events (event_id);
