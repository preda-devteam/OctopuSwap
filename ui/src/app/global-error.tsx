"use client";

import { useEffect } from "react";
import Button from "@/components/base/Button";

const isDev = process.env.NODE_ENV === "development";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="container error">
      <h1>Internal Server Error</h1>
      <Button onClick={() => reset()}>Try Again</Button>
    </main>
  );
}
