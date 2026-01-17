-- ============================================
-- 32 - USER LOGIN EVENTS TABLE (METRICS)
-- ============================================
-- EJECUTAR EN SUPABASE SQL EDITOR
--
-- Creates table to track user login events for metrics.
-- Endpoints will use COUNT(DISTINCT user_id) to get unique users.
--

-- =====================
-- TABLE: user_login_events
-- =====================

CREATE TABLE IF NOT EXISTS public.user_login_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('parent', 'child')),
  source text NOT NULL DEFAULT 'web'
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS user_login_events_created_at_idx
  ON public.user_login_events (created_at DESC);

CREATE INDEX IF NOT EXISTS user_login_events_user_id_idx
  ON public.user_login_events (user_id);

CREATE INDEX IF NOT EXISTS user_login_events_role_idx
  ON public.user_login_events (role);

-- Composite index for date range + role queries
CREATE INDEX IF NOT EXISTS user_login_events_created_at_role_idx
  ON public.user_login_events (created_at DESC, role);

-- =====================
-- RLS: Enable but restrict to service role only
-- =====================

ALTER TABLE public.user_login_events ENABLE ROW LEVEL SECURITY;

-- No policies for authenticated/anon - only service role can access
-- Service role bypasses RLS automatically

-- =====================
-- RPC FUNCTION: metrics_unique_logins
-- =====================

CREATE OR REPLACE FUNCTION public.metrics_unique_logins(
  from_ts timestamptz,
  to_ts timestamptz
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  result := json_build_object(
    'unique_users_total', (
      SELECT COUNT(DISTINCT user_id)
      FROM public.user_login_events
      WHERE created_at >= from_ts AND created_at < to_ts
    ),
    'unique_users_by_role', (
      SELECT COALESCE(json_agg(json_build_object('role', role, 'unique_users', unique_users)), '[]'::json)
      FROM (
        SELECT role, COUNT(DISTINCT user_id) as unique_users
        FROM public.user_login_events
        WHERE created_at >= from_ts AND created_at < to_ts
        GROUP BY role
        ORDER BY role
      ) t
    ),
    'unique_users_by_day', (
      SELECT COALESCE(json_agg(json_build_object('date', day::text, 'unique_users', unique_users)), '[]'::json)
      FROM (
        SELECT date_trunc('day', created_at)::date as day,
               COUNT(DISTINCT user_id) as unique_users
        FROM public.user_login_events
        WHERE created_at >= from_ts AND created_at < to_ts
        GROUP BY day
        ORDER BY day
      ) d
    )
  );

  RETURN result;
END;
$$;

-- Grant execute to service role (implicit, but explicit for clarity)
GRANT EXECUTE ON FUNCTION public.metrics_unique_logins(timestamptz, timestamptz) TO service_role;
