// pages/ReferralPage.jsx
import {
  Icon,
  f7,
  Sheet,
  Page,
  Navbar,
  NavTitle,
  NavRight,
  Button,
  Block,
  CardFooter,
} from "framework7-react";
import { useMaquetteEvents } from "../contexts/MaquetteEventContext";
import CriteriaDisplay from "../components/CriteriaDisplay";

const StepByStepInfoPage = ({
  criteriaData,
  maquetteNumber,
  maquetteId,
}) => {
  const { dispatchEvent, EVENTS } = useMaquetteEvents();
  return (
    <Page>
      <Navbar>
        <NavTitle>
          {`Stap ${(criteriaData?.stepIndex || 0) + 1} van ${criteriaData?.groups.length
            }`}
        </NavTitle>
        <NavRight>
          <div
            className="neu-btn-circle"
            style={{ width: "36px", height: "36px", cursor: "pointer", marginRight: "10px" }}
            onClick={() => {
              // Close the sheet
              f7.sheet.close(".sheet-step-criteria");

              // Cancel the step-by-step process for this maquette
              if (criteriaData?.onCancel) {
                criteriaData.onCancel();
              }

              // Reset animations for all other maquettes
              dispatchEvent(EVENTS.RESET_OTHER_ANIMATIONS, {
                maquetteNumber,
              });
            }}
          >
            <Icon f7="multiply" style={{ fontSize: "18px" }} />
          </div>
        </NavRight>
      </Navbar>

      <Block>
        <CriteriaDisplay
          criteriaData={criteriaData?.criteriaStructure}
          maquetteData={criteriaData?.maquetteData}
        />
        <CardFooter>
          <Button
            fill
            bgColor="red"
            sheetClose=".sheet-step-criteria"
            onClick={() => {
              f7.sheet.close(".sheet-step-criteria");
              if (criteriaData?.onConfirm) {
                criteriaData.onConfirm();
              }
            }}
            iconF7="chevron_right"
          />
          <div />
        </CardFooter>
      </Block>
    </Page>
  );
};

export default StepByStepInfoPage;
