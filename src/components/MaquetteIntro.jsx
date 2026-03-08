import React from "react";
import { Button, CardFooter, f7, Icon } from "framework7-react";

const MaquetteIntro = () => {
  return (
    <div>
      <h2
        className="neu-text-primary"
        style={{ marginBottom: "16px", fontWeight: 700 }}
      >
        Stappenplan voor Maquette-analyse
      </h2>

      <ol
        className="neu-text-primary"
        style={{ paddingLeft: "20px", lineHeight: "1.8" }}
      >
        <li>Zijn er Bevoorrechte weggebruikers? PS → BS → AS</li>
        <li>
          Welk Type kruising is het? (T-kruising, Inrit S, Inrit B, Zandweg,
          Gelijke rangorde?)
        </li>
        <li>Wegtype: Smal (S) of Breed (B) ?</li>
        <li>Tel voertuigen vooraan op elke hoek</li>
        <li>Zijn er LA (Linksaffer) of LV (links vrij)?</li>
        <li>Wie mag wegrijden volgens regels?</li>
        <li>Sluiten voertuigen aan?</li>
        <li>Herhaal vanaf stap 4 tot alle weg zijn</li>
      </ol>

      <div
        style={{
          padding: "12px 16px",
          marginTop: "16px",
          backgroundColor: "var(--color-yellow-light)",
        }}
      >
        <strong className="neu-text-primary">Kernvraag per voertuig:</strong>{" "}
        <span className="neu-text-primary">
          'Heeft dit voertuig voorrang, of moet het voorrang verlenen?'
        </span>
      </div>
    </div>
  );
};

export default MaquetteIntro;
