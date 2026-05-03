"use client"
import { useState } from "react"

interface PlatformDef {
  id: string
  name: string
  icon: string
  description: string
  color: string
}

interface Props {
  platform: PlatformDef
  connected: boolean
  connectedAt?: string
  disabled: boolean
}

export function ConnectPlatformCard({ platform, connected, connectedAt, disabled }: Props) {
  const [disconnecting, setDisconnecting] = useState(false)

  async function handleDisconnect() {
    setDisconnecting(true)
    await fetch("/api/connect/status", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: platform.id }),
    })
    window.location.reload()
  }

  return (
    <div className={`bg-white rounded-2xl border p-6 ${connected ? "border-green-200" : "border-gray-100"}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{platform.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{platform.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{platform.description}</p>
          </div>
        </div>
        {connected && (
          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
            ✓ Connected
          </span>
        )}
      </div>

      {connected ? (
        <div className="space-y-2">
          {connectedAt && (
            <p className="text-xs text-gray-400">
              সংযুক্ত: {new Date(connectedAt).toLocaleDateString("bn-BD")}
            </p>
          )}
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="w-full py-2 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {disconnecting ? "সরানো হচ্ছে..." : "সংযোগ বিচ্ছিন্ন করুন"}
          </button>
        </div>
      ) : (
        <a
          href={disabled ? undefined : `/api/connect/${platform.id.toLowerCase()}`}
          className={`block w-full py-2 text-sm text-center font-medium rounded-xl transition-colors ${
            disabled
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
          aria-disabled={disabled}
        >
          কানেক্ট করুন
        </a>
      )}
    </div>
  )
}
