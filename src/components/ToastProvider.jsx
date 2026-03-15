"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: "var(--fh-card)",
          color: "var(--foreground)",
          border: "1px solid rgba(15, 107, 95, 0.2)",
        },
      }}
    />
  );
}
