import { lazy } from "react";
const ProfilePage = lazy(() => import("../f7pages/ProfilePage.jsx"));
const MaquettePage = lazy(() => import("../f7pages/MaquettePage.jsx"));
const QAPage = lazy(() => import("../f7pages/QAPage.jsx"));
const TrafficSignsPage = lazy(() => import("../f7pages/TrafficSignsPage.jsx"));
const RijscholenPage = lazy(() => import("../f7pages/RijscholenPage.jsx"));
const ServicesPage = lazy(() => import("../f7pages/ServicesPage.jsx"));
const InsurancePage = lazy(() => import("../f7pages/InsurancePage.jsx"));
const YTVideos = lazy(() => import("../f7pages/YTVideos.jsx"));
const ReferralPage = lazy(() => import("../f7pages/ReferralPage.jsx"));

const EmergencyPage = lazy(() => import("../f7pages/EmergencyPage.jsx"));
const AboutPage = lazy(() => import("../f7pages/about.jsx"));
const FormPage = lazy(() => import("../f7pages/form.jsx"));
const DynamicRoutePage = lazy(() => import("../f7pages/dynamic-route.jsx"));
const RequestAndLoad = lazy(() => import("../f7pages/request-and-load.jsx"));
const NotFoundPage = lazy(() => import("../f7pages/404.jsx"));

const AuthPage = lazy(() => import("../components/AuthPage.jsx"));
const AdminProfile = lazy(() => import("../components/AdminProfile.jsx"));
const AdminRequestPage = lazy(() => import("../components/AdminRequestPage.jsx"));
const StudentDashboard = lazy(() => import("../components/StudentDashboard.jsx"));
const StudentLoginPage = lazy(() => import("../f7pages/StudentLoginPage.jsx"));
const SchoolSelectionPage = lazy(() => import("../f7pages/SchoolSelectionPage.jsx"));
const MaquetteEdit = lazy(() => import("../components/MaquetteEdit.jsx"));
const AdminAccessPage = lazy(() => import("../f7pages/AdminAccessPage.jsx"));
const SchoolAccessRequest = lazy(() => import("../components/SchoolAccessRequest.jsx"));
const StudentAccessRequest = lazy(() => import("../components/StudentAccessRequest.jsx"));
const SingleMaquettePage = lazy(() => import("../f7pages/SingleMaquettePage.jsx"));

const VerifyAccess = lazy(() => import("../components/VerifyAccess.jsx"));
const AccountManagerPage = lazy(() => import("../f7pages/AccountManagerPage.jsx"));
const StudentAccessRegistrationPage = lazy(() => import("../f7pages/StudentAccessRegistrationPage.jsx"));
const OfflineDemo = lazy(() => import("../f7pages/offline-demo.jsx"));
const PWAInstallDemo = lazy(() => import("../f7pages/pwa-install-demo.jsx"));
const FreeTrialSignup = lazy(() => import("../components/FreeTrialSignup.jsx"));
const StudentAccessGrant = lazy(() => import("../components/StudentAccessGrant.jsx"));
const CampaignPage = lazy(() => import("../f7pages/CampaignPage.jsx"));
const CampaignFreshPage = lazy(() => import("../f7pages/CampaignFreshPage.jsx"));
const AdminManagementPage = lazy(() => import("../f7pages/AdminManagementPage.jsx"));
const MockExams = lazy(() => import("../components/MockExams.jsx"));
const MockExamsSequenced = lazy(() => import("../components/MockExamsSequenced.jsx"));
const MaquetteBuilder = lazy(() => import("../f7pages/MaquetteBuilder.jsx"));
const StepByStepInfoPage = lazy(() => import("../f7pages/StepByStepInfoPage.jsx"));
const HomePage = lazy(() => import("../f7pages/HomePage.jsx"));
const SkinSettingsPage = lazy(() => import("../f7pages/SkinSettingsPage.jsx"));
const SkinSelectPage = lazy(() => import("../f7pages/SkinSelectPage.jsx"));
const RegistrationRequirementsPage = lazy(() => import("../f7pages/RegistrationRequirementsPage.jsx"));
const AdminMarketingGuidePage = lazy(() => import("../f7pages/AdminMarketingGuidePage.jsx"));
const AdvertisePage = lazy(() => import("../f7pages/AdvertisePage.jsx"));
const AdsDashboardPage = lazy(() => import("../f7pages/AdsDashboardPage.jsx"));
const AdsCampaignPage = lazy(() => import("../f7pages/AdsCampaignPage.jsx"));
const SuperAdminToolsPage = lazy(() => import("../f7pages/SuperAdminToolsPage.jsx"));

const pageRoutes = [
  {
    path: "/",
    component: HomePage,
  },
  {
    path: "/home",
    component: HomePage,
  },
  {
    path: "/profile",
    component: ProfilePage,
  },
  {
    path: "/student-login",
    component: StudentLoginPage,
  },
  {
    path: "/school-selection",
    component: SchoolSelectionPage,
  },
  {
    path: "/maquettebuilder",
    component: MaquetteBuilder,
  },
  {
    path: "/maquette",
    component: MaquettePage,
  },
  {
    path: "/qa",
    component: QAPage,
  },
  {
    path: "/verkeersborden",
    component: TrafficSignsPage,
  },
  {
    path: "/videos",
    component: YTVideos,
  },
  {
    path: "/rijscholen",
    component: RijscholenPage,
  },
  {
    path: "/services",
    component: ServicesPage,
  },
  {
    path: "/insurance",
    component: InsurancePage,
  },
  {
    path: "/mockexams",
    component: MockExams,
  },
  {
    path: "/mockexamssequenced",
    component: MockExamsSequenced,
  },
  {
    path: "/emergency",
    component: EmergencyPage,
  },
  {
    path: "/form",
    component: FormPage,
  },
  {
    path: "/dynamic-route",
    component: DynamicRoutePage,
  },
  {
    path: "/request-and-load",
    component: RequestAndLoad,
  },
  {
    path: "/single-maquette",
    component: SingleMaquettePage,
  },
  {
    path: "/about",
    component: AboutPage,
  },
  {
    path: "/referral",
    component: ReferralPage,
  },
  {
    path: "/auth",
    component: AuthPage,
  },
  {
    path: "/admin-profile",
    component: AdminProfile,
  },
  {
    path: "/admin-request",
    component: AdminRequestPage,
  },
  {
    path: "/student-dashboard",
    component: StudentDashboard,
  },
  {
    path: "/admin-access",
    component: AdminAccessPage,
  },
  {
    path: "/school-access-request",
    component: SchoolAccessRequest,
  },
  {
    path: "/student-access-request",
    component: StudentAccessRequest,
  },
  {
    path: "/student-access-registration",
    component: StudentAccessRegistrationPage,
  },
  {
    path: "/verify-access",
    component: VerifyAccess,
  },
  {
    path: "/accountmanager",
    component: AccountManagerPage,
  },
  {
    path: "/offline-demo",
    component: OfflineDemo,
  },
  {
    path: "/pwa-install-demo",
    component: PWAInstallDemo,
  },
  {
    path: "/admin-management",
    component: AdminManagementPage,
  },
  {
    path: "/free-trial-signup",
    component: FreeTrialSignup,
  },
  {
    path: "/student-access-grant",
    component: StudentAccessGrant,
  },
  {
    path: "/campaign",
    component: CampaignPage,
  },
  {
    path: "/campaign-fresh",
    component: CampaignFreshPage,
  },
  {
    path: "/stepbystepinfo",
    component: StepByStepInfoPage,
  },
  {
    path: "/skin-settings",
    component: SkinSettingsPage,
  },
  {
    path: "/skin-select",
    component: SkinSelectPage,
  },
  {
    path: "/registration-requirements",
    component: RegistrationRequirementsPage,
  },
  {
    path: "/admin-marketing-guide",
    component: AdminMarketingGuidePage,
  },
  {
    path: "/adverteren",
    component: AdvertisePage,
  },
  {
    path: "/ads-dashboard",
    component: AdsDashboardPage,
  },
  {
    path: "/ads-campaign",
    component: AdsCampaignPage,
  },
  {
    path: "/superadmin-tools",
    component: SuperAdminToolsPage,
  },
];

export const notFoundComponent = NotFoundPage;
export default pageRoutes;
