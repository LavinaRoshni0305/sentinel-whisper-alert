import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmergencyButton } from "@/components/EmergencyButton";
import { ContactManager } from "@/components/ContactManager";
import { DetectionSettings, type DetectionSettings as DetectionSettingsType } from "@/components/DetectionSettings";
import { LocationTracker } from "@/components/LocationTracker";
import { 
  Shield, 
  Users, 
  Settings, 
  MapPin, 
  Activity,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
}

const Index = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [detectionSettings, setDetectionSettings] = useState<DetectionSettingsType | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const { toast } = useToast();

  useEffect(() => {
    // Auto-start monitoring if conditions are met
    if (contacts.length > 0 && location && detectionSettings) {
      const enabledMethods = Object.entries(detectionSettings).filter(
        ([key, value]) => key.includes('Enabled') && value
      ).length;
      
      if (enabledMethods > 0) {
        setIsMonitoring(true);
      }
    }
  }, [contacts, location, detectionSettings]);

  const handleEmergency = async () => {
    setEmergencyMode(true);
    
    // Create emergency message
    const locationText = location 
      ? `Location: ${location.address || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`} (±${location.accuracy.toFixed(0)}m accuracy)`
      : "Location: Unable to determine current location";
    
    const message = `🚨 EMERGENCY ALERT 🚨\n\nThis is an automated emergency message. The person you are receiving this from may need immediate assistance.\n\n${locationText}\n\nTime: ${new Date().toLocaleString()}\n\nPlease check on them immediately or contact emergency services if needed.\n\n⚠️ This message was sent automatically by their Emergency Response App.`;

    // Simulate sending alerts to contacts
    for (const contact of contacts) {
      console.log(`Sending emergency alert to ${contact.name} (${contact.phone}):`, message);
      
      // In a real app, you would integrate with SMS/email services here
      // For now, we'll just log and show toast notifications
    }

    toast({
      title: "Emergency Alert Sent!",
      description: `Alert sent to ${contacts.length} emergency contact${contacts.length !== 1 ? 's' : ''}`,
      variant: "destructive",
    });

    // Auto-deactivate emergency mode after 5 minutes
    setTimeout(() => {
      setEmergencyMode(false);
      toast({
        title: "Emergency Mode Deactivated",
        description: "Emergency monitoring resumed normally",
      });
    }, 300000);
  };

  const getSystemStatus = () => {
    if (emergencyMode) return { text: 'Emergency Active', color: 'emergency', icon: AlertTriangle };
    if (isMonitoring) return { text: 'Monitoring Active', color: 'safe', icon: CheckCircle2 };
    return { text: 'System Inactive', color: 'warning', icon: Activity };
  };

  const status = getSystemStatus();
  const StatusIcon = status.icon;

  const enabledDetectionMethods = detectionSettings ? 
    Object.entries(detectionSettings).filter(([key, value]) => key.includes('Enabled') && value).length : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-gradient-to-r from-card to-muted/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emergency to-accent bg-clip-text text-transparent">
                Guardian AI
              </h1>
              <p className="text-muted-foreground mt-1">
                Advanced Emergency Response System
              </p>
            </div>
            <Badge 
              variant="outline" 
              className={`text-lg px-4 py-2 border-${status.color}/50 text-${status.color} animate-glow`}
            >
              <StatusIcon className={`w-5 h-5 mr-2 ${emergencyMode ? 'animate-pulse' : ''}`} />
              {status.text}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-card/50 border border-border/50">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="detection" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Detection
            </TabsTrigger>
            <TabsTrigger value="location" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="text-center space-y-8">
              <EmergencyButton
                onEmergency={handleEmergency}
                isActive={isMonitoring}
                emergencyMode={emergencyMode}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <Card className="border-emergency/20 bg-gradient-to-br from-card to-emergency/5">
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                      <Users className="w-5 h-5 text-emergency" />
                      Emergency Contacts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-emergency">
                        {contacts.length}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {contacts.length === 0 ? 'No contacts configured' : 'Contacts ready'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-accent/20 bg-gradient-to-br from-card to-accent/5">
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                      <Activity className="w-5 h-5 text-accent" />
                      Detection Methods
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-accent">
                        {enabledDetectionMethods}/4
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Active detection systems
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-safe/20 bg-gradient-to-br from-card to-safe/10">
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                      <MapPin className="w-5 h-5 text-safe" />
                      Location Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-safe">
                        {location ? '✓' : '✗'}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {location ? 'Location available' : 'Location needed'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {!isMonitoring && (
                <Card className="border-warning/30 bg-gradient-to-br from-card to-warning/5 max-w-2xl mx-auto">
                  <CardContent className="text-center py-6">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-warning" />
                    <h3 className="text-lg font-semibold mb-2">Setup Required</h3>
                    <p className="text-muted-foreground mb-4">
                      Complete setup to activate emergency monitoring:
                    </p>
                    <div className="space-y-2 text-sm">
                      {contacts.length === 0 && (
                        <p className="text-warning">• Add emergency contacts</p>
                      )}
                      {!location && (
                        <p className="text-warning">• Enable location tracking</p>
                      )}
                      {enabledDetectionMethods === 0 && (
                        <p className="text-warning">• Configure detection methods</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="contacts">
            <ContactManager onContactsChange={setContacts} />
          </TabsContent>

          <TabsContent value="detection">
            <DetectionSettings onSettingsChange={setDetectionSettings} />
          </TabsContent>

          <TabsContent value="location">
            <LocationTracker onLocationUpdate={setLocation} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;