import { type TrackingPixel, type InsertTrackingPixel } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Tracking pixel operations
  createTrackingPixel(pixel: InsertTrackingPixel): Promise<TrackingPixel>;
  getTrackingPixel(id: string): Promise<TrackingPixel | undefined>;
  markPixelAsOpened(id: string): Promise<TrackingPixel | undefined>;
  getAllTrackingPixels(): Promise<TrackingPixel[]>;
  getStats(): Promise<{
    totalPixels: number;
    openedPixels: number;
    openRate: number;
    avgViewTime: number;
    totalViewTime: number;
  }>;
}

export class MemStorage implements IStorage {
  private trackingPixels: Map<string, TrackingPixel>;

  constructor() {
    this.trackingPixels = new Map();
  }

  async createTrackingPixel(insertPixel: InsertTrackingPixel): Promise<TrackingPixel> {
    const id = randomUUID();
    const pixel: TrackingPixel = {
      id,
      createdAt: new Date(),
      opened: false,
      lastSeenAt: null,
      totalViewTime: 0,
      viewCount: 0,
      ...insertPixel,
    };
    this.trackingPixels.set(id, pixel);
    return pixel;
  }

  async getTrackingPixel(id: string): Promise<TrackingPixel | undefined> {
    return this.trackingPixels.get(id);
  }

  async markPixelAsOpened(id: string): Promise<TrackingPixel | undefined> {
    const pixel = this.trackingPixels.get(id);
    if (!pixel) return undefined;
    
    const now = new Date();
    let additionalViewTime = 0;
    
    // Calculate additional view time if this is a repeat view
    if (pixel.lastSeenAt) {
      const timeSinceLastSeen = now.getTime() - pixel.lastSeenAt.getTime();
      // Only count as continuous viewing if less than 30 seconds gap
      if (timeSinceLastSeen < 30000) {
        additionalViewTime = timeSinceLastSeen;
      }
    }
    
    const updatedPixel = {
      ...pixel,
      opened: true,
      openedAt: pixel.openedAt || now, // Keep original open time
      lastSeenAt: now,
      totalViewTime: pixel.totalViewTime + additionalViewTime,
      viewCount: pixel.viewCount + 1,
    };
    
    this.trackingPixels.set(id, updatedPixel);
    return updatedPixel;
  }

  async getAllTrackingPixels(): Promise<TrackingPixel[]> {
    return Array.from(this.trackingPixels.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getStats(): Promise<{
    totalPixels: number;
    openedPixels: number;
    openRate: number;
    avgViewTime: number;
    totalViewTime: number;
  }> {
    const pixels = Array.from(this.trackingPixels.values());
    const totalPixels = pixels.length;
    const openedPixels = pixels.filter(p => p.opened).length;
    const openRate = totalPixels > 0 ? Math.round((openedPixels / totalPixels) * 100) : 0;
    
    const totalViewTime = pixels.reduce((sum, p) => sum + p.totalViewTime, 0);
    const avgViewTime = openedPixels > 0 ? Math.round(totalViewTime / openedPixels) : 0;
    
    return { totalPixels, openedPixels, openRate, avgViewTime, totalViewTime };
  }
}

export const storage = new MemStorage();
