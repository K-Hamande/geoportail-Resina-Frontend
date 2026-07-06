function SiteSelector({ sites, siteId, onChange }) {
  return (
    <div className="selector-box">
      <div style={{ flex: 1 }}>
        <div className="selector-label">Site sélectionné</div>
        <select className="site-select" value={siteId || ""} onChange={(e) => onChange(e.target.value)}>
          {sites.map((site) => (
            <option key={site.siteId} value={site.siteId}>
              {site.nom}
            </option>
          ))}
        </select>
      </div>
      <span style={{ opacity: 0.7 }}>⌄</span>
    </div>
  );
}

export default SiteSelector;