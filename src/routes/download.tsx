import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { ArrowLeft, Smartphone, Apple, Download, Share2, QrCode, Check } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/download")({
  head: () => ({ meta: [{ title: "Download App — Monvex" }] }),
  component: DownloadPage,
});

function DownloadPage() {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.origin : "https://monvex.app";

  const installPWA = () => {
    // Best-effort: prompt browser install if available
    alert("On Android: tap the menu (⋮) → 'Install app' / 'Add to Home screen'.\nOn iPhone: tap Share → 'Add to Home Screen'.");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`;

  return (
    <Shell>
      <div className="px-4 pt-6 pb-24">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/profile" className="rounded-full bg-white p-2 shadow"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-2xl font-extrabold">Download App</h1>
        </div>

        <div className="bg-gradient-to-br from-[#2563eb] to-[#7c3aed] rounded-3xl p-6 text-white shadow-lg text-center">
          <div className="bg-white/20 rounded-3xl inline-flex p-4 mb-3"><Smartphone className="h-10 w-10" /></div>
          <h2 className="text-2xl font-extrabold">Get the Monvex App</h2>
          <p className="text-sm opacity-90 mt-1">Faster access, push notifications, offline support.</p>
        </div>

        <button onClick={installPWA} className="mt-5 w-full bg-emerald-500 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 shadow-md">
          <Download className="h-5 w-5" /> Install on this phone
        </button>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <a href={`/monvex.apk`} download className="bg-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 shadow-md">
            <Smartphone className="h-5 w-5 text-emerald-600" /> Android APK
          </a>
          <a href={`https://apps.apple.com/`} target="_blank" rel="noreferrer" className="bg-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 shadow-md">
            <Apple className="h-5 w-5" /> iOS
          </a>
        </div>

        <div className="mt-5 bg-white rounded-3xl p-5 shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <QrCode className="h-5 w-5 text-[#2563eb]" />
            <p className="font-extrabold">Scan to download</p>
          </div>
          <div className="flex justify-center bg-muted rounded-2xl p-4">
            <img src={qr} alt="QR code to download Monvex" className="rounded-lg" />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3 break-all">{url}</p>
          <button onClick={copyLink} className="mt-3 w-full bg-[#2563eb] text-white rounded-2xl py-3 font-bold flex items-center justify-center gap-2">
            {copied ? <><Check className="h-4 w-4" /> Copied</> : <><Share2 className="h-4 w-4" /> Copy Link</>}
          </button>
        </div>

        <div className="mt-5 bg-white rounded-3xl p-5 shadow-md">
          <p className="font-extrabold mb-2">How to install</p>
          <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
            <li><b>Android:</b> Open Chrome menu (⋮) → "Install app" or "Add to Home screen".</li>
            <li><b>iPhone:</b> Open in Safari → tap Share → "Add to Home Screen".</li>
            <li>Launch Monvex from your home screen like any other app.</li>
          </ol>
        </div>
      </div>
    </Shell>
  );
}