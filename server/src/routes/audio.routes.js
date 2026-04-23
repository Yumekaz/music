import { Router } from "express";

const router = Router();

const tones = {
  "track-blinding-lights": [392, 494, 587, 494],
  "track-kesariya": [330, 392, 440, 392],
  "track-pasoori": [294, 370, 440, 370],
  fallback: [330, 392, 494, 392]
};

function writeString(buffer, offset, value) {
  buffer.write(value, offset, value.length, "ascii");
}

function createWavePreview(id) {
  const sampleRate = 44100;
  const channels = 1;
  const bitsPerSample = 16;
  const seconds = 4;
  const samples = sampleRate * seconds;
  const bytesPerSample = bitsPerSample / 8;
  const dataSize = samples * channels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);
  const melody = tones[id] || tones.fallback;

  writeString(buffer, 0, "RIFF");
  buffer.writeUInt32LE(36 + dataSize, 4);
  writeString(buffer, 8, "WAVE");
  writeString(buffer, 12, "fmt ");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * bytesPerSample, 28);
  buffer.writeUInt16LE(channels * bytesPerSample, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  writeString(buffer, 36, "data");
  buffer.writeUInt32LE(dataSize, 40);

  for (let index = 0; index < samples; index += 1) {
    const time = index / sampleRate;
    const beat = Math.floor(time * 2) % melody.length;
    const frequency = melody[beat];
    const fadeIn = Math.min(time / 0.08, 1);
    const fadeOut = Math.min((seconds - time) / 0.12, 1);
    const envelope = Math.max(0, Math.min(fadeIn, fadeOut));
    const wave =
      Math.sin(2 * Math.PI * frequency * time) * 0.58 +
      Math.sin(2 * Math.PI * frequency * 2 * time) * 0.16;
    const sample = Math.round(Math.max(-1, Math.min(1, wave * envelope)) * 0x7fff);
    buffer.writeInt16LE(sample, 44 + index * bytesPerSample);
  }

  return buffer;
}

router.get("/preview/:id", (request, response) => {
  const audio = createWavePreview(request.params.id);
  response.set({
    "Content-Type": "audio/wav",
    "Content-Length": String(audio.length),
    "Cache-Control": "public, max-age=3600"
  });
  response.send(audio);
});

export default router;
