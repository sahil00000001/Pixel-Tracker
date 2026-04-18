import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { emailStorage } from "./email-storage";
import { generateEmails, injectTrackingPixel } from "./email-generator";
import { durationPingSchema } from "@shared/schema";
import type { LinkedInPost, GeneratedEmail } from "@shared/schema";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

// 1x1 transparent GIF as base64
const TRACKING_PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function registerRoutes(app: Express): Promise<Server> {

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

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

  // ═══════════════════════════════════════════════════════════════════════════
  // JOB APPLICATION EMAIL ROUTES
  // ═══════════════════════════════════════════════════════════════════════════

  // POST: Save Gmail credentials (in-memory only, never persisted to disk)
  app.post("/api/emails/config", (req, res) => {
    const { gmailUser, gmailPass } = req.body;
    if (!gmailUser || !gmailPass) {
      return res.status(400).json({ message: "gmailUser and gmailPass are required" });
    }
    emailStorage.setGmailConfig(gmailUser.trim(), gmailPass.trim());
    res.json({ success: true, message: "Gmail credentials saved in memory" });
  });

  // POST: Test Gmail connection
  app.post("/api/emails/test-connection", async (req, res) => {
    const { gmailUser, gmailPass } = req.body;
    if (!gmailUser || !gmailPass) {
      return res.status(400).json({ message: "gmailUser and gmailPass are required" });
    }
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser.trim(), pass: gmailPass.trim() },
      });
      await transporter.verify();
      emailStorage.setGmailConfig(gmailUser.trim(), gmailPass.trim());
      res.json({ success: true, message: "Gmail connection verified successfully" });
    } catch (err: any) {
      res.status(400).json({ success: false, message: parseGmailError(err.message || "Connection failed") });
    }
  });

  // POST: Send a test email to yourself so you can see how it looks
  app.post("/api/emails/send-test", async (req, res) => {
    const { gmailUser, gmailPass } = req.body;
    if (!gmailUser || !gmailPass) {
      return res.status(400).json({ message: "gmailUser and gmailPass are required" });
    }
    try {
      const testPost: LinkedInPost = {
        name: "Test Recruiter",
        emails: [gmailUser.trim()],
        tech_stack: ["python", "aws", "docker", "langchain", "react"],
        post_text:
          "🚀 Hiring: AI/ML Full Stack Engineer\n\nTechCorp AI is looking for a talented engineer to join our team!\n\n📍 Location: Bangalore (Hybrid)\n💼 Experience: 1-3 Years\n\n🔧 Required: Python, LangChain, RAG, AWS, React, Docker\n\n📩 Apply: " +
          gmailUser.trim() +
          "\n\n#Hiring #AIEngineer",
      };
      const [testEmail] = generateEmails([testPost], gmailUser.trim());
      if (!testEmail) {
        return res.status(500).json({ message: "Failed to generate test email" });
      }

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser.trim(), pass: gmailPass.trim() },
      });

      await transporter.sendMail({
        from: `"Sahil Vashisht" <${gmailUser.trim()}>`,
        to: gmailUser.trim(),
        replyTo: gmailUser.trim(),
        subject: `[TEST PREVIEW] ${testEmail.subject}`,
        html: testEmail.html,
      });

      res.json({ success: true, message: `Test email sent to ${gmailUser.trim()} — check your inbox` });
    } catch (err: any) {
      res.status(400).json({ success: false, message: parseGmailError(err.message || "Test send failed") });
    }
  });

  // POST: Generate emails from LinkedIn JSON data
  app.post("/api/emails/generate", (req, res) => {
    try {
      const { posts, fromEmail } = req.body as { posts: LinkedInPost[]; fromEmail: string };
      if (!posts || !Array.isArray(posts)) {
        return res.status(400).json({ message: "posts array is required" });
      }
      const emails = generateEmails(posts, fromEmail || "vashishtsahil99@gmail.com");
      res.json({ emails, total: emails.length });
    } catch (err: any) {
      console.error("Error generating emails:", err);
      res.status(500).json({ message: err.message || "Failed to generate emails" });
    }
  });

  // POST: Start sending email queue (non-blocking — returns jobId immediately)
  app.post("/api/emails/send", async (req, res) => {
    try {
      const {
        emails,
        gmailUser,
        gmailPass,
        delayMs = 8000,
      } = req.body as {
        emails: GeneratedEmail[];
        gmailUser: string;
        gmailPass: string;
        delayMs: number;
      };

      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({ message: "emails array is required" });
      }
      if (!gmailUser || !gmailPass) {
        return res.status(400).json({ message: "gmailUser and gmailPass are required" });
      }

      const job = emailStorage.createJob(emails);

      // Resolve base URL for tracking pixel
      let baseUrl = "http://localhost:5000";
      if (process.env.REPLIT_DOMAINS) {
        baseUrl = `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`;
      } else if (process.env.RENDER_EXTERNAL_URL) {
        baseUrl = process.env.RENDER_EXTERNAL_URL;
      } else if (req.headers["x-forwarded-proto"] && req.headers.host) {
        baseUrl = `${req.headers["x-forwarded-proto"]}://${req.headers.host}`;
      } else if (req.headers.host && process.env.NODE_ENV === "production") {
        baseUrl = `https://${req.headers.host}`;
      }

      // Process queue in background
      processEmailQueue(job.id, job.emails, gmailUser, gmailPass, delayMs, baseUrl).catch(
        (err) => console.error("Queue error:", err)
      );

      res.json({ jobId: job.id, total: job.total });
    } catch (err: any) {
      console.error("Error starting send job:", err);
      res.status(500).json({ message: err.message || "Failed to start send job" });
    }
  });

  // GET: Poll job status
  app.get("/api/emails/job/:id", (req, res) => {
    const job = emailStorage.getJob(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  });

  // GET: All sent email records (enriched with pixel open tracking data)
  app.get("/api/emails/records", async (req, res) => {
    try {
      const records = emailStorage.getSentRecords();

      const enriched = await Promise.all(
        records.map(async (record) => {
          if (!record.trackingPixelId) return { ...record, pixelData: null };
          try {
            const pixel = await storage.getTrackingPixel(record.trackingPixelId);
            if (!pixel) return { ...record, pixelData: null };
            return {
              ...record,
              pixelData: {
                opened: pixel.opened,
                openedAt: pixel.openedAt ? pixel.openedAt.toISOString() : null,
                viewCount: pixel.viewCount,
                realOpens: pixel.realOpens,
                totalViewTimeMs: pixel.totalViewTime,
              },
            };
          } catch {
            return { ...record, pixelData: null };
          }
        })
      );

      res.json({
        records: enriched,
        stats: emailStorage.getSentRecordStats(),
      });
    } catch (err: any) {
      res.status(500).json({ message: "Failed to fetch records" });
    }
  });

  // GET: All jobs list
  app.get("/api/emails/jobs", (req, res) => {
    res.json(emailStorage.getAllJobs());
  });

  const httpServer = createServer(app);
  return httpServer;
}

// ─── Gmail Error Parser ───────────────────────────────────────────────────────

function parseGmailError(raw: string): string {
  if (/Username and Password not accepted|InvalidLogin|534-5\.7/i.test(raw))
    return "Invalid App Password. Make sure 2-Step Verification is ON and you generated an App Password at myaccount.google.com/apppasswords.";
  if (/535-5\.7|authentication failed/i.test(raw))
    return "Gmail authentication failed. Check the App Password is correct and hasn't been revoked.";
  if (/454|too many login/i.test(raw))
    return "Too many login attempts. Wait 1–2 minutes and try again.";
  if (/550|relay access denied/i.test(raw))
    return "Gmail rejected the message. Verify your App Password and account settings.";
  if (/ETIMEDOUT|ECONNREFUSED|ENOTFOUND/i.test(raw))
    return "Connection failed. Check your internet connection.";
  if (/Daily sending quota exceeded/i.test(raw))
    return "Gmail daily sending limit reached (500 emails). Try again tomorrow.";
  return raw;
}

// ─── Background Email Queue Processor ────────────────────────────────────────

async function processEmailQueue(
  jobId: string,
  emails: GeneratedEmail[],
  gmailUser: string,
  gmailPass: string,
  delayMs: number,
  baseUrl: string
) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
    pool: true,         // reuse SMTP connection across emails
    maxConnections: 1,  // Gmail allows 1 concurrent connection
  });

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];

    if (email.status === "skipped") {
      emailStorage.updateEmailInJob(jobId, email.id, { status: "skipped" });
      emailStorage.addSentRecord({ ...email, status: "skipped" });
      continue;
    }

    // Create tracking pixel — non-fatal if it fails
    let htmlToSend = email.html;
    let pixelId: string | undefined;
    try {
      const { storage } = await import("./storage");
      const pixel = await storage.createTrackingPixel({
        openedAt: null,
        metadata: { emailId: email.id, to: email.to, company: email.company, role: email.role },
      });
      pixelId = pixel.id;
      htmlToSend = injectTrackingPixel(email.html, `${baseUrl}/api/pixel/${pixel.id}`);
      emailStorage.updateEmailInJob(jobId, email.id, { trackingPixelId: pixel.id });
    } catch {
      // Non-fatal
    }

    try {
      await transporter.sendMail({
        from: `"Sahil Vashisht" <${gmailUser}>`,
        to: email.to,
        replyTo: gmailUser,
        subject: email.subject,
        html: htmlToSend,
        headers: {
          "X-Mailer": "Job-Application-Sender/1.0",
          "Precedence": "bulk",
        },
      });

      const now = new Date().toISOString();
      emailStorage.updateEmailInJob(jobId, email.id, {
        status: "sent",
        sentAt: now,
        trackingPixelId: pixelId,
      });
      emailStorage.addSentRecord({ ...email, status: "sent", sentAt: now, trackingPixelId: pixelId });
      console.log(`[Email ${i + 1}/${emails.length}] Sent → ${email.to}`);
    } catch (err: any) {
      const errorMsg = parseGmailError(err.message || "Send failed");
      emailStorage.updateEmailInJob(jobId, email.id, { status: "failed", error: errorMsg });
      emailStorage.addSentRecord({ ...email, status: "failed", error: errorMsg });
      console.error(`[Email ${i + 1}/${emails.length}] Failed → ${email.to}: ${errorMsg}`);
    }

    // Gmail SMTP rate-limit compliance: wait between sends, skip delay after last email
    if (i < emails.length - 1) {
      await new Promise((r) => setTimeout(r, Math.max(delayMs, 5000)));
    }
  }

  transporter.close();
  emailStorage.completeJob(jobId);
  console.log(`[Email] Job ${jobId} complete.`);
}
