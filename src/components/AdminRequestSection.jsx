import {
  Block,
  Card,
  CardContent,
  Button,
  Icon,
  useStore,
} from "framework7-react";
import { useAdminStatus } from "../contexts/AdminStatusContext";
import { useI18n } from "../i18n/i18n";
import { isSuperAdmin } from "../js/utils";

const AdminRequestSection = ({ requestStatus, user, requestAdminStatus }) => {
  const authUser = useStore("authUser");
  const { isAdmin } = useAdminStatus(); // Get admin status from context
  const { t } = useI18n();

  const shouldRender =
    !isAdmin &&
    requestStatus === "none" &&
    !isSuperAdmin(user?.email);

  if (
    !shouldRender &&
    requestStatus !== "pending" &&
    !(
      isAdmin ||
      requestStatus === "approved" ||
      isSuperAdmin(user?.email)
    )
  ) {
    return null;
  }

  return (
    <>
      {!isAdmin &&
        requestStatus === "none" &&
        !isSuperAdmin(user?.email) && (
          <Block style={{ margin: "16px" }}>
            <Card>
              <CardContent>
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <Icon
                    f7="person_badge_shield"
                    size="60"
                    color="blue"
                    style={{ marginBottom: "20px" }}
                  />
                  <h2>{t('adminRequest.noAdminRightsTitle')}</h2>
                  <p>
                    {t('adminRequest.noAdminRightsDesc')}
                  </p>
                  <Button fill large color="blue" onClick={requestAdminStatus}>
                    <Icon f7="paperplane" slot="start" />
                    {t('adminRequest.requestViaWhatsApp')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Block>
        )}

      {requestStatus === "pending" && (
        <Block style={{ margin: "16px" }}>
          <Card>
            <CardContent>
              <div style={{ textAlign: "center", padding: "20px" }}>
                <Icon
                  f7="clock"
                  size="60"
                  color="orange"
                  style={{ marginBottom: "20px" }}
                />
                <h2>{t('adminRequest.requestSentTitle')}</h2>
                <p>
                  {t('adminRequest.requestSentDesc')}
                </p>
                <Button fill large color="green" disabled>
                  <Icon f7="clock" slot="start" />
                  {t('adminRequest.inProcess')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </Block>
      )}

      {(isAdmin ||
        requestStatus === "approved" ||
        isSuperAdmin(user?.email)) && (
        <Block style={{ margin: "16px" }}>
          <Card>
            <CardContent>
              <div style={{ textAlign: "center", padding: "20px" }}>
                <Icon
                  f7="checkmark_shield"
                  size="60"
                  color="green"
                  style={{ marginBottom: "20px" }}
                />
                <h2>{t('adminRequest.adminRightsActiveTitle')}</h2>
                <p>
                  {t('adminRequest.adminRightsActiveDesc')}
                </p>
              </div>
            </CardContent>
          </Card>
        </Block>
      )}
    </>
  );
};

export default AdminRequestSection;
