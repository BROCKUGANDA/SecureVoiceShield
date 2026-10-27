# Runbook — Telco API outage

**Severity:** SEV2 (per operator)

## Detect
- `shield_telco_unknown_ratio{provider}` > 20% for 5 min.
- Breaker opens.

## Contain
1. Mode controller sets TELCO_DEGRADED for that operator.
2. SIM and forwarding signals return `unknown`.
3. `otp-guard` returns `step_up` above the tenant's amount threshold.

## Communicate
- Status page update; `system.mode.changed` webhook to affected tenants.
- Public banner: "We couldn't check the SIM card right now."

## Recover
- Automatic exit after 30 min healthy.
- If persistent, disable the operator adapter (`telco.{operator}.enabled=false`) and fall back to per-transaction `assess`.