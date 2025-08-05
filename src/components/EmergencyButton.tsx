import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmergencyButtonProps {
  onEmergency: () => void;
  isActive: boolean;
  emergencyMode: boolean;
}

export const EmergencyButton = ({ onEmergency, isActive, emergencyMode }: EmergencyButtonProps) => {
  const [countdown, setCountdown] = useState<number | null>(null);
  const { toast } = useToast();

  const handleEmergencyTrigger = () => {
    if (emergencyMode) return;
    
    let count = 3;
    setCountdown(count);
    
    const timer = setInterval(() => {
      count--;
      setCountdown(count);
      
      if (count === 0) {
        clearInterval(timer);
        setCountdown(null);
        onEmergency();
        toast({
          title: "Emergency Alert Sent!",
          description: "Your emergency contacts have been notified.",
          variant: "destructive",
        });
      }
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="relative">
        <Button
          onClick={handleEmergencyTrigger}
          disabled={countdown !== null || emergencyMode}
          className={`
            relative w-32 h-32 rounded-full text-lg font-bold transition-all duration-300
            ${emergencyMode 
              ? 'bg-gradient-to-br from-emergency to-accent animate-pulse-emergency' 
              : isActive
                ? 'bg-gradient-to-br from-emergency to-accent hover:scale-105 shadow-lg'
                : 'bg-gradient-to-br from-muted to-secondary hover:scale-105'
            }
            ${countdown !== null ? 'animate-shake' : ''}
          `}
          style={{
            boxShadow: emergencyMode ? 'var(--shadow-emergency)' : isActive ? 'var(--shadow-glow)' : 'var(--shadow-card)'
          }}
        >
          {countdown !== null ? (
            <span className="text-4xl font-bold text-white animate-glow">{countdown}</span>
          ) : emergencyMode ? (
            <div className="flex flex-col items-center">
              <AlertTriangle className="w-8 h-8 mb-2 text-white animate-glow" />
              <span className="text-sm">ACTIVE</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {isActive ? (
                <Shield className="w-8 h-8 mb-2" />
              ) : (
                <Phone className="w-8 h-8 mb-2" />
              )}
              <span className="text-sm">SOS</span>
            </div>
          )}
        </Button>
        
        {(isActive || emergencyMode) && (
          <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-emergency/20 to-accent/20 animate-spin" style={{ animationDuration: '3s' }} />
        )}
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          {emergencyMode 
            ? "Emergency mode active - contacts notified"
            : countdown !== null
              ? "Triggering emergency alert..."
              : isActive
                ? "Monitoring for emergency signals"
                : "Press and hold for emergency"
          }
        </p>
        {!emergencyMode && (
          <p className="text-xs text-muted-foreground">
            Voice, gesture, or motion detection active
          </p>
        )}
      </div>
    </div>
  );
};