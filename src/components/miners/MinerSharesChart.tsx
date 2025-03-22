"use client";

import React from "react";
import "chartjs-adapter-date-fns";
import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  // Type imports for TS
  ChartData,
  ChartOptions,
  TooltipItem,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register Chart.js + Filler
ChartJS.register(TimeScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

/** 1) Domain type from your API: "MinerBlock" data points */
interface MinerBlock {
  timestamp: number;    // in seconds
  height: number;
  valid_shares: number;
  invalid_shares: number; // or "reject" shares
  stale_shares: number;
}

/** 2) The exact shape for Chart.js data points */
interface SharesPoint {
  x: number;    // ms since epoch
  y: number;    // share count
  height: number;
}

/** 3) Rolling average smoothing */
function applyRollingAverage(
  data: SharesPoint[],
  windowSize = 5
): SharesPoint[] {
  if (data.length < windowSize) return data;
  const smoothed: SharesPoint[] = [];
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(data.length - 1, i + halfWindow);
    let sum = 0;
    let count = 0;
    for (let j = start; j <= end; j++) {
      sum += data[j].y;
      count++;
    }
    const avg = sum / count;
    // Use the "middle" index for stable X
    const mid = Math.floor((start + end) / 2);
    smoothed.push({
      x: data[mid].x,
      y: avg,
      height: data[mid].height,
    });
  }

  return smoothed;
}

interface Props {
  minerData: MinerBlock[];
  smooth?: boolean;
  windowSize?: number;
}

/**
 * Displays three line-series on Chart.js:
 * - Valid Shares
 * - Invalid (Reject) Shares
 * - Stale Shares
 */
export default function MinerSharesChart({
  minerData,
  smooth = true,
  windowSize = 5,
}: Props) {
  // 1) Build arrays for each share type => {x, y, height}
  const validPoints: SharesPoint[] = minerData.map((block) => ({
    x: block.timestamp * 1000, // convert sec => ms
    y: block.valid_shares,
    height: block.height,
  }));
  const invalidPoints: SharesPoint[] = minerData.map((block) => ({
    x: block.timestamp * 1000,
    y: block.invalid_shares,
    height: block.height,
  }));
  const stalePoints: SharesPoint[] = minerData.map((block) => ({
    x: block.timestamp * 1000,
    y: block.stale_shares,
    height: block.height,
  }));

  // 2) Optionally apply rolling average
  const finalValid = smooth ? applyRollingAverage(validPoints, windowSize) : validPoints;
  const finalInvalid = smooth ? applyRollingAverage(invalidPoints, windowSize) : invalidPoints;
  const finalStale = smooth ? applyRollingAverage(stalePoints, windowSize) : stalePoints;

  // 3) Gradient helpers
  function createLineGradient(ctx: any, startColor: string, endColor: string) {
    const { chartArea } = ctx.chart;
    if (!chartArea) return startColor;
    const { left, right } = chartArea;
    const gradient = ctx.chart.ctx.createLinearGradient(left, 0, right, 0);
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);
    return gradient;
  }

  function createFillGradient(ctx: any, startColor: string, endColor: string) {
    const { chartArea } = ctx.chart;
    if (!chartArea) return startColor;
    const { top, bottom } = chartArea;
    const gradient = ctx.chart.ctx.createLinearGradient(0, top, 0, bottom);
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);
    return gradient;
  }

  // 4) Build chart data with 3 datasets
  const chartData: ChartData<"line", SharesPoint[], number> = {
    datasets: [
      {
        label: "Valid Shares",
        data: finalValid,
        fill: true,
        tension: 0.5,
        cubicInterpolationMode: "monotone" as const,
        borderColor: (ctx) => createLineGradient(ctx, "#10b981", "#6ee7b7"),
        borderWidth: 2,
        backgroundColor: (ctx) =>
          createFillGradient(ctx, "rgba(16,185,129,0.3)", "rgba(16,185,129,0)"),
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBorderWidth: 2,
        pointHoverBorderColor: "#fff",
        yAxisID: "y",
      },
      {
        label: "Invalid (Reject) Shares",
        data: finalInvalid,
        fill: true,
        tension: 0.5,
        cubicInterpolationMode: "monotone" as const,
        borderColor: (ctx) => createLineGradient(ctx, "#ef4444", "#fca5a5"),
        borderWidth: 2,
        backgroundColor: (ctx) =>
          createFillGradient(ctx, "rgba(239,68,68,0.3)", "rgba(239,68,68,0)"),
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBorderWidth: 2,
        pointHoverBorderColor: "#fff",
        yAxisID: "y",
      },
      {
        label: "Stale Shares",
        data: finalStale,
        fill: true,
        tension: 0.5,
        cubicInterpolationMode: "monotone" as const,
        borderColor: (ctx) => createLineGradient(ctx, "#f59e0b", "#fcd34d"),
        borderWidth: 2,
        backgroundColor: (ctx) =>
          createFillGradient(ctx, "rgba(245,158,11,0.3)", "rgba(245,158,11,0)"),
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBorderWidth: 2,
        pointHoverBorderColor: "#fff",
        yAxisID: "y",
      },
    ],
  };

  // 5) Chart config
  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    scales: {
      x: {
        type: "time",
        time: {
          displayFormats: {
            hour: "MMM d HH:mm",
          },
        },
        ticks: { color: "#cbd5e1", font: { size: 12 } },
        grid: { color: "rgba(255,255,255,0.1)" },
      },
      y: {
        type: "linear",
        position: "left",
        ticks: { color: "#cbd5e1", font: { size: 12 } },
        grid: { color: "rgba(255,255,255,0.1)" },
      },
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          color: "#e2e8f0",
          font: { size: 13 },
        },
      },
      tooltip: {
        position: "nearest",
        yAlign: "center",
        caretPadding: 12,
        caretSize: 6,
        usePointStyle: true,
        displayColors: true,
        backgroundColor: "#182026",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        borderColor: "#2A2D34",
        borderWidth: 1,
        cornerRadius: 6,
        padding: 10,
        titleMarginBottom: 8,
        bodySpacing: 6,
        titleFont: {
          size: 14,
          weight: "bold" as const,
        },
        bodyFont: {
          size: 13,
          weight: "normal" as const,
        },
        callbacks: {
          title: (contexts) => {
            if (!contexts.length) return "";
            // Cast to our typed shape
            const raw = contexts[0].raw as SharesPoint;
            const dateObj = new Date(raw.x);
            return dateObj.toLocaleString([], {
              year: "numeric",
              month: "short",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            });
          },
          label: (context) => {
            const datasetLabel = context.dataset.label || "Line";
            const raw = context.raw as SharesPoint;
            const lines = [datasetLabel];
            if (raw.height) {
              lines.push(`Height: ${raw.height.toLocaleString()}`);
            }
            // Show # of shares
            lines.push(`Shares: ${raw.y.toLocaleString()}`);
            return lines;
          },
        },
      },
    },
  };

  return (
    <div
      className="
        h-full flex flex-col
        rounded-lg shadow-md
        bg-gradient-to-r from-[#182026] to-[#0f1215]
        border border-[#2A2D34]
        p-6 sm:p-8
        gap-4
      "
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-2xl font-extrabold text-white">
          Miner Shares
        </h2>
      </div>

      <p className="text-sm text-gray-400">
        Miners shares by type (valid, rejected, stale) to gauge performance.
      </p>

      <div className="w-full h-64 mt-2">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
