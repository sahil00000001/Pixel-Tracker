import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Copy, TestTube, Eye } from "lucide-react";

export default function TestPage() {
  const { toast } = useToast();
  const [pixelData, setPixelData] = useState<any>(null);
  const [trackingUrl, setTrackingUrl] = useState("");

  const createTestPixel = async () => {
    try {
      const response = await fetch("/api/pixel/create");
      const data = await response.json();
      setPixelData(data);
      setTrackingUrl(data.trackingUrl);
      
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <TestTube className="mr-3 h-8 w-8 text-primary" />
            Tracking Test Page
          </h1>
          <p className="text-muted-foreground mt-2">Test your email tracking pixels</p>
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
      </div>
    </div>
  );
}