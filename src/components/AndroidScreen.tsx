"use client";

import { useEffect, useRef } from "react";
import {
  DeviceRendererFactory,
  RendererSetupOptions,
} from "@genymotion/device-web-player";

interface AndroidScreenProps {
  instanceAddress: string;
  instanceId: string;
}

interface PlayerInstance {
  VM_communication: {
    disconnect: () => void;
  };
}

export function AndroidScreen({
  instanceAddress,
  instanceId,
}: AndroidScreenProps) {
  console.log("Rendering AndroidScreen");

  const playerInstanceRef = useRef<PlayerInstance | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) {
      console.error("Container element not found");
      return;
    }

    console.log("Instance Address:", instanceAddress);
    console.log("Instance ID:", instanceId);

    const options: RendererSetupOptions = {
      template: "renderer_partial",
      gpsSpeedSupport: true,
      translateHomeKey: true,
      streamResolution: false,
      token: instanceId,
      volume: false,
      navbar: false,
      power: false,
      fileUpload: false,
      clipboard: false,
      battery: false,
      gps: false,
      identifiers: false,
      network: false,
      phone: false,
      diskIO: false,
      biometrics: false,
      connectionFailedURL:
        "https://www.genymotion.com/help/cloud-paas/iceconnectionstate-failed/",
    };

    try {
      console.log("Setting up the device player...");
      const deviceRendererFactory = new DeviceRendererFactory();
      playerInstanceRef.current = deviceRendererFactory.setupRenderer(
        containerRef.current,
        `wss://${instanceAddress}`,
        options
      );
    } catch (e) {
      console.error("Error while loading the device player:", e);
    }

    // Clean up on unmount
    return () => {
      if (
        playerInstanceRef.current &&
        playerInstanceRef.current.VM_communication
      ) {
        console.log("Disconnecting from Genymotion instance...");
        playerInstanceRef.current.VM_communication.disconnect();
        playerInstanceRef.current = null;
      }
    };
  }, [instanceAddress, instanceId]);

  return <div ref={containerRef} className="flex-grow relative min-h-0" />;
}
