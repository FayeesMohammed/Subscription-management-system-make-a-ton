-- Create roles and databases
CREATE DATABASE brightloop_test;

-- App role for runtime API: NOT superuser, NOBYPASSRLS
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'brightloop_app') THEN
    CREATE ROLE brightloop_app WITH LOGIN PASSWORD 'brightloop_app_pass' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
END
$$;

-- Grant permissions in brightloop
\c brightloop;
GRANT USAGE, CREATE ON SCHEMA public TO brightloop_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO brightloop_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO brightloop_app;

-- Grant permissions in brightloop_test
\c brightloop_test;
GRANT USAGE, CREATE ON SCHEMA public TO brightloop_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO brightloop_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO brightloop_app;
