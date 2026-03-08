import React, { createElement } from "react";

import ProfilePage from "../f7pages/ProfilePage.jsx";
import MaquettePage from "../f7pages/MaquettePage.jsx";
import QAPage from "../f7pages/QAPage.jsx";
import TrafficSignsPage from "../f7pages/TrafficSignsPage.jsx";
import RijscholenPage from "../f7pages/RijscholenPage.jsx";
import ServicesPage from "../f7pages/ServicesPage.jsx";
import InsurancePage from "../f7pages/InsurancePage.jsx";
import YTVideos from "../f7pages/YTVideos.jsx";
import ReferralPage from "../f7pages/ReferralPage.jsx";

import EmergencyPage from "../f7pages/EmergencyPage.jsx";
import AboutPage from "../f7pages/about.jsx";
import FormPage from "../f7pages/form.jsx";
import DynamicRoutePage from "../f7pages/dynamic-route.jsx";
import RequestAndLoad from "../f7pages/request-and-load.jsx";
import NotFoundPage from "../f7pages/404.jsx";

import AuthPage from "../components/AuthPage.jsx";
import AdminProfile from "../components/AdminProfile.jsx";
import AdminRequestPage from "../components/AdminRequestPage.jsx";
import StudentDashboard from "../components/StudentDashboard.jsx";
import StudentLoginPage from "../f7pages/StudentLoginPage.jsx";
import SchoolSelectionPage from "../f7pages/SchoolSelectionPage.jsx";
import MaquetteEdit from "../components/MaquetteEdit.jsx";
import AdminAccessPage from "../f7pages/AdminAccessPage.jsx";
import SchoolAccessRequest from "../components/SchoolAccessRequest.jsx";
import StudentAccessRequest from "../components/StudentAccessRequest.jsx";
import SingleMaquettePage from "../f7pages/SingleMaquettePage.jsx";

import VerifyAccess from "../components/VerifyAccess.jsx";
import AccountManagerPage from "../f7pages/AccountManagerPage.jsx";
import StudentAccessRegistrationPage from "../f7pages/StudentAccessRegistrationPage.jsx";
import OfflineDemo from "../f7pages/offline-demo.jsx";
import PWAInstallDemo from "../f7pages/pwa-install-demo.jsx";
import FreeTrialSignup from "../components/FreeTrialSignup.jsx";
import StudentAccessGrant from "../components/StudentAccessGrant.jsx";
import CampaignPage from "../f7pages/CampaignPage.jsx";
import CampaignFreshPage from "../f7pages/CampaignFreshPage.jsx";
import AdminManagementPage from "../f7pages/AdminManagementPage.jsx";
import MockExams from "../components/MockExams.jsx";
import MockExamsSequenced from "../components/MockExamsSequenced.jsx";
import MaquetteBuilder from "../f7pages/MaquetteBuilder.jsx";
import StepByStepInfoPage from "../f7pages/StepByStepInfoPage.jsx";
import HomePage from "../f7pages/HomePage.jsx";
import SkinSettingsPage from "../f7pages/SkinSettingsPage.jsx";
import SkinSelectPage from "../f7pages/SkinSelectPage.jsx";
import RegistrationRequirementsPage from "../f7pages/RegistrationRequirementsPage.jsx";
import AdminMarketingGuidePage from "../f7pages/AdminMarketingGuidePage.jsx";
import AdvertisePage from "../f7pages/AdvertisePage.jsx";
import AdsDashboardPage from "../f7pages/AdsDashboardPage.jsx";
import AdsCampaignPage from "../f7pages/AdsCampaignPage.jsx";
import SuperAdminToolsPage from "../f7pages/SuperAdminToolsPage.jsx";

// Wrapper component for query parameter-based routing
const QueryParamRouteWrapper = (props) => {
  const urlParams = new URLSearchParams(props.f7route.query);
  const pageParam = props.f7route?.params?.page || urlParams.get("page") || "home";

  // Check for invite parameters
  const isInvite = urlParams.get("invite") === "true";
  // Map page parameter to component
  const pageComponents = {
    home: HomePage,
    profile: ProfilePage,
    maquettebuilder: MaquetteBuilder,
    maquette: MaquettePage,
    maquetteedit: MaquetteEdit,
    mockexams: MockExams,
    mockexamssequenced: MockExamsSequenced,
    "single-maquette": SingleMaquettePage,
    qa: QAPage,
    verkeersborden: TrafficSignsPage,
    rijscholen: RijscholenPage,
    services: ServicesPage,
    insurance: InsurancePage,
    emergency: EmergencyPage,
    about: AboutPage,
    form: FormPage,
    "dynamic-route": DynamicRoutePage,
    "request-and-load": RequestAndLoad,
    videos: YTVideos,
    referral: ReferralPage,

    auth: AuthPage,
    "student-login": StudentLoginPage,
    "school-selection": SchoolSelectionPage,
    "admin-profile": AdminProfile,
    "admin-request": AdminRequestPage,
    "student-dashboard": StudentDashboard,
    "admin-access": AdminAccessPage,
    "school-access-request": SchoolAccessRequest,
    "student-access-request": StudentAccessRequest,
    "student-access-registration": StudentAccessRegistrationPage,
    "verify-access": VerifyAccess,
    "student-access-grant": StudentAccessGrant,
    accountmanager: AccountManagerPage,
    "offline-demo": OfflineDemo,
    "pwa-install-demo": PWAInstallDemo,
    campaign: CampaignPage,
    "campaign-fresh": CampaignFreshPage,
    "admin-management": AdminManagementPage,
    "registration-requirements": RegistrationRequirementsPage,
    "admin-marketing-guide": AdminMarketingGuidePage,
    adverteren: AdvertisePage,
    "ads-dashboard": AdsDashboardPage,
    "ads-campaign": AdsCampaignPage,
    "superadmin-tools": SuperAdminToolsPage,
  };

  // Show regular pages
  const Component =
    pageParam && pageComponents[pageParam]
      ? pageComponents[pageParam]
      : NotFoundPage;
  return createElement(Component, props);
};

const routes = [
  {
    path: "/",
    component: QueryParamRouteWrapper,
  },
  {
    path: "/page/:page",
    component: QueryParamRouteWrapper,
  },
  {
    path: "/page/:page/",
    component: QueryParamRouteWrapper,
  },
  {
    path: "/home/",
    component: HomePage,
  },
  {
    path: "/profile/",
    component: ProfilePage,
  },
  {
    path: "/student-login/",
    component: StudentLoginPage,
  },
  {
    path: "/school-selection/",
    component: SchoolSelectionPage,
  },
  {
    path: "/maquettebuilder/",
    component: MaquetteBuilder,
  },
  {
    path: "/rijscholen/",
    component: RijscholenPage,
  },
  {
    path: "/services/",
    component: ServicesPage,
  },
  {
    path: "/insurance/",
    component: InsurancePage,
  },
  {
    path: "/mockexams/",
    component: MockExams,
  },
  {
    path: "/mockexamssequenced/",
    component: MockExamsSequenced,
  },
  {
    path: "/emergency/",
    component: EmergencyPage,
  },
  {
    path: "/about/",
    component: AboutPage,
  },
  {
    path: "/form/",
    component: FormPage,
  },
  {
    path: "/dynamic-route/",
    component: DynamicRoutePage,
  },
  {
    path: "/request-and-load/",
    component: RequestAndLoad,
  },
  {
    path: "/single-maquette/",
    component: SingleMaquettePage,
  },
  {
    path: "/about/",
    component: AboutPage,
  },
  {
    path: "/referral/",
    component: ReferralPage,
  },
  {
    path: "/auth/",
    component: AuthPage,
  },
  {
    path: "/free-trial-signup/",
    component: FreeTrialSignup,
  },
  {
    path: "/student-access-grant/",
    component: StudentAccessGrant,
  },
  {
    path: "/campaign/",
    component: CampaignPage,
  },
  {
    path: "/campaign-fresh/",
    component: CampaignFreshPage,
  },
  {
    path: "/stepbystepinfo/",
    component: StepByStepInfoPage,
  },
  {
    path: "/skin-settings/",
    component: SkinSettingsPage,
  },
  {
    path: "/skin-select/",
    component: SkinSelectPage,
  },
  {
    path: "/registration-requirements/",
    component: RegistrationRequirementsPage,
  },
  {
    path: "/admin-marketing-guide/",
    component: AdminMarketingGuidePage,
  },
  {
    path: "/adverteren/",
    component: AdvertisePage,
  },
  {
    path: "/ads-dashboard/",
    component: AdsDashboardPage,
  },
  {
    path: "/ads-campaign/",
    component: AdsCampaignPage,
  },
  {
    path: "/superadmin-tools/",
    component: SuperAdminToolsPage,
  },
  {
    path: "(.*)",
    component: NotFoundPage,
  },
];

export default routes;
