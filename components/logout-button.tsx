"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface LogoutButtonProps {
  label?: string;
  loadingLabel?: string;
}

export default function LogoutButton({ label = "Logout", loadingLabel = "Signing out..." }: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
      router.push("/admin/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button className="secondary-button" type="button" onClick={logout} disabled={loading}>
      {loading ? loadingLabel : label}
    </button>
  );
}
