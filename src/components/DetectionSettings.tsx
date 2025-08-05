import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  Eye, 
  Hand, 
  Zap, 
  Settings, 
  Volume2,
  Gauge
} from "lucide-react";

interface DetectionSettingsProps {
  onSettingsChange: (settings: DetectionSettings) => void;
}

export interface DetectionSettings {
  voiceEnabled: boolean;
  blinkEnabled: boolean;
  gestureEnabled: boolean;
  motionEnabled: boolean;
  voiceSensitivity: number;
  motionSensitivity: number;
  emergencyKeywords: string[];
}

export const DetectionSettings = ({ onSettingsChange }: DetectionSettingsProps) => {
  const [settings, setSettings] = useState<DetectionSettings>({
    voiceEnabled: true,
    blinkEnabled: true,
    gestureEnabled: true,
    motionEnabled: true,
    voiceSensitivity: 70,
    motionSensitivity: 60,
    emergencyKeywords: ["help", "emergency", "call 911", "danger"]
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('detection_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      onSettingsChange(parsed);
    }
  }, [onSettingsChange]);

  const updateSettings = (newSettings: Partial<DetectionSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('detection_settings', JSON.stringify(updated));
    onSettingsChange(updated);
  };

  const detectionMethods = [
    {
      id: 'voice',
      title: 'Voice Detection',
      description: 'Detects emergency keywords and distress calls',
      icon: Mic,
      enabled: settings.voiceEnabled,
      onToggle: (enabled: boolean) => updateSettings({ voiceEnabled: enabled }),
      sensitivity: settings.voiceSensitivity,
      onSensitivityChange: (value: number[]) => updateSettings({ voiceSensitivity: value[0] })
    },
    {
      id: 'blink',
      title: 'Blink Pattern Detection',
      description: 'Recognizes specific blink patterns for silent alerts',
      icon: Eye,
      enabled: settings.blinkEnabled,
      onToggle: (enabled: boolean) => updateSettings({ blinkEnabled: enabled })
    },
    {
      id: 'gesture',
      title: 'Hand Gesture Recognition',
      description: 'Detects predefined emergency hand signals',
      icon: Hand,
      enabled: settings.gestureEnabled,
      onToggle: (enabled: boolean) => updateSettings({ gestureEnabled: enabled })
    },
    {
      id: 'motion',
      title: 'Motion & Shake Detection',
      description: 'Responds to device shaking and sudden movements',
      icon: Zap,
      enabled: settings.motionEnabled,
      onToggle: (enabled: boolean) => updateSettings({ motionEnabled: enabled }),
      sensitivity: settings.motionSensitivity,
      onSensitivityChange: (value: number[]) => updateSettings({ motionSensitivity: value[0] })
    }
  ];

  const enabledCount = detectionMethods.filter(method => method.enabled).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-emergency to-accent bg-clip-text text-transparent">
          Detection Settings
        </h2>
        <Badge 
          variant="outline" 
          className={`${enabledCount > 0 ? 'border-safe/50 text-safe' : 'border-warning/50 text-warning'}`}
        >
          {enabledCount}/4 Methods Active
        </Badge>
      </div>

      <div className="grid gap-4">
        {detectionMethods.map((method) => {
          const IconComponent = method.icon;
          return (
            <Card 
              key={method.id} 
              className={`border transition-all duration-300 ${
                method.enabled 
                  ? 'border-emergency/30 bg-gradient-to-br from-card to-emergency/5' 
                  : 'border-muted/30 bg-gradient-to-br from-card to-muted/30'
              }`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      method.enabled 
                        ? 'bg-emergency/20 text-emergency' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{method.title}</h3>
                      <p className="text-sm text-muted-foreground font-normal">
                        {method.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={method.enabled}
                    onCheckedChange={method.onToggle}
                    className="data-[state=checked]:bg-emergency"
                  />
                </CardTitle>
              </CardHeader>
              
              {method.enabled && method.sensitivity && method.onSensitivityChange && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <Gauge className="w-4 h-4" />
                        Sensitivity
                      </label>
                      <span className="text-sm text-muted-foreground">
                        {method.sensitivity}%
                      </span>
                    </div>
                    <Slider
                      value={[method.sensitivity]}
                      onValueChange={method.onSensitivityChange}
                      max={100}
                      min={10}
                      step={10}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="border-accent/20 bg-gradient-to-br from-card to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Volume2 className="w-5 h-5 text-accent" />
            Emergency Keywords
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {settings.emergencyKeywords.map((keyword, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="border-accent/30 text-accent"
              >
                "{keyword}"
              </Badge>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Voice detection will trigger when these words are detected
          </p>
        </CardContent>
      </Card>

      {enabledCount === 0 && (
        <Card className="border-warning/30 bg-gradient-to-br from-card to-warning/5">
          <CardContent className="text-center py-6">
            <Settings className="w-8 h-8 mx-auto mb-3 text-warning" />
            <p className="text-warning font-medium">No detection methods are enabled</p>
            <p className="text-sm text-muted-foreground mt-1">
              Enable at least one method to monitor for emergencies
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};