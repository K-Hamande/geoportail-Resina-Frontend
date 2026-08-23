import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { apiGet } from "../shared/apiClient";
import LambdaLayout from "./LambdaLayout";

const CENTRE_BURKINA_FASO = [12.2, -1.5];

function LambdaCartePage() {
  const [sites, setSites] = useState([]);

  useEffect(() => {
    apiGet("/api/v1/sites/statut-simple").then(setSites).catch(() => {});
    const intervalle = setInterval(() => {
      apiGet("/api/v1/sites/statut-simple").then(setSites).catch(() => {});
    }, 60000);
    return () => clearInterval(intervalle);
  }, []);

  const sitesPositionnes = sites.filter((s) => s.latitude != null && s.longitude != null);

  return (
    <LambdaLayout>
      <div className="lambda-carte-wrapper">
        <MapContainer center={CENTRE_BURKINA_FASO} zoom={7} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {sitesPositionnes.map((site) => (
            <CircleMarker
              key={site.siteId}
              center={[site.latitude, site.longitude]}
              radius={8}
              pathOptions={{
                fillColor: site.statut === "OK" ? "#0D9B5A" : "#D93535",
                color: site.statut === "OK" ? "#0D9B5A" : "#D93535",
                fillOpacity: 0.85,
                weight: 1,
              }}
            >
              <Popup>
                <div style={{ textAlign: "center", minWidth: "120px" }}>
                  <div style={{ fontSize: "20px" }}>{site.statut === "OK" ? "🟢" : "🔴"}</div>
                  <div style={{ fontWeight: 700, fontSize: "13px" }}>{site.nom}</div>
                  <div style={{ fontSize: "11px", color: "#5B6478" }}>{site.ville}</div>
                  <div style={{ marginTop: "4px", fontWeight: 600, color: site.statut === "OK" ? "#0D9B5A" : "#D93535" }}>
                    {site.statut === "OK" ? "Opérationnel" : "Hors service"}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </LambdaLayout>
  );
}

export default LambdaCartePage;