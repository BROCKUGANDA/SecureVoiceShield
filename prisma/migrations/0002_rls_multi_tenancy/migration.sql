-- Row-Level Security for multi-tenancy (12, section 17).
-- Every tenant-scoped table has a tenant_id column and an RLS policy.
-- The app sets `app.current_tenant` via SET LOCAL before each query.

-- Add tenant_id to Decision (already in schema as tenantId)
ALTER TABLE "Decision" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- RLS on Decision
ALTER TABLE "Decision" ENABLE ROW LEVEL SECURITY;
CREATE POLICY decision_tenant_isolation ON "Decision"
  USING ("tenantId" = current_setting('app.current_tenant', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant', true));

-- RLS on AuditEntry (cell-scoped, not tenant-scoped; readable by all tenants in cell)
ALTER TABLE "AuditEntry" ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_cell_isolation ON "AuditEntry"
  USING ("cell" = current_setting('app.current_cell', true));

-- RLS on Outcome
ALTER TABLE "Outcome" ENABLE ROW LEVEL SECURITY;
CREATE POLICY outcome_tenant_isolation ON "Outcome"
  USING ("tenantId" = current_setting('app.current_tenant', true));

-- RLS on EvidencePack
ALTER TABLE "EvidencePack" ENABLE ROW LEVEL SECURITY;
CREATE POLICY evidence_tenant_isolation ON "EvidencePack"
  USING ("tenantId" = current_setting('app.current_tenant', true));

-- RLS on Tenant (self-read only)
ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_self_read ON "Tenant"
  USING ("id" = current_setting('app.current_tenant', true));

-- Bypass for service role (Shield Core internal operations)
-- In production, the service role has BYPASSRLS; app role does not.