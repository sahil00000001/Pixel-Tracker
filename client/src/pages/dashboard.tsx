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
        {/* Enhanced Hero Section */}
        <div className="relative intro-card rounded-3xl p-8 mb-8 text-center shadow-2xl overflow-hidden">
          {/* Animated background particles */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-xl animate-pulse animation-delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full blur-xl animate-pulse animation-delay-2000"></div>
          </div>
          
          <div className="relative flex flex-col md:flex-row items-center justify-center mb-6">
            {/* Enhanced Email Tracking SVG with animations */}
            <div className="relative mr-6 mb-4 md:mb-0">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 animate-ping"></div>
              <svg className="relative w-24 h-24 text-white animate-bounce" fill="currentColor" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="rgba(255,255,255,0.2)" />
                <rect x="20" y="35" width="60" height="40" rx="4" fill="white" opacity="0.9" />
                <path d="M25 40 L50 55 L75 40" stroke="currentColor" strokeWidth="2" fill="none" />
                <circle cx="65" cy="25" r="8" fill="#FFD700" className="animate-pulse" />
                <circle cx="63" cy="23" r="2" fill="white" />
                <circle cx="67" cy="23" r="2" fill="white" />
                <path d="M61 27 Q65 29 69 27" stroke="white" strokeWidth="1.5" fill="none" />
                <path d="M35 60 L45 60 M35 65 L55 65 M35 70 L50 70" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <div className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-green-400 to-green-500 rounded-full animate-pulse shadow-lg"></div>
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-5xl md:text-6xl font-bold mb-3 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent animate-fade-in">
                📧 Pixel Tracker
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-2 font-medium">
                Know when your emails are opened & how long they're read!
              </p>
              <p className="text-sm text-blue-200 max-w-2xl mx-auto md:mx-0">
                🚀 Track email opens with invisible 1x1 pixel images. Perfect for email marketing campaigns, newsletters, and engagement analytics with advanced anti-ghost technology.
              </p>
            </div>
          </div>
          
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 hover:bg-white/30 transition-all duration-300 hover:scale-105 border border-white/10">
              <div className="relative">
                <Mail className="h-10 w-10 mx-auto mb-3 text-white animate-pulse" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full animate-ping"></div>
              </div>
              <h3 className="font-bold text-white text-lg mb-2">Track Opens</h3>
              <p className="text-blue-100 text-sm">See exactly when emails are opened with real-time notifications</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 hover:bg-white/30 transition-all duration-300 hover:scale-105 border border-white/10">
              <div className="relative">
                <Clock className="h-10 w-10 mx-auto mb-3 text-white animate-pulse animation-delay-500" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-400 rounded-full animate-ping animation-delay-500"></div>
              </div>
              <h3 className="font-bold text-white text-lg mb-2">Duration Tracking</h3>
              <p className="text-blue-100 text-sm">Monitor precise viewing time with millisecond accuracy</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 hover:bg-white/30 transition-all duration-300 hover:scale-105 border border-white/10">
              <div className="relative">
                <TrendingUp className="h-10 w-10 mx-auto mb-3 text-white animate-pulse animation-delay-1000" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-purple-400 rounded-full animate-ping animation-delay-1000"></div>
              </div>
              <h3 className="font-bold text-white text-lg mb-2">Smart Analytics</h3>
              <p className="text-blue-100 text-sm">Advanced insights with bot detection and engagement patterns</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
            <Link href="/test">
              <Button variant="secondary" className="bg-white/90 backdrop-blur-sm text-blue-600 hover:bg-white hover:scale-105 transition-all duration-300 shadow-lg border border-white/20">
                <TestTube className="mr-2 h-4 w-4" />
                Test Tracking
              </Button>
            </Link>
            <Button 
              variant="secondary" 
              onClick={() => window.open('/api-docs', '_blank')} 
              className="bg-white/90 backdrop-blur-sm text-blue-600 hover:bg-white hover:scale-105 transition-all duration-300 shadow-lg border border-white/20"
            >
              <Image className="mr-2 h-4 w-4" />
              API Documentation
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card className="stat-card card-hover group bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Image className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-700">Total Pixels</p>
                  <p className="text-2xl font-bold text-blue-900 group-hover:scale-105 transition-transform duration-300">
                    {dashboardData?.stats.totalPixels || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card card-hover group bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-full group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Eye className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-700">Opened</p>
                  <p className="text-2xl font-bold text-green-900 group-hover:scale-105 transition-transform duration-300">
                    {dashboardData?.stats.openedPixels || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card card-hover group bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-700">Open Rate</p>
                  <p className="text-2xl font-bold text-purple-900 group-hover:scale-105 transition-transform duration-300">
                    {dashboardData?.stats.openRate || 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card card-hover group bg-gradient-to-br from-orange-50 to-orange-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-orange-700">Avg View Time</p>
                  <p className="text-2xl font-bold text-orange-900 group-hover:scale-105 transition-transform duration-300">
                    {formatDuration(dashboardData?.stats.avgViewTime || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card card-hover group bg-gradient-to-br from-indigo-50 to-indigo-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-indigo-700">Total View Time</p>
                  <p className="text-2xl font-bold text-indigo-900 group-hover:scale-105 transition-transform duration-300">
                    {formatDuration(dashboardData?.stats.totalViewTime || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card card-hover group bg-gradient-to-br from-emerald-50 to-emerald-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-emerald-700">Real Opens</p>
                  <p className="text-2xl font-bold text-emerald-900 group-hover:scale-105 transition-transform duration-300">
                    {dashboardData?.stats.realOpens || 0}
                  </p>
                  <p className="text-xs text-emerald-600 font-medium">
                    {dashboardData?.stats.realOpenRate || 0}% real rate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Create Pixel */}
          <Card className="glass-card card-hover group bg-gradient-to-br from-blue-50/80 to-purple-50/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-800 group-hover:text-blue-700 transition-colors duration-300">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mr-3 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="text-lg font-bold">Create Tracking Pixel</span>
                  <p className="text-sm text-gray-600 font-normal">Generate advanced tracking with bot detection</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => createPixelMutation.mutate(undefined)}
                disabled={createPixelMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-gradient"
              >
                {createPixelMutation.isPending ? (
                  <>
                    <Clock className="mr-2 h-5 w-5 animate-spin" />
                    Creating Magic...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate New Pixel
                  </>
                )}
              </Button>
              <div className="text-center bg-white/50 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <p className="text-sm text-gray-700 font-medium">
                  🎯 Advanced Features Included
                </p>
                <div className="flex justify-center gap-4 mt-2 text-xs text-gray-600">
                  <span>• Bot Detection</span>
                  <span>• Duration Tracking</span>
                  <span>• Real-time Analytics</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Check Pixel Status */}
          <Card className="glass-card card-hover group bg-gradient-to-br from-green-50/80 to-emerald-50/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-800 group-hover:text-green-700 transition-colors duration-300">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl mr-3 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="text-lg font-bold">Check Pixel Status</span>
                  <p className="text-sm text-gray-600 font-normal">Monitor real-time tracking analytics</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="pixelId" className="text-gray-700 font-medium">Pixel ID</Label>
                <Input
                  id="pixelId"
                  value={checkPixelId}
                  onChange={(e) => setCheckPixelId(e.target.value)}
                  placeholder="Enter pixel ID to check status..."
                  className="bg-white/80 border-gray-200 focus:border-green-400 focus:ring-green-400 transition-colors duration-300"
                />
              </div>
              <Button 
                onClick={() => checkPixelMutation.mutate(checkPixelId)}
                disabled={checkPixelMutation.isPending || !checkPixelId}
                className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-gradient disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkPixelMutation.isPending ? (
                  <>
                    <Clock className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-5 w-5" />
                    Check Status
                  </>
                )}
              </Button>
              <div className="text-center bg-white/50 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <p className="text-sm text-gray-700 font-medium">
                  📊 Get Detailed Analytics
                </p>
                <div className="flex justify-center gap-4 mt-2 text-xs text-gray-600">
                  <span>• View Count</span>
                  <span>• Duration Data</span>
                  <span>• Bot Detection</span>
                </div>
              </div>
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