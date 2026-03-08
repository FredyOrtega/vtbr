import React from "react";

interface Props {
    url: string;
}

export function BackgroundPlayer({ url }: Props) {
    if (!url) return null;

    const embed = url.replace("watch?v=", "embed/");

    return (
        <iframe
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1"
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 0
            }}
        />
    );
}