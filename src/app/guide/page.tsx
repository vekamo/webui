"use client";
import { useState } from "react";

const faqs = [
  {
    question: "What is MWC Pool?",
    answer:
      "MWC Pool is a mining pool for MimbleWimble Coin (MWC), allowing miners to combine their computing power for higher rewards.",
  },
  {
    question: "How do I start mining?",
    answer:
      "To start mining, you need a compatible mining rig or ASIC, an MWC wallet, and mining software configured to connect to our pool.",
  },
  {
    question: "What are the mining rewards?",
    answer:
      "Our pool operates on a 1% PPLNG fee structure, distributing rewards fairly based on each miner’s contribution.",
  },
  {
    question: "Is there a minimum payout?",
    answer:
      "Yes, the minimum payout is 0.2 MWC. Payouts are processed automatically once you reach this threshold.",
  },
  {
    question: "Which mining software or hardware is recommended?",
    answer:
      "Popular software choices include Gminer and lolMiner. For specialized hardware, the iPollo G1 ASIC is also compatible with MWC mining. Ensure proper configuration and that your hardware/software supports MWC.",
  },
  {
    question: "How can I contact support?",
    answer:
      "You can reach out on Telegram at @mwc_vek or on Discord as 'vekamo' for assistance.",
  },
];

export default function Guide() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 sm:px-16 bg-black text-white">
      {/* Title */}
      <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
        Frequently Asked Questions
      </h1>
      <p className="text-gray-400 text-md sm:text-lg mt-2">
        Find answers to common questions about MWC mining.
      </p>

      {/* Stratum Information */}
      <h2 className="text-3xl font-bold mt-10">Stratum Info</h2>
      <div className="w-full max-w-3xl mt-4 overflow-x-auto">
        <table className="w-full table-auto text-left border-collapse">
          <thead>
            <tr>
              <th className="border-b border-gray-700 p-3">Region</th>
              <th className="border-b border-gray-700 p-3">Difficulty</th>
              <th className="border-b border-gray-700 p-3">SSL</th>
              <th className="border-b border-gray-700 p-3">Stratum</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-b border-gray-700 p-3">USA</td>
              <td className="border-b border-gray-700 p-3">8</td>
              <td className="border-b border-gray-700 p-3">No</td>
              <td className="border-b border-gray-700 p-3">
                stratum+tcp://stratum2.mwcpool.com:2222
              </td>
            </tr>
            <tr>
              <td className="border-b border-gray-700 p-3">USA</td>
              <td className="border-b border-gray-700 p-3">32</td>
              <td className="border-b border-gray-700 p-3">No</td>
              <td className="border-b border-gray-700 p-3">
                stratum+tcp://stratum1.mwcpool.com:3333
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* FAQ List */}
      <div className="w-full max-w-3xl mt-6 space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-black/[.15] border border-white/[.1] p-5 rounded-lg shadow-lg"
          >
            <button
              className="w-full text-left text-lg font-medium flex justify-between items-center"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <span>{faq.question}</span>
              <span className="text-gray-400">
                {openIndex === index ? "−" : "+"}
              </span>
            </button>
            {openIndex === index && (
              <p className="mt-2 text-gray-300 text-sm">{faq.answer}</p>
            )}
          </div>
        ))}
      </div>

      
    </div>
  );
}
