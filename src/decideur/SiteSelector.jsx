import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronUp, ChevronDown } from "lucide-react";

function SiteSelector({ sites, siteId, onChange }) {
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [position, setPosition] = useState(null);
  const conteneurRef = useRef(null);
  const panneauRef = useRef(null);
  const inputRef = useRef(null);

  const siteSelectionne = sites.find((s) => s.siteId === siteId);

  const sitesFiltres = useMemo(() => {
    const texte = recherche.trim().toLowerCase();
    if (!texte) return sites;
    return sites.filter(
      (s) => s.nom.toLowerCase().includes(texte) || s.ville.toLowerCase().includes(texte)
    );
  }, [sites, recherche]);

  // Ferme le menu si on clique n'importe ou en dehors - le panneau est
  // desormais rendu via un portail (hors de .selector-box, cf. plus bas),
  // donc il faut aussi verifier panneauRef en plus de conteneurRef.
  useEffect(() => {
    function surClicExterieur(e) {
      const dansDeclencheur = conteneurRef.current && conteneurRef.current.contains(e.target);
      const dansPanneau = panneauRef.current && panneauRef.current.contains(e.target);
      if (!dansDeclencheur && !dansPanneau) setOuvert(false);
    }
    document.addEventListener("mousedown", surClicExterieur);
    return () => document.removeEventListener("mousedown", surClicExterieur);
  }, []);

  // Ferme aussi sur Echap - deuxieme moyen de fermer, independant du clic
  // exterieur (cf. BUG CORRIGE plus bas sur le bouton declencheur).
  useEffect(() => {
    if (!ouvert) return;
    function surEchap(e) {
      if (e.key === "Escape") setOuvert(false);
    }
    document.addEventListener("keydown", surEchap);
    return () => document.removeEventListener("keydown", surEchap);
  }, [ouvert]);

  // BUG CORRIGE : le panneau etait positionne en absolute A L'INTERIEUR du
  // header decideur, qui passe en position: sticky a partir de 1024px -
  // une fois le header "colle" en haut apres defilement de la page, le
  // contenu du panneau qui depassait de sa hauteur normale se faisait
  // couper (comportement connu de position: sticky avec un descendant
  // absolute qui deborde largement). Le panneau est maintenant rendu via
  // un portail dans document.body, en position: fixed, positionne a
  // chaque ouverture (et reajuste si la page defile/redimensionne tant
  // qu'il reste ouvert) a partir des coordonnees REELLES du bouton a
  // l'ecran - il n'est plus un descendant du header et ne peut donc plus
  // etre coupe par lui.
  function recalculerPosition() {
    if (!conteneurRef.current) return;
    const rect = conteneurRef.current.getBoundingClientRect();
    setPosition({ top: rect.bottom + 8, left: rect.left, width: rect.width });
  }

  useEffect(() => {
    if (!ouvert) return;
    recalculerPosition();
    window.addEventListener("scroll", recalculerPosition, true);
    window.addEventListener("resize", recalculerPosition);
    return () => {
      window.removeEventListener("scroll", recalculerPosition, true);
      window.removeEventListener("resize", recalculerPosition);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ouvert]);

  // BUG CORRIGE : le bouton ne faisait qu'OUVRIR (toujours setOuvert(true)),
  // jamais basculer - un re-clic dessus en pensant fermer le menu n'avait
  // aucun effet, seul un clic EN DEHORS fermait (ou Echap, ajoute ci-dessus).
  // Bascule desormais comme attendu.
  function basculerMenu() {
    if (ouvert) {
      setOuvert(false);
      return;
    }
    setOuvert(true);
    setRecherche("");
    // Le champ de recherche vient d'apparaitre dans le DOM - on lui donne
    // le focus juste apres, une fois le rendu effectue.
    setTimeout(() => inputRef.current && inputRef.current.focus(), 0);
  }

  function choisirSite(site) {
    onChange(site.siteId);
    setOuvert(false);
  }

  return (
    <div className="selector-box" ref={conteneurRef}>
      <div style={{ flex: 1, position: "relative" }}>
        <div className="selector-label">Site sélectionné</div>

        <button type="button" className="site-select-trigger" onClick={basculerMenu}>
          {siteSelectionne ? siteSelectionne.nom : "Choisir un site…"}
        </button>
      </div>
      <button
        type="button"
        onClick={basculerMenu}
        style={{ opacity: 0.7, display: "inline-flex", background: "none", border: "none", padding: 0, color: "inherit", cursor: "pointer" }}
        aria-label={ouvert ? "Fermer la liste des sites" : "Ouvrir la liste des sites"}
      >
        {ouvert ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {ouvert && position && createPortal(
        <div
          ref={panneauRef}
          className="site-select-panel"
          style={{ top: position.top, left: position.left, width: Math.max(position.width, 280) }}
        >
          <input
            ref={inputRef}
            type="text"
            className="site-select-search"
            placeholder="Rechercher par nom ou ville…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />

          <div className="site-select-count">
            {sitesFiltres.length} site{sitesFiltres.length > 1 ? "s" : ""}
          </div>

          <div className="site-select-list">
            {sitesFiltres.length === 0 && (
              <div className="site-select-empty">Aucun résultat</div>
            )}
            {sitesFiltres.map((site) => (
              <button
                type="button"
                key={site.siteId}
                className={`site-select-item ${site.siteId === siteId ? "site-select-item-actif" : ""}`}
                onClick={() => choisirSite(site)}
              >
                <div className="site-select-item-nom">{site.nom}</div>
                <div className="site-select-item-ville">{site.ville}</div>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default SiteSelector;
