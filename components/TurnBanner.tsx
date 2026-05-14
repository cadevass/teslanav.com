"use client";

import { useEffect, useState } from "react";
import type { RouteStep } from "@/types/route";

interface TurnBannerProps {
  steps: RouteStep[];
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

function formatStepDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  if (meters >= 100) return `${Math.round(meters / 50) * 50} m`;
  return `${Math.round(meters / 10) * 10} m`;
}

function getTurnArrow(type: string, modifier?: string): string {
  if (type === "arrive") return "🏁";
  if (type === "depart") return "🚀";
  if (type === "roundabout" || type === "rotary") return "🔄";
  if (!modifier) return "⬆️";
  switch (modifier) {
    case "left": return "⬅️";
    case "slight left": return "↖️";
    case "sharp left": return "◀️";
    case "right": return "➡️";
    case "slight right": return "↗️";
    case "sharp right": return "▶️";
    case "uturn": return "↩️";
    case "straight": return "⬆️";
    default: return "⬆️";
  }
}

export function TurnBanner({ steps, userLat, userLng, isDarkMode }: TurnBannerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [distanceToNext, setDistanceToNext] = useState<number | null>(null);

  useEffect(() => {
    if (!steps || steps.length === 0) return;

    // Walk through steps and find which one we're currently on
    // by accumulating coordinates along the route
    // Simple approach: find the step whose cumulative distance best matches our progress
    let bestStep = 0;
    let bestDistance = Infinity;

    // Build cumulative distances for each step endpoint
    let cumulative = 0;
    const stepDistances: number[] = [];
    for (const step of steps) {
      cumulative += step.distance;
      stepDistances.push(cumulative);
    }

    // Find which step we're closest to completing
    for (let i = 0; i < steps.length - 1; i++) {
      const step = steps[i];
      // Estimate distance remaining in this step
      // We use the step's distance as a proxy
      const distToEnd = step.distance;
      if (distToEnd < bestDistance) {
        bestDistance = distToEnd;
        bestStep = i;
      }
    }

    setCurrentStepIndex(bestStep);
    setDistanceToNext(steps[bestStep]?.distance ?? null);
  }, [userLat, userLng, steps]);

  const currentStep = steps[currentStepIndex];
  const nextStep = steps[currentStepIndex + 1];

  if (!currentStep) return null;

  const arrow = getTurnArrow(currentStep.maneuver.type, currentStep.maneuver.modifier);
  const distance = distanceToNext !== null ? formatStepDistance(distanceToNext) : "";

  return (
    <div
      className={`
        absolute top-4 left-1/2 -translate-x-1/2 z-30
        flex flex-col gap-1 min-w-[320px] max-w-[480px] w-auto
        rounded-2xl backdrop-blur-xl shadow-2xl border px-5 py-4
        ${isDarkMode
          ? "bg-[#1a1a1a]/90 text-white border-white/10"
          : "bg-white/90 text-black border-black/10"}
      `}
    >
      {/* Current instruction */}
      <div className="flex items-center gap-3">
        <span className="text-4xl leading-none">{arrow}</span>
        <div className="flex flex-col">
          <span className="text-xl font-bold leading-tight">{currentStep.instruction}</span>
          {distance && (
            <span className={`text-sm font-medium ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
              in {distance}
            </span>
          )}
        </div>
      </div>

      {/* Next step preview */}
      {nextStep && currentStep.maneuver.type !== "arrive" && (
        <div className={`flex items-center gap-2 pt-2 mt-1 border-t ${isDarkMode ? "border-white/10 text-gray-400" : "border-black/10 text-gray-500"}`}>
          <span className="text-sm">Then:</span>
          <span className="text-sm font-medium truncate">{nextStep.instruction}</span>
        </div>
      )}
    </div>
  );
}
