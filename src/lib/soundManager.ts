import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

let soundInstance: AudioPlayer | null = null;

export async function playSirenSound() {
  try {
    if (soundInstance) {
      await stopSirenSound();
    }

    // Configure audio to play out loud even in silent mode
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      shouldRouteThroughEarpiece: false,
    });

    const player = createAudioPlayer(require('@/assets/sounds/siren.mp3'));
    player.loop = true;
    player.volume = 1.0;
    player.play();
    soundInstance = player;
  } catch (error) {
    console.warn('[sound] failed to play siren sound', error);
  }
}

export async function stopSirenSound() {
  try {
    if (soundInstance) {
      soundInstance.pause();
      soundInstance.release();
      soundInstance = null;
    }
  } catch (error) {
    console.warn('[sound] failed to stop siren sound', error);
  }
}
