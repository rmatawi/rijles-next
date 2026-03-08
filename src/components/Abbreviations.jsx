import React from "react";
import { Page, Navbar, NavRight, NavTitle, Block, Button, Icon } from "framework7-react";

const abbreviationsData = [
  { term: "Voertuigen", definition: "Fietsen, bromfietsen, motorfietsen en auto's" },
  { term: "Motorrijtuigen", definition: "Auto's en motorfietsen" },
  { term: "Snelverkeer", definition: "Auto's en motorfietsen" },
  { term: "Langzaamverkeer", definition: "Fietsen en bromfietsen" },
  { term: "P.S.", definition: "Politie met sirene" },
  { term: "B.S.", definition: "Brandweer met sirene" },
  { term: "A.S.", definition: "Ambulance met sirene" },
  { term: "S.", definition: "Smal" },
  { term: "B.", definition: "Breed" },
  { term: "S/B.", definition: "Het maakt niet uit of het smal of breed is" },
  { term: "LA.", definition: "Linksaffer(s). Zij die links afslaan, naar links gaan" },
  { term: "LV.", definition: "Linksvrij. Er komt/staat geen verkeer van/op de hoek links" },
  { term: "mf.", definition: "Motorfiets" },
  { term: "bf.", definition: "Bromfiets" },
  { term: "f", definition: "Fiets" },
  { term: "AVF", definition: "Algemeen Verkeers Fatsoen of Vfah. Verkeersfatsoen alle hoeken" },
  { term: "vf", definition: "Verkeersfatsoen" },
  { term: "+", definition: "Plus, En, Samen (=gelijktijdig)" },
  { term: "-", definition: "Daarna" },
  { term: "(w)", definition: "wenkt" },
  { term: "Rijden weg", definition: "Volgens de regels wegrijden" },
];

const Abbreviations = () => {
  return (
    <Page>
      <Navbar>
        <NavTitle>Afkortingen</NavTitle>
        <NavRight>
          <div
            className="neu-btn-circle sheet-close"
            style={{ width: "36px", height: "36px", marginRight: "8px", cursor: "pointer" }}
          >
            <Icon f7="xmark" style={{ fontSize: "18px" }} />
          </div>
        </NavRight>
      </Navbar>
      <Block strong inset style={{ padding: "16px" }}>
        <div style={{ display: "grid", gap: "12px" }}>
          {abbreviationsData.map((item, index) => (
            <div key={index} style={{ display: "flex", gap: "8px" }}>
              <strong style={{ minWidth: "100px", flexShrink: 0 }}>{item.term}</strong>
              <span>{item.definition}</span>
            </div>
          ))}
        </div>
      </Block>
    </Page>
  );
};

export default Abbreviations;
