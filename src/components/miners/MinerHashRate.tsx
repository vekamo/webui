"use client";

import React from "react";
// Chart.js + react-chartjs-2 imports
import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { Line } from "react-chartjs-2";

// Register only the pieces we need
ChartJS.register(
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/**
 * One data item from your `minerHistorical`. 
 * e.g. 
 *   {
 *     timestamp: 1742449944,
 *     gps: [ { edge_bits: 31, gps: 0.434109 } ],
 *     ...
 *   }
 */
export interface MinerBlockItem {
  timestamp: number; 
  gps: Array<{ edge_bits: number; gps: number }>;
  // plus whatever else you have, e.g. height, shares, etc.
}

/**
 * A standalone chart that displays c31 GPS (hash rate) over time.
 */
export default function MinerHashrate({
  minerData,
}: {
  minerData: MinerBlockItem[];
}) {
  // 1) Convert your data => Chart.js points
  //    For each block, find c31 in block.gps array
  const chartPoints = minerData.map((block) => {
    const c31obj = block.gps.find((g) => g.edge_bits === 31);
    const c31Rate = c31obj?.gps ?? 0;

    // Convert block.timestamp (seconds) => ms
    return {
      x: block.timestamp * 1000,
      y: c31Rate,
    };
  });

  // 2) Build the "data" object for react-chartjs-2
  const chartData = {
    datasets: [
      {
        label: "Miner c31 Hash Rate (GPS)",
        data: chartPoints,
        borderColor: "#14b8a6", // teal
        backgroundColor: "rgba(20,184,166,0.1)",
        fill: true,
        pointRadius: 0,
        tension: 0.3,
      },
    ],
  };

  // 3) Chart options
  const options = {
    responsive: true,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    scales: {
      x: {
        type: "time" as const, // uses chartjs-adapter-date-fns
        time: {
          // e.g. "MMM d HH:mm"
          displayFormats: {
            minute: "MMM d HH:mm",
            hour: "MMM d HH:mm",
            day: "MMM d",
          },
        },
        ticks: {
          color: "#cbd5e1",
        },
        grid: {
          color: "rgba(255,255,255,0.1)",
        },
      },
      y: {
        type: "linear" as const,
        ticks: {
          color: "#cbd5e1",
        },
        grid: {
          color: "rgba(255,255,255,0.1)",
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: "#e2e8f0",
        },
      },
      tooltip: {
        backgroundColor: "#1f1f22",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#4b5563",
        borderWidth: 1,
        cornerRadius: 6,
      },
    },
  };

  return (
    <div className="w-full h-64">
      <Line data={chartData} options={options} />
    </div>
  );
}
