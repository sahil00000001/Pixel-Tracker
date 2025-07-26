import { z } from "zod";

// Enhanced tracking data structure with duration tracking
export interface TrackingPixel {
  id: string;
  createdAt: Date;
  openedAt: Date | null;
  opened: boolean;
  lastSeenAt: Date | null;
  totalViewTime: number; // Total time in milliseconds
  viewCount: number; // Number of times viewed
  metadata?: any;
}

export type InsertTrackingPixel = Omit<TrackingPixel, 'id' | 'createdAt' | 'opened' | 'totalViewTime' | 'viewCount' | 'lastSeenAt'>;
