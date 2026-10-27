# Runbook P1 — Clear shown with missing evidence

**Severity:** SEV1

## Detect
- Metric `shield_verdict_clear_with_missing_evidence_total` > 0 pages on-call.
- `shield_audit_chain_verified` drops.

## Contain
1. Flip kill switch `public.verdicts.floor_inconclusive` for the affected cell.
2. Enter SAFE_HALT for public verdicts (mode controller).
3. Stop new policy activations.

## Communicate
- Tell affected users: "Please treat the earlier result as 'We can't tell'."
- Notify partner banks via `system.mode.changed` webhook.

## Recover
1. Identify the offending code path / policy version from the audit chain.
2. Fix + regression test + re-gate via `shield-eval gate check`.
3. Re-verify the audit chain (`bun run audit:verify`).
4. Two-person sign-off to exit SAFE_HALT.

## Learn
- Blameless review within 5 working days.
- Append root cause and fix to this runbook.