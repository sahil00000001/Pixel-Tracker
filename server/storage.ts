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
    
    // Clean up stale sessions every 30 seconds
    setInterval(() => {
      this.cleanupStaleSessions();
    }, 30000);
  }

  private cleanupStaleSessions() {
    const now = new Date();
    let cleanupCount = 0;
    
    this.trackingPixels.forEach((pixel, pixelId) => {
      Object.entries(pixel.sessionData).forEach(([sessionId, session]) => {
        if (session.isActive) {
          const timeSinceLastPing = now.getTime() - session.lastPing.getTime();
          
          // If no ping for more than 30 seconds, end the session
          if (timeSinceLastPing > 30000) {
            console.log(`Auto-ending stale session ${sessionId} for pixel ${pixelId} (${Math.round(timeSinceLastPing / 1000)}s since last ping)`);
            this.endSession(pixelId, sessionId);
            cleanupCount++;
          }
        }
      });
    });
    
    if (cleanupCount > 0) {
      console.log(`Cleaned up ${cleanupCount} stale sessions`);
    }
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
      // New session - record start time
      sessionData = {
        startTime: now,
        lastPing: now,
        duration: 0,
        isActive: true
      };
      console.log(`New session started: ${sessionId} for pixel ${pixelId} at ${now.toISOString()}`);
    } else {
      // Update existing session
      const timeSinceLastPing = now.getTime() - sessionData.lastPing.getTime();
      
      // Only count as active if ping is within reasonable time (max 10 seconds gap)
      if (timeSinceLastPing <= 10000) {
        // Calculate total duration from start time to current ping
        sessionData.duration = now.getTime() - sessionData.startTime.getTime();
        sessionData.lastPing = now;
        sessionData.isActive = true;
        console.log(`Session ping: ${sessionId} - duration now ${Math.round(sessionData.duration / 1000)}s`);
      } else {
        // Gap too large, mark as inactive but don't reset duration
        sessionData.isActive = false;
        console.log(`Session ${sessionId} marked inactive due to large gap: ${timeSinceLastPing}ms`);
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
    const now = new Date();
    
    // Calculate final duration if session is still active
    if (sessionData.isActive && sessionData.startTime) {
      sessionData.duration = now.getTime() - sessionData.startTime.getTime();
    }
    
    sessionData.isActive = false;
    
    // Add session duration to total view time
    const finalDuration = sessionData.duration;
    const updatedPixel = {
      ...pixel,
      totalViewTime: pixel.totalViewTime + finalDuration,
      sessionData: {
        ...pixel.sessionData,
        [sessionId]: sessionData
      }
    };
    
    this.trackingPixels.set(pixelId, updatedPixel);
    console.log(`Session ${sessionId} ended for pixel ${pixelId}. Final duration: ${Math.round(finalDuration / 1000)}s (${finalDuration}ms). Total view time now: ${Math.round(updatedPixel.totalViewTime / 1000)}s`);
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
      
      // Add duration from active sessions and count them
      Object.values(pixel.sessionData).forEach(session => {
        if (session.isActive) {
          activeSessionsCount++;
          // For active sessions, calculate current duration from start time
          const currentDuration = new Date().getTime() - session.startTime.getTime();
          totalViewTime += currentDuration;
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
