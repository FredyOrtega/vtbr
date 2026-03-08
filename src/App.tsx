import React, { useState } from "react";
import { Experience } from "./components/Experience";

export default function App() {
  const [headTransform, setHeadTransform] = useState({
    rotation: { x: 0, y: 0, z: 0 },
    position: { x: 0, y: 0 },
    expressions: { browLeft: 0, browRight: 0 }
  });

  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;

    setHeadTransform({
      rotation: {
        x: y * 0.5,
        y: -x * 0.5,
        z: 0
      },
      position: {
        x: x * 0.5,
        y: y * 0.5
      },
      expressions: {
        browLeft: 0,
        browRight: 0
      }
    });
  };
  const [videoUrl, setVideoUrl] = useState("");
  const [inputUrl, setInputUrl] = useState("");

  const loadVideo = () => {
    if (!inputUrl) return;

    // Regex que cubre: watch?v=, youtu.be, embed, y shorts
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = inputUrl.match(regex);
    const videoId = match ? match[1] : null;

    if (!videoId) {
      alert("URL de YouTube no válida");
      return;
    }

    // Importante: quitamos el mute=1 si quieres escuchar el video, 
    // pero recuerda que muchos navegadores bloquean el autoplay con sonido.
    setVideoUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0`);
  };


  // Regex que cubre: watch?v=, youtu.be, embed, y shorts
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = inputUrl.match(regex);
  const videoId = match ? match[1] : null;

  if (!videoId) {
    alert("URL de YouTube no válida");
    return;
  }

  // Importante: quitamos el mute=1 si quieres escuchar el video, 
  // pero recuerda que muchos navegadores bloquean el autoplay con sonido.
  setVideoUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0`);
  return (
    <div
      className="w-full h-screen bg-black overflow-hidden relative"
      onMouseMove={handleMouseMove}
    >

      {/* VIDEO BACKGROUND */}
      {videoUrl && (
        <iframe
          src={videoUrl}
          allow="autoplay"
          className="absolute top-0 left-0 w-full h-full"
          style={{
            border: "none",
            zIndex: 0
          }}
        />
      )}

      {/* URL INPUT */}
      {!videoUrl && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-4">

          <h1 className="text-white text-3xl font-bold">
            YouTube Avatar Player
          </h1>

          <input
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Paste YouTube URL"
            className="px-4 py-2 rounded text-black w-80"
          />

          <button
            onClick={loadVideo}
            className="bg-red-600 text-white px-6 py-2 rounded"
          >
            Load Video
          </button>

        </div>
      )}

      {/* AVATAR */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          width: 260,
          height: 260,
          zIndex: 2
        }}
      >
        <Experience
          analyser={null}
          headTransform={headTransform}
        />
      </div>

    </div>
  );
}