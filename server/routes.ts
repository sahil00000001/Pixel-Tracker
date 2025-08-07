import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { durationPingSchema } from "@shared/schema";
import fs from "fs";
import path from "path";

// 1x1 transparent GIF as base64
const TRACKING_PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function registerRoutes(app: Express): Promise<Server> {
  
  // GET: Serve API documentation
  app.get("/api-docs", (req, res) => {
    try {
      const docsPath = path.join(process.cwd(), "API_DOCUMENTATION.md");
      if (fs.existsSync(docsPath)) {
        const content = fs.readFileSync(docsPath, "utf8");
        
        // Enhanced HTML with modern styling and markdown-like formatting
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <title>📧 Email Tracking API Documentation</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
            line-height: 1.7;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        .header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            margin-bottom: 30px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .header h1 {
            font-size: 3rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 15px;
            font-weight: 800;
        }
        
        .header p {
            font-size: 1.2rem;
            color: #666;
            margin-bottom: 20px;
        }
        
        .nav-tabs {
            display: flex;
            gap: 10px;
            margin-top: 20px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .nav-tab {
            padding: 10px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: 600;
            text-decoration: none;
            display: inline-block;
        }
        
        .nav-tab:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        
        .content {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .doc-content {
            white-space: pre-wrap;
            font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', monospace;
            font-size: 14px;
            line-height: 1.6;
            color: #2d3748;
        }
        
        /* Code highlighting */
        .doc-content {
            background: #1a202c;
            color: #e2e8f0;
            padding: 30px;
            border-radius: 15px;
            overflow-x: auto;
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        /* Scroll styling */
        ::-webkit-scrollbar { width: 12px; }
        ::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.1); border-radius: 6px; }
        ::-webkit-scrollbar-thumb { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 6px;
        }
        ::-webkit-scrollbar-thumb:hover { background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%); }
        
        .footer {
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            color: rgba(255, 255, 255, 0.9);
        }
        
        .status-badge {
            display: inline-block;
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 600;
            margin-left: 10px;
        }
        
        @media (max-width: 768px) {
            .container { padding: 20px 15px; }
            .header, .content { padding: 25px; }
            .header h1 { font-size: 2rem; }
            .nav-tabs { gap: 5px; }
            .nav-tab { padding: 8px 15px; font-size: 0.9rem; }
        }
        
        /* Animation */
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .header, .content, .footer { animation: fadeInUp 0.6s ease-out; }
        .content { animation-delay: 0.2s; }
        .footer { animation-delay: 0.4s; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📧 Email Tracking API</h1>
            <p>Advanced email open tracking with anti-ghost technology and duration analytics</p>
            <span class="status-badge">Production Ready</span>
            
            <div class="nav-tabs">
                <a href="#quick-start" class="nav-tab">🚀 Quick Start</a>
                <a href="#endpoints" class="nav-tab">🔗 Endpoints</a>
                <a href="#examples" class="nav-tab">💻 Examples</a>
                <a href="#advanced" class="nav-tab">⚡ Advanced</a>
            </div>
        </div>
        
        <div class="content">
            <div class="doc-content">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>
        
        <div class="footer">
            <p>🛡️ Enterprise-grade email tracking with bot detection and real-time analytics</p>
            <p style="margin-top: 10px; font-size: 0.9rem; opacity: 0.8;">
                DEVELOPED BY Sahil Vashisht (Software Developer) | 
                <a href="/" style="color: rgba(255,255,255,0.9);">← Back to Dashboard</a>
            </p>
        </div>
    </div>
    
    <script>
        // Smooth scrolling for navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target.getAttribute('href');
                if (target.startsWith('#')) {
                    const element = document.querySelector(target);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        });
        
        // Add copy functionality to code blocks
        document.addEventListener('DOMContentLoaded', () => {
            console.log('📧 Email Tracking API Documentation Loaded');
        });
    </script>
</body>
</html>`;
        
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.send(htmlContent);
      } else {
        res.status(404).send("API documentation not found");
      }
    } catch (error) {
      console.error("Error serving API docs:", error);
      res.status(500).send("Error loading API documentation");
    }
  });
  
  // GET: Create unique tracking pixel ID
  app.get("/api/pixel/create", async (req, res) => {
    try {
      const { metadata } = req.query;
      
      const pixel = await storage.createTrackingPixel({
        openedAt: null,
        metadata: metadata ? JSON.parse(metadata as string) : null,
      });

      // Determine base URL from various hosting environments
      let baseUrl = "http://localhost:5000"; // fallback
      
      if (process.env.REPLIT_DOMAINS) {
        // Replit environment
        baseUrl = `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`;
      } else if (process.env.RENDER_EXTERNAL_URL) {
        // Render.com environment
        baseUrl = process.env.RENDER_EXTERNAL_URL;
      } else if (process.env.VERCEL_URL) {
        // Vercel environment
        baseUrl = `https://${process.env.VERCEL_URL}`;
      } else if (process.env.RAILWAY_STATIC_URL) {
        // Railway environment
        baseUrl = process.env.RAILWAY_STATIC_URL;
      } else if (process.env.BASE_URL) {
        // Custom base URL
        baseUrl = process.env.BASE_URL;
      } else if (req.headers.host && req.headers['x-forwarded-proto']) {
        // Generic reverse proxy detection
        baseUrl = `${req.headers['x-forwarded-proto']}://${req.headers.host}`;
      } else if (req.headers.host && process.env.NODE_ENV === 'production') {
        // Production environment with host header
        baseUrl = `https://${req.headers.host}`;
      }

      res.json({
        id: pixel.id,
        trackingUrl: `${baseUrl}/api/pixel/${pixel.id}`,
        embedCode: `<img src="${baseUrl}/api/pixel/${pixel.id}" width="1" height="1" style="display:none;" />`,
        advancedEmbedCode: `
<div style="display:none;">
  <img src="${baseUrl}/api/pixel/${pixel.id}" width="1" height="1" onload="initDurationTracking('${pixel.id}', '${baseUrl}')" />
  <script>
  function initDurationTracking(pixelId, baseUrl) {
    const sessionId = Math.random().toString(36).substring(2, 15);
    let isActive = true;
    let startTime = Date.now();
    
    // Ping every 2 seconds while active
    const pingInterval = setInterval(() => {
      if (!isActive) return;
      
      fetch(baseUrl + '/api/pixel/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pixelId: pixelId,
          sessionId: sessionId,
          timestamp: Date.now()
        })
      }).catch(() => {}); // Silent fail
    }, 2000);
    
    // End session on page unload
    window.addEventListener('beforeunload', () => {
      isActive = false;
      navigator.sendBeacon(baseUrl + '/api/pixel/end', JSON.stringify({
        pixelId: pixelId,
        sessionId: sessionId
      }));
    });
    
    // End session on visibility change (email client focus loss)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        isActive = false;
        clearInterval(pingInterval);
        fetch(baseUrl + '/api/pixel/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pixelId: pixelId,
            sessionId: sessionId
          })
        }).catch(() => {});
      }
    });
  }
  </script>
</div>`,
        createdAt: pixel.createdAt,
      });
    } catch (error) {
      console.error("Error creating tracking pixel:", error);
      res.status(500).json({ message: "Failed to create tracking pixel" });
    }
  });

  // GET: Track pixel open (returns 1x1 GIF)
  app.get("/api/pixel/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Extract client information for bot detection
      const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      
      // Mark pixel as opened with enhanced tracking
      await storage.markPixelAsOpened(id, ipAddress, userAgent);
      console.log(`Pixel opened: ${id} at ${new Date().toISOString()}`);
      
      // Return 1x1 transparent GIF with anti-cache headers
      res.setHeader("Content-Type", "image/gif");
      res.setHeader("Content-Length", TRACKING_PIXEL.length);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, private, max-age=0");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "Thu, 01 Jan 1970 00:00:00 GMT");
      res.setHeader("Last-Modified", new Date().toUTCString());
      res.setHeader("ETag", `"${Date.now()}-${Math.random()}"`);
      res.send(TRACKING_PIXEL);
    } catch (error) {
      console.error("Error tracking pixel:", error);
      // Still return the pixel even if tracking fails
      res.setHeader("Content-Type", "image/gif");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.send(TRACKING_PIXEL);
    }
  });

  // POST: Check if pixel was opened
  app.post("/api/pixel/check", async (req, res) => {
    try {
      const { id } = req.body;
      
      if (!id) {
        return res.status(400).json({ message: "Pixel ID is required" });
      }

      const pixel = await storage.getTrackingPixel(id);
      
      if (!pixel) {
        return res.status(404).json({ 
          opened: false, 
          message: "Pixel not found" 
        });
      }

      res.json({
        opened: pixel.opened,
        openedAt: pixel.openedAt,
        createdAt: pixel.createdAt,
        lastSeenAt: pixel.lastSeenAt,
        totalViewTime: pixel.totalViewTime,
        viewCount: pixel.viewCount,
        realOpens: pixel.realOpens,
        isDurationTracking: pixel.isDurationTracking,
        activeSessionsCount: Object.values(pixel.sessionData).filter(s => s.isActive).length,
      });
    } catch (error) {
      console.error("Error checking pixel status:", error);
      res.status(500).json({ message: "Failed to check pixel status" });
    }
  });

  // POST: Duration tracking ping
  app.post("/api/pixel/ping", async (req, res) => {
    try {
      const result = durationPingSchema.safeParse(req.body);
      
      if (!result.success) {
        console.log("Invalid ping data:", req.body);
        return res.status(400).json({ message: "Invalid ping data" });
      }
      
      const { pixelId, sessionId, timestamp } = result.data;
      const updatedPixel = await storage.recordDurationPing(pixelId, sessionId, timestamp);
      
      if (!updatedPixel) {
        console.log(`Ping failed: pixel ${pixelId} not found`);
        return res.status(404).json({ message: "Pixel not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error recording duration ping:", error);
      res.status(500).json({ message: "Failed to record ping" });
    }
  });

  // POST: End tracking session
  app.post("/api/pixel/end", async (req, res) => {
    try {
      let pixelId, sessionId, duration;
      
      // Handle both JSON and URL-encoded data (for sendBeacon compatibility)
      if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
        pixelId = req.body.pixelId;
        sessionId = req.body.sessionId;
        duration = parseInt(req.body.duration) || 0;
      } else {
        ({ pixelId, sessionId, duration = 0 } = req.body);
      }
      
      if (!pixelId || !sessionId) {
        console.log("Missing required fields:", req.body);
        return res.status(400).json({ message: "Pixel ID and session ID are required" });
      }
      
      const updatedPixel = await storage.endSessionWithDuration(pixelId, sessionId, duration);
      
      if (!updatedPixel) {
        console.log(`End session failed: pixel ${pixelId} or session ${sessionId} not found`);
        return res.status(404).json({ message: "Pixel or session not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error ending session:", error);
      res.status(500).json({ message: "Failed to end session" });
    }
  });

  // GET: Dashboard stats and pixel list
  app.get("/api/dashboard", async (req, res) => {
    try {
      const stats = await storage.getStats();
      const pixels = await storage.getAllTrackingPixels();
      
      res.json({
        stats,
        recentPixels: pixels.slice(0, 20), // Show last 20 pixels
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
