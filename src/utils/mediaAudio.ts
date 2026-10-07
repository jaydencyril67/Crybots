import { registerPlugin } from '@capacitor/core';

type MediaAudioPlugin = {
  prepareMediaOutput: () => Promise<void>;
  releaseMediaOutput: () => Promise<void>;
};

const MediaAudio = registerPlugin<MediaAudioPlugin>('MediaAudio');

export const prepareMediaOutput = async () => {
  try {
    await MediaAudio.prepareMediaOutput();
  } catch {
    // Browser/PWA builds have no native audio-routing plugin; normal HTML audio remains the fallback.
  }
};

export const releaseMediaOutput = async () => {
  try {
    await MediaAudio.releaseMediaOutput();
  } catch {
    // Browser/PWA builds have no native audio-routing plugin.
  }
};
