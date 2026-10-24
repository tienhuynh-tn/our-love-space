"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/client";

export function LiveUpdates() {
  const router = useRouter();
  const [disconnected,setDisconnected] = useState(false);
  const [available,setAvailable] = useState(false);
  useEffect(() => {
    const supabase = browserClient();
    let disposed = false;
    let connectedBefore = false;
    const channel = supabase.channel("our-adventures",{ config: { private: true } }).on("broadcast",{ event: "changed" },() => {
      if (!disposed) setAvailable(true);
    });
    void supabase.realtime.setAuth().then(() => {
      if (!disposed) channel.subscribe(status => {
        if (disposed) return;
        setDisconnected(status !== "SUBSCRIBED");
        if (status === "SUBSCRIBED") {
          if (connectedBefore) setAvailable(true);
          connectedBefore = true;
        }
      });
    }).catch(() => { if (!disposed) setDisconnected(true); });
    // A refresh on return also renews expiring private image URLs.
    const onVisible = () => { if (document.visibilityState === "visible") setAvailable(true); };
    document.addEventListener("visibilitychange",onVisible);
    const timer = window.setInterval(() => setAvailable(true),8 * 60 * 1000);
    return () => { disposed = true;void supabase.removeChannel(channel);document.removeEventListener("visibilitychange",onVisible);window.clearInterval(timer); };
  },[]);
  return <div className="mx-auto mb-4 max-w-6xl text-xs text-stone-600 dark:text-stone-400">
    {disconnected && <p role="status">Live updates are reconnecting. You can still save your plans.</p>}
    {available && <button className="min-h-11 rounded-xl px-3 underline underline-offset-4" onClick={() => { setAvailable(false);router.refresh(); }}>Refresh shared plans & photos</button>}
  </div>;
}
