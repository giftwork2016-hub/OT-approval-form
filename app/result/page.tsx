import { Suspense } from "react";
import ResultView from "./result-view";

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <ResultView />
    </Suspense>
  );
}
