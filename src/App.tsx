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
    // 1. Validar que no esté vacío
    if (!inputUrl.trim()) {
      alert("Por favor, pega una URL");
      return;
    }

    // 2. Extraer el ID de YouTube usando Regex (funciona con shorts, watch?v=, youtu.be, etc)
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = inputUrl.match(regExp);
    const videoId = (match && match[7].length === 11) ? match[7] : null;

    if (videoId) {
      // 3. Construir la URL de embed correcta
      // Nota: eliminamos mute=1 si quieres que se escuche (pero requiere interacción del usuario)
      const finalUrl = `https://www.youtube.com{videoId}?autoplay=1&mute=1&rel=0`;
      setVideoUrl(finalUrl);
    } else {
      alert("URL de YouTube no válida. Verifica el formato.");
    }
  };

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative" onMouseMove={handleMouseMove}>

      {/* VIDEO BACKGROUND - Se renderiza solo si videoUrl tiene valor */}
      {videoUrl && (
        <iframe
          src={videoUrl}
          allow="autoplay; encrypted-media"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full"
          style={{ border: "none", zIndex: 0 }}
        />
      )}

      {/* URL INPUT - Se oculta cuando ya hay un video cargado */}
      {!videoUrl && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-4 bg-black/50">
          <h1 className="text-white text-3xl font-bold">YouTube Avatar Player</h1>
          <input
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Pega la URL de YouTube aquí..."
            className="px-4 py-2 rounded text-black w-80 border-2 border-red-500"
          />
          <button
            onClick={loadVideo} // <-- Asegúrate de que esta línea esté tal cual
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded transition-colors"
          >
            Load Video
          </button>
        </div>
      )}

      {/* AVATAR - Siempre visible encima de todo */}
      <div style={{ position: "absolute", bottom: 20, right: 20, width: 260, height: 260, zIndex: 2 }}>
        <Experience analyser={null} headTransform={headTransform} />
      </div>

      {/* BOTÓN OPCIONAL: Para cambiar de video una vez cargado */}
      {videoUrl && (
        <button
          onClick={() => setVideoUrl("")}
          className="absolute top-4 right-4 z-20 bg-white/20 text-white px-3 py-1 rounded hover:bg-white/40"
        >
          Cambiar Video
        </button>
      )}
    </div>
  );
}