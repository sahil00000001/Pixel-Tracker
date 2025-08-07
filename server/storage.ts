import { type TrackingPixel, type InsertTrackingPixel } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Tracking pixel operations
  createTrackingPixel(pixel: InsertTrackingPixel): Promise<TrackingPixel>;
  getTrackingPixel(id: string): Promise<TrackingPixel | undefined>;
  markPixelAsOpened(id: string, ipAddress: string, userAgent: string): Promise<TrackingPixel | undefined>;
  recordDurationPing(pixelId: string, sessionId: string, timestamp: number): Promise<TrackingPixel | undefined>;
  endSession(pixelId: string, sessionId: string): Promise<TrackingPixel | undefined>;
  getAllTrackingPixels(): Promise<TrackingPixel[]>;
  getStats(): Promise<{
    totalPixels: number;
    openedPixels: number;
    realOpens: number;
    openRate: number;
    realOpenRate: number;
    avgViewTime: number;
    totalViewTime: number;
    activeSessionsCount: number;
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
      realOpens: 0,
      ipAddresses: [],
      userAgents: [],
      sessionData: {},
      isDurationTracking: false,
      ...insertPixel,
    };
    this.trackingPixels.set(id, pixel);
    return pixel;
  }

  async getTrackingPixel(id: string): Promise<TrackingPixel | undefined> {
    return this.trackingPixels.get(id);
  }

  async markPixelAsOpened(id: string, ipAddress: string, userAgent: string): Promise<TrackingPixel | undefined> {
    const pixel = this.trackingPixels.get(id);
    if (!pixel) return undefined;
    
    const now = new Date();
    let additionalViewTime = 0;
    
    // Enhanced bot/prefetch detection
    const isLikelyBot = this.isLikelyBot(userAgent);
    const isNewIP = !pixel.ipAddresses.includes(ipAddress);
    const isNewUserAgent = !pixel.userAgents.includes(userAgent);
    
    // Calculate additional view time if this is a repeat view
    if (pixel.lastSeenAt) {
      const timeSinceLastSeen = now.getTime() - pixel.lastSeenAt.getTime();
      // Only count as continuous viewing if less than 30 seconds gap
      if (timeSinceLastSeen < 30000) {
        additionalViewTime = timeSinceLastSeen;
      }
    }
    
    // Track unique IPs and user agents
    if (isNewIP) pixel.ipAddresses.push(ipAddress);
    if (isNewUserAgent) pixel.userAgents.push(userAgent);
    
    // Count as real open if: new IP, not a bot, and reasonable user agent
    const isRealOpen = isNewIP && !isLikelyBot && this.isReasonableUserAgent(userAgent);
    
    const updatedPixel = {
      ...pixel,
      opened: true,
      openedAt: pixel.openedAt || now, // Keep original open time
      lastSeenAt: now,
      totalViewTime: pixel.totalViewTime + additionalViewTime,
      viewCount: pixel.viewCount + 1,
      realOpens: pixel.realOpens + (isRealOpen ? 1 : 0),
    };
    
    this.trackingPixels.set(id, updatedPixel);
    console.log(`Pixel ${id}: viewCount=${updatedPixel.viewCount}, realOpens=${updatedPixel.realOpens}, isBot=${isLikelyBot}, IP=${ipAddress}`);
    return updatedPixel;
  }

  private isLikelyBot(userAgent: string): boolean {
    const botPatterns = [
      /bot/i, /crawl/i, /spider/i, /scan/i, /monitor/i, 
      /google/i, /bing/i, /yahoo/i, /facebook/i, /twitter/i,
      /preload/i, /prefetch/i, /preview/i, /proxy/i,
      /feed/i, /rss/i, /index/i, /archive/i,
      /mailcheck/i, /mailgun/i, /sendgrid/i, /postfix/i,
      /curl/i, /wget/i, /http/i, /python/i, /java/i, /node/i
    ];
    return botPatterns.some(pattern => pattern.test(userAgent));
  }
  
  private isReasonableUserAgent(userAgent: string): boolean {
    // Must contain browser indicators
    const browserPatterns = [
      /Mozilla/i, /Chrome/i, /Safari/i, /Firefox/i, /Edge/i, /Opera/i,
      /iPhone/i, /Android/i, /iPad/i, /Macintosh/i, /Windows/i
    ];
    return browserPatterns.some(pattern => pattern.test(userAgent)) && userAgent.length > 20;
  }

  async recordDurationPing(pixelId: string, sessionId: string, timestamp: number): Promise<TrackingPixel | undefined> {
    const pixel = this.trackingPixels.get(pixelId);
    if (!pixel) return undefined;
    
    const now = new Date(timestamp);
    let sessionData = pixel.sessionData[sessionId];
    
    if (!sessionData) {
      // New session
      sessionData = {
        startTime: now,
        lastPing: now,
        duration: 0,
        isActive: true
      };
    } else {
      // Update existing session
      const timeSinceLastPing = now.getTime() - sessionData.lastPing.getTime();
      
      // Only count if ping is within reasonable time (max 10 seconds gap)
      if (timeSinceLastPing <= 10000) {
        sessionData.duration += timeSinceLastPing;
        sessionData.lastPing = now;
        sessionData.isActive = true;
      } else {
        // Gap too large, mark as inactive but don't reset
        sessionData.isActive = false;
      }
    }
    
    const updatedPixel = {
      ...pixel,
      sessionData: {
        ...pixel.sessionData,
        [sessionId]: sessionData
      },
      isDurationTracking: true,
      lastSeenAt: now
    };
    
    this.trackingPixels.set(pixelId, updatedPixel);
    return updatedPixel;
  }

  async endSession(pixelId: string, sessionId: string): Promise<TrackingPixel | undefined> {
    const pixel = this.trackingPixels.get(pixelId);
    if (!pixel || !pixel.sessionData[sessionId]) return undefined;
    
    const sessionData = pixel.sessionData[sessionId];
    sessionData.isActive = false;
    
    // Add session duration to total view time
    const updatedPixel = {
      ...pixel,
      totalViewTime: pixel.totalViewTime + sessionData.duration,
      sessionData: {
        ...pixel.sessionData,
        [sessionId]: sessionData
      }
    };
    
    this.trackingPixels.set(pixelId, updatedPixel);
    console.log(`Session ${sessionId} ended for pixel ${pixelId}. Duration: ${sessionData.duration}ms`);
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
    realOpens: number;
    openRate: number;
    realOpenRate: number;
    avgViewTime: number;
    totalViewTime: number;
    activeSessionsCount: number;
  }> {
    const pixels = Array.from(this.trackingPixels.values());
    const totalPixels = pixels.length;
    const openedPixels = pixels.filter(p => p.opened).length;
    const totalRealOpens = pixels.reduce((sum, p) => sum + p.realOpens, 0);
    
    const openRate = totalPixels > 0 ? Math.round((openedPixels / totalPixels) * 100) : 0;
    const realOpenRate = totalPixels > 0 ? Math.round((totalRealOpens / totalPixels) * 100) : 0;
    
    // Calculate total view time including active sessions
    let totalViewTime = 0;
    let activeSessionsCount = 0;
    
    pixels.forEach(pixel => {
      totalViewTime += pixel.totalViewTime;
      
      // Add duration from active sessions
      Object.values(pixel.sessionData).forEach(session => {
        if (session.isActive) {
          activeSessionsCount++;
          totalViewTime += session.duration;
        }
      });
    });
    
    const avgViewTime = totalRealOpens > 0 ? Math.round(totalViewTime / totalRealOpens) : 0;
    
    return { 
      totalPixels, 
      openedPixels, 
      realOpens: totalRealOpens,
      openRate, 
      realOpenRate,
      avgViewTime, 
      totalViewTime,
      activeSessionsCount
    };
  }
}

export const storage = new MemStorage();
