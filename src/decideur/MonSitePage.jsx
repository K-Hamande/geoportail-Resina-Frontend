import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, TriangleAlert, XCircle } from "lucide-react";
import { apiGet } from "../shared/apiClient";
import { useSiteSelection } from "../shared/SiteSelectionContext";
import ErrorBanner from "../shared/ErrorBanner";
import DecideurLayout from "./DecideurLayout";
import UpdateBar from "./UpdateBar";
import AnpticStatusCard from "./AnpticStatusCard";
import LanStatusCard from "./LanStatusCard";

const INTERVALLE_ACTUALISATION_DEFAUT_S = 60; // repris de AdminSupervisionService.DEFAUT_INTERVALLE_S

// Meme echelle de gravite que NodeStatus.severityRank() cote backend :
// sert a combiner le statut ANPTIC et le statut LAN en un seul message
// de synthese (le pire des deux l'emporte).
const RANG_GRAVITE = { OK: 0, WARN: 1, UNKNOWN: 1, KO: 2 };

function pireStatut(a, b) {
  if (!a) return b;
  if (!b) return a;
  return (RANG_GRAVITE[b] ?? 1) > (RANG_GRAVITE[a] ?? 1) ? b : a;
}

const HERO_PAR_STATUT = {
  OK: { classe: "hero-ok", Icone: CheckCircle2, titre: "Tout fonctionne normalement", sous: "Réseau ANPTIC et réseau du bâtiment opérationnels." },
  WARN: { classe: "hero-warn", Icone: TriangleAlert, titre: "Attention requise", sous: "Une dégradation a été détectée sur ce site." },
  UNKNOWN: { classe: "hero-warn", Icone: TriangleAlert, titre: "Statut incertain", sous: "Certaines données ne sont pas encore disponibles." },
  KO: { classe: "hero-ko", Icone: XCircle, titre: "Panne détectée", sous: "Une intervention est nécessaire sur ce site." },
};

function MonSitePage() {
  const { siteId, sites } = useSiteSelection();
  const siteSelectionne = sites.find((site) => site.siteId === siteId);
  const intervalleActualisationMs =
    (siteSelectionne?.intervalleActualisationS ?? INTERVALLE_ACTUALISATION_DEFAUT_S) * 1000;
  const [anpticData, setAnpticData] = useState(null);
  const [lanData, setLanData] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  // Retient le dernier siteId charge avec succes (pas un simple booleen :
  // changer de site via le selecteur doit redevenir un "premier chargement"
  // pour CE site). Sert a eviter qu'un rafraichissement periodique en
  // echec passager (ex: 429 "trop de requetes") n'efface les donnees deja
  // affichees avec un ecran d'erreur - seul un echec AVANT tout succes
  // pour ce site doit afficher l'erreur.
  const dernierSiteChargeAvecSucces = useRef(null);

  const chargerStatuts = useCallback(async () => {
    if (!siteId) return;
    setIsLoading(true);
    try {
      const [anptic, lan] = await Promise.all([
        apiGet(`/api/v1/site/${siteId}/anptic`),
        apiGet(`/api/v1/site/${siteId}/lan`),
      ]);
      setAnpticData(anptic);
      setLanData(lan);
      setLastUpdated(new Date());
      setErreur(null);
      dernierSiteChargeAvecSucces.current = siteId;
    } catch (err) {
      if (dernierSiteChargeAvecSucces.current !== siteId) setErreur(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    chargerStatuts();
  }, [chargerStatuts]);

  useEffect(() => {
    const intervalle = setInterval(chargerStatuts, intervalleActualisationMs);
    return () => clearInterval(intervalle);
  }, [chargerStatuts, intervalleActualisationMs]);

  const statutGlobal = anpticData && lanData ? pireStatut(anpticData.status, lanData.globalStatus) : null;
  const hero = statutGlobal ? HERO_PAR_STATUT[statutGlobal] ?? HERO_PAR_STATUT.UNKNOWN : null;

  return (
    <DecideurLayout>
      <UpdateBar lastUpdated={lastUpdated} onRefresh={chargerStatuts} isLoading={isLoading} />
      <ErrorBanner message={erreur} onRetry={chargerStatuts} />

      {hero && (
        <div className={`site-hero ${hero.classe}`}>
          <span className="site-hero-icon"><hero.Icone size={26} /></span>
          <div className="site-hero-texts">
            <div className="site-hero-title">{hero.titre}</div>
            <div className="site-hero-sub">{hero.sous}</div>
          </div>
        </div>
      )}

      <AnpticStatusCard data={anpticData} />
      <LanStatusCard data={lanData} />
    </DecideurLayout>
  );
}

export default MonSitePage;