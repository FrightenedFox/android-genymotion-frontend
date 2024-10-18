import { useEffect, useRef } from 'react';
import { DeviceRendererFactory } from '@genymotion/device-web-player';

interface AndroidScreenProps {
  instanceAddress: string;
  instanceId: string;
}

export function AndroidScreen({ instanceAddress, instanceId }: AndroidScreenProps) {
  const playerInstanceRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) {
      console.error('Container element not found');
      return;
    }

    const options = {
      template: "renderer_partial",
      paas: true,
      gpsSpeedSupport: true,
      translateHomeKey: true,
      streamResolution: false,
      fileUploadUrl: false,
      token: instanceId,
      microphone: true,
      baseband: true,
      connectionFailedURL: 'https://www.genymotion.com/help/cloud-paas/iceconnectionstate-failed/',
    };

    try {
      console.log('Setting up the device player...');
      const deviceRendererFactory = new DeviceRendererFactory();
      playerInstanceRef.current = deviceRendererFactory.setupRenderer(
        containerRef.current,
        `wss://${instanceAddress}`,
        options,
      );

      // Clean up on unmount
      return () => {
        disconnectPlayer();
      };
    } catch (e) {
      console.error('Error while loading the device player:', e);
    }
  }, [instanceAddress, instanceId]);

  const disconnectPlayer = () => {
    if (playerInstanceRef.current && playerInstanceRef.current.VM_communication) {
      console.log('Disconnecting from Genymotion instance...');
      playerInstanceRef.current.VM_communication.disconnect();
      playerInstanceRef.current = null;
    }
  };

  return (
    <div>
      <div ref={containerRef} className="w-full h-full" />
      <button onClick={disconnectPlayer} className="mt-4 px-4 py-2 bg-red-500 text-white rounded">
        Disconnect
      </button>
    </div>
  );
}