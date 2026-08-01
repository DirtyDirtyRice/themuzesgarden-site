class TimelineDawPcmCaptureProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.channelCount = Math.max(1, Math.min(32, options.processorOptions?.channelCount ?? 1));
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    for (const channel of output) channel.fill(0);
    if (!input?.[0]?.length) return true;
    const frameCount = input[0].length;
    const channels = Array.from({ length: this.channelCount }, (_, index) =>
      input[index] ? new Float32Array(input[index]) : new Float32Array(frameCount));
    const buffers = channels.map((channel) => channel.buffer);
    this.port.postMessage({ type: "pcm", channels: buffers }, buffers);
    return true;
  }
}

registerProcessor("timeline-daw-pcm-capture", TimelineDawPcmCaptureProcessor);
