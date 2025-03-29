"use client";
import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import {
  ClipboardDocumentIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { useMinerData } from "@/app/hooks/useMinerData";
// import { isBasicTorPubKey } from "@/utils/utils"; // if you want a simple length decode check

interface PayoutSetupCardProps {
  payoutAddress: string;
  setPayoutAddress: React.Dispatch<React.SetStateAction<string>>;
  slateResponse: string;
  setSlateResponse: React.Dispatch<React.SetStateAction<string>>;
  resumeSlate?: string;
  isResumeMode?: boolean;
  setIsResumeMode?: React.Dispatch<React.SetStateAction<boolean>>;
  refreshPayout: () => void;
}

export default function PayoutSetupCard({
  payoutAddress,
  setPayoutAddress,
  slateResponse,
  setSlateResponse,
  resumeSlate,
  isResumeMode = false,
  setIsResumeMode,
  refreshPayout
}: PayoutSetupCardProps) {
  const [requestResult, setRequestResult] = useState("");
  const [justCopied, setJustCopied] = useState(false);

  // For ephemeral toast notifications
  const [notification, setNotification] = useState("");
  const [isErrorNotif, setIsErrorNotif] = useState(false);

  // Payment logic from your custom hook
  const {
    isTxSlateLoading,
    minerPaymentTxSlate,
    manualPaymentError,
    isPaymentSettingProcessing,
    fetchMinerPaymentTxSlate,
    finalizeTxSlate,
  } = useMinerData();

  // If user is logged in, read cookies
  const minerId = Cookies.get("id") ?? "";
  const legacyToken = Cookies.get("legacyToken") ?? "";
  const token = Cookies.get("token") ?? "";

  /** Helper: ephemeral “toast” notification */
  function showNotification(msg: string, isError = false) {
    setNotification(msg);
    setIsErrorNotif(isError);
  }

  /** Immediately clears the form, then shows an error toast for 5s */
  function showErrorAndReset(reason: string) {
    handleClearAll();
    showNotification(reason, true);
    setTimeout(() => {
      setNotification("");
      setIsErrorNotif(false);
    }, 5000);
  }

  // Whenever the custom hook returns a new slate, set it as our requestResult
  useEffect(() => {
    if (minerPaymentTxSlate) {
      setRequestResult(minerPaymentTxSlate);
    }
  }, [minerPaymentTxSlate]);

  // NEW APPROACH: If isResumeMode is set to TRUE in the parent,
  // we apply resumeSlate again, even if it's the same string as before.
  useEffect(() => {
    if (isResumeMode && resumeSlate && resumeSlate.trim().length > 0) {
      setRequestResult(resumeSlate.trim());
      showNotification("Resumed an existing slatepack!");
    }
  }, [isResumeMode]); // depends on isResumeMode

  // If manualPaymentError changes => display error & reset
  useEffect(() => {
    if (manualPaymentError) {
      const message = getReadableError(manualPaymentError);
      showErrorAndReset(message);
    }
  }, [manualPaymentError]);

  const hasSlatepack = requestResult.trim().length > 0;
  const isRequestingWithdrawal = isTxSlateLoading;
  const isFinalizing = isPaymentSettingProcessing;

  /** 1) “Get Initial Slatepack” */
  async function handleRequestWithdrawal() {
    const addr = payoutAddress.trim();
    if (!addr) {
      showErrorAndReset("No slatepack address provided.");
      return;
    }

    /* If you want a simple length decode check, uncomment:
    if (!isBasicTorPubKey(addr)) {
      showErrorAndReset("Invalid Slatepack Address. Please check and try again.");
      return;
    }
    */

    try {
      setRequestResult("");
      await fetchMinerPaymentTxSlate(minerId, legacyToken, token, addr);
      showNotification("Initial slatepack generated!");
      setTimeout(() => {
        setNotification("");
        setIsErrorNotif(false);
      }, 3000);
      refreshPayout()
    } catch (error) {
      showErrorAndReset("Error generating slatepack");
    }
  }

  /** 2) “Finalize” */
  async function handleFinalize() {
    if (!slateResponse.trim()) {
      showErrorAndReset("No response slatepack to finalize.");
      return;
    }
    try {
      await finalizeTxSlate(minerId, legacyToken, slateResponse);
      showNotification("Withdrawal finalized successfully!");
      // Clear everything after success
      setTimeout(() => {
        handleClearAll();
        setNotification("");
        setIsErrorNotif(false);
      }, 3000);
      refreshPayout()
    } catch (error) {
      showErrorAndReset("Error finalizing slatepack");
    }
  }

  /** 3) Copy the “initial” slate */
  async function handleCopySlatepack() {
    if (!requestResult.trim()) return;
    try {
      await navigator.clipboard.writeText(requestResult.trim());
      setJustCopied(true);
      showNotification("Slatepack copied!");
      setTimeout(() => {
        setJustCopied(false);
        setNotification("");
        setIsErrorNotif(false);
      }, 3000);
    } catch (err) {
      showErrorAndReset("Failed to copy slatepack.");
    }
  }

  /** 4) Clear => reset everything */
  function handleClearAll() {
    setPayoutAddress("");
    setSlateResponse("");
    setRequestResult("");
    setJustCopied(false);
    if (setIsResumeMode) {
      setIsResumeMode(false); // important so we can re-trigger the effect next time
    }
  }

  /** Helper: parse + display your error nicely */
  function getReadableError(err: unknown) {
    if (!err) return "";
    if (typeof err === "string") return err;
    if (typeof err === "object") {
      const eObj = err as Record<string, any>;
      if (eObj.message) return eObj.message;
      return JSON.stringify(eObj);
    }
    return "Unknown error";
  }

  return (
    <>
      {notification && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div
            className="
              flex items-center gap-2 px-4 py-3 text-sm text-white
              rounded-md shadow-lg ring-1 ring-white/10 bg-black/80
              backdrop-blur-sm
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

      <div
        className="
          w-full
          rounded-lg
          shadow-md
          bg-gradient-to-r from-[#182026] to-[#0f1215]
          border border-[#2A2D34]
          p-4 sm:p-6
          flex flex-col gap-4
        "
      >
        <h2 className="text-2xl font-extrabold text-white">Withdrawal</h2>
        <p className="text-sm text-gray-400">
          Enter your slatepack address, generate the initial slatepack,
          then add the response slatepack before finalizing.
        </p>

        {/* Address + “Get Initial” Button */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-3">
          <div className="flex-1">
            <label
              htmlFor="payoutAddress"
              className="block text-xs text-gray-500 uppercase mb-1"
            >
              Slatepack Address
            </label>
            <input
              id="payoutAddress"
              type="text"
              value={payoutAddress}
              onChange={(e) => setPayoutAddress(e.target.value)}
              placeholder="Enter your slatepack address..."
              disabled={isResumeMode || hasSlatepack || isRequestingWithdrawal}
              className={`
                w-full
                rounded-md px-3 py-2
                text-sm text-gray-100
                bg-gray-700
                border border-gray-600
                focus:outline-none
                focus:ring-2 focus:ring-blue-500
                transition-colors duration-200
                ${
                  (isResumeMode || hasSlatepack || isRequestingWithdrawal)
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }
              `}
            />
          </div>

          <button
            onClick={handleRequestWithdrawal}
            disabled={isResumeMode || hasSlatepack || isRequestingWithdrawal}
            className={`
              w-full sm:w-auto
              px-4 py-2
              text-sm font-semibold
              rounded-md
              text-white
              flex items-center justify-center gap-2
              transition-colors duration-200
              ${
                (isResumeMode || hasSlatepack || isRequestingWithdrawal)
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
                <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
            )}
            Get Initial Slatepack
          </button>
        </div>

        {/* Two columns => "Initial Slatepack" + "Response Slatepack" */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Initial Slatepack Column */}
          <div className="flex-1 space-y-1 relative">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Initial Slatepack
            </p>
            <div className="relative">
              <div className="bg-black/30 rounded-md px-2 py-1 h-32 overflow-y-auto">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                  {hasSlatepack ? requestResult : "No initial slatepack yet."}
                </pre>
              </div>
              {hasSlatepack && (
                <button
                  onClick={handleCopySlatepack}
                  className="
                    absolute top-2 right-2
                    text-gray-300 hover:text-blue-400
                    transition-colors duration-150
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

          {/* Response Slatepack Column */}
          <div className="flex-1">
            <label
              htmlFor="slateResponse"
              className="block text-xs text-gray-500 mb-1 uppercase tracking-wide"
            >
              Response Slatepack
            </label>
            <textarea
              id="slateResponse"
              value={slateResponse}
              onChange={(e) => setSlateResponse(e.target.value)}
              rows={4}
              placeholder="Paste the response slatepack here..."
              disabled={!hasSlatepack || isRequestingWithdrawal}
              className={`
                w-full
                rounded-md
                px-3
                py-2
                text-sm text-gray-100
                bg-gray-700
                border border-gray-600
                focus:outline-none
                focus:ring-2 focus:ring-blue-500
                resize-none
                transition-colors duration-200
                ${
                  !hasSlatepack || isRequestingWithdrawal
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }
              `}
              style={{ height: "8rem", overflowY: "auto" }}
            />
          </div>
        </div>

        {/* Finalize + Clear */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-4">
          <button
            onClick={handleClearAll}
            className="
              min-w-[10rem]
              px-4
              py-2
              text-sm font-semibold
              rounded-md
              text-white
              transition-colors duration-200
              bg-red-500 hover:bg-red-700
            "
          >
            Clear
          </button>

          <button
            onClick={handleFinalize}
            disabled={
              slateResponse.trim().length === 0 ||
              requestResult.trim().length === 0 ||
              isRequestingWithdrawal ||
              isFinalizing
            }
            className={`
              min-w-[10rem]
              px-4 py-2
              text-sm font-semibold
              rounded-md
              text-white
              flex items-center justify-center gap-2
              transition-colors duration-200
              ${
                slateResponse.trim().length > 0 &&
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
                <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
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
