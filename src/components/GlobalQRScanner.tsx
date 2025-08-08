import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Square, List, X } from 'lucide-react';
import { Language, Song } from '../types';
import { translations } from '../data/translations';
import jsQR from 'jsqr';

interface GlobalQRScannerProps {
  currentLanguage: Language;
  songs: Song[];
  onSongFound: (song: Song) => void;
  onNoMatch: (qrData: string) => void;
  onClose: () => void;
  autoStart?: boolean;
}

export const GlobalQRScanner: React.FC<GlobalQRScannerProps> = ({
  currentLanguage,
  songs,
  onSongFound,
  onNoMatch,
  onClose,
  autoStart = false
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<number | null>(null);

  // Auto-start scanning when autoStart prop is true
  useEffect(() => {
    if (autoStart && !isScanning && !scannerError) {
      startScanning();
    }
  }, [autoStart]);

  // Set up video stream when available
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        if (videoRef.current) {
          videoRef.current.play();
          // Start scanning once video is ready
          scanForQRCode();
        }
      };
    }
  }, [stream]);

  const startScanning = async () => {
    try {
      setScannerError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      setIsScanning(true);
    } catch (error) {
      setScannerError(`Unable to access camera: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    setScannerError(null);
  };

  // Stop stream when scanning stops
  useEffect(() => {
    if (!isScanning && stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      if (scanIntervalRef.current) {
        clearTimeout(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    }
  }, [isScanning, stream]);

  const scanForQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      try {
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          // Stop scanning when QR code is found
          stopScanning();
          handleQRCodeDetected(code.data);
          return;
        }
      } catch (error) {
        // Ignore canvas errors and continue scanning
      }
    }

    // Continue scanning
    if (isScanning) {
      scanIntervalRef.current = window.setTimeout(scanForQRCode, 100);
    }
  };

  const handleQRCodeDetected = (qrData: string) => {
    // Look for a match in the song list
    const foundSong = songs.find(song => 
      song.hitster_url === qrData || 
      song.spotify_url === qrData ||
      song.youtube_url === qrData ||
      song.apple_music_url === qrData
    );
    
    if (foundSong) {
      onSongFound(foundSong);
    } else {
      onNoMatch(qrData);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (scanIntervalRef.current) {
        clearTimeout(scanIntervalRef.current);
      }
    };
  }, [stream]);

  const t = translations[currentLanguage];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">{t.scanQRCode}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {scannerError ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">{scannerError}</div>
              <button
                onClick={startScanning}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t.tryAgain}
              </button>
            </div>
          ) : !isScanning ? (
            <div className="text-center py-8">
              <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">{t.readyToScan}</p>
              <button
                onClick={startScanning}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <QrCode className="w-5 h-5" />
                {t.startScanning}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-square">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                
                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <Square className="w-48 h-48 text-white opacity-50" strokeWidth={2} />
                    <div className="absolute inset-0 border-2 border-blue-500 rounded-lg animate-pulse" />
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-gray-600 mb-4">{t.pointCameraAtQR}</p>
                <button
                  onClick={stopScanning}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  {t.stopScanning}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};