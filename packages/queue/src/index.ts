// Message-queue facade over pg-boss.
// Shield uses a transactional outbox: the event is written in the same
// transaction as the state change. pg-boss delivers it asynchronously.
//
// Queue names and shedding order are defined in the platform spec (02, §11).

export const QUEUES = {
  whatsappIngest: "whatsapp.ingest",
  audioFetch: "audio.fetch",
  audioDetect: "audio.detect",
  verdictCompose: "verdict.compose",
  notifySend: "notify.send",
  webhookDeliver: "webhook.deliver",
  webhookUrgent: "webhook.urgent",
  reputationRecompute: "reputation.recompute",
  wavesCluster: "waves.cluster",
  telcoSubscriptionRenew: "telco.subscription.renew",
  retentionPurge: "retention.purge",
  integrityVerify: "integrity.verify",
  kbSync: "kb.sync",
  evalRun: "eval.run",
  policyBacktest: "policy.backtest",
  evidencePack: "evidence.pack",
  archiveCold: "archive.cold",
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

// Never shed (P0): verdict.compose, notify.send, retention.purge, integrity.verify, webhook.urgent
export const NEVER_SHED: QueueName[] = [
  QUEUES.verdictCompose,
  QUEUES.notifySend,
  QUEUES.retentionPurge,
  QUEUES.integrityVerify,
  QUEUES.webhookUrgent,
];

// Shedding order under load, first to go (02, §11):
export const SHED_ORDER: QueueName[] = [
  QUEUES.archiveCold,
  QUEUES.evalRun,
  QUEUES.kbSync,
  QUEUES.policyBacktest,
  QUEUES.wavesCluster,
  QUEUES.reputationRecompute,
];