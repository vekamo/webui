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
  ChartData,
  ChartOptions,
  TooltipItem,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register Chart.js components, including Filler for gradients
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

// 1) Domain type from your API
interface MinerBlock {
  id: number;
  timestamp: number;
  height: number;
  valid_shares: number;
  invalid_shares: number;
  stale_shares: number;
  total_valid_shares: number;
  total_invalid_shares: number;
  total_stale_shares: number;
  dirty: number;
  user_id: number;
  gps: Array<{
    edge_bits: number;
    gps: number;
  }>;
  mwc_stats_id: number | null;
  pool_stats_id: number | null;
  worker_stats_id: number;
}

// 2) The type shape for the final points we pass to Chart.js
interface MinerChartPoint {
  x: number;      // timestamp in ms
  y: number;      // c31Rate
  height: number; // for tooltip
}

// 3) Optional rolling average function
function applyRollingAverage(
  data: MinerChartPoint[],
  windowSize = 5
): MinerChartPoint[] {
  if (data.length < windowSize) return data;
  const smoothed: MinerChartPoint[] = [];
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
    // We'll keep the "middle" x/time for a stable anchor
    const mid = Math.floor((start + end) / 2);
    smoothed.push({
      x: data[mid].x,
      y: avg,
      height: data[mid].height,
    });
  }

  return smoothed;
}

// 4) Props for your chart
interface Props {
  minerData: MinerBlock[];
  smooth?: boolean;
  windowSize?: number;
}

export default function MinerHashRateChart({
  minerData,
  smooth = true,
  windowSize = 5,
}: Props) {
  // A) Convert your minerData to chart points
  const chartPoints: MinerChartPoint[] = minerData.map((block) => {
    // find c31
    const c31 = block.gps?.find((g) => g.edge_bits === 31);
    const c31Rate = c31?.gps ?? 0;
    return {
      x: block.timestamp * 1000, // seconds => ms
      y: c31Rate,
      height: block.height,
    };
  });

  // B) Optionally smooth the data
  const finalPoints = smooth
    ? applyRollingAverage(chartPoints, windowSize)
    : chartPoints;

  // C) Create gradient helpers
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

  // D) Build chart data, typed as an array of MinerChartPoint
  const chartData: ChartData<"line", MinerChartPoint[], number> = {
    datasets: [
      {
        label: "Miner c31 Hash Rate (GPS)",
        data: finalPoints,
        fill: true,
        tension: 0.5,
        cubicInterpolationMode: "monotone" as const,
        borderColor: (ctx) => createLineGradient(ctx, "#14b8a6", "#4ade80"),
        borderWidth: 2,
        backgroundColor: (ctx) =>
          createFillGradient(ctx, "rgba(20,184,166,0.3)", "rgba(20,184,166,0)"),
        pointRadius: 0,
        yAxisID: "y",
      },
    ],
  };

  // E) Chart config + styling typed with ChartOptions<"line">
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
        ticks: {
          color: "#cbd5e1", // axis label color
          font: { size: 12 },
        },
        grid: {
          color: "rgba(255,255,255,0.1)", // subtle grid lines
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
          color: "#e2e8f0", // legend label color
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
          weight: "bold" as const,
        },
        bodyFont: {
          size: 13,
          weight: "normal" as const,
        },
        callbacks: {
          // Typed as TooltipItem<"line">[]
          title: (contexts) => {
            if (!contexts.length) return "";
            // Cast 'raw' to our MinerChartPoint shape
            const raw = contexts[0].raw as MinerChartPoint;
            const dateObj = new Date(raw.x);
            return dateObj.toLocaleString([], {
              year: "numeric",
              month: "short",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            });
          },
          // Typed as TooltipItem<"line">
          label: (context) => {
            const datasetLabel = context.dataset.label || "Line";
            const raw = context.raw as MinerChartPoint;
            const lines = [datasetLabel];
            if (raw.height) {
              lines.push(`Height: ${raw.height.toLocaleString()}`);
            }
            lines.push(`GPS: ${raw.y.toLocaleString()} gps`);
            return lines;
          },
        },
      },
    },
  };

  // F) Return your JSX
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
      {/* Header / Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-2xl font-extrabold text-white">
          Miner Graphrate
        </h2>
      </div>

      <p className="text-sm text-gray-400">
        Miner's graphrate over time to track performance and ensure consistent mining
      </p>

      {/* Chart Container */}
      <div className="w-full h-64 mt-2">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
