import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Copy, 
  Eye, 
  Image,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Target,
  Sparkles,
  TrendingUp,
  TestTube,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Link } from "wouter";

interface TrackingPixel {
  id: string;
  createdAt: string;
  openedAt: string | null;
  opened: boolean;
  lastSeenAt: string | null;
  totalViewTime: number;
  viewCount: number;
  realOpens: number;
  isDurationTracking: boolean;
  activeSessionsCount: number;
  metadata?: any;
}

interface DashboardData {
  stats: {
    totalPixels: number;
    openedPixels: number;
    realOpens: number;
    openRate: number;
    realOpenRate: number;
    avgViewTime: number;
    totalViewTime: number;
    activeSessionsCount: number;
  };
  recentPixels: TrackingPixel[];
}

interface CreatePixelResponse {
  id: string;
  trackingUrl: string;
  embedCode: string;
  advancedEmbedCode: string;
  createdAt: string;
}

// Utility function to format time duration
const formatDuration = (milliseconds: number): string => {
  if (milliseconds === 0) return "0s";
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [checkPixelId, setCheckPixelId] = useState("");
  const [expandedPixels, setExpandedPixels] = useState<Set<string>>(new Set());

  // Fetch dashboard data
  const { data: dashboardData } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Create new tracking pixel
  const createPixelMutation = useMutation({
    mutationFn: async (metadata?: string) => {
      const url = metadata 
        ? `/api/pixel/create?metadata=${encodeURIComponent(metadata)}`
        : '/api/pixel/create';
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to create tracking pixel");
      }
      return response.json();
    },
    onSuccess: (data: CreatePixelResponse) => {
      toast({
        title: "🎯 Advanced Tracking Pixel Created",
        description: `ID: ${data.id} • Bot filtering enabled • Duration tracking available`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Pixel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check pixel status
  const checkPixelMutation = useMutation({
    mutationFn: async (pixelId: string) => {
      const response = await apiRequest("/api/pixel/check", {
        method: "POST",
        body: JSON.stringify({ id: pixelId }),
        headers: { "Content-Type": "application/json" },
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Pixel Status",
        description: data.opened 
          ? `Opened at ${new Date(data.openedAt).toLocaleString()}`
          : "Not opened yet",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Checking Pixel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: "Text copied successfully",
    });
  };

  const togglePixelExpansion = (pixelId: string) => {
    setExpandedPixels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pixelId)) {
        newSet.delete(pixelId);
      } else {
        newSet.add(pixelId);
      }
      return newSet;
    });
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return "Just now";
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    return `${Math.floor(diffSecs / 86400)}d ago`;
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="intro-card rounded-2xl p-8 mb-8 text-center shadow-2xl">
          <div className="flex items-center justify-center mb-6">
            {/* Cute Email Tracking SVG */}
            <svg className="w-20 h-20 text-white mr-4" fill="currentColor" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="rgba(255,255,255,0.2)" />
              <rect x="20" y="35" width="60" height="40" rx="4" fill="white" opacity="0.9" />
              <path d="M25 40 L50 55 L75 40" stroke="currentColor" strokeWidth="2" fill="none" />
              <circle cx="65" cy="25" r="8" fill="#FFD700" />
              <circle cx="63" cy="23" r="2" fill="white" />
              <circle cx="67" cy="23" r="2" fill="white" />
              <path d="M61 27 Q65 29 69 27" stroke="white" strokeWidth="1.5" fill="none" />
              <path d="M35 60 L45 60 M35 65 L55 65 M35 70 L50 70" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <div>
              <h1 className="text-4xl font-bold mb-2">📧 Pixel Tracker</h1>
              <p className="text-xl text-blue-100">Know when your emails are opened & how long they're read!</p>
              <p className="text-sm text-blue-200 mt-2">Track email opens with invisible 1x1 pixel images. Perfect for email marketing campaigns, newsletters, and engagement analytics.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white/20 rounded-lg p-4">
              <Mail className="h-8 w-8 mx-auto mb-2 text-white" />
              <h3 className="font-semibold text-white">Track Opens</h3>
              <p className="text-blue-100 text-sm">See exactly when emails are opened</p>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <Clock className="h-8 w-8 mx-auto mb-2 text-white" />
              <h3 className="font-semibold text-white">Time Tracking</h3>
              <p className="text-blue-100 text-sm">Monitor how long emails are viewed</p>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-white" />
              <h3 className="font-semibold text-white">Analytics</h3>
              <p className="text-blue-100 text-sm">Get insights on engagement patterns</p>
            </div>
          </div>
          
          <div className="flex justify-center space-x-4 mt-8">
            <Link href="/test">
              <Button variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50">
                <TestTube className="mr-2 h-4 w-4" />
                Test Page
              </Button>
            </Link>
            <Button variant="secondary" onClick={() => window.open('/api-docs', '_blank')} className="bg-white text-blue-600 hover:bg-blue-50">
              <Image className="mr-2 h-4 w-4" />
              API Docs
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card className="stat-card card-hover">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Image className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Pixels</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData?.stats.totalPixels || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card card-hover">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-green-100 rounded-full">
                    <Eye className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Opened</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData?.stats.openedPixels || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card card-hover">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Open Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData?.stats.openRate || 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card card-hover">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg View Time</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatDuration(dashboardData?.stats.avgViewTime || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card card-hover">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-indigo-100 rounded-full">
                    <Sparkles className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total View Time</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatDuration(dashboardData?.stats.totalViewTime || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card card-hover">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-emerald-100 rounded-full">
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Real Opens</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData?.stats.realOpens || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    {dashboardData?.stats.realOpenRate || 0}% real rate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Create Pixel */}
          <Card className="glass-card card-hover">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-800">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                </div>
                Create Tracking Pixel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => createPixelMutation.mutate(undefined)}
                disabled={createPixelMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
              >
                {createPixelMutation.isPending ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate New Pixel
                  </>
                )}
              </Button>
              <p className="text-sm text-gray-600 text-center">
                ✨ Creates a unique tracking pixel with embed code
              </p>
            </CardContent>
          </Card>

          {/* Check Pixel Status */}
          <Card className="glass-card card-hover">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-800">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <Eye className="h-5 w-5 text-green-600" />
                </div>
                Check Pixel Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="pixelId" className="text-gray-700">Pixel ID</Label>
                <Input
                  id="pixelId"
                  value={checkPixelId}
                  onChange={(e) => setCheckPixelId(e.target.value)}
                  placeholder="Enter pixel ID to check"
                  className="bg-white/80 border-gray-200"
                />
              </div>
              <Button 
                onClick={() => checkPixelMutation.mutate(checkPixelId)}
                disabled={checkPixelMutation.isPending || !checkPixelId}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
              >
                {checkPixelMutation.isPending ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Check Status
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Pixels */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-800">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              📊 Recent Tracking Pixels
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData?.recentPixels.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No tracking pixels created yet</p>
                <p className="text-gray-400 text-sm">Create your first pixel above to start tracking email opens!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData?.recentPixels.map((pixel) => {
                  // Generate URLs and embed codes for each pixel
                  const baseUrl = window.location.origin;
                  const trackingUrl = `${baseUrl}/api/pixel/${pixel.id}`;
                  const embedCode = `<img src="${trackingUrl}" width="1" height="1" style="display:none;" />`;
                  const advancedEmbedCode = `
<div style="display:none;">
  <img src="${trackingUrl}" width="1" height="1" onload="initDurationTracking('${pixel.id}', '${baseUrl}')" />
  <script>
  function initDurationTracking(pixelId, baseUrl) {
    // Prevent multiple instances
    if (window._trackingInitialized) return;
    window._trackingInitialized = true;
    
    const sessionId = Math.random().toString(36).substring(2, 15);
    const startTime = performance.now();
    let isActive = true;
    let pingInterval;
    let retryCount = 0;
    
    // Send ping with retry logic
    function sendPing() {
      if (!isActive) return;
      
      fetch(baseUrl + '/api/pixel/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pixelId, sessionId, timestamp: Date.now() })
      }).catch(error => {
        console.warn('Ping failed:', error);
        retryCount++;
        if (retryCount < 3) {
          setTimeout(sendPing, 1000 * retryCount); // Exponential backoff
        }
      });
    }
    
    // Start pinging every 5 seconds (reduced frequency)
    pingInterval = setInterval(sendPing, 5000);
    
    // Send final duration calculation
    function endSession() {
      if (!isActive) return;
      isActive = false;
      clearInterval(pingInterval);
      
      const duration = Math.round(performance.now() - startTime);
      const data = new URLSearchParams({ pixelId, sessionId, duration: duration.toString() });
      
      try {
        navigator.sendBeacon(baseUrl + '/api/pixel/end', data);
      } catch (e) {
        fetch(baseUrl + '/api/pixel/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: data
        }).catch(() => {});
      }
    }
    
    // Handle page unload
    window.addEventListener('beforeunload', endSession);
    
    // Handle visibility changes with resume capability
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        endSession();
      } else if (!isActive) {
        // Resume tracking if user returns to tab
        isActive = true;
        retryCount = 0;
        pingInterval = setInterval(sendPing, 5000);
      }
    });
  }
  </script>
</div>`.trim();
                  const isExpanded = expandedPixels.has(pixel.id);
                  
                  return (
                    <div key={pixel.id} className="bg-white/60 border border-white/40 rounded-xl p-4 card-hover">
                      <div className="space-y-3">
                        {/* Header with ID and status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                              {pixel.opened ? (
                                <div className="p-2 bg-green-100 rounded-full">
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                </div>
                              ) : (
                                <div className="p-2 bg-gray-100 rounded-full">
                                  <Clock className="h-5 w-5 text-gray-500" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-mono text-sm font-semibold text-gray-800">{pixel.id}</p>
                              <p className="text-sm text-gray-600">
                                📅 Created {formatTimestamp(pixel.createdAt)}
                                {pixel.opened && pixel.openedAt && (
                                  <span className="text-green-600 ml-2">
                                    • ✅ Opened {formatTimestamp(pixel.openedAt)}
                                  </span>
                                )}
                              </p>
                              {pixel.opened && (
                                <div className="text-xs text-gray-500 mt-1 space-y-1">
                                  <p>
                                    👁️ Total Views: {pixel.viewCount} • 🎯 Real Opens: {pixel.realOpens} • ⏱️ View Time: {formatDuration(pixel.totalViewTime)}
                                  </p>
                                  {pixel.lastSeenAt && (
                                    <p>🕐 Last seen: {formatTimestamp(pixel.lastSeenAt)}</p>
                                  )}
                                  {pixel.isDurationTracking && (
                                    <p className="text-blue-600">🔄 Duration tracking enabled • 📈 Active sessions: {pixel.activeSessionsCount}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              {pixel.realOpens > 0 && (
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
                                  🎯 {pixel.realOpens} Real
                                </Badge>
                              )}
                              <Badge 
                                variant={pixel.opened ? "default" : "secondary"}
                                className={pixel.opened ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}
                              >
                                {pixel.opened ? "✅ Opened" : "⏳ Pending"}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePixelExpansion(pixel.id)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        {/* Collapsible Details */}
                        {isExpanded && (
                          <div className="space-y-3 pt-2 border-t border-gray-200">
                            {/* Tracking URL */}
                            <div>
                              <Label className="text-xs text-gray-600 font-medium">Tracking URL</Label>
                              <div className="flex items-center space-x-2 mt-1">
                                <Input value={trackingUrl} readOnly className="text-xs bg-gray-50" />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(trackingUrl)}
                                  className="bg-white/80 hover:bg-white border-gray-200"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Basic HTML Embed Code */}
                            <div>
                              <Label className="text-xs text-gray-600 font-medium">Basic HTML Embed Code</Label>
                              <div className="flex items-center space-x-2 mt-1">
                                <Input value={embedCode} readOnly className="text-xs bg-gray-50" />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(embedCode)}
                                  className="bg-white/80 hover:bg-white border-gray-200"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">⚡ Basic tracking - detects opens only</p>
                            </div>

                            {/* Advanced HTML Embed Code with Duration Tracking */}
                            <div>
                              <Label className="text-xs text-gray-600 font-medium">🚀 Advanced Embed Code (Duration Tracking)</Label>
                              <div className="flex items-center space-x-2 mt-1">
                                <textarea 
                                  value={advancedEmbedCode} 
                                  readOnly 
                                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded p-2 h-20 resize-none"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(advancedEmbedCode)}
                                  className="bg-white/80 hover:bg-white border-gray-200"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="text-xs text-blue-600 mt-1">✨ Advanced tracking - measures precise viewing duration with smart retry and resume</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Developer Credit */}
        <div className="text-center mt-8 text-xs text-gray-400">
          DEVELOPED BY Sahil Vashisht (Software Developer)
        </div>
      </div>
    </div>
  );
}