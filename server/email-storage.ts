import { GeneratedEmail, SendJob } from "@shared/schema";
import { randomUUID } from "crypto";

// ─── In-Memory Email Storage ──────────────────────────────────────────────────

class EmailStorage {
  // Gmail config stored per session (not persisted — cleared on restart)
  private gmailConfig: { user: string; pass: string } | null = null;

  // Active/completed send jobs
  private jobs: Map<string, SendJob> = new Map();

  // All-time sent email records (cumulative log)
  private sentRecords: GeneratedEmail[] = [];

  // ── Gmail Config ────────────────────────────────────────────────────────────

  setGmailConfig(user: string, pass: string) {
    this.gmailConfig = { user, pass };
  }

  getGmailConfig() {
    return this.gmailConfig;
  }

  clearGmailConfig() {
    this.gmailConfig = null;
  }

  // ── Jobs ────────────────────────────────────────────────────────────────────

  createJob(emails: GeneratedEmail[]): SendJob {
    const id = randomUUID();
    const job: SendJob = {
      id,
      total: emails.length,
      sent: 0,
      failed: 0,
      skipped: 0,
      isRunning: true,
      startedAt: new Date().toISOString(),
      emails: emails.map(e => ({ ...e, status: "pending" })),
    };
    this.jobs.set(id, job);
    return job;
  }

  getJob(id: string): SendJob | undefined {
    return this.jobs.get(id);
  }

  updateEmailInJob(jobId: string, emailId: string, update: Partial<GeneratedEmail>) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.emails = job.emails.map(e => (e.id === emailId ? { ...e, ...update } : e));

    // Recalculate counters
    job.sent = job.emails.filter(e => e.status === "sent").length;
    job.failed = job.emails.filter(e => e.status === "failed").length;
    job.skipped = job.emails.filter(e => e.status === "skipped").length;

    this.jobs.set(jobId, job);
  }

  completeJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    job.isRunning = false;
    job.completedAt = new Date().toISOString();
    this.jobs.set(jobId, job);
  }

  getAllJobs(): SendJob[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  // ── Sent Records ────────────────────────────────────────────────────────────

  addSentRecord(email: GeneratedEmail) {
    this.sentRecords.unshift(email);
  }

  getSentRecords(): GeneratedEmail[] {
    return this.sentRecords;
  }

  getSentRecordStats() {
    const total = this.sentRecords.length;
    const sent = this.sentRecords.filter(e => e.status === "sent").length;
    const failed = this.sentRecords.filter(e => e.status === "failed").length;
    const skipped = this.sentRecords.filter(e => e.status === "skipped").length;
    return { total, sent, failed, skipped };
  }
}

export const emailStorage = new EmailStorage();
