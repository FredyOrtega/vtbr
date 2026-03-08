import React from "react";

interface Props {
    url: string;
}

export function BackgroundPlayer({ url }: Props) {
    if (!url) return null;

    const embed = url.replace("watch?v=", "embed/");

    return (
        <iframe
            src={embed + "?autoplay=1&mute=1&controls=0&loop=1"}
            title="YouTube background"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 0,
                pointerEvents: "none"
            }}
        />
    );
}