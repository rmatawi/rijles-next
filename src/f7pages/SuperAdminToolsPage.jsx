import React from "react";
import {
  Page,
  Navbar,
  NavLeft,
  NavTitle,
  Block,
  Icon,
  useStore,
} from "framework7-react";
import NavHomeButton from "../components/NavHomeButton";
import { isSuperAdmin } from "../js/utils";
import useAppNavigation from "../hooks/useAppNavigation";

const TOOL_LINKS = [
  {
    title: "Admin Management",
    description: "Manage admin access and permissions",
    url: "/admin-management",
    icon: "person_2_fill",
  },
  {
    title: "Ads Dashboard",
    description: "Beheer advertentiecampagnes en statistieken",
    url: "/ads-dashboard/",
    icon: "chart_bar_square_fill",
  },
  {
    title: "Ads Campaign Kit",
    description: "Social media posts om adverteerders te werven",
    url: "/ads-campaign/",
    icon: "megaphone_fill",
  },
  {
    title: "Advertise Page",
    description: "Publieke pagina met advertentiepakketten",
    url: "/adverteren/",
    icon: "speaker_3_fill",
  },
  {
    title: "Campaign Page",
    description: "Bestaande campagnecreatives voor social media",
    url: "/campaign/",
    icon: "photo_stack_fill",
  },
  {
    title: "Campaign Fresh",
    description: "Nieuwe campaign creatives (fresh layout)",
    url: "/campaign-fresh/",
    icon: "sparkles",
  },
  {
    title: "Skin Selection",
    description: "Kies actieve skin en test varianten",
    url: "/skin-select/",
    icon: "paintbrush_fill",
  },
  {
    title: "Skin Settings",
    description: "Technische skininstellingen",
    url: "/skin-settings/",
    icon: "slider_horizontal_3",
  },
];

const SuperAdminToolsPage = () => {
  const { navigate } = useAppNavigation();
  const authUser = useStore("authUser");
  const canAccess = isSuperAdmin(authUser?.email);

  if (!canAccess) {
    return (
      <Page name="superadmin-tools" className="page-neu">
        <Navbar className="neu-navbar">
          <NavLeft>
            <NavHomeButton />
          </NavLeft>
          <NavTitle className="neu-text-primary">Superadmin Tools</NavTitle>
        </Navbar>
        <Block style={{ paddingTop: "24px" }}>
          Alleen toegankelijk voor superadmins in <code>VITE_REACT_APP_OWNER</code>.
        </Block>
      </Page>
    );
  }

  return (
    <Page name="superadmin-tools" className="page-neu">
      <style>{`
        .superadmin-tools-wrap {
          padding: 8px 16px 18px;
        }

        .superadmin-tools-intro {
          margin: 0 0 12px;
          font-size: 14px;
          opacity: 0.85;
        }

        .superadmin-tools-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .superadmin-tool-tile {
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 14px;
          background: #fff;
          min-height: 144px;
          padding: 12px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          justify-content: flex-start;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
          cursor: pointer;
        }

        .superadmin-tool-icon {
          width: 44px;
          height: 44px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          margin-bottom: 8px;
        }

        .superadmin-tool-title {
          margin: 0 0 4px;
          font-size: 14px;
          font-weight: 700;
          line-height: 1.2;
        }

        .superadmin-tool-desc {
          margin: 0;
          font-size: 12px;
          line-height: 1.3;
          opacity: 0.72;
        }

        @media (min-width: 900px) {
          .superadmin-tools-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }
      `}</style>

      <Navbar className="neu-navbar">
        <NavLeft>
          <NavHomeButton />
        </NavLeft>
        <NavTitle className="neu-text-primary">Superadmin Tools</NavTitle>
      </Navbar>

      <Block className="superadmin-tools-wrap">
        <p className="superadmin-tools-intro">Alle superadmin tools op een plek.</p>
        <div className="superadmin-tools-grid">
          {TOOL_LINKS.map((item) => (
            <div
              key={item.url}
              className="superadmin-tool-tile"
              onClick={() => {
                navigate(item.url);
              }}
            >
              <div className="superadmin-tool-icon">
                <Icon f7={item.icon} size="20px" />
              </div>
              <p className="superadmin-tool-title">{item.title}</p>
              <p className="superadmin-tool-desc">{item.description}</p>
            </div>
          ))}
        </div>
      </Block>
    </Page>
  );
};

export default SuperAdminToolsPage;
