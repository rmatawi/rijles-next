import {
  List,
  ListInput,
  Block,
  Button,
  Icon,
  useStore,
} from "framework7-react";
import { isUserAdmin, isSuperAdmin } from "../js/utils";
import { useI18n } from "../i18n/i18n";

const AdminProfileSection = ({
  requestStatus,
  profile,
  setProfile,
  user,
  selectedSchoolIds,
  handleSave,
  handleSignOut,
  setActiveTab,
}) => {
  const { t } = useI18n();
  const authUser = useStore("authUser");

  // Check admin status using authUser properties instead of isAdmin() utility
  const isAdminStatus = isUserAdmin(authUser);

  if (!isAdminStatus) {
    return null;
  }

  return (
    <>
      <List noHairlinesMd style={{ margin: "16px" }}>
        <ListInput
          outline
          label="Name"
          type="text"
          placeholder="Enter your name"
          value={profile.name}
          onInput={(e) => setProfile({ ...profile, name: e.target.value })}
        />
        <ListInput
          outline
          label="Email"
          type="text"
          placeholder="Enter your email"
          value={profile.email}
          onInput={(e) => setProfile({ ...profile, email: e.target.value })}
          disabled={user && !isSuperAdmin(user.email)}
        />
        <ListInput
          outline
          label="Phone"
          type="tel"
          placeholder="Enter phone number"
          value={profile.phone}
          onInput={(e) => setProfile({ ...profile, phone: e.target.value })}
        />
        <ListInput
          outline
          label="Address"
          type="text"
          placeholder="Enter address"
          value={profile.address}
          onInput={(e) => setProfile({ ...profile, address: e.target.value })}
        />
      </List>

      <Block style={{ margin: "16px" }}>
        <Button fill large onClick={() => handleSave()}>
          <Icon f7="floppy_disk" slot="start" />
          Save Changes
        </Button>
      </Block>

    </>
  );
};

export default AdminProfileSection;
