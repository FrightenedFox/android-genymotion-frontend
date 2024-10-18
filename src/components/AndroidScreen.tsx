import { useEffect } from 'react';
import { DeviceRendererFactory } from '@genymotion/device-web-player';

interface AndroidScreenProps {
  instanceAddress: string;
  instanceId: string;
}

export function AndroidScreen({ instanceAddress, instanceId }: AndroidScreenProps) {
  useEffect(() => {
    const container = document.getElementById('genymotion');

    const options = {
      template: "renderer_partial",
      paas: true,
      gpsSpeedSupport: true,
      translateHomeKey: true,
      streamResolution: false,
      fileUploadUrl: `wss://${instanceAddress}/fileupload/`,
      token: instanceId,
      microphone: true,
      baseband: true,
      connectionFailedURL: 'https://www.genymotion.com/help/cloud-paas/iceconnectionstate-failed/',
    };

    let instance: any;
    try {
      console.log('Setting up the device player...');
      const deviceRendererFactory = new DeviceRendererFactory();
      instance = deviceRendererFactory.setupRenderer(
        container!,
        `wss://${instanceAddress}`,
        options,
      );

      // Clean up on unmount
      return () => {
        // instance.destroy();
      };
    } catch (e) {
      console.error('Error while loading the device player:', e);
    }
  }, [instanceAddress, instanceId]);

  return (
    <div id="genymotion" className="w-full h-full" />
  );
}