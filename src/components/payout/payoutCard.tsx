"use client";
import React, { useState } from "react";
import {
  ClipboardDocumentIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

export default function PayoutSetupCard() {
  const [payoutAddress, setPayoutAddress] = useState("");
  const [requestResult, setRequestResult] = useState("");
  const [notes, setNotes] = useState("");

  // For loading spinners
  const [isRequestingWithdrawal, setIsRequestingWithdrawal] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // For the copy icon success
  const [justCopied, setJustCopied] = useState(false);

  // Simple custom notification
  const [notification, setNotification] = useState("");
  const [isErrorNotif, setIsErrorNotif] = useState(false);

  /** Ephemeral bottom-center notification for 3s */
  function showNotification(msg: string, isError = false) {
    setNotification(msg);
    setIsErrorNotif(isError);
    setTimeout(() => {
      setNotification("");
      setIsErrorNotif(false);
    }, 3000);
  }

  // Has a *non-empty* initial slatepack
  const hasSlatepack = requestResult.trim().length > 0;

  /**
   * 1) "Get Initial Slatepack"
   */
  function handleRequestWithdrawal() {
    if (!payoutAddress.trim()) {
      showNotification("No slatepack address provided.", true);
      return;
    }
    setIsRequestingWithdrawal(true);
    setRequestResult("Processing your request...");

    setTimeout(() => {
      setIsRequestingWithdrawal(false);
      setRequestResult(`BEGINSLATE_BIN.
Ju8CthVrQxeJtmp 7Ewa2acCh7noJPD ZCjVdSNcR4YA8nP xTPJoutDrbjYtgr
L1kkXGb4bzSkCLr tV2eMJx2dLys37f XU344T8TH5TTFow cLXshAJLCekk7W4
DBjKKNt4TUziuo6 MZ8PMyZ.
ENDSLATE_BIN.
`);
      showNotification("Initial slatepack generated!");
    }, 3000);
  }

  /**
   * 2) "Finalize"
   */
  function handleFinalize() {
    setIsFinalizing(true);
    setTimeout(() => {
      setIsFinalizing(false);
      showNotification("Withdrawal finalized successfully!");
      // Reset everything
      setPayoutAddress("");
      setRequestResult("");
      setNotes("");
      setJustCopied(false);
      setIsRequestingWithdrawal(false);
    }, 3000);
  }

  /**
   * 3) Copy initial slatepack
   */
  async function handleCopySlatepack() {
    try {
      const slatepack = requestResult.trim();
      if (!slatepack) return;
      await navigator.clipboard.writeText(slatepack);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 3000);
      showNotification("Slatepack copied!");
    } catch (err) {
      console.error("Copy failed:", err);
      showNotification("Failed to copy slatepack.", true);
    }
  }

  const notesDisabled = !hasSlatepack || isRequestingWithdrawal;
  const canFinalize =
    notes.trim().length > 0 && !notesDisabled && !isFinalizing;

  return (
    <>
      {/* Notification at bottom-center */}
      {notification && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div
            className="
              flex items-center gap-2
              px-4 py-3
              text-sm text-white
              rounded-md shadow-lg
              ring-1 ring-white/10
              bg-black/80 backdrop-blur-sm
            "
          >
            {isErrorNotif ? (
              <ExclamationCircleIcon className="w-5 h-5 text-red-400" />
            ) : (
              <CheckCircleIcon className="w-5 h-5 text-green-400" />
            )}
            <span>{notification}</span>
          </div>
        </div>
      )}

      {/* Main card */}
      <div
        className="
          w-full
          rounded-lg shadow-md
          bg-gradient-to-r from-[#182026] to-[#0f1215]
          border border-[#2A2D34]
          p-4 sm:p-6
          flex flex-col gap-4

          font-[family-name:var(--font-geist-mono)]
        "
      >
        <h2 className="text-2xl font-extrabold text-white">
          Withdrawal
        </h2>
        <p className="text-sm text-gray-400">
          Enter your slatepack address, generate the initial slatepack,
          then add the response slatepack before finalizing.
        </p>

        {/* Row: address + get slatepack */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-3">
          <div className="flex-1">
            <label
              htmlFor="payoutAddress"
              className="block text-xs text-gray-500 uppercase mb-1 uppercase tracking-wide"
            >
              Slatepack Address
            </label>
            <input
              id="payoutAddress"
              type="text"
              value={payoutAddress}
              onChange={(e) => setPayoutAddress(e.target.value)}
              placeholder="Enter your slatepack address..."
              disabled={hasSlatepack || isRequestingWithdrawal}
              className={`
                w-full
                rounded-md
                px-3 py-2
                text-sm text-gray-100
                bg-gray-700
                focus:outline-none
                focus:ring-2 focus:ring-blue-500
                border border-gray-600
                transition-colors
                duration-200
                ${
                  hasSlatepack || isRequestingWithdrawal
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }
              `}
            />
          </div>

          <button
            onClick={handleRequestWithdrawal}
            disabled={hasSlatepack || isRequestingWithdrawal}
            className={`
              w-full sm:w-auto
              px-4 py-2
              text-sm font-semibold
              rounded-md
              text-white
              flex items-center justify-center gap-2
              transition-colors duration-200
              ${
                (hasSlatepack || isRequestingWithdrawal)
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }
            `}
          >
            {isRequestingWithdrawal && (
              <svg
                className="w-4 h-4 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 
                    018-8v8z"
                />
              </svg>
            )}
            Get Initial Slatepack
          </button>
        </div>

        {/* 2 columns: initial slatepack + response slatepack */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Left: initial slatepack */}
          <div className="flex-1 space-y-1 relative">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Initial Slatepack
            </p>
            <div className="relative">
              <div className="bg-black/30 rounded-md px-2 py-1 h-32 overflow-y-auto">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                  {hasSlatepack
                    ? requestResult
                    : "No initial slatepack yet."}
                </pre>
              </div>

              {hasSlatepack && (
                <button
                  onClick={async () => {
                    try {
                      const slatepack = requestResult.trim();
                      if (!slatepack) return;
                      await navigator.clipboard.writeText(slatepack);
                      setJustCopied(true);
                      setTimeout(() => setJustCopied(false), 3000);
                      showNotification("Slatepack copied!");
                    } catch (err) {
                      console.error("Copy failed:", err);
                      showNotification("Failed to copy slatepack.", true);
                    }
                  }}
                  className="
                    absolute
                    top-2
                    right-2
                    text-gray-300
                    hover:text-blue-400
                    transition-colors
                    duration-150
                    focus:outline-none
                  "
                  title="Copy Slatepack"
                >
                  {justCopied ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-400" />
                  ) : (
                    <ClipboardDocumentIcon className="w-5 h-5" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Right: "Response" => disabled if no slatepack or if we're STILL requesting */}
          <div className="flex-1">
            <label
              htmlFor="notes"
              className="block text-xs text-gray-500 mb-1 uppercase tracking-wide"
            >
              Response Slatepack
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Paste the response slatepack here..."
              disabled={!hasSlatepack || isRequestingWithdrawal}
              className={`
                w-full
                rounded-md
                px-3
                py-2
                text-sm
                text-gray-100
                bg-gray-700
                focus:outline-none
                focus:ring-2
                focus:ring-blue-500
                border
                border-gray-600
                resize-none
                transition-colors
                duration-200
                ${
                  !hasSlatepack || isRequestingWithdrawal
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }
              `}
              style={{
                height: "8rem",
                overflowY: "auto",
              }}
            />
          </div>
        </div>

        {/* Finalize button */}
        <div className="flex justify-center mt-2">
          <button
            onClick={() => {
              setIsFinalizing(true);
              setTimeout(() => {
                setIsFinalizing(false);
                showNotification("Withdrawal finalized successfully!");
                // Reset everything
                setPayoutAddress("");
                setRequestResult("");
                setNotes("");
                setJustCopied(false);
                setIsRequestingWithdrawal(false);
              }, 3000);
            }}
            disabled={
              notes.trim().length === 0 ||
              !hasSlatepack ||
              isRequestingWithdrawal ||
              isFinalizing
            }
            className={`
              min-w-[10rem]  // ensures it's not too tiny
              px-4 py-2
              text-sm font-semibold
              rounded-md
              text-white
              transition-colors duration-200
              flex items-center justify-center gap-2
              ${
                notes.trim().length > 0 &&
                hasSlatepack &&
                !isRequestingWithdrawal &&
                !isFinalizing
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-600 cursor-not-allowed"
              }
            `}
          >
            {isFinalizing && (
              <svg
                className="w-4 h-4 animate-spin text-white mr-1.5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 
                    018-8v8z"
                />
              </svg>
            )}
            {isFinalizing ? "Finalizing..." : "Finalize"}
          </button>
        </div>
      </div>
    </>
  );
}
