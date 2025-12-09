"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";

export const useRequireParentAuth = () => {
  const router = useRouter();
  const parent = useSessionStore((state) => state.parent);

  useEffect(() => {
    if (!parent) {
      router.replace("/parent/login");
    }
  }, [parent, router]);

  return parent;
};

