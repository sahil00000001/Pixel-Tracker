import { LinkedInPost, GeneratedEmail } from "@shared/schema";
import { randomUUID } from "crypto";

// ─── Sahil's Profile ─────────────────────────────────────────────────────────

const PROFILE = {
  name: "Sahil Vashisht",
  email: "vashishtsahil99@gmail.com",
  phone: "+91-9625107920",
  linkedin: "https://linkedin.com/in/sahilvashisht",
  github: "https://github.com/SahilVashisht",
  location: "Bangalore, India",
  resumeUrl:
    "https://drive.google.com/file/d/1he4m09ON2dm9s7tcDYX5VQ9G8NcCAP1j/view?usp=sharing",
  experience: "1.6 Years",
  currentCTC: "6 LPA",
  expectedCTC: "10–12 LPA (Negotiable)",
  noticePeriod: "15 Days",
  cgpa: "8.47",
  college: "GTBIT, New Delhi (2024)",
};

// ─── Certifications ───────────────────────────────────────────────────────────

interface Cert {
  name: string;
  issuer: string;
  type: "ai" | "devops" | "process" | "data";
}

const ALL_CERTS: Cert[] = [
  { name: "Tata GenAI-Powered Data Analytics Simulation", issuer: "Forage, 2025", type: "ai" },
  { name: "Introduction to Generative AI", issuer: "Google", type: "ai" },
  { name: "Introduction to Large Language Models", issuer: "Google", type: "ai" },
  { name: "AWS Cloud Practitioner Essentials", issuer: "AWS Training & Certification, 2025", type: "devops" },
  { name: "Microsoft Azure Fundamentals AZ-900 Challenge", issuer: "Microsoft", type: "devops" },
  { name: "Camunda Knowledge Badge (BPMN & DMN)", issuer: "Credly, 2025", type: "process" },
  { name: "Six Sigma White Belt Certification", issuer: "", type: "process" },
  { name: "Introduction to SQL", issuer: "Google Developer Program", type: "data" },
];

// ─── Category Detection ───────────────────────────────────────────────────────

export function detectCategories(postText: string, techStack: string[]): string[] {
  const text = (postText + " " + techStack.join(" ")).toLowerCase();
  const cats = new Set<string>();

  if (
    /\b(gen[\s-]?ai|llm|agentic|rag|langchain|llamaindex|openai|claude api|gemini|prompt\s*engin|vector\s*(db|database)|langgraph|autogen|crewai|mlops|langraph)\b/.test(text) ||
    /\b(ai[\s/]?ml|machine\s*learning|deep\s*learning|nlp|bert|gpt|transformers)\b/.test(text)
  ) cats.add("ai");

  if (/\b(python|fastapi|django|flask)\b/.test(text)) cats.add("python");

  // Java: check carefully — "javascript" should NOT trigger this
  const techStr = techStack.join(" ").toLowerCase();
  if (/\bjava\b/.test(techStr) || /\bspring[\s-]*(boot|mvc)\b/.test(text)) cats.add("java");

  if (/\b(asp\.net|aspnet|\.net\s*(core|8|7|6)?|dotnet|c#)\b/.test(text)) cats.add("dotnet");

  if (/\b(node\.?js|express\.?js|nestjs)\b/.test(text)) cats.add("node");

  if (/\b(react|angular|vue|next\.?js|frontend|front[\s-]end)\b/.test(text)) cats.add("frontend");

  if (
    /\b(aws|azure|gcp|google\s*cloud|docker|kubernetes|k8s|ci\/cd|terraform|pulumi|devops|cloud\s*engineer|cloud\s*infra|cloudformation|iac)\b/.test(text)
  ) cats.add("devops");

  if (/\b(full[\s-]?stack|mern|mean)\b/.test(text)) cats.add("fullstack");

  if (/\bbackend\b/.test(text)) cats.add("backend");

  if (/\bmicro[\s-]?services?\b/.test(text)) cats.add("microservices");

  if (/\b(sde[\s-]?\d?|software\s*(development\s*)?engineer)\b/.test(text)) cats.add("sde");

  return Array.from(cats);
}

// ─── Role Title Extractor ─────────────────────────────────────────────────────

// Strip all emoji/symbol unicode blocks from a string
function stripEmoji(s: string): string {
  return s
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, "")   // Misc symbols, emoticons, transport, etc.
    .replace(/[\u{2600}-\u{27BF}]/gu, "")       // Misc symbols, Dingbats
    .replace(/[\u{FE00}-\u{FEFF}]/gu, "")       // Variation selectors
    .replace(/[\u{200B}-\u{200F}]/gu, "")       // Zero-width chars
    .trim();
}

function extractRoleTitle(postText: string): string {
  // Normalise em/en dashes so the regex always matches
  const text = postText.replace(/\u2014|\u2013|\u2012/g, "-");

  const patterns = [
    /hiring[:\s]+([A-Za-z][^!\n\r#@]+?)(?:\s*[-]|\s*\n|\s*\()/i,
    /we['']?re\s+hiring[:\s]+([A-Za-z][^!\n\r#@]+?)(?:\s*[-]|\s*\n|\s*\()/i,
    /position[:\s]+([A-Za-z][^!\n\r#@]+?)(?:\s*[-]|\s*\n)/i,
    /role[:\s]+([A-Za-z][^!\n\r#@]+?)(?:\s*[-]|\s*\n)/i,
    /opening[:\s]+([A-Za-z][^!\n\r#@]+?)(?:\s*[-]|\s*\n)/i,
  ];

  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      return stripEmoji(m[1])
        .replace(/#+\w+/g, "")
        .trim();
    }
  }

  // Fallback: first non-emoji line
  const firstLine = stripEmoji(postText.split("\n")[0])
    .replace(/#+\w+/g, "")
    .replace(/hiring[:\s]*/i, "")
    .trim();
  return firstLine || "Software Developer";
}

// ─── Company Extractor ────────────────────────────────────────────────────────

function extractCompany(postText: string, email: string): string {
  // Try to find company in post text
  const patterns = [
    /(?:at|join|@)\s+([A-Z][A-Za-z0-9\s.&]+?)(?:\s+is|\s+are|\s+needs|\s+looking|\.|,|\n)/,
    /^([A-Z][A-Za-z0-9\s.&]+?)\s+is\s+(?:hiring|looking|expanding|building)/im,
  ];

  for (const re of patterns) {
    const m = postText.match(re);
    if (m && m[1].length < 40) return m[1].trim();
  }

  // Fallback to email domain
  const domainMatch = email.match(/@([^.]+)/);
  if (domainMatch) {
    const domain = domainMatch[1];
    if (!["gmail", "yahoo", "outlook", "hotmail"].includes(domain)) {
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    }
  }

  return "Your Company";
}

// ─── Recruiter Name Extractor ─────────────────────────────────────────────────

function extractRecruiterFirstName(name: string): string {
  if (!name || name.trim().toLowerCase() === "hiring manager") return "";
  // Take everything before first comma, then first word
  const beforeComma = name.split(",")[0].trim();
  const firstName = beforeComma.split(" ")[0];
  return firstName.charAt(0).toUpperCase() + firstName.slice(1);
}

// ─── Subject Line Generator ───────────────────────────────────────────────────

export function generateSubject(roleTitle: string, categories: string[]): string {
  const has = (c: string) => categories.includes(c);

  let skillMatch: string;

  if (has("ai") && has("python"))
    skillMatch = "Python + Agentic AI — Google & AWS Certified";
  else if (has("ai") && (has("fullstack") || has("frontend")))
    skillMatch = "AI Full Stack — Agentic AI + Cloud";
  else if (has("ai"))
    skillMatch = "Agentic AI + Full Stack — Google & AWS Certified";
  else if (has("dotnet"))
    skillMatch = "ASP.NET Core + React + Cloud Certified";
  else if (has("java"))
    skillMatch = "Java Spring Boot + React";
  else if (has("python") && has("devops"))
    skillMatch = "Python Backend + Cloud — AWS Certified";
  else if (has("python"))
    skillMatch = "Python Backend + Cloud";
  else if (has("devops"))
    skillMatch = "DevOps + Cloud — AWS & Azure Certified";
  else if (has("sde"))
    skillMatch = "SDE — Full Stack + AI Certified";
  else if (has("frontend"))
    skillMatch = "React + TypeScript";
  else
    skillMatch = "Full Stack Developer — AI & Cloud Certified";

  return `Application: ${roleTitle} | 1.6 YOE | ${skillMatch}`;
}

// ─── Role Description (header tagline) ───────────────────────────────────────

function getRoleDescription(categories: string[]): string {
  const has = (c: string) => categories.includes(c);

  if (has("ai") && has("python")) return "Python & Agentic AI Developer";
  if (has("ai") && (has("fullstack") || has("frontend"))) return "AI-Powered Full Stack Developer";
  if (has("ai")) return "Agentic AI & Full Stack Developer";
  if (has("dotnet") && (has("frontend") || has("fullstack"))) return "ASP.NET Core + React Full Stack Developer";
  if (has("dotnet")) return "ASP.NET Core Backend Developer";
  if (has("java") && has("microservices")) return "Java Spring Boot Microservices Developer";
  if (has("java")) return "Java Spring Boot Backend Developer";
  if (has("python") && has("devops")) return "Python Backend + Cloud Engineer";
  if (has("python")) return "Python Backend Developer";
  if (has("devops")) return "DevOps & Cloud Engineer";
  if (has("fullstack")) return "Full Stack Developer (MERN / TypeScript)";
  if (has("frontend")) return "React + TypeScript Frontend Engineer";
  if (has("microservices")) return "Microservices & Backend Developer";
  if (has("sde")) return "Full Stack Software Engineer";
  return "Full Stack Developer";
}

// ─── Opening Paragraph ────────────────────────────────────────────────────────

function getSkillMatchLine(categories: string[]): string {
  const has = (c: string) => categories.includes(c);

  if (has("ai")) return "AI/ML, agentic workflows, LLM integration, and full stack development";
  if (has("dotnet")) return "ASP.NET Core backend development, React frontends, and cloud deployment";
  if (has("java") && has("microservices")) return "Java Spring Boot development and microservices architecture";
  if (has("java")) return "Java Spring Boot backend development";
  if (has("python") && has("devops")) return "Python backend development, automation, and cloud infrastructure";
  if (has("python")) return "Python backend development and AI automation";
  if (has("devops")) return "cloud infrastructure, CI/CD pipelines, and DevOps practices";
  if (has("fullstack")) return "full stack development with MERN, TypeScript, and cloud services";
  if (has("frontend")) return "React + TypeScript frontend development and REST API integration";
  if (has("microservices")) return "microservices architecture, distributed systems, and backend development";
  return "full stack development, REST API design, and cloud deployment";
}

// ─── Skills Block ─────────────────────────────────────────────────────────────

interface Skill {
  name: string;
  detail: string;
}

function buildSkillsList(categories: string[]): Skill[] {
  const has = (c: string) => categories.includes(c);
  const skills: Skill[] = [];

  skills.push({ name: "Full Stack Development", detail: "1.6 Years — Production-grade APIs & web applications" });

  if (has("ai"))
    skills.push({ name: "AI, Agentic AI & GenAI", detail: "9/10 — LLM integration (GPT-4/Claude), agent workflows, RAG pipelines, prompt engineering" });
  if (has("python"))
    skills.push({ name: "Python AI/ML & Automation", detail: "9/10 — FastAPI, async processing, ML pipeline integration, data automation" });
  if (has("dotnet"))
    skills.push({ name: "ASP.NET Core 8 & MVC", detail: "9/10 — Web API, C#, Entity Framework Core, RESTful design" });
  if (has("java"))
    skills.push({ name: "Java & Spring Boot", detail: "8/10 — Spring MVC, Spring Boot REST APIs, JPA/Hibernate" });
  if (has("node"))
    skills.push({ name: "Node.js & Express / NestJS", detail: "9/10 — REST APIs, middleware, async patterns" });
  if (has("frontend") || has("fullstack"))
    skills.push({ name: "Frontend — React + TypeScript + Redux", detail: "8.5/10 — Next.js, hooks, context, state management, Tailwind CSS" });
  if (has("devops"))
    skills.push({ name: "Cloud AWS / Azure", detail: "7.5/10 — EC2, Lambda, App Service, AKS, Docker, CI/CD pipelines" });
  if (has("microservices"))
    skills.push({ name: "Microservices & System Design", detail: "8/10 — CQRS, event-driven, API gateway, Kafka, distributed patterns" });
  if (has("sde"))
    skills.push({ name: "Problem Solving & DSA", detail: "8.5/10 — Competitive programming, algorithmic thinking" });

  skills.push({ name: "Databases — SQL / NoSQL", detail: "7/10 — PostgreSQL, MongoDB, Redis, query optimization" });

  return skills;
}

// ─── Certifications Block ─────────────────────────────────────────────────────

function getSortedCerts(categories: string[]): Cert[] {
  const has = (c: string) => categories.includes(c);
  const certs = [...ALL_CERTS];

  if (has("ai")) {
    certs.sort((a, b) => (a.type === "ai" ? -1 : b.type === "ai" ? 1 : 0));
  } else if (has("devops")) {
    certs.sort((a, b) => (a.type === "devops" ? -1 : b.type === "devops" ? 1 : 0));
  } else if (has("backend") || has("java") || has("dotnet") || has("python")) {
    certs.sort((a, b) => {
      const priority = (t: string) => (t === "devops" ? 0 : t === "process" ? 1 : 2);
      return priority(a.type) - priority(b.type);
    });
  }

  return certs;
}

// ─── HTML Email Builder ───────────────────────────────────────────────────────

function buildSkillsHTML(skills: Skill[]): string {
  return `
  <table cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
    ${skills
      .map(
        (s, i) => `
    <tr style="background:${i % 2 === 0 ? "#ffffff" : "#f8fafc"};">
      <td style="padding:10px 14px;font-size:14px;color:#1e293b;border-bottom:1px solid #f1f5f9;width:38%;">
        <span style="display:inline-block;width:8px;height:8px;background:#0a66c2;border-radius:2px;margin-right:9px;vertical-align:middle;"></span>
        <strong>${s.name}</strong>
      </td>
      <td style="padding:10px 14px;font-size:13px;color:#64748b;border-bottom:1px solid #f1f5f9;">${s.detail}</td>
    </tr>`
      )
      .join("")}
  </table>`;
}

function buildCertsHTML(certs: Cert[]): string {
  return `
  <table cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;">
    ${certs
      .map(
        (c, i) => `
    <tr style="background:${i % 2 === 0 ? "#ffffff" : "#f8fafc"};">
      <td style="padding:8px 6px;font-size:14px;color:#1e293b;border-bottom:1px solid #f1f5f9;">
        <span style="color:#16a34a;font-weight:700;margin-right:8px;">✓</span>
        ${c.name}${c.issuer ? ` <span style="color:#94a3b8;font-size:12px;">— ${c.issuer}</span>` : ""}
      </td>
    </tr>`
      )
      .join("")}
  </table>`;
}

function buildEmailHTML(params: {
  recruiterName: string;
  roleTitle: string;
  roleDescription: string;
  company: string;
  openingSkillLine: string;
  skillsHTML: string;
  certsHTML: string;
}): string {
  const { recruiterName, roleTitle, roleDescription, company, openingSkillLine, skillsHTML, certsHTML } = params;

  const greeting = recruiterName ? `Dear ${recruiterName},` : "Dear Hiring Manager,";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application: ${roleTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f1f5f9;">
  <tr>
    <td align="center" style="padding:20px 10px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="640" style="max-width:640px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#0a66c2 0%,#004fa3 100%);padding:36px 32px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">${PROFILE.name}</h1>
            <p style="color:#cce5ff;margin:10px 0 0;font-size:15px;font-weight:500;">${roleDescription}</p>
            <p style="color:#a8d4ff;margin:12px 0 0;font-size:13px;">
              <span style="background:rgba(255,255,255,0.15);padding:4px 14px;border-radius:20px;display:inline-block;margin:2px;">1.6 Years</span>
              &nbsp;&middot;&nbsp;
              <span style="background:rgba(255,255,255,0.15);padding:4px 14px;border-radius:20px;display:inline-block;margin:2px;">8x Certified</span>
              &nbsp;&middot;&nbsp;
              <span style="background:rgba(34,197,94,0.35);color:#86efac;padding:4px 14px;border-radius:20px;display:inline-block;margin:2px;">&#10003; 15 Days Notice</span>
            </p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:32px 32px 24px;">

            <!-- Greeting -->
            <p style="font-size:16px;color:#1e293b;margin:0 0 18px;font-weight:500;">${greeting}</p>

            <!-- Opening -->
            <p style="font-size:15px;color:#334155;line-height:1.75;margin:0 0 26px;">
              I am writing to express my strong interest in the <strong style="color:#0a66c2;">${roleTitle}</strong> position at <strong>${company}</strong>. With ${PROFILE.experience} of hands-on experience in ${openingSkillLine}, I am confident that my background aligns closely with what you are looking for.
            </p>

            <!-- Quick Snapshot -->
            <table cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;margin:0 0 26px;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
              <tr style="background:#0a66c2;">
                <td colspan="4" style="padding:10px 16px;">
                  <span style="color:#ffffff;font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">Quick Snapshot</span>
                </td>
              </tr>
              <tr>
                <td style="padding:11px 16px;background:#f8fafc;font-size:12px;color:#64748b;font-weight:700;width:22%;border-bottom:1px solid #e2e8f0;text-transform:uppercase;letter-spacing:0.5px;">Experience</td>
                <td style="padding:11px 16px;font-size:14px;color:#1e293b;font-weight:600;width:28%;border-bottom:1px solid #e2e8f0;">1.6 Years</td>
                <td style="padding:11px 16px;background:#f8fafc;font-size:12px;color:#64748b;font-weight:700;width:22%;border-bottom:1px solid #e2e8f0;text-transform:uppercase;letter-spacing:0.5px;">Current CTC</td>
                <td style="padding:11px 16px;font-size:14px;color:#1e293b;font-weight:600;width:28%;border-bottom:1px solid #e2e8f0;">6 LPA</td>
              </tr>
              <tr>
                <td style="padding:11px 16px;background:#f8fafc;font-size:12px;color:#64748b;font-weight:700;border-bottom:1px solid #e2e8f0;text-transform:uppercase;letter-spacing:0.5px;">Expected CTC</td>
                <td style="padding:11px 16px;font-size:14px;color:#1e293b;font-weight:600;border-bottom:1px solid #e2e8f0;">10–12 LPA (Negotiable)</td>
                <td style="padding:11px 16px;background:#f0fdf4;font-size:12px;color:#166534;font-weight:700;border-bottom:1px solid #e2e8f0;text-transform:uppercase;letter-spacing:0.5px;">Notice Period</td>
                <td style="padding:11px 16px;font-size:14px;color:#16a34a;font-weight:700;background:#f0fdf4;border-bottom:1px solid #e2e8f0;">&#10003; 15 Days</td>
              </tr>
              <tr>
                <td style="padding:11px 16px;background:#f8fafc;font-size:12px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Location</td>
                <td colspan="3" style="padding:11px 16px;font-size:14px;color:#1e293b;font-weight:600;">Bangalore, India &nbsp;<span style="color:#64748b;font-size:13px;">(Open to Remote / Relocation)</span></td>
              </tr>
            </table>

            <!-- Skills -->
            <div style="margin:0 0 26px;">
              <p style="font-size:12px;font-weight:700;color:#0a66c2;text-transform:uppercase;letter-spacing:1.2px;margin:0 0 12px;padding-bottom:8px;border-bottom:2px solid #dbeafe;">Skills &amp; Expertise</p>
              ${skillsHTML}
            </div>

            <!-- Achievements -->
            <div style="margin:0 0 26px;background:#f8fafc;border-left:4px solid #0a66c2;padding:18px 20px;border-radius:0 8px 8px 0;">
              <p style="font-size:12px;font-weight:700;color:#0a66c2;text-transform:uppercase;letter-spacing:1.2px;margin:0 0 12px;">Key Achievements</p>
              <ul style="margin:0;padding:0 0 0 18px;color:#334155;font-size:14px;line-height:1.9;">
                <li>Led WLS enterprise integration project at PodTech — managed team of 5, 100% on-time delivery</li>
                <li>Architected 35+ production-ready RESTful APIs across ASP.NET Core &amp; Spring Boot</li>
                <li>Reduced API response times by 20% and data processing time by 35%</li>
                <li>B.Tech IT — CGPA: ${PROFILE.cgpa} — ${PROFILE.college}</li>
              </ul>
            </div>

            <!-- Work Experience -->
            <div style="margin:0 0 26px;">
              <p style="font-size:12px;font-weight:700;color:#0a66c2;text-transform:uppercase;letter-spacing:1.2px;margin:0 0 12px;padding-bottom:8px;border-bottom:2px solid #dbeafe;">Work Experience</p>
              <table cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
                <tr style="background:#f8fafc;">
                  <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;">
                    <strong style="color:#1e293b;font-size:14px;">PodTech</strong>
                    <span style="color:#0a66c2;font-size:13px;"> — Full Stack Developer</span>
                    <span style="float:right;color:#94a3b8;font-size:12px;">Jan 2025 – Present</span><br>
                    <span style="color:#64748b;font-size:13px;">10+ RESTful APIs in ASP.NET Core 8 &amp; MVC &nbsp;·&nbsp; Led WLS project (team of 5) &nbsp;·&nbsp; React + TypeScript + Redux</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;">
                    <strong style="color:#1e293b;font-size:14px;">LTIMindtree</strong>
                    <span style="color:#0a66c2;font-size:13px;"> — Software Developer</span>
                    <span style="float:right;color:#94a3b8;font-size:12px;">Nov 2024 – Jan 2025</span><br>
                    <span style="color:#64748b;font-size:13px;">5+ RESTful APIs in Spring Boot &amp; Java &nbsp;·&nbsp; 20% API response time reduction &nbsp;·&nbsp; DB schema optimization</span>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Certifications -->
            <div style="margin:0 0 26px;">
              <p style="font-size:12px;font-weight:700;color:#0a66c2;text-transform:uppercase;letter-spacing:1.2px;margin:0 0 12px;padding-bottom:8px;border-bottom:2px solid #dbeafe;">Certifications <span style="color:#94a3b8;font-weight:400;">(8)</span></p>
              ${certsHTML}
            </div>

            <!-- Reason for change -->
            <div style="background:#eff6ff;border-radius:8px;padding:16px 20px;margin:0 0 26px;border:1px solid #dbeafe;">
              <p style="font-size:14px;color:#1e40af;margin:0;line-height:1.7;">
                <strong>Why I'm exploring new opportunities:</strong> I'm eager to work on advanced AI systems, specifically agent-based architectures, and contribute to building scalable, intelligent automation solutions in a growth-oriented environment.
              </p>
            </div>

            <!-- CTA Buttons -->
            <div style="text-align:center;margin:0 0 28px;">
              <a href="${PROFILE.resumeUrl}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:6px;font-size:14px;font-weight:700;margin:5px 6px;">&#128196; View Resume</a>
              <a href="${PROFILE.linkedin}" style="display:inline-block;background:#0a66c2;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:6px;font-size:14px;font-weight:700;margin:5px 6px;">LinkedIn Profile</a>
              <a href="${PROFILE.github}" style="display:inline-block;background:#24292e;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:6px;font-size:14px;font-weight:700;margin:5px 6px;">GitHub</a>
            </div>

            <!-- Closing -->
            <p style="font-size:15px;color:#334155;line-height:1.75;margin:0 0 22px;">
              I'd love the opportunity to discuss how I can contribute to ${company}. Please feel free to reach out — I'm available for a call at your convenience.
            </p>

            <!-- Signature -->
            <div style="border-top:1px solid #e2e8f0;padding-top:20px;">
              <p style="margin:0;font-size:16px;font-weight:700;color:#1e293b;">${PROFILE.name}</p>
              <p style="margin:4px 0 0;font-size:13px;color:#0a66c2;font-weight:500;">${roleDescription}</p>
              <p style="margin:6px 0 0;font-size:13px;color:#64748b;">
                &#128231; ${PROFILE.email} &nbsp;|&nbsp; &#128241; ${PROFILE.phone}
              </p>
              <p style="margin:5px 0 0;font-size:13px;">
                <a href="${PROFILE.linkedin}" style="color:#0a66c2;text-decoration:none;font-weight:600;">LinkedIn</a>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                <a href="${PROFILE.github}" style="color:#0a66c2;text-decoration:none;font-weight:600;">GitHub</a>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                <a href="${PROFILE.resumeUrl}" style="color:#dc2626;text-decoration:none;font-weight:600;">Resume</a>
              </p>
            </div>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">This is a personalized job application email. Reply directly to continue the conversation.</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
<!-- %%PIXEL%% --></body>
</html>`;
}

// ─── Main Generator ───────────────────────────────────────────────────────────

export function generateEmails(posts: LinkedInPost[], fromEmail: string): GeneratedEmail[] {
  const seenEmails = new Set<string>();
  const results: GeneratedEmail[] = [];

  for (const post of posts) {
    const text = post.post_text || "";

    // Skip posts where someone is looking for work
    if (/\b(open to work|i am looking for|looking for (a |new )?opportunity|seeking (a |new )?role)\b/i.test(text)) {
      continue;
    }

    // Skip posts with no email
    if (!post.emails || post.emails.length === 0) continue;

    const toEmail = post.emails[0].trim().toLowerCase();

    // Deduplicate by email
    if (seenEmails.has(toEmail)) continue;
    seenEmails.add(toEmail);

    const techStack = post.tech_stack || [];
    const categories = detectCategories(text, techStack);
    const roleTitle = extractRoleTitle(text);
    const company = extractCompany(text, toEmail);
    const recruiterFirst = extractRecruiterFirstName(post.name || "");

    const roleDescription = getRoleDescription(categories);
    const skills = buildSkillsList(categories);
    const certs = getSortedCerts(categories);

    const html = buildEmailHTML({
      recruiterName: recruiterFirst,
      roleTitle,
      roleDescription,
      company,
      openingSkillLine: getSkillMatchLine(categories),
      skillsHTML: buildSkillsHTML(skills),
      certsHTML: buildCertsHTML(certs),
    });

    results.push({
      id: randomUUID(),
      from: fromEmail,
      to: toEmail,
      subject: generateSubject(roleTitle, categories),
      html,
      recruiter: recruiterFirst || post.name || "Hiring Manager",
      role: roleTitle,
      company,
      categories,
      status: "pending",
    });
  }

  return results;
}

// Inject tracking pixel — replaces placeholder comment; falls back to prepending before </body>
export function injectTrackingPixel(html: string, pixelUrl: string): string {
  const img = `<img src="${pixelUrl}" width="1" height="1" style="display:none;width:1px;height:1px;border:0;margin:0;padding:0;" alt="" />`;
  if (html.includes("<!-- %%PIXEL%% -->")) {
    return html.replace("<!-- %%PIXEL%% -->", img);
  }
  // Fallback: inject just before </body> if placeholder was stripped
  return html.includes("</body>") ? html.replace("</body>", `${img}</body>`) : html + img;
}
