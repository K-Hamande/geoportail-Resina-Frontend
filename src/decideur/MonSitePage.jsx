import { useCallback, useEffect, useState } from "react";
import { apiGet } from "../shared/apiClient";
import { useSiteSelection } from "../shared/SiteSelectionContext";
import DecideurLayout from "./DecideurLayout";
import UpdateBar from "./UpdateBar";
import AnpticStatusCard from "./AnpticStatusCard";
import LanStatusCard from "./LanStatusCard";

const INTERVALLE_ACTUALISATION_MS = 30000; // 30 s

function MonSitePage() {
  const { siteId } = useSiteSelection();
  const [anpticData, setAnpticData] = useState(null);
  const [lanData, setLanData] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const chargerStatuts = useCallback(() => {
    if (!siteId) return;
    apiGet(`/api/v1/site/${siteId}/anptic`).then(setAnpticData).catch((err) => setErreur(err.message));
    apiGet(`/api/v1/site/${siteId}/lan`).then(setLanData).catch((err) => setErreur(err.message));
    setLastUpdated(new Date());
  }, [siteId]);

  useEffect(() => {
    chargerStatuts();
  }, [chargerStatuts]);

  useEffect(() => {
    const intervalle = setInterval(chargerStatuts, INTERVALLE_ACTUALISATION_MS);
    return () => clearInterval(intervalle);
  }, [chargerStatuts]);

  return (
    <DecideurLayout>
      <UpdateBar lastUpdated={lastUpdated} onRefresh={chargerStatuts} />
      {erreur && <p style={{ color: "var(--color-ko)" }}>Erreur : {erreur}</p>}
      <AnpticStatusCard data={anpticData} />
      <LanStatusCard data={lanData} />
    </DecideurLayout>
  );
}

export default MonSitePage;