import { useMapEvents } from "react-leaflet";

// Ce composant n'affiche RIEN visuellement (il renvoie null) - son seul
// role est d'ecouter les evenements de la carte parente (via useMapEvents)
// et de remonter la position cliquee au composant parent, par la prop
// onPick. C'est un pattern courant avec react-leaflet : un composant
// "invisible" purement fonctionnel, place a l'interieur d'un MapContainer.
function LocationPicker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

export default LocationPicker;