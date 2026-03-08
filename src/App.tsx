import React, { useState } from "react";
import { Experience } from "./components/Experience";

export default function App() {

  const [videoUrl, setVideoUrl] = useState("");
  const [inputUrl, setInputUrl] = useState("");

  const loadVideo = () => {
    if (!inputUrl) return;

    let id = inputUrl;

    try {
      if (inputUrl.includes("watch?v=")) {
        id = new URL(inputUrl).searchParams.get("v") || "";
      }

      if (inputUrl.includes("youtu.be/")) {
        id = inputUrl.split("youtu.be/")[1];
      }

    } catch (e) { }

    setVideoUrl(`https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0`);
  };

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">

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
          headTransform={{
            rotation: { x: 0, y: 0, z: 0 },
            position: { x: 0, y: 0 },
            expressions: { browLeft: 0, browRight: 0 }
          }}
        />
      </div>

    </div>
  );
}