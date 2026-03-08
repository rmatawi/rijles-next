import { Page, List, ListItem, Button, f7, Sheet, Navbar, NavTitle, NavRight, Icon } from "framework7-react";
import { useMaquetteGroups } from "../contexts/MaquetteGroupsContext";
import ManageCategoriesSheet from "./ManageCategoriesSheet";
import { useI18n } from "../i18n/i18n";

const MaquetteSidePanel = ({ canManageCurrentSchool, onNavigate, onPushToDatabase }) => {
  const { t } = useI18n();
  const { maquetteGroups } = useMaquetteGroups();

  return (
    <Sheet right id="maquette-chapters-sheet" style={{ height: "50vh" }}>
      <Page>
        <Navbar>
          <NavTitle>Maquetten</NavTitle>
          <NavRight>
            <div
              className="neu-btn-circle sheet-close"
              style={{ width: "36px", height: "36px", marginRight: "8px", cursor: "pointer" }}
            >
              <Icon f7="xmark" style={{ fontSize: "18px" }} />
            </div>
          </NavRight>
        </Navbar>

        {/* Navigation List */}
        <List noHairlines>
          {maquetteGroups.map((group) => (
            <ListItem
              link="#"
              key={group.id}
              title={group.title}
              iconF7={group.icon}
              onClick={() => {
                f7.sheet.close("#maquette-chapters-sheet");
                setTimeout(() => {
                  if (onNavigate) onNavigate(group.id);
                }, 500);
              }}
            />
          ))}
        </List>

        {canManageCurrentSchool && (
          <div style={{ padding: "10px" }}>
            <Button
              fill
              onClick={() => {
                f7.sheet.close("#maquette-chapters-sheet");
                setTimeout(() => {
                  f7.sheet.open(".sheet-managecategories");
                }, 500);
              }}
              text={t('common.manageCategories')}
              iconF7="pencil"
            />
          </div>
        )}
      </Page>
      <ManageCategoriesSheet isAdmin={canManageCurrentSchool} />
    </Sheet>
  );
};

export default MaquetteSidePanel;
