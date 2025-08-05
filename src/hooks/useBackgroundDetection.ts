import { useState, useEffect, useRef } from 'react';
import { useToast } from './use-toast';

// Type declarations for browser APIs
declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

declare var webkitSpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

interface DeviceMotionEventWithPermission extends DeviceMotionEvent {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

interface DetectionSettings {
  voiceEnabled: boolean;
  blinkEnabled: boolean;
  gestureEnabled: boolean;
  motionEnabled: boolean;
  voiceSensitivity: number;
  motionSensitivity: number;
  emergencyKeywords: string[];
}

interface BackgroundDetectionHook {
  isBackgroundActive: boolean;
  startBackgroundDetection: () => Promise<void>;
  stopBackgroundDetection: () => void;
  detectionStatus: {
    voice: boolean;
    motion: boolean;
    camera: boolean;
  };
}

export const useBackgroundDetection = (
  settings: DetectionSettings | null,
  onEmergencyDetected: () => void
): BackgroundDetectionHook => {
  const [isBackgroundActive, setIsBackgroundActive] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState({
    voice: false,
    motion: false,
    camera: false
  });

  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const motionListenerRef = useRef<((event: DeviceMotionEvent) => void) | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    return () => {
      stopBackgroundDetection();
    };
  }, []);

  const startVoiceDetection = async () => {
    if (!settings?.voiceEnabled || !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return false;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('')
          .toLowerCase();

        // Check for emergency keywords
        const hasEmergencyKeyword = settings.emergencyKeywords.some(keyword => 
          transcript.includes(keyword.toLowerCase())
        );

        if (hasEmergencyKeyword) {
          console.log('Emergency keyword detected:', transcript);
          onEmergencyDetected();
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          toast({
            title: "Microphone Access Denied",
            description: "Please enable microphone access for voice detection",
            variant: "destructive",
          });
        }
      };

      recognition.onend = () => {
        // Restart recognition for continuous monitoring
        if (isBackgroundActive && settings?.voiceEnabled) {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (error) {
              console.error('Failed to restart speech recognition:', error);
            }
          }, 1000);
        }
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
      return true;
    } catch (error) {
      console.error('Voice detection setup failed:', error);
      return false;
    }
  };

  const startMotionDetection = async () => {
    if (!settings?.motionEnabled) return false;

    try {
      // Request device motion permission on iOS
      if (typeof DeviceMotionEvent !== 'undefined' && 'requestPermission' in DeviceMotionEvent) {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission !== 'granted') {
          toast({
            title: "Motion Access Denied",
            description: "Please enable device motion access for shake detection",
            variant: "destructive",
          });
          return false;
        }
      }

      let lastShakeTime = 0;
      const shakeThreshold = (100 - settings.motionSensitivity) / 10; // Convert to acceleration threshold

      const handleMotion = (event: DeviceMotionEvent) => {
        const { acceleration } = event;
        if (!acceleration) return;

        const { x = 0, y = 0, z = 0 } = acceleration;
        const totalAcceleration = Math.sqrt(x * x + y * y + z * z);

        if (totalAcceleration > shakeThreshold) {
          const now = Date.now();
          if (now - lastShakeTime > 2000) { // Prevent multiple triggers
            console.log('Emergency shake detected:', totalAcceleration);
            lastShakeTime = now;
            onEmergencyDetected();
          }
        }
      };

      window.addEventListener('devicemotion', handleMotion);
      motionListenerRef.current = handleMotion;
      return true;
    } catch (error) {
      console.error('Motion detection setup failed:', error);
      return false;
    }
  };

  const startCameraDetection = async () => {
    if (!settings?.blinkEnabled && !settings?.gestureEnabled) return false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      videoStreamRef.current = stream;
      
      // In a real implementation, you would use computer vision libraries
      // like MediaPipe or TensorFlow.js for gesture and blink detection
      console.log('Camera detection active for gestures and blinks');
      
      return true;
    } catch (error) {
      console.error('Camera detection setup failed:', error);
      if (error instanceof Error && error.name === 'NotAllowedError') {
        toast({
          title: "Camera Access Denied",
          description: "Please enable camera access for gesture and blink detection",
          variant: "destructive",
        });
      }
      return false;
    }
  };

  const startBackgroundDetection = async () => {
    if (!settings) {
      toast({
        title: "Configuration Required",
        description: "Please configure detection settings first",
        variant: "destructive",
      });
      return;
    }

    setIsBackgroundActive(true);

    const status = {
      voice: false,
      motion: false,
      camera: false
    };

    // Start enabled detection methods
    if (settings.voiceEnabled) {
      status.voice = await startVoiceDetection();
    }

    if (settings.motionEnabled) {
      status.motion = await startMotionDetection();
    }

    if (settings.blinkEnabled || settings.gestureEnabled) {
      status.camera = await startCameraDetection();
    }

    setDetectionStatus(status);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    toast({
      title: "Background Detection Active",
      description: "Zero Touch SOS is now monitoring for emergencies in the background",
    });
  };

  const stopBackgroundDetection = () => {
    setIsBackgroundActive(false);

    // Stop voice recognition
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      speechRecognitionRef.current = null;
    }

    // Stop motion detection
    if (motionListenerRef.current) {
      window.removeEventListener('devicemotion', motionListenerRef.current);
      motionListenerRef.current = null;
    }

    // Stop camera stream
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => track.stop());
      videoStreamRef.current = null;
    }

    setDetectionStatus({
      voice: false,
      motion: false,
      camera: false
    });

    toast({
      title: "Background Detection Stopped",
      description: "Emergency monitoring has been deactivated",
    });
  };

  return {
    isBackgroundActive,
    startBackgroundDetection,
    stopBackgroundDetection,
    detectionStatus
  };
};