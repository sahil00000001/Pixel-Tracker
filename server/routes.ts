import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
        
        // Serve as HTML with basic styling for better readability
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Email Tracking API Documentation</title>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, system-ui, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
        code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; font-size: 0.9em; }
        h1, h2, h3 { color: #333; }
        h1 { border-bottom: 2px solid #007cba; padding-bottom: 10px; }
        h2 { border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        table { border-collapse: collapse; width: 100%; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f9f9f9; }
    </style>
</head>
<body>
    <pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
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

      const baseUrl = process.env.REPLIT_DOMAINS 
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : process.env.BASE_URL || "http://localhost:5000";

      res.json({
        id: pixel.id,
        trackingUrl: `${baseUrl}/api/pixel/${pixel.id}`,
        embedCode: `<img src="${baseUrl}/api/pixel/${pixel.id}" width="1" height="1" style="display:none;" />`,
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
      
      // Mark pixel as opened
      await storage.markPixelAsOpened(id);
      console.log(`Pixel opened: ${id} at ${new Date().toISOString()}`);
      
      // Return 1x1 transparent GIF
      res.setHeader("Content-Type", "image/gif");
      res.setHeader("Content-Length", TRACKING_PIXEL.length);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.send(TRACKING_PIXEL);
    } catch (error) {
      console.error("Error tracking pixel:", error);
      // Still return the pixel even if tracking fails
      res.setHeader("Content-Type", "image/gif");
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
      });
    } catch (error) {
      console.error("Error checking pixel status:", error);
      res.status(500).json({ message: "Failed to check pixel status" });
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
