import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiGet } from "../shared/apiClient";
import Header from "./Header";
import Footer from "./Footer";
import DecideurNav from "./DecideurNav";
import SiteSelector from "./SiteSelector";
import AnpticStatusCard from "./AnpticStatusCard";
import LanStatusCard from "./LanStatusCard";

function MonSitePage() {
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState(null);
  const [anpticData, setAnpticData] = useState(null);
  const [lanData, setLanData] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    apiGet("/api/v1/sites")
      .then((data) => {
        setSites(data);
        const siteDepuisUrl = searchParams.get("site");
        if (siteDepuisUrl) {
          setSiteId(siteDepuisUrl);
        } else if (data.length > 0) {
          setSiteId(data[0].siteId);
        }
      })
      .catch((err) => setErreur(err.message));
  }, []);

  useEffect(() => {
    if (!siteId) return;
    apiGet(`/api/v1/site/${siteId}/anptic`).then(setAnpticData).catch((err) => setErreur(err.message));
    apiGet(`/api/v1/site/${siteId}/lan`).then(setLanData).catch((err) => setErreur(err.message));
  }, [siteId]);

  return (
    <div className="page">
      <Header />
      <DecideurNav />
      <div className="page-content">
        {erreur && <p style={{ color: "var(--color-ko)" }}>Erreur : {erreur}</p>}
        <SiteSelector sites={sites} siteId={siteId} onChange={setSiteId} />
        <AnpticStatusCard data={anpticData} />
        <LanStatusCard data={lanData} />
      </div>
      <Footer />
    </div>
  );
}

export default MonSitePage;