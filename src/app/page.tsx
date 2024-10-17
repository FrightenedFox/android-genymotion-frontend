'use client';

import { useEffect } from 'react';
import { DeviceRendererFactory } from '@genymotion/device-web-player';

export default function Home() {
  useEffect(() => {
    // Replace with your actual instance address and token
    const webrtcAddress = 'wss://3.72.233.90';
    const token = 'i-07cff442ac7f84da8';

    const container = document.getElementById('genymotion');

    const options = {
      template: "renderer_partial", // As per documentation
      paas: true,
      gpsSpeedSupport: true,
      translateHomeKey: true,
      streamResolution: false,
      fileUploadUrl: 'wss://ec2-3-72-233-90.eu-central-1.compute.amazonaws.com/fileupload/',
      token: token,
      microphone: true,
      baseband: true,
      connectionFailedURL:
        'https://www.genymotion.com/help/cloud-paas/iceconnectionstate-failed/',
    };

    let instance: any;
    try { 
      const deviceRendererFactory = new DeviceRendererFactory();
      instance = deviceRendererFactory.setupRenderer(
        container!,
        webrtcAddress,
        options,
      );

      // Clean up on unmount
      const handleBeforeUnload = () => {
        instance.destroy();
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    } catch (e) {
      console.error('Error while loading the device player:', e);
    }
  }, []);

  return (
    <div>
      {/* Optional: Include Google Maps API if you need GPS map positioning */}
      {/* <Script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY" /> */}
      <div id="genymotion" style={{ width: '100%', height: '100vh' }}></div>
    </div>
  );
}