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

function getTurnArrow(type: string, modifier?: string): React.ReactNode {
  const cls = "w-10 h-10 text-blue-400";
  if (type === "arrive") return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;
  if (type === "depart") return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>;
  if (type === "roundabout" || type === "rotary") return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;
  if (modifier === "left" || modifier === "sharp left") return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>;
  if (modifier === "slight left") return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18M3 12V6"/></svg>;
  if (modifier === "right" || modifier === "sharp right") return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>;
  if (modifier === "slight right") return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H3M21 12V6"/></svg>;
  if (modifier === "uturn") return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>;
  return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>;
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
        <div className="flex-shrink-0">{arrow}</div>
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
