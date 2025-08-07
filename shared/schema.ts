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
