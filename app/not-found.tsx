"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Monitor } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/");
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-white rounded-none flex items-center justify-center">
            <Monitor className="h-8 w-8 text-black" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-display font-bold text-white uppercase tracking-wider">
            Page Not Found
          </h1>
          <p className="text-sm text-gray-400 font-mono">
            Redirecting to home in 2 seconds...
          </p>
        </div>
        <button
          onClick={() => router.replace("/")}
          className="bg-white hover:bg-neutral-200 text-black font-bold py-3 px-6 rounded-none text-sm uppercase tracking-wider transition-all cursor-pointer"
        >
          Go Home Now
        </button>
      </div>
    </div>
  );
}
