"use client";

import { useEffect, useRef, useState } from "react";

interface Camera {
  id: string;
  lat: number;
  lng: number;
}

interface SpeedCameraAlertProps {
  cameras: Camera[];
  userLat: number;
  userLng: number;
  isDarkMode: boolean;
}

function getDistanceInMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  if (meters >= 100) return `${Math.round(meters / 50) * 50} m`;
  return `${Math.round(meters / 10) * 10} m`;
}

const ALERT_DISTANCE = 500; // meters — alert when within 500m
const COOLDOWN_MS = 15000; // 15 seconds before same camera can alert again

export function SpeedCameraAlert({ cameras, userLat, userLng, isDarkMode }: SpeedCameraAlertProps) {
  const [alert, setAlert] = useState<{ distance: number } | null>(null);
  const alertedIds = useRef<Map<string, number>>(new Map());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !audioRef.current) {
      audioRef.current = new Audio("/alert-sound.mp3");
    }
  }, []);

  useEffect(() => {
    if (!cameras || cameras.length === 0) return;

    const now = Date.now();
    let closestDistance = Infinity;
    let triggered = false;

    for (const camera of cameras) {
      const distance = getDistanceInMeters(userLat, userLng, camera.lat, camera.lng);

      if (distance <= ALERT_DISTANCE) {
        // Check cooldown
        const lastAlerted = alertedIds.current.get(camera.id) || 0;
        if (now - lastAlerted < COOLDOWN_MS) continue;

        // Trigger alert
        alertedIds.current.set(camera.id, now);
        triggered = true;

        if (distance < closestDistance) {
          closestDistance = distance;
        }

        // Play sound
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }
      }
    }

    if (triggered) {
      setAlert({ distance: closestDistance });
      setTimeout(() => setAlert(null), 6000);
    }
  }, [userLat, userLng, cameras]);

  if (!alert) return null;

  return (
    <div
      className={`
        fixed bottom-28 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-4 px-6 py-4 rounded-2xl
        shadow-2xl border backdrop-blur-xl
        animate-bounce-in
        ${isDarkMode
          ? "bg-amber-500/20 border-amber-400/40 text-white"
          : "bg-amber-50 border-amber-400 text-black"}
      `}
    >
      {/* Camera icon */}
      <div className="flex-shrink-0">
        <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
        </svg>
      </div>

      <div className="flex flex-col">
        <span className="text-lg font-bold tracking-wide text-amber-400">SPEED CAMERA</span>
        <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
          {formatDistance(alert.distance)} ahead
        </span>
      </div>
    </div>
  );
}
