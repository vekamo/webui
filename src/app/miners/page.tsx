"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { API_URL_V2 } from "@/constants/constants"; // Or wherever you store your constants

export default function MinersPage() {
  const [minerData, setMinerData] = useState<any[]>([]);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Retrieve authentication info from cookies
  const token = Cookies.get("token");
  const id = Cookies.get("id");

  useEffect(() => {
    async function fetchMinerData() {
      // 1. Check if user is authenticated
      if (!token || !id) {
        setError("Not authenticated");
        setIsLoading(false);
        return;
      }

      try {
        // 2. Configure your endpoint
        // e.g. if you have a dynamic block range or height, fetch them from an API or pass them in:
        const latestBlockHeight = 2784778; // placeholder
        const BLOCK_RANGE = 200;           // placeholder
        const blockDifference = 50;        // placeholder

        // Example URL
        const url = `${API_URL_V2}worker/stats/${id}/${latestBlockHeight},${blockDifference}/gps,height,valid_shares,timestamp,invalid_shares,stale_shares,edge_bits`;

        // 3. Fetch with Auth
        const response = await fetch(url, {
          headers: {
            Authorization: "Basic " + token, 
            // If your token is actually a JWT or Bearer token, do:
            // Authorization: `Bearer ${token}`
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch miner data");
        }

        // 4. Parse and store data
        const data = await response.json();
        setMinerData(data);
        setIsLoading(false);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
        setIsLoading(false);
      }
    }

    fetchMinerData();
  }, [token, id]);

  return (
    <div className="min-h-screen bg-black text-white p-8 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-4 text-center">
        Miner Data
      </h1>

      {/* Loading & Error States */}
      {isLoading ? (
        <p className="text-gray-400 text-center">Loading miner data...</p>
      ) : error ? (
        <p className="text-red-500 text-center">{error}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-gray-300 border border-white/[.1] rounded-lg">
            <thead>
              <tr className="bg-black/[.15] text-gray-500 uppercase tracking-wide">
                <th className="py-2 px-4 border border-white/[.1]">Block Height</th>
                <th className="py-2 px-4 border border-white/[.1]">Timestamp</th>
                <th className="py-2 px-4 border border-white/[.1]">Valid Shares</th>
                <th className="py-2 px-4 border border-white/[.1]">Invalid Shares</th>
                <th className="py-2 px-4 border border-white/[.1]">Stale Shares</th>
                <th className="py-2 px-4 border border-white/[.1]">Edge Bits</th>
              </tr>
            </thead>
            <tbody>
              {minerData.map((block, index) => (
                <tr
                  key={index}
                  className="hover:bg-white/[.05] transition-colors"
                >
                  <td className="py-2 px-4 border border-white/[.1]">
                    {block.height}
                  </td>
                  <td className="py-2 px-4 border border-white/[.1]">
                    {block.timestamp}
                  </td>
                  <td className="py-2 px-4 border border-white/[.1]">
                    {block.valid_shares}
                  </td>
                  <td className="py-2 px-4 border border-white/[.1]">
                    {block.invalid_shares}
                  </td>
                  <td className="py-2 px-4 border border-white/[.1]">
                    {block.stale_shares}
                  </td>
                  <td className="py-2 px-4 border border-white/[.1]">
                    {block.edge_bits}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
