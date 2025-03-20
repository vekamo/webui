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
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register Chart.js + time scale
ChartJS.register(
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export interface MWCBlockChartPoint {
  timestamp: number;
  hashRate: number;
  height?: number;
  difficulty?: number;
}

function applyRollingAverage(
  data: MWCBlockChartPoint[],
  windowSize = 5
): MWCBlockChartPoint[] {
  if (data.length < windowSize) return data;
  const smoothed: MWCBlockChartPoint[] = [];
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(data.length - 1, i + halfWindow);
    let sum = 0;
    let count = 0;
    for (let j = start; j <= end; j++) {
      sum += data[j].hashRate;
      count++;
    }
    const avg = sum / count;
    const mid = Math.floor((start + end) / 2);
    smoothed.push({
      timestamp: data[mid].timestamp,
      height: data[mid].height,
      difficulty: data[mid].difficulty,
      hashRate: avg,
    });
  }

  return smoothed;
}

interface Props {
  poolData: MWCBlockChartPoint[];
  networkData: MWCBlockChartPoint[];
  smooth?: boolean;
  windowSize?: number;
}

export default function PoolNetworkHashRateChart({
  poolData,
  networkData,
  smooth = true,
  windowSize = 5,
}: Props) {
  // 1) Smooth both arrays if needed
  const poolPlot = smooth ? applyRollingAverage(poolData, windowSize) : poolData;
  const netPlot = smooth ? applyRollingAverage(networkData, windowSize) : networkData;

  // 2) Convert each to Chart.js points (ms for time)
  const poolPoints = poolPlot.map((d) => ({
    x: d.timestamp * 1000,
    y: d.hashRate,
    height: d.height || 0,
    difficulty: d.difficulty || 0,
  }));

  const netPoints = netPlot.map((d) => ({
    x: d.timestamp * 1000,
    y: d.hashRate,
    height: d.height || 0,
    difficulty: d.difficulty || 0,
  }));

  // Gradient helpers
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

  // 3) Build chart data with both datasets (Network first, then Pool)
  const chartData = {
    datasets: [
      {
        label: "Network",
        data: netPoints,
        fill: true,
        tension: 0.5,
        cubicInterpolationMode: "monotone",
        borderColor: (ctx: any) => createLineGradient(ctx, "#14b8a6", "#4ade80"),
        borderWidth: 2,
        backgroundColor: (ctx: any) =>
          createFillGradient(ctx, "rgba(20,184,166,0.3)", "rgba(20,184,166,0)"),
        pointRadius: 0,
        yAxisID: "y",
      },
      {
        label: "Pool",
        data: poolPoints,
        fill: true,
        tension: 0.5,
        cubicInterpolationMode: "monotone",
        borderColor: (ctx: any) => createLineGradient(ctx, "#a78bfa", "#fff1f2"),
        borderWidth: 2,
        backgroundColor: (ctx: any) =>
          createFillGradient(ctx, "rgba(167,139,250,0.3)", "rgba(167,139,250,0)"),
        pointRadius: 0,
        yAxisID: "y",
      },
    ],
  };

  // 4) Chart config + styling changes
  const options = {
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
        ticks: {
          // Lighter gray text for axis
          color: "#cbd5e1",
          font: { size: 12 },
        },
        grid: {
          // Subtle grid lines
          color: "rgba(255,255,255,0.1)",
        },
      },
      y: {
        type: "linear",
        position: "left",
        ticks: {
          color: "#cbd5e1",
          font: { size: 12 },
        },
        grid: {
          color: "rgba(255,255,255,0.1)",
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          // Make legend labels a bit brighter
          color: "#e2e8f0",
          font: { size: 13 },
        },
      },
      tooltip: {
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
          weight: "bold",
        },
        bodyFont: {
          size: 13,
          weight: "normal",
        },
        callbacks: {
          title: (contexts: any) => {
            if (!contexts.length) return "";
            const raw = contexts[0].raw;
            const dateObj = new Date(raw.x);
            return dateObj.toLocaleString([], {
              year: "numeric",
              month: "short",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            });
          },
          label: (context: any) => {
            const datasetLabel = context.dataset.label ?? "Line";
            const raw = context.raw;
            const lines = [datasetLabel];
            if (raw.height && raw.height > 0) {
              lines.push(`Height: ${raw.height.toLocaleString()}`);
            }
            if (raw.difficulty && raw.difficulty > 0) {
              lines.push(`Difficulty: ${raw.difficulty.toLocaleString()}`);
            }
            lines.push(`GPS: ${(+raw.y).toLocaleString()} gps`);
            return lines;
          },
        },
      },
    },
  };

  // 5) Render container + chart
  return (
    <div
      className="
        h-full flex flex-col
        rounded-lg shadow-md
        bg-gradient-to-r from-[#182026] to-[#0f1215]
        border border-[#2A2D34]
        p-6 sm:p-8
        gap-4
        font-[family-name:var(--font-geist-mono)]
      "
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-2xl font-extrabold text-white">
          Network vs. Pool Hash Rate
        </h2>
      </div>

      <p className="text-sm text-gray-400">
        {smooth
          ? `Rolling Avg (window = ${windowSize}) with gradient lines`
          : "Raw data, no smoothing"}
      </p>

      <div className="w-full h-64 mt-2">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
