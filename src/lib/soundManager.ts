import { Audio } from 'expo-av';

let soundInstance: Audio.Sound | null = null;

export async function playSirenSound() {
  try {
    if (soundInstance) {
      await stopSirenSound();
    }

    // Configure audio to play out loud even in silent mode
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      playThroughEarpieceAndroid: false,
    });

    const { sound } = await Audio.Sound.createAsync(
      require('@/assets/sounds/siren.mp3'),
      { shouldPlay: true, isLooping: true, volume: 1.0 }
    );
    soundInstance = sound;
  } catch (error) {
    console.warn('[sound] failed to play siren sound', error);
  }
}

export async function stopSirenSound() {
  try {
    if (soundInstance) {
      await soundInstance.stopAsync();
      await soundInstance.unloadAsync();
      soundInstance = null;
    }
  } catch (error) {
    console.warn('[sound] failed to stop siren sound', error);
  }
}
