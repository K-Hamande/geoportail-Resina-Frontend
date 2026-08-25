import { useMemo, useState } from "react";

// Enveloppe un <select> classique avec un petit champ de recherche
// au-dessus, qui filtre les <option> affichees selon le texte tape.
// Le <select> natif reste inchange (value/onChange/name/disabled/
// required... passes tels quels via ...selectProps) - seul l'ensemble
// d'<option> visibles change, donc aucune page appelante n'a besoin de
// changer sa logique de filtrage/formulaire, juste remplacer <select>
// par <SearchableSelect> (meme children, memes props).
function SearchableSelect({
  children,
  searchPlaceholder = "Rechercher...",
  className = "",
  selectClassName = "",
  value,
  ...selectProps
}) {
  const [recherche, setRecherche] = useState("");

  const optionsFiltrees = useMemo(() => {
    const enfants = Array.isArray(children) ? children : [children];
    const termeRecherche = recherche.trim().toLowerCase();
    if (!termeRecherche) return enfants;

    return enfants.filter((enfant) => {
      if (!enfant || typeof enfant !== "object") return true;
      const valeurOption = enfant.props?.value;
      // Toujours garder visibles : l'option vide ("Toutes les régions",
      // "—"...) et l'option actuellement selectionnee - sinon le select
      // parait vide des qu'on tape un texte qui ne correspond pas a la
      // selection en cours.
      if (valeurOption === "" || valeurOption === undefined) return true;
      if (value !== undefined && valeurOption === value) return true;
      const texte = String(enfant.props?.children ?? "").toLowerCase();
      return texte.includes(termeRecherche);
    });
  }, [children, recherche, value]);

  return (
    <div className={`searchable-select ${className}`}>
      <input
        type="text"
        className="searchable-select-input"
        placeholder={searchPlaceholder}
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
      />
      <select className={selectClassName} value={value} {...selectProps}>
        {optionsFiltrees}
      </select>
    </div>
  );
}

export default SearchableSelect;