"use client";
import { useState } from "react";

const faqs = [
  {
    question: "What is MWC Pool?",
    answer: "MWC Pool is a mining pool for MimbleWimble Coin (MWC), allowing miners to combine their computing power for higher rewards.",
  },
  {
    question: "How do I start mining?",
    answer: "To start mining, you need a compatible mining rig, an MWC wallet, and a mining software configured to connect to our pool.",
  },
  {
    question: "What are the mining rewards?",
    answer: "Mining rewards depend on the pool’s total hash rate and the current difficulty. MWC Pool distributes rewards fairly based on contributions.",
  },
  {
    question: "Is there a minimum payout?",
    answer: "Yes, the minimum payout is 0.1 MWC. Payouts are processed automatically once the threshold is reached.",
  },
  {
    question: "Which mining software is recommended?",
    answer: "Popular choices include Gminer and lolMiner. Ensure that your software supports MWC mining.",
  },
];

export default function FAQ() {
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

      {/* FAQ List */}
      <div className="w-full max-w-3xl mt-6 space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-black/[.15] border border-white/[.1] p-5 rounded-lg shadow-lg">
            <button
              className="w-full text-left text-lg font-medium flex justify-between items-center"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <span>{faq.question}</span>
              <span className="text-gray-400">{openIndex === index ? "−" : "+"}</span>
            </button>
            {openIndex === index && <p className="mt-2 text-gray-300 text-sm">{faq.answer}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
