"use client";

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

import annotationPlugin from "chartjs-plugin-annotation";

// Register Chart.js modules and the annotation plugin, exactly once.
ChartJS.register(
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
);

// Export the fully-configured Chart.js instance.
// (You don't necessarily need to export ChartJS if you only use <Line> from react-chartjs-2,
// but it's nice to keep it in case you want direct access.)
export { ChartJS };
