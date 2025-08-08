@@ .. @@
 import React, { useState, useEffect, useRef } from 'react';
 import { QrCode, Square, List, X } from 'lucide-react';
 import { Language, Song } from '../types';
 import { translations } from '../data/translations';
 import jsQR from 'jsqr';
 
-interface QRScannerProps {
+interface GlobalQRScannerProps {
   currentLanguage: Language;
   songs: Song[];
   onSongFound: (song: Song) => void;
@@ -13,7 +13,7 @@ interface QRScannerProps {
   autoStart?: boolean;
 }
 
-export const QRScanner: React.FC<QRScannerProps> = ({
+export const GlobalQRScanner: React.FC<GlobalQRScannerProps> = ({
   currentLanguage,
   songs,
   onSongFound,
@@ .. @@
     // Auto-start scanning when autoStart prop is true
     useEffect(() => {
       if (autoStart && !isScanning && scannerError) {
-        console.log('🎥 Auto-starting QR scanner...');
         startScanning();
       }
     }, [autoStart]);
@@ .. @@
   const startScanning = async () => {
     try {
-      console.log('🎥 Starting camera...');
       setScannerError(null);
       const mediaStream = await navigator.mediaDevices.getUserMedia({
@@ .. @@
         }
       });
       
-      console.log('✅ Camera stream obtained:', mediaStream);
       setStream(mediaStream);
       setIsScanning(true);
     } catch (error) {
-      console.error('❌ Error accessing camera:', error);
       setScannerError(`Unable to access camera: ${error instanceof Error ? error.message : 'Unknown error'}`);
     }
   };
 
   const stopScanning = () => {
-    console.log('🛑 Stopping scanner...');
     setIsScanning(false);
     setScannerError(null);
   };
@@ .. @@
   const scanForQRCode = () => {
     if (!videoRef.current || !canvasRef.current || !isScanning) {
-      console.log('Scan conditions not met:', {
-        hasVideo: !!videoRef.current,
-        hasCanvas: !!canvasRef.current,
-        isScanning
-      });
       return;
     }
@@ .. @@
         const code = jsQR(imageData.data, imageData.width, imageData.height);
         
         if (code) {
-          console.log('📱 QR Code detected:', code.data);
           // Stop scanning when QR code is found
           stopScanning();
           handleQRCodeDetected(code.data);
           return;
         }
       }
-    } else {
-      console.log('Video not ready, readyState:', video.readyState);
     }
 
     // Continue scanning
@@ .. @@
   };
 
   const handleQRCodeDetected = (qrData: string) => {
-    console.log('🎵 Processing QR code:', qrData);
-    
     // Look for a match in the song list
     const foundSong = songs.find(song => 
       song.hitster_url === qrData || 
@@ .. @@
     );
     
     if (foundSong) {
-      console.log('✅ Match found:', foundSong);
       onSongFound(foundSong);
     } else {
-      console.log('❌ No match found for:', qrData);
       onNoMatch(qrData);
     }
   };
@@ .. @@
   // Cleanup on unmount
   useEffect(() => {
     return () => {
-      console.log('🧹 QRScanner unmounting, cleaning up...');
       if (stream) {
         stream.getTracks().forEach(track => track.stop());
       }