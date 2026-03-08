import React, { useState } from "react";
import {
  Page,
  Navbar,
  NavTitle,
  Block,
  NavRight,
  Button,
  Icon,
  f7,
} from "framework7-react";

const TrafficRules = () => {
  // State to track which items are expanded
  const [expandedItems, setExpandedItems] = useState({});

  // Toggle expanded state for a specific item
  const toggleExpand = (index) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const listItemStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const expandStyle = {
    marginTop: "5px",
    marginBottom: "20px",
    paddingLeft: "20px",
    fontStyle: "italic",
  };

  return (
    <div>
      <Block>
        <strong>1. Bevoorrechte weggebruikers</strong>
        <ul>
          <li style={listItemStyle}>
            <span>Gaan altijd eerst</span>
            <Button onClick={() => toggleExpand(0)}>
              {expandedItems[0] ? "Less..." : "More..."}
            </Button>
          </li>
          {expandedItems[0] && (
            <div style={expandStyle}>
              Onder Bevoorrechte weggebruikers verstaat men Politie{" "}
              <b>met sirene</b>, Brandweer <b>met sirene</b> en Ambulance{" "}
              <b>met sirene</b>.
              <br />
              Let wel: ze zijn pas Bevoorrechte weggebruikers, wanneer ze met
              loeiende sirene rijden.
            </div>
          )}
          <li style={listItemStyle}>
            <span>Altijd één voor één: PS-BS-AS</span>
            <Button onClick={() => toggleExpand(1)}>
              {expandedItems[1] ? "Less..." : "More..."}
            </Button>
          </li>
          {expandedItems[1] && (
            <div style={expandStyle}>
              Deze weggebruikers mogen nooit samen oprijden. Altijd één voor één
              in de volgorde: PS-BS-AS.
              <br />
              Note: Het min-symbool betekent <b>gevolgd door</b>.
            </div>
          )}
        </ul>
      </Block>

      <Block>
        <strong>2. Kruising – gelelijke rangorde</strong>
        <ul>
          <li style={listItemStyle}>
            <span>Links aankomend verkeer heeft voorrang</span>
            <Button onClick={() => toggleExpand(2)}>
              {expandedItems[2] ? "Less..." : "More..."}
            </Button>
          </li>
          {expandedItems[2] && (
            <div style={expandStyle}>
              De bestuurder kijkt naar <b>zijn links</b>. Komt er verkeer, dan
              is er <b>geen</b> sprake van links vrij <b>(LV)</b> en moet de
              bestuurder voorrang verlenen.
            </div>
          )}
          <li style={listItemStyle}>
            <span>
              <b>LA</b> (linksaf) + <b>LV</b> (links vrij) mogen rijden
            </span>
            <Button onClick={() => toggleExpand(3)}>
              {expandedItems[3] ? "Less..." : "More..."}
            </Button>
          </li>
          {expandedItems[3] && (
            <div style={expandStyle}>
              Gaat de bestuurder naar links <b>(LA)</b> of gaat komt er geen
              verkeer links van de bestuurder <b>(LV)</b> dan mag hij oprijden.
              Een uitzondering is als er een <b>rechtdoorgaande</b>{" "}
              (brom)fietser aan zijn linkerkant staat. Dan gaat de fietser
              eerst.
            </div>
          )}
          <li style={listItemStyle}>
            <span>Geen LA & geen LV? Dan VF toepassen</span>
            <Button onClick={() => toggleExpand(4)}>
              {expandedItems[4] ? "Less..." : "More..."}
            </Button>
          </li>
          {expandedItems[4] && (
            <div style={expandStyle}>
              Gaat niemand linksaf en heeft niemand linksvrij? Dan wordt
              Verkeersfatsoen <b>(VF)</b> toegepast. Dat wil zeggen dat iemand,
              naar <b>zijn rechts</b> moet kijken en moet wenken dat die als
              eerst mag oprijden.
            </div>
          )}
        </ul>
      </Block>

      <Block>
        <strong>3. Verhard vs. onverhard</strong>
        <ul>
          <li style={listItemStyle}>
            <span>Verhard heeft altijd voorrang</span>
            <Button onClick={() => toggleExpand(5)}>
              {expandedItems[5] ? "Less..." : "More..."}
            </Button>
          </li>
          {expandedItems[5] && (
            <div style={expandStyle}>
              Het verkeer op de verharde weg heeft voorrang, terwijl het verkeer
              op de onverharde weg moet wachten.
            </div>
          )}
          <li style={listItemStyle}>
            <span>
              Behalve bij een T-kruizing waarbij de{" "}
              <b>doorgaande weg onverhard</b> is
            </span>
            <Button onClick={() => toggleExpand(6)}>
              {expandedItems[6] ? "Less..." : "More..."}
            </Button>
          </li>
          {expandedItems[6] && (
            <div style={expandStyle}>
              Indien bij een T-kruizing de <b>doorgaande weg onverhard</b> is,
              dan heeft deze <b>toch voorrang</b>.
            </div>
          )}
        </ul>
      </Block>

      <Block>
        <strong>4. T-kruising</strong>
        <ul>
          <li style={listItemStyle}>
            <span>
              Doorgaande weg heeft voorrang, <b>zelf wanneer onverhard</b>
            </span>
            <Button onClick={() => toggleExpand(7)}>
              {expandedItems[7] ? "Less..." : "More..."}
            </Button>
          </li>
          {expandedItems[7] && (
            <div style={expandStyle}>
              Het verkeer op de doorgaande weg moet eest afgehandeld worden, ook
              al is deze onverhard. De zijweg verleent voorrang.
            </div>
          )}
          <li style={listItemStyle}>
            <span>Zijweg wacht</span>
            <Button onClick={() => toggleExpand(8)}>
              {expandedItems[8] ? "Less..." : "More..."}
            </Button>
          </li>
          {expandedItems[8] && (
            <div style={expandStyle}>
              De zijweg gaat pas wanneer de hoofdweg vrij is.
            </div>
          )}
        </ul>
      </Block>

      <Block>
        <strong>5. Linksaffer (LA)</strong>
        <ul>
          <li style={listItemStyle}>
            <span>LA (Linksaffer) heeft bijna altijd voorrang</span>
            <Button onClick={() => toggleExpand(9)}>
              {expandedItems[9] ? "Less..." : "More..."}
            </Button>
          </li>
          {expandedItems[9] && (
            <div style={expandStyle}>
              Bij wegen van gelijke rangorde wordt eerst gekeken naar{" "}
              <b>LA dan LV</b>. Als er naast de auto{" "}
              <b>geen rechtdoorgaande fietser met LV</b> staat, dan rijdt LA op.
            </div>
          )}
          <li style={listItemStyle}>
            <span>
              Twee LA (fiets en auto)→ langzaamverkeer (korte bocht) gaat
              eerst{" "}
            </span>
            <Button onClick={() => toggleExpand(10)}>
              {expandedItems[10] ? "Less..." : "More..."}
            </Button>
          </li>
          {expandedItems[10] && (
            <div style={expandStyle}>
              Staan er fietser en auto naast elkaar die beide links moeten, dan
              gaat de fietser eerst. De fietser heeft de zogenaamde{" "}
              <b>korte bocht</b>.
            </div>
          )}
          <li style={listItemStyle}>
            <span>Naar weg met rijwielpad → Beide gaan samen</span>
            <Button onClick={() => toggleExpand(11)}>
              {expandedItems[11] ? "Less..." : "More..."}
            </Button>
          </li>
          {expandedItems[11] && (
            <div style={expandStyle}>
              Staan er fietser en auto naast elkaar die beide links moeten naar
              een weg <b>met rijwielpad</b>, dan mogen beide samen oprijden.
            </div>
          )}
        </ul>
      </Block>

      <Block>
        <strong>6. Rechtsaffer (RA)</strong>
        <ul>
          <li style={listItemStyle}>
            <span>Wanneer mag een rechtsaffer rijden?</span>
            <Button onClick={() => toggleExpand(12)}>
              {expandedItems[12] ? "Less..." : "More..."}
            </Button>
          </li>
          {expandedItems[12] && (
            <div style={expandStyle}>
              <ul>
                <li>Als zijn links vrij is</li>
                <li>Als hij geen tegenligger heeft</li>
              </ul>
            </div>
          )}
          <li style={listItemStyle}>
            <span>Wat is een tegenligger van een rechtsaffer?</span>
            <Button onClick={() => toggleExpand(12.1)}>
              {expandedItems[12.1] ? "Less..." : "More..."}
            </Button>
          </li>
          {expandedItems[12.1] && (
            <div style={expandStyle}>
              <ul>
                <li>Een linksaffer </li>
                <li>Een rechtdoorgaande met LV </li>
                <li>Iemand op een voorrangsweg of voorrangskruising </li>
              </ul>
            </div>
          )}
          <li style={listItemStyle}>
            <span>Naar zijweg → voorrang aan tegenliggers</span>
            <Button onClick={() => toggleExpand(13)}>
              {expandedItems[13] ? "Less..." : "More..."}
            </Button>
          </li>
          {expandedItems[13] && (
            <div style={expandStyle}>
              Staat een rechtsaffer op de hoofdweg om de zijweg in te slaan en
              heeft die een tegenligger, dan moet hij voorrang verlenen.
            </div>
          )}
          <li style={listItemStyle}>
            <span>
              Twee RA → snelverkeer (korte bocht) vóór langzaamverkeer
            </span>
            <Button onClick={() => toggleExpand(14)}>
              {expandedItems[14] ? "Less..." : "More..."}
            </Button>
          </li>
          {expandedItems[14] && (
            <div style={expandStyle}>
              Staan twee rechtsaffers naast elkaar (fiets en auto), dan gaat de
              auto eerst.
            </div>
          )}
          <li style={listItemStyle}>
            <span>Naar weg met rijwielpad → Beide gaan samen</span>
            <Button onClick={() => toggleExpand(15)}>
              {expandedItems[15] ? "Less..." : "More..."}
            </Button>
          </li>
          {expandedItems[15] && (
            <div style={expandStyle}>
              Staan twee rechtsaffers naast elkaar (fiets en auto) en rijden ze
              naar een weg <b>met een rijwielpad</b>, dan mogen beide samen
              oprijden.
            </div>
          )}
        </ul>
      </Block>

      <Block>
        <strong>7. Rechtdoor met links vrij (LV)</strong>
        <ul>
          <li style={listItemStyle}>
            <span>Rechtdoor met niemand links = voorrang</span>
            <Button onClick={() => toggleExpand(18)}>
              {expandedItems[18] ? "Less..." : "More..."}
            </Button>
          </li>
          {expandedItems[18] && (
            <div style={expandStyle}>
              De bestuurder die rechtdoor wilt gaan, kijkt naar links. Is het
              vrij en veilig om op te rijden, dan mag hij oprijden.
            </div>
          )}
        </ul>
      </Block>

      <Block>
        <strong>8. Voorbeelden Verkeersfatsoen (VF) situaties:</strong>
        <ul>
          <li>
            <span>Twee RA tegenover elkaar op smalle weg</span>
          </li>
          <li>
            <span>Twee inhalers</span>
          </li>
          <li>
            <span>Geen LA & geen LV</span>
          </li>
          <li>
            <span>Imand moet Wenken wie mag oprijden</span>
          </li>
        </ul>
      </Block>

      <Block>
        <strong>9. Inritten</strong>
        <ul>
          <li style={listItemStyle}>
            <span>
              Verkeer <b>NIET naar de inrit</b> eerst afhandelen.
              <ul>
                <li>Hoofdweg eerst</li>
                <li>dan Zijweg</li>
              </ul>
            </span>
            <Button onClick={() => toggleExpand(24)}>
              {expandedItems[24] ? "Less..." : "More..."}
            </Button>
          </li>
          {expandedItems[24] && (
            <div style={expandStyle}>
              Het verkeer dat <b>wel naar de inrit gaat</b>, moet wachten en
              voorrang verlenen aan het verkeer dat{" "}
              <b>niet naar de inrit gaat</b>. Het verkeer op de hoofdweg moet
              eerst afgehandeld worden en vervolgens de zijweg.
            </div>
          )}
          <li style={listItemStyle}>
            <span>Inrit S → eerst volledig vrij</span>
            <Button onClick={() => toggleExpand(25)}>
              {expandedItems[25] ? "Less..." : "More..."}
            </Button>
          </li>
          {expandedItems[25] && (
            <div style={expandStyle}>
              Is er sprake van een smalle inrit, dan moet die eerst vrijgemaakt
              worden.
            </div>
          )}
          <li style={listItemStyle}>
            <span>Inrit B → direct inrijden toegestaan</span>
            <Button onClick={() => toggleExpand(26)}>
              {expandedItems[26] ? "Less..." : "More..."}
            </Button>
          </li>
          {expandedItems[26] && (
            <div style={expandStyle}>
              Is er sprake van een brede inrit, dan man men inrijden.
            </div>
          )}
          <li style={listItemStyle}>
            <span>
              Overig Verkeer afhandelen.
              <ul>
                <li>Hoofdweg eerst</li>
                <li>dan Zijweg</li>
              </ul>
            </span>
            <Button onClick={() => toggleExpand(27)}>
              {expandedItems[27] ? "Less..." : "More..."}
            </Button>
          </li>
          {expandedItems[27] && (
            <div style={expandStyle}>
              Zodra het verkeer dat <b>niet naar de inrit gaat</b> is
              afgehandeld, volgt het verkeer dat <b>wel naar de inrit moet</b>.
              Eerst de hoofdweg en tenslotte de zijweg.
            </div>
          )}
        </ul>
      </Block>
    </div>
  );
};

export default TrafficRules;
