import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Finanzas JR",
    short_name: "Finanzas",
    description: "Tablero de salida de deuda y estabilización financiera",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f6f8",
    theme_color: "#0f172a",
    lang: "es-DO",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
