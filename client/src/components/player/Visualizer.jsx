import { useEffect, useRef } from "react";
import { getAnalyserNode } from "../../lib/directAudio.js";
import { usePlayerStore } from "../../store/playerStore.js";

export function Visualizer() {
  const canvasRef = useRef(null);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isDirect = usePlayerStore((state) => state.sourceType === "preview" || state.sourceType === "jamendo");

  useEffect(() => {
    let animationId;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        canvas.width = entry.contentRect.width * window.devicePixelRatio;
        canvas.height = entry.contentRect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    });
    resizeObserver.observe(canvas);

    let analyser = null;
    let bufferLength = 0;
    let dataArray = null;

    function draw() {
      animationId = requestAnimationFrame(draw);

      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;

      ctx.clearRect(0, 0, width, height);

      // Lazy load analyser once audio context starts and direct audio is playing
      if (!analyser && isDirect) {
        analyser = getAnalyserNode();
        if (analyser) {
          bufferLength = analyser.frequencyBinCount;
          dataArray = new Uint8Array(bufferLength);
        }
      }

      if (analyser && isPlaying && isDirect) {
        analyser.getByteFrequencyData(dataArray);
      } else if (dataArray) {
        // Decaying effect when paused or not direct
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = Math.max(0, dataArray[i] - 4);
        }
      }

      if (!dataArray) {
        // Draw flat line
        ctx.strokeStyle = "rgba(255, 0, 127, 0.3)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height - 2);
        ctx.lineTo(width, height - 2);
        ctx.stroke();
        return;
      }

      const barWidth = (width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * (height - 4);

        const grad = ctx.createLinearGradient(0, height, 0, height - barHeight);
        grad.addColorStop(0, "rgba(255, 0, 127, 0.1)");
        grad.addColorStop(0.5, "rgba(255, 0, 127, 0.7)");
        grad.addColorStop(1, "rgba(0, 245, 255, 0.95)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        
        const finalBarHeight = Math.max(2, barHeight); // minimum height of 2px
        if (ctx.roundRect) {
          ctx.roundRect(x, height - finalBarHeight, barWidth - 3, finalBarHeight, 3);
        } else {
          ctx.rect(x, height - finalBarHeight, barWidth - 3, finalBarHeight);
        }
        ctx.fill();

        x += barWidth;
      }
    }

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, [isPlaying, isDirect]);

  return (
    <div className="visualizer-container">
      <canvas ref={canvasRef} className="visualizer-canvas" />
    </div>
  );
}
