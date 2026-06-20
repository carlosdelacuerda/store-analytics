"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppDispatch } from "@/store/hooks";
import { logoutUser } from "@/store/slices/authSlice";

export default function Header({ title }: { title: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await dispatch(logoutUser());
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
      <h1 className="text-lg font-bold text-gray-900">{title}</h1>
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition active:bg-gray-100"
      >
        {loggingOut ? "Signing out…" : "Logout"}
      </button>
    </header>
  );
}
