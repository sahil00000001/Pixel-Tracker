import { z } from "zod";

// Enhanced tracking data structure with advanced anti-cache and duration tracking
export interface TrackingPixel {
  id: string;
  createdAt: Date;
  openedAt: Date | null;
  opened: boolean;
  lastSeenAt: Date | null;
  totalViewTime: number; // Total time in milliseconds
  viewCount: number; // Number of times viewed
  realOpens: number; // Genuine human opens (filtered from prefetch/cache)
  ipAddresses: string[]; // Track unique IPs to detect real users
  userAgents: string[]; // Track user agents to filter bots/prefetch
  sessionData: { [sessionId: string]: { 
    startTime: Date; 
    lastPing: Date; 
    duration: number; 
    isActive: boolean;
  }};
  isDurationTracking: boolean; // Whether this pixel supports duration tracking
  metadata?: any;
}

export type InsertTrackingPixel = Omit<TrackingPixel, 'id' | 'createdAt' | 'opened' | 'totalViewTime' | 'viewCount' | 'lastSeenAt' | 'realOpens' | 'ipAddresses' | 'userAgents' | 'sessionData' | 'isDurationTracking'>;

// Schema for duration tracking pings
export const durationPingSchema = z.object({
  pixelId: z.string(),
  sessionId: z.string(),
  timestamp: z.number(),
});

export type DurationPing = z.infer<typeof durationPingSchema>;

// ─── Job Application Email Types ────────────────────────────────────────────

export interface LinkedInPost {
  name: string;
  headline?: string;
  profile_url?: string;
  emails: string[];
  phones?: string[];
  tech_stack?: string[];
  post_text: string;
}

export type EmailStatus = 'pending' | 'sent' | 'failed' | 'skipped';

export interface GeneratedEmail {
  id: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  recruiter: string;
  role: string;
  company: string;
  categories: string[];
  status: EmailStatus;
  sentAt?: string;
  error?: string;
  trackingPixelId?: string;
}

export interface SendJob {
  id: string;
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  isRunning: boolean;
  startedAt: string;
  completedAt?: string;
  emails: GeneratedEmail[];
}
