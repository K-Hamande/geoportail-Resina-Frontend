import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiGet } from "../shared/apiClient";
import DecideurLayout from "./DecideurLayout";
import UpdateBar from "./UpdateBar";
import SiteSelector from "./SiteSelector";
import AnpticStatusCard from "./AnpticStatusCard";
import LanStatusCard from "./LanStatusCard";

function MonSitePage() {
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState(null);
  const [anpticData, setAnpticData] = useState(null);
  const [lanData, setLanData] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [searchParams] = useSearchParams();

  useEffect(() => {
    apiGet("/api/v1/sites")
      .then((data) => {
        setSites(data);
        const siteDepuisUrl = searchParams.get("site");
        if (siteDepuisUrl) setSiteId(siteDepuisUrl);
        else if (data.length > 0) setSiteId(data[0].siteId);
      })
      .catch((err) => setErreur(err.message));
  }, []);

  // useCallback "fige" cette fonction : elle n'est recreee que si "siteId"
  // change. Necessaire ici pour pouvoir l'utiliser sans risque dans le
  // tableau de dependances du useEffect juste en dessous (sinon, une
  // NOUVELLE fonction serait creee a CHAQUE rendu, declenchant une
  // boucle infinie de rechargements).
  const chargerStatuts = useCallback(() => {
    if (!siteId) return;
    apiGet(`/api/v1/site/${siteId}/anptic`).then(setAnpticData).catch((err) => setErreur(err.message));
    apiGet(`/api/v1/site/${siteId}/lan`).then(setLanData).catch((err) => setErreur(err.message));
    setLastUpdated(new Date());
  }, [siteId]);

  useEffect(() => {
    chargerStatuts();
  }, [chargerStatuts]);

  return (
    <DecideurLayout headerExtra={<SiteSelector sites={sites} siteId={siteId} onChange={setSiteId} />}>
      <UpdateBar lastUpdated={lastUpdated} onRefresh={chargerStatuts} />
      {erreur && <p style={{ color: "var(--color-ko)" }}>Erreur : {erreur}</p>}
      <AnpticStatusCard data={anpticData} />
      <LanStatusCard data={lanData} />
    </DecideurLayout>
  );
}

export default MonSitePage;