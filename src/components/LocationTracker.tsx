import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
}

interface LocationTrackerProps {
  onLocationUpdate: (location: LocationData | null) => void;
}

export const LocationTracker = ({ onLocationUpdate }: LocationTrackerProps) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const { toast } = useToast();

  useEffect(() => {
    checkPermission();
    getCurrentLocation();
  }, []);

  const checkPermission = async () => {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setPermissionStatus(permission.state === 'granted' ? 'granted' : 'denied');
        
        permission.addEventListener('change', () => {
          setPermissionStatus(permission.state === 'granted' ? 'granted' : 'denied');
        });
      } catch (error) {
        console.error('Error checking geolocation permission:', error);
      }
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        };

        // Try to get readable address
        try {
          const address = await reverseGeocode(locationData.latitude, locationData.longitude);
          locationData.address = address;
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
        }

        setLocation(locationData);
        onLocationUpdate(locationData);
        setLoading(false);
        setPermissionStatus('granted');
        
        toast({
          title: "Location Updated",
          description: "Your current location has been captured successfully.",
        });
      },
      (error) => {
        setLoading(false);
        setPermissionStatus('denied');
        
        let errorMessage = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        
        setError(errorMessage);
        onLocationUpdate(null);
        
        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    // Using a simple reverse geocoding service
    // In production, you'd want to use a proper service like Google Maps API
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const formatAccuracy = (accuracy: number) => {
    if (accuracy < 1000) {
      return `±${accuracy.toFixed(0)}m`;
    }
    return `±${(accuracy / 1000).toFixed(1)}km`;
  };

  const getLocationStatus = () => {
    if (loading) return { text: 'Getting Location...', color: 'warning', icon: RefreshCw };
    if (error) return { text: 'Location Unavailable', color: 'destructive', icon: AlertCircle };
    if (location) return { text: 'Location Active', color: 'safe', icon: CheckCircle };
    return { text: 'Location Not Set', color: 'warning', icon: AlertCircle };
  };

  const status = getLocationStatus();
  const StatusIcon = status.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-emergency to-accent bg-clip-text text-transparent">
          Location Tracking
        </h2>
        <Badge 
          variant="outline" 
          className={`border-${status.color}/50 text-${status.color}`}
        >
          <StatusIcon className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
          {status.text}
        </Badge>
      </div>

      <Card className="border-emergency/20 bg-gradient-to-br from-card to-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emergency" />
            Current Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="text-center py-6">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-destructive" />
              <p className="text-destructive font-medium">{error}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please enable location access in your browser settings
              </p>
            </div>
          ) : location ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Coordinates
                  </label>
                  <p className="font-mono text-sm">
                    {formatCoordinates(location.latitude, location.longitude)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Accuracy
                  </label>
                  <p className="text-sm">
                    {formatAccuracy(location.accuracy)}
                  </p>
                </div>
              </div>
              
              {location.address && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Address
                  </label>
                  <p className="text-sm">{location.address}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Last Updated
                </label>
                <p className="text-sm">
                  {new Date(location.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <MapPin className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">
                Location not yet determined
              </p>
            </div>
          )}
          
          <Button
            onClick={getCurrentLocation}
            disabled={loading}
            className="w-full bg-gradient-to-r from-emergency to-accent"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Getting Location...
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 mr-2" />
                Update Location
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-accent/20 bg-gradient-to-br from-card to-accent/5">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Privacy Notice:</strong> Your location is only stored locally on your device 
            and shared with emergency contacts only during an emergency alert.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};