"use client";

import React, { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-white">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong!</h2>
      <p className="text-gray-500 mb-6 text-sm max-w-md">{error?.message || "An unexpected error occurred."}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition"
      >
        Try again
      </button>
    </div>
  );
}
