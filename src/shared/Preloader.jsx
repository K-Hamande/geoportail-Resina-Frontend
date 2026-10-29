// Prechargeur generique affiche pendant le chargement d'une page ou de
// donnees, pour que l'utilisateur sache qu'un traitement est en cours
// plutot que de se demander si l'appli a plante (cf. compte rendu des
// amendements, section III). Plein ecran par defaut (logo ANPTIC qui
// pulse, en superposition) - utilise partout dans l'appli pour tout
// chargement de page/section, a la place des "Chargement..." textuels
// bruts disperses auparavant.
function Preloader({ label = "Chargement...", pleinEcran = true }) {
  if (pleinEcran) {
    return (
      <div className="preloader-plein-ecran">
        <img src="/logo_anptic_ok.png" alt="ANPTIC" className="preloader-logo" />
        {label && <span className="preloader-label">{label}</span>}
      </div>
    );
  }

  return (
    <div className="preloader">
      <div className="preloader-spinner" aria-hidden="true"></div>
      {label && <span className="preloader-label">{label}</span>}
    </div>
  );
}

export default Preloader;
