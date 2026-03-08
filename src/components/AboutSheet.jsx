import { Block, Button, CardContent, Navbar, NavLeft, NavRight, NavTitle, Page, Sheet, Icon } from "framework7-react";
import { useI18n } from "../i18n/i18n";

const AboutSheet = () => {
  const { t } = useI18n();

  return (
    <Sheet id="sheet-about" style={{ height: "70vh" }}>
      <Page>
        <Navbar>
          <NavTitle>About this app</NavTitle>
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
          {/* <h2 style={{ marginTop: 0 }}>Rijles</h2> */}
          <p>
            Your complete driving theory companion. This app helps you prepare for your driving exam with:
          </p>
          <ul style={{ paddingLeft: "20px", margin: "12px 0" }}>
            <li>Comprehensive driving theory content</li>
            <li>Interactive traffic simulations for visual learning, adjustable for both left and right-hand traffic</li>
            <li>Instructor-recorded explainer videos using traffic simulations, all within the app</li>
            <li>Practice tests and quizzes</li>
            <li>Lesson scheduling with your instructor</li>
            <li>Progress tracking and achievements</li>
            <li>Bookmarks and highlights for study notes</li>
            <li>Offline access to study materials</li>
          </ul>
          <p style={{ marginTop: "24px", fontSize: "14px", color: "var(--f7-text-color-secondary)" }}>
            Developed by{" "}
            <a
              external=""
              className="external"
              target="_blank"
              href="https://synergyapps.vercel.app/"
              rel="noreferrer"
            >
              <strong>Quinn Wilson</strong> for Synergy Apps
            </a>
          </p>
        </Block>
      </Page>
    </Sheet>
  );
};

export default AboutSheet;
