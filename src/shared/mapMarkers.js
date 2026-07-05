import L from "leaflet";
import { getStatusColor } from "./statusStyles";

// Un "divIcon" Leaflet permet de definir une icone de marqueur a partir
// de HTML/CSS brut, plutot que d'utiliser une image. Pratique pour
// generer une couleur dynamique sans devoir preparer plusieurs fichiers
// image (un par couleur).
export function buildColoredMarkerIcon(status) {
  const couleur = getStatusColor(status);

  return L.divIcon({
    className: "", // on desactive le style par defaut de Leaflet pour cette icone
    html: `<div style="
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background-color: ${couleur};
      border: 2px solid white;
      box-shadow: 0 0 4px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10], // centre l'icone exactement sur les coordonnees GPS
  });
}