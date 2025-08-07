import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Copy, TestTube, Eye, Home, ArrowRight, CheckCircle, Clock, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { Link, useLocation } from "wouter";

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

export default function TestPage() {
  const { toast } = useToast();
  const [pixelData, setPixelData] = useState<any>(null);
  const [trackingUrl, setTrackingUrl] = useState("");
  const [, setLocation] = useLocation();
  const [expandedPixels, setExpandedPixels] = useState<Set<string>>(new Set());

  // Fetch dashboard data to show existing pixels
  const { data: dashboardData, refetch } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const createTestPixel = async () => {
    try {
      const response = await fetch("/api/pixel/create");
      const data = await response.json();
      setPixelData(data);
      setTrackingUrl(data.trackingUrl);
      
      // Refetch dashboard data to show the new pixel
      refetch();
      
      toast({
        title: "Test Pixel Created",
        description: `ID: ${data.id}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create test pixel",
        variant: "destructive",
      });
    }
  };

  const testTracking = async () => {
    if (!trackingUrl) return;
    
    try {
      // Simulate opening the tracking pixel
      await fetch(trackingUrl);
      
      toast({
        title: "Tracking Pixel Loaded",
        description: "Check the server logs to see the tracking event",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load tracking pixel",
        variant: "destructive",
      });
    }
  };

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

  const goToDashboard = () => {
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="outline" className="mb-4">
              <Home className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <TestTube className="mr-3 h-8 w-8 text-primary" />
            Tracking Test Page
          </h1>
          <p className="text-muted-foreground mt-2">Test your email tracking pixels and view all created pixels</p>
          <p className="text-sm text-muted-foreground mt-1">Create new pixels, simulate email opens, and monitor tracking performance in real-time.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Test Pixel */}
          <Card>
            <CardHeader>
              <CardTitle>Create Test Pixel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={createTestPixel} className="w-full">
                Create New Test Pixel
              </Button>
              
              {pixelData && (
                <div className="space-y-3">
                  <div>
                    <Label>Pixel ID</Label>
                    <div className="flex items-center space-x-2">
                      <Input value={pixelData.id} readOnly className="font-mono text-sm" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(pixelData.id)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Tracking URL</Label>
                    <div className="flex items-center space-x-2">
                      <Input value={pixelData.trackingUrl} readOnly className="text-sm" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(pixelData.trackingUrl)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label>HTML Embed Code</Label>
                    <div className="flex items-center space-x-2">
                      <Input value={pixelData.embedCode} readOnly className="text-sm" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(pixelData.embedCode)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Action buttons after pixel creation */}
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={goToDashboard}
                      className="flex-1"
                      variant="outline"
                    >
                      <ArrowRight className="mr-2 h-4 w-4" />
                      View Dashboard
                    </Button>
                    <Button 
                      onClick={() => setPixelData(null)}
                      variant="outline"
                      className="flex-1"
                    >
                      Create Another
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>Test Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Test URL (Optional)</Label>
                <Input
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="Enter tracking URL to test"
                />
              </div>
              
              <Button 
                onClick={testTracking} 
                disabled={!trackingUrl}
                className="w-full"
              >
                <Eye className="mr-2 h-4 w-4" />
                Simulate Email Open
              </Button>
              
              <div className="text-sm text-muted-foreground">
                <p><strong>How to use:</strong></p>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>Create a test pixel above</li>
                  <li>Copy the HTML embed code</li>
                  <li>Add it to your email HTML</li>
                  <li>When someone opens the email, the tracking fires</li>
                  <li>Check the dashboard or use the pixel check API</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Reference */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>API Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Badge variant="outline" className="mb-2">GET</Badge>
                <p className="font-mono text-sm">/api/pixel/create</p>
                <p className="text-sm text-muted-foreground">Creates a new tracking pixel and returns ID, tracking URL, and embed code</p>
              </div>
              
              <div>
                <Badge variant="outline" className="mb-2">GET</Badge>
                <p className="font-mono text-sm">/api/pixel/:id</p>
                <p className="text-sm text-muted-foreground">Loads the tracking pixel (1x1 GIF) and marks as opened</p>
              </div>
              
              <div>
                <Badge variant="outline" className="mb-2">POST</Badge>
                <p className="font-mono text-sm">/api/pixel/check</p>
                <p className="text-sm text-muted-foreground">Check if a pixel has been opened (send {`{"id": "pixel-id"}`} in body)</p>
              </div>
              
              <div>
                <Badge variant="outline" className="mb-2">GET</Badge>
                <p className="font-mono text-sm">/api/dashboard</p>
                <p className="text-sm text-muted-foreground">Get overall statistics and recent pixels</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Existing Pixels */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-3 h-5 w-5 text-primary" />
              📊 All Tracking Pixels
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!dashboardData?.recentPixels || dashboardData.recentPixels.length === 0 ? (
              <div className="text-center py-8">
                <TestTube className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No tracking pixels created yet</p>
                <p className="text-gray-400 text-sm">Create your first pixel above to start testing!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData.recentPixels.map((pixel) => {
                  // Generate URLs for each pixel
                  const baseUrl = window.location.origin;
                  const trackingUrl = `${baseUrl}/api/pixel/${pixel.id}`;
                  const embedCode = `<img src="${trackingUrl}" width="1" height="1" style="display:none;" />`;
                  const isExpanded = expandedPixels.has(pixel.id);
                  
                  return (
                    <div key={pixel.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="space-y-3">
                        {/* Header with ID and status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center">
                              {pixel.opened ? (
                                <div className="p-2 bg-green-100 rounded-full">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </div>
                              ) : (
                                <div className="p-2 bg-gray-100 rounded-full">
                                  <Clock className="h-4 w-4 text-gray-500" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-mono text-sm font-semibold text-gray-800">{pixel.id}</p>
                              <p className="text-sm text-gray-600">
                                📅 Created {formatTimestamp(pixel.createdAt)}
                                {pixel.opened && pixel.openedAt && (
                                  <> • 👀 Opened {formatTimestamp(pixel.openedAt)}</>
                                )}
                              </p>
                              {pixel.opened && (
                                <p className="text-xs text-gray-500 mt-1">
                                  👁️ Views: {pixel.viewCount} • ⏱️ Time: {formatDuration(pixel.totalViewTime)}
                                  {pixel.lastSeenAt && (
                                    <> • 🕐 Last seen: {formatTimestamp(pixel.lastSeenAt)}</>
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={pixel.opened ? "default" : "secondary"}
                              className={pixel.opened ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                            >
                              {pixel.opened ? "✅ Opened" : "⏳ Pending"}
                            </Badge>
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
                                <Input value={trackingUrl} readOnly className="text-xs" />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(trackingUrl)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {/* HTML Embed Code */}
                            <div>
                              <Label className="text-xs text-gray-600 font-medium">HTML Embed Code</Label>
                              <div className="flex items-center space-x-2 mt-1">
                                <Input value={embedCode} readOnly className="text-xs" />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(embedCode)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
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