import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  Send,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Upload,
  KeyRound,
  Play,
  BarChart3,
  ChevronRight,
  Link as LinkIcon,
  FlaskConical,
  TrendingUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PixelData {
  opened: boolean;
  openedAt: string | null;
  viewCount: number;
  realOpens: number;
  totalViewTimeMs: number;
}

interface GeneratedEmail {
  id: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  recruiter: string;
  role: string;
  company: string;
  categories: string[];
  status: "pending" | "sent" | "failed" | "skipped";
  sentAt?: string;
  error?: string;
  trackingPixelId?: string;
  pixelData?: PixelData | null;
}

interface SendJob {
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: GeneratedEmail["status"] }) {
  const map = {
    pending:  { color: "bg-slate-100 text-slate-600",  icon: <Clock className="w-3 h-3" />,        label: "Pending" },
    sent:     { color: "bg-green-100 text-green-700",  icon: <CheckCircle className="w-3 h-3" />,   label: "Sent" },
    failed:   { color: "bg-red-100 text-red-700",      icon: <XCircle className="w-3 h-3" />,       label: "Failed" },
    skipped:  { color: "bg-yellow-100 text-yellow-700",icon: <ChevronRight className="w-3 h-3" />,  label: "Skipped" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
      {s.icon} {s.label}
    </span>
  );
}

function CategoryBadge({ cat }: { cat: string }) {
  const colors: Record<string, string> = {
    ai:           "bg-purple-100 text-purple-700",
    python:       "bg-blue-100 text-blue-700",
    java:         "bg-orange-100 text-orange-700",
    dotnet:       "bg-indigo-100 text-indigo-700",
    node:         "bg-green-100 text-green-700",
    frontend:     "bg-pink-100 text-pink-700",
    devops:       "bg-cyan-100 text-cyan-700",
    fullstack:    "bg-teal-100 text-teal-700",
    backend:      "bg-slate-100 text-slate-700",
    microservices:"bg-amber-100 text-amber-700",
    sde:          "bg-lime-100 text-lime-700",
  };
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold mr-1 ${colors[cat] ?? "bg-gray-100 text-gray-600"}`}>
      {cat}
    </span>
  );
}

function OpenedBadge({ pixel }: { pixel: PixelData | null | undefined }) {
  if (!pixel) return <span className="text-[10px] text-slate-300">—</span>;
  if (!pixel.opened) return <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />Not opened</span>;
  const dur = pixel.totalViewTimeMs > 0 ? `${Math.round(pixel.totalViewTimeMs / 1000)}s` : null;
  return (
    <span className="flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-1 text-[10px] text-green-600 font-semibold">
        <Eye className="w-3 h-3" /> Opened{pixel.viewCount > 1 ? ` ×${pixel.viewCount}` : ""}
        {pixel.realOpens > 0 && pixel.realOpens !== pixel.viewCount && (
          <span className="text-[9px] text-slate-400">({pixel.realOpens} real)</span>
        )}
      </span>
      {pixel.openedAt && (
        <span className="text-[10px] text-slate-400">{new Date(pixel.openedAt).toLocaleString()}</span>
      )}
      {dur && <span className="text-[10px] text-slate-400">Read ~{dur}</span>}
    </span>
  );
}

// ─── Email Preview Modal ──────────────────────────────────────────────────────

function PreviewModal({ email, onClose }: { email: GeneratedEmail; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <p className="font-semibold text-sm text-slate-800 truncate max-w-md">{email.subject}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              To: {email.to} · {email.company}
              {email.pixelData?.opened && (
                <span className="ml-2 text-green-600 font-medium">· Opened</span>
              )}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <iframe
            srcDoc={email.html}
            className="w-full border-0"
            style={{ height: "calc(90vh - 80px)" }}
            title="Email Preview"
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EmailSender() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const completedNotified = useRef(false);

  // Gmail config
  const [gmailUser, setGmailUser] = useState("");
  const [gmailPass, setGmailPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [connectionOk, setConnectionOk] = useState<boolean | null>(null);

  // JSON input
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState("");

  // Generated emails
  const [generatedEmails, setGeneratedEmails] = useState<GeneratedEmail[]>([]);
  const [previewEmail, setPreviewEmail] = useState<GeneratedEmail | null>(null);

  // Sending
  const [delayMs, setDelayMs] = useState(8000);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("setup");

  // ── Job polling ──────────────────────────────────────────────────────────────
  const { data: jobData } = useQuery<SendJob>({
    queryKey: [`/api/emails/job/${activeJobId}`],
    enabled: !!activeJobId,
    refetchInterval: (query) => {
      const d = query.state.data as SendJob | undefined;
      return !d || d.isRunning ? 2000 : false;
    },
    staleTime: 0,
  });

  // Sync live job email statuses back into the queue table
  useEffect(() => {
    if (jobData?.emails?.length) {
      setGeneratedEmails(jobData.emails);
    }
  }, [jobData]);

  // Auto-switch to Sent Log tab when job finishes
  useEffect(() => {
    if (jobData && !jobData.isRunning && jobData.completedAt && !completedNotified.current) {
      completedNotified.current = true;
      queryClient.invalidateQueries({ queryKey: ["/api/emails/records"] });
      setTimeout(() => setActiveTab("log"), 600);
      toast({
        title: "Job complete!",
        description: `${jobData.sent} sent · ${jobData.failed} failed · ${jobData.skipped} skipped`,
      });
    }
  }, [jobData?.completedAt, jobData?.isRunning]);

  // ── Records query ─────────────────────────────────────────────────────────
  const { data: recordsData, refetch: refetchRecords } = useQuery<{
    records: GeneratedEmail[];
    stats: { total: number; sent: number; failed: number; skipped: number };
  }>({
    queryKey: ["/api/emails/records"],
    refetchInterval: activeJobId ? 6000 : false,
    refetchOnMount: true,
    staleTime: 0,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const testConnection = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/emails/test-connection", {
        method: "POST",
        body: JSON.stringify({ gmailUser, gmailPass }),
        headers: { "Content-Type": "application/json" },
      });
      return res.json();
    },
    onSuccess: () => {
      setConnectionOk(true);
      toast({ title: "Connection successful", description: "Gmail App Password verified" });
    },
    onError: (err: any) => {
      setConnectionOk(false);
      toast({ title: "Connection failed", description: err.message, variant: "destructive" });
    },
  });

  const sendTestEmail = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/emails/send-test", {
        method: "POST",
        body: JSON.stringify({ gmailUser, gmailPass }),
        headers: { "Content-Type": "application/json" },
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Test email sent!", description: data.message });
    },
    onError: (err: any) => {
      toast({ title: "Test send failed", description: err.message, variant: "destructive" });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (posts: any[]) => {
      const res = await apiRequest("/api/emails/generate", {
        method: "POST",
        body: JSON.stringify({ posts, fromEmail: gmailUser }),
        headers: { "Content-Type": "application/json" },
      });
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedEmails(data.emails);
      setActiveTab("queue");
      toast({ title: `Generated ${data.total} emails`, description: "Review and send when ready" });
    },
    onError: (err: any) => {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/emails/send", {
        method: "POST",
        body: JSON.stringify({
          emails: generatedEmails.filter((e) => e.status === "pending"),
          gmailUser,
          gmailPass,
          delayMs,
        }),
        headers: { "Content-Type": "application/json" },
      });
      return res.json();
    },
    onSuccess: (data) => {
      completedNotified.current = false; // reset so next job completion fires notification
      setActiveJobId(data.jobId);
      toast({ title: "Sending started", description: `${data.total} emails queued — delay: ${delayMs / 1000}s` });
    },
    onError: (err: any) => {
      toast({ title: "Send failed", description: err.message, variant: "destructive" });
    },
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleJsonParse() {
    setJsonError("");
    try {
      const parsed = JSON.parse(jsonInput);
      generateMutation.mutate(Array.isArray(parsed) ? parsed : [parsed]);
    } catch {
      setJsonError("Invalid JSON — please check format matches the sample");
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setJsonInput(ev.target?.result as string);
    reader.readAsText(file);
    // reset so same file can be re-uploaded
    e.target.value = "";
  }

  function skipEmail(id: string) {
    setGeneratedEmails((prev) => prev.map((e) => e.id === id ? { ...e, status: "skipped" } : e));
  }
  function restoreEmail(id: string) {
    setGeneratedEmails((prev) => prev.map((e) => e.id === id ? { ...e, status: "pending" } : e));
  }

  // ── Derived state ─────────────────────────────────────────────────────────
  const pendingCount  = generatedEmails.filter((e) => e.status === "pending").length;
  const sentCount     = generatedEmails.filter((e) => e.status === "sent").length;
  const failedCount   = generatedEmails.filter((e) => e.status === "failed").length;
  const skippedCount  = generatedEmails.filter((e) => e.status === "skipped").length;
  const isJobRunning  = jobData?.isRunning ?? false;

  const processedCount = (jobData?.sent ?? 0) + (jobData?.failed ?? 0) + (jobData?.skipped ?? 0);
  const progress = jobData && jobData.total > 0 ? Math.round((processedCount / jobData.total) * 100) : 0;

  // Which email is the backend currently sending?
  const currentlySendingId = isJobRunning
    ? generatedEmails.find((e) => e.status === "pending")?.id ?? null
    : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ── */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0a66c2] flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Job Application Sender</h1>
              <p className="text-xs text-slate-500">Dynamic email generator + Gmail sender with open tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {recordsData?.stats && (
              <div className="hidden sm:flex items-center gap-4 text-sm">
                <span className="text-slate-500">
                  All-time: <strong className="text-green-600">{recordsData.stats.sent}</strong> sent
                  {recordsData.stats.failed > 0 && (
                    <> · <strong className="text-red-500">{recordsData.stats.failed}</strong> failed</>
                  )}
                </span>
              </div>
            )}
            <a href="/" className="text-sm text-[#0a66c2] hover:underline flex items-center gap-1">
              <BarChart3 className="w-4 h-4" /> Pixel Dashboard
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="setup" className="gap-2">
              <KeyRound className="w-4 h-4" /> Setup &amp; Generate
            </TabsTrigger>
            <TabsTrigger value="queue" className="gap-2">
              <Send className="w-4 h-4" /> Email Queue
              {generatedEmails.length > 0 && (
                <Badge className="ml-1 bg-[#0a66c2] text-white text-xs">{generatedEmails.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="log" className="gap-2">
              <TrendingUp className="w-4 h-4" /> Sent Log &amp; Tracking
              {(recordsData?.stats?.sent ?? 0) > 0 && (
                <Badge className="ml-1 bg-green-600 text-white text-xs">{recordsData?.stats?.sent}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ═══════════ TAB 1: SETUP & GENERATE ═══════════ */}
          <TabsContent value="setup" className="space-y-6">

            {/* Gmail Config */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#0a66c2]" />
                  Gmail Configuration
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Use a Gmail <strong>App Password</strong> — not your regular password. Generate one at{" "}
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#0a66c2] underline"
                  >
                    myaccount.google.com/apppasswords
                  </a>{" "}
                  (requires 2-Step Verification).
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="gmail-user">Gmail Address</Label>
                    <Input
                      id="gmail-user"
                      type="email"
                      placeholder="vashishtsahil99@gmail.com"
                      value={gmailUser}
                      onChange={(e) => { setGmailUser(e.target.value); setConnectionOk(null); }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gmail-pass">App Password</Label>
                    <div className="relative">
                      <Input
                        id="gmail-pass"
                        type={showPass ? "text" : "password"}
                        placeholder="xxxx xxxx xxxx xxxx"
                        value={gmailPass}
                        onChange={(e) => { setGmailPass(e.target.value); setConnectionOk(null); }}
                        className="pr-16"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-800 px-1"
                        onClick={() => setShowPass(!showPass)}
                      >
                        {showPass ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Test connection */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testConnection.mutate()}
                    disabled={!gmailUser || !gmailPass || testConnection.isPending}
                    className="gap-2"
                  >
                    {testConnection.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                    Test Connection
                  </Button>

                  {/* Send test email to self */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendTestEmail.mutate()}
                    disabled={!gmailUser || !gmailPass || sendTestEmail.isPending}
                    className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    {sendTestEmail.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
                    Send Test Email to Self
                  </Button>

                  {/* Connection status */}
                  {connectionOk === true && (
                    <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <CheckCircle className="w-4 h-4" /> Connected
                    </span>
                  )}
                  {connectionOk === false && (
                    <span className="flex items-center gap-1 text-red-500 text-sm font-medium">
                      <XCircle className="w-4 h-4" /> Failed
                    </span>
                  )}
                </div>

                {sendTestEmail.isSuccess && (
                  <div className="text-xs text-purple-700 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2">
                    ✓ Test email sent to your inbox — check it to confirm formatting looks right before blasting.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* JSON Input */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#0a66c2]" />
                  LinkedIn Job Data (JSON)
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Paste your JSON array of LinkedIn job postings, or upload a .json file.
                  Posts without an email or where someone is "open to work" are auto-skipped.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 items-center">
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
                    <Upload className="w-4 h-4" /> Upload .json file
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  {jsonInput && (
                    <span className="text-xs text-slate-500">{jsonInput.length.toLocaleString()} chars loaded</span>
                  )}
                </div>

                <Textarea
                  className="h-64 text-xs font-mono bg-slate-50"
                  placeholder={`[
  {
    "name": "Priya Sharma, Hiring",
    "emails": ["priya.sharma@techcorpai.com"],
    "tech_stack": ["python", "aws", "docker", "langchain"],
    "post_text": "🚀 We're Hiring: AI/ML Engineer\\n\\nTechCorp AI..."
  }
]`}
                  value={jsonInput}
                  onChange={(e) => { setJsonInput(e.target.value); setJsonError(""); }}
                />

                {jsonError && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> {jsonError}
                  </p>
                )}

                <Button
                  onClick={handleJsonParse}
                  disabled={!jsonInput.trim() || generateMutation.isPending || isJobRunning}
                  className="bg-[#0a66c2] hover:bg-[#0052a5] gap-2"
                >
                  {generateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Generate Emails
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ TAB 2: EMAIL QUEUE ═══════════ */}
          <TabsContent value="queue" className="space-y-4">
            {generatedEmails.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-lg font-medium">No emails generated yet</p>
                <p className="text-sm mt-1">Go to Setup &amp; Generate tab first</p>
              </div>
            ) : (
              <>
                {/* Controls + Progress */}
                <Card>
                  <CardContent className="pt-4 pb-4 space-y-4">
                    {/* Counters + send button */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                        <span className="text-slate-500">Total: <strong>{generatedEmails.length}</strong></span>
                        <span className="text-blue-600">Pending: <strong>{pendingCount}</strong></span>
                        <span className="text-green-600">Sent: <strong>{sentCount}</strong></span>
                        {failedCount > 0 && <span className="text-red-500">Failed: <strong>{failedCount}</strong></span>}
                        {skippedCount > 0 && <span className="text-yellow-600">Skipped: <strong>{skippedCount}</strong></span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <label className="whitespace-nowrap text-xs">Gap between sends:</label>
                          <Select
                            value={String(delayMs)}
                            onValueChange={(v) => setDelayMs(Number(v))}
                            disabled={isJobRunning}
                          >
                            <SelectTrigger className="w-[160px] h-8 text-xs border-slate-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5000">5s (fastest safe)</SelectItem>
                              <SelectItem value="8000">8s ✓ recommended</SelectItem>
                              <SelectItem value="10000">10s</SelectItem>
                              <SelectItem value="15000">15s (cautious)</SelectItem>
                              <SelectItem value="20000">20s</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          onClick={() => sendMutation.mutate()}
                          disabled={
                            pendingCount === 0 || isJobRunning || sendMutation.isPending || !gmailUser || !gmailPass
                          }
                          className="bg-[#0a66c2] hover:bg-[#0052a5] gap-2 min-w-[140px]"
                        >
                          {isJobRunning ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                          ) : (
                            <><Send className="w-4 h-4" /> Send {pendingCount} Emails</>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Credential warning */}
                    {(!gmailUser || !gmailPass) && pendingCount > 0 && (
                      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded px-3 py-2">
                        ⚠ Enter Gmail address and App Password in the Setup tab before sending.
                      </p>
                    )}

                    {/* Progress bar */}
                    {activeJobId && (
                      <div>
                        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                          <span>
                            {isJobRunning ? (
                              currentlySendingId
                                ? `Sending to ${generatedEmails.find(e => e.id === currentlySendingId)?.to} (${generatedEmails.find(e => e.id === currentlySendingId)?.company})…`
                                : "Processing…"
                            ) : (
                              "Completed"
                            )}
                          </span>
                          <span className="font-medium">{processedCount}/{jobData?.total ?? 0} · {progress}%</span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              isJobRunning ? "bg-[#0a66c2] animate-pulse" : "bg-green-500"
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        {!isJobRunning && jobData?.completedAt && (
                          <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Done — {jobData.sent} sent · {jobData.failed} failed · {jobData.skipped} skipped
                            &nbsp;·&nbsp;
                            <button
                              className="underline hover:no-underline"
                              onClick={() => { refetchRecords(); setActiveTab("log"); }}
                            >
                              View Sent Log →
                            </button>
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Email Table */}
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b">
                            <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs w-6">#</th>
                            <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">To</th>
                            <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">Company</th>
                            <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">Role</th>
                            <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">Subject</th>
                            <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">Categories</th>
                            <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">Status</th>
                            <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {generatedEmails.map((email, i) => {
                            const isCurrent = isJobRunning && email.id === currentlySendingId;
                            return (
                              <tr
                                key={email.id}
                                className={`border-b transition-colors ${
                                  isCurrent
                                    ? "bg-blue-50 border-l-2 border-l-[#0a66c2]"
                                    : "hover:bg-slate-50/50"
                                }`}
                              >
                                <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                                <td className="px-4 py-3">
                                  <div className="text-xs text-slate-700 font-medium">{email.to}</div>
                                  <div className="text-xs text-slate-400">{email.recruiter}</div>
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-700 font-medium">{email.company}</td>
                                <td className="px-4 py-3">
                                  <div className="text-xs text-slate-700 max-w-[180px] truncate" title={email.role}>
                                    {email.role}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-xs text-slate-700 max-w-[200px] truncate" title={email.subject}>
                                    {email.subject || <span className="text-slate-400">—</span>}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-0.5">
                                    {email.categories.map((c) => <CategoryBadge key={c} cat={c} />)}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <StatusBadge status={email.status} />
                                  {email.error && (
                                    <div className="text-[10px] text-red-400 mt-0.5 max-w-[160px] truncate" title={email.error}>
                                      {email.error}
                                    </div>
                                  )}
                                  {email.sentAt && (
                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                      {new Date(email.sentAt).toLocaleTimeString()}
                                    </div>
                                  )}
                                  {isCurrent && (
                                    <div className="text-[10px] text-blue-500 mt-0.5 flex items-center gap-1">
                                      <Loader2 className="w-2.5 h-2.5 animate-spin" /> Sending now…
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1.5">
                                    <Button
                                      variant="ghost" size="sm"
                                      className="h-7 px-2 text-xs gap-1 text-[#0a66c2]"
                                      onClick={() => setPreviewEmail(email)}
                                    >
                                      <Eye className="w-3.5 h-3.5" /> Preview
                                    </Button>
                                    {email.status === "pending" && (
                                      <Button
                                        variant="ghost" size="sm"
                                        className="h-7 px-2 text-xs text-yellow-600 hover:text-yellow-700"
                                        onClick={() => skipEmail(email.id)}
                                        disabled={isJobRunning}
                                      >
                                        Skip
                                      </Button>
                                    )}
                                    {email.status === "skipped" && (
                                      <Button
                                        variant="ghost" size="sm"
                                        className="h-7 px-2 text-xs text-green-600 hover:text-green-700"
                                        onClick={() => restoreEmail(email.id)}
                                        disabled={isJobRunning}
                                      >
                                        Restore
                                      </Button>
                                    )}
                                    {email.status === "failed" && (
                                      <Button
                                        variant="ghost" size="sm"
                                        className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700"
                                        onClick={() => setGeneratedEmails((prev) => prev.map((e) => e.id === email.id ? { ...e, status: "pending", error: undefined } : e))}
                                        disabled={isJobRunning}
                                      >
                                        Retry
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ═══════════ TAB 3: SENT LOG + OPEN TRACKING ═══════════ */}
          <TabsContent value="log" className="space-y-4">
            {/* Stats cards */}
            {recordsData?.stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Emails Sent",      value: recordsData.stats.sent,    color: "text-green-600",  bg: "bg-green-50" },
                  { label: "Failed",            value: recordsData.stats.failed,  color: "text-red-500",    bg: "bg-red-50" },
                  { label: "Skipped",           value: recordsData.stats.skipped, color: "text-yellow-600", bg: "bg-yellow-50" },
                  { label: "Total Processed",   value: recordsData.stats.total,   color: "text-slate-700",  bg: "bg-slate-50" },
                ].map((s) => (
                  <Card key={s.label} className={`${s.bg} border-0 shadow-none`}>
                    <CardContent className="pt-4 pb-3 px-4">
                      <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Opened count card */}
            {recordsData?.records && (() => {
              const sentRecords = recordsData.records.filter((r) => r.status === "sent");
              const openedCount = sentRecords.filter((r) => r.pixelData?.opened).length;
              const trackedCount = sentRecords.filter((r) => r.pixelData !== null && r.pixelData !== undefined).length;
              if (trackedCount === 0) return null;
              return (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 flex items-center gap-3">
                  <Eye className="w-5 h-5 text-[#0a66c2] shrink-0" />
                  <div className="text-sm">
                    <strong className="text-[#0a66c2]">{openedCount} of {trackedCount}</strong>
                    <span className="text-slate-600"> tracked emails have been opened</span>
                    {trackedCount > 0 && (
                      <span className="text-slate-400 ml-2">
                        ({Math.round((openedCount / trackedCount) * 100)}% open rate)
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Records Table */}
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base">All-Time Sent Records</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => refetchRecords()}>
                  <Loader2 className="w-3 h-3" /> Refresh
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {!recordsData?.records?.length ? (
                  <div className="text-center py-16 text-slate-400">
                    <Mail className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No emails sent yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b">
                          <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">To</th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">Company / Role</th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">Subject</th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">Sent Status</th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />Open Tracking</span>
                          </th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">Sent At</th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">Preview</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recordsData.records.map((email, i) => (
                          <tr key={`${email.id}-${i}`} className="border-b hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="text-xs text-slate-700 font-medium">{email.to}</div>
                              <div className="text-xs text-slate-400">{email.recruiter}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-xs font-medium text-slate-700">{email.company}</div>
                              <div className="text-xs text-slate-500 max-w-[150px] truncate" title={email.role}>
                                {email.role}
                              </div>
                              <div className="flex flex-wrap gap-0.5 mt-0.5">
                                {email.categories.slice(0, 3).map((c) => <CategoryBadge key={c} cat={c} />)}
                              </div>
                            </td>
                            <td className="px-4 py-3 max-w-[200px]">
                              <div className="text-xs text-slate-600 truncate" title={email.subject}>
                                {email.subject}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={email.status} />
                              {email.error && (
                                <div className="text-[10px] text-red-400 mt-0.5 max-w-[120px] truncate" title={email.error}>
                                  {email.error}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <OpenedBadge pixel={email.pixelData} />
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                              {email.sentAt ? new Date(email.sentAt).toLocaleString() : "—"}
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                variant="ghost" size="sm"
                                className="h-7 px-2 text-xs gap-1 text-[#0a66c2]"
                                onClick={() => setPreviewEmail(email)}
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Email Preview Modal */}
      {previewEmail && <PreviewModal email={previewEmail} onClose={() => setPreviewEmail(null)} />}
    </div>
  );
}
