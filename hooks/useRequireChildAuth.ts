"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";

export const useRequireChildAuth = () => {
  const router = useRouter();
  const child = useSessionStore((state) => state.child);

  useEffect(() => {
    if (!child) {
      router.replace("/child/join");
    }
  }, [child, router]);

  return child;
};

