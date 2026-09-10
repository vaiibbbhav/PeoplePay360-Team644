/**
 * DigitalPersona U.are.U 4500 Web SDK Wrapper
 * Provides an event-driven interface to the local DigitalPersona Web Service.
 */

// Global declarations for DigitalPersona Web SDK
declare global {
  interface Window {
    Fingerprint?: any;
  }
}

export type SampleAcquiredData = {
  dataUrl: string;
  rawBase64: string;
  sampleIndex?: number;
  deviceUid?: string;
};

export type DeviceEvent = {
  deviceUid?: string;
  [key: string]: any;
};

type ListenerMap = {
  deviceConnected: ((e: DeviceEvent) => void)[];
  deviceDisconnected: ((e: DeviceEvent) => void)[];
  communicationFailed: ((e: any) => void)[];
  sampleAcquired: ((s: SampleAcquiredData) => void)[];
  qualityReported: ((q: { quality: any; qualityName: string }) => void)[];
};

class FingerprintService {
  private sdk: any = null;
  public isAcquiring: boolean = false;
  public currentReader: string = '';
  private listeners: ListenerMap = {
    deviceConnected: [],
    deviceDisconnected: [],
    communicationFailed: [],
    sampleAcquired: [],
    qualityReported: [],
  };

  constructor() {
    this.initSdk();
  }

  public isAvailable(): boolean {
    return typeof window !== 'undefined' && Boolean(window.Fingerprint?.WebApi);
  }

  public initSdk(): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      this.sdk = new window.Fingerprint.WebApi();

      this.sdk.onDeviceConnected = (e: DeviceEvent) => {
        this.emit('deviceConnected', e);
      };

      this.sdk.onDeviceDisconnected = (e: DeviceEvent) => {
        this.isAcquiring = false;
        this.currentReader = '';
        this.emit('deviceDisconnected', e);
      };

      this.sdk.onCommunicationFailed = (e: any) => {
        this.isAcquiring = false;
        this.currentReader = '';
        this.emit('communicationFailed', e);
        this.resetConnection();
      };

      this.sdk.onSamplesAcquired = (s: any) => {
        try {
          this.emit('sampleAcquired', this.parseSample(s));
        } catch (err) {
          console.error('Error parsing acquired fingerprint sample:', err);
        }
      };

      this.sdk.onQualityReported = (e: any) => {
        const qualityName = window.Fingerprint.QualityCode?.[e.quality] || String(e.quality);
        this.emit('qualityReported', { quality: e.quality, qualityName });
      };

      return true;
    } catch (err) {
      console.error('Failed to initialize Fingerprint WebApi:', err);
      return false;
    }
  }

  private resetConnection(): void {
    // The DigitalPersona client caches authenticated connection details in
    // sessionStorage. They are invalid after DpHostW restarts.
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('websdk');
      window.sessionStorage.removeItem('websdk.sessionId');
    }

    if (this.sdk) {
      this.sdk.onCommunicationFailed = null;
    }
    this.sdk = null;
    this.initSdk();
  }

  public on<K extends keyof ListenerMap>(event: K, callback: ListenerMap[K][number]): void {
    const list = this.listeners[event] as Array<ListenerMap[K][number]>;
    if (list) {
      list.push(callback);
    }
  }

  public off<K extends keyof ListenerMap>(event: K, callback: ListenerMap[K][number]): void {
    const list = this.listeners[event] as Array<ListenerMap[K][number]>;
    if (list) {
      this.listeners[event] = list.filter((cb) => cb !== callback) as ListenerMap[K];
    }
  }

  private emit<K extends keyof ListenerMap>(
    event: K,
    data: Parameters<ListenerMap[K][number]>[0],
  ): void {
    const list = this.listeners[event];
    if (list) {
      list.forEach((cb) => {
        try {
          (cb as (arg: typeof data) => void)(data);
        } catch (e) {
          console.error(`Error in ${String(event)} listener:`, e);
        }
      });
    }
  }

  /**
   * Enumerates connected DigitalPersona readers.
   */
  public async enumerateDevices(): Promise<string[]> {
    if (!this.sdk) {
      this.initSdk();
    }
    if (!this.sdk) {
      throw new Error('DigitalPersona Web SDK is not available');
    }
    return await this.sdk.enumerateDevices();
  }

  /**
   * Starts fingerprint acquisition.
   */
  public async startAcquisition(readerUid = ''): Promise<void> {
    if (!this.sdk) this.initSdk();
    if (!this.sdk) throw new Error('SDK not initialized');
    if (this.isAcquiring) return;

    this.currentReader = readerUid;
    this.isAcquiring = true;

    try {
      const format = window.Fingerprint.SampleFormat.PngImage;
      await this.sdk.startAcquisition(format, readerUid);
    } catch (err) {
      this.isAcquiring = false;
      this.currentReader = '';
      throw err;
    }
  }

  /**
   * Stops fingerprint acquisition.
   */
  public async stopAcquisition(): Promise<void> {
    if (!this.sdk || !this.isAcquiring) return;
    try {
      await this.sdk.stopAcquisition();
    } finally {
      this.isAcquiring = false;
      this.currentReader = '';
    }
  }

  /**
   * Decodes acquired sample object into a displayable and transmittable PNG data URL.
   */
  public parseSample(s: any): SampleAcquiredData {
    if (!s || !s.samples) {
      throw new Error('Empty sample acquired');
    }
    const samples = typeof s.samples === 'string' ? JSON.parse(s.samples) : s.samples;
    if (!samples || samples.length === 0) {
      throw new Error('No sample items in acquisition payload');
    }

    // Convert Base64URL to standard Base64
    const base64Data = window.Fingerprint.b64UrlTo64(samples[0]);
    const dataUrl = `data:image/png;base64,${base64Data}`;

    return {
      dataUrl,
      rawBase64: base64Data,
      sampleIndex: s.sampleIndex,
      deviceUid: s.deviceUid,
    };
  }
}

export const fingerprintSdk = new FingerprintService();
