import { useLayoutEffect } from "react";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation
} from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout.js";
import AdminLayout from "../layouts/AdminLayout.js";

import HomePage from "../features/home/pages/HomePage.js";
import AboutPage from "../features/about/AboutPage.js";
import ServicesPage from "../features/services/ServicesPage.js";
import ProjectsPage from "../features/projects/ProjectsPage.js";
import ContactPage from "../features/contact/ContactPage.js";
import ServiceRequestPage from "../features/service-requests/ServiceRequestPage.js";

import { AuthProvider } from "../features/auth/AuthContext.js";
import ProtectedRoute from "../features/auth/ProtectedRoute.js";
import AdminLoginPage from "../features/auth/pages/AdminLoginPage.js";

import DashboardPage from "../features/dashboard/DashboardPage.js";

import ReviewsPage from "../features/reviews/ReviewsPage.js";
import ReviewInvitationsPage from "../features/reviews/admin/ReviewInvitationsPage.js";
import PublicReviewPage from "../features/reviews/PublicReviewPage.js";

import ServiceRequestsPage from "../features/service-requests/admin/ServiceRequestsPage.js";
import ServiceRequestDetailsPage from "../features/service-requests/admin/ServiceRequestDetailsPage.js";

import ClientsPage from "../features/clients/admin/ClientsPage.js";
import ClientDetailsPage from "../features/clients/admin/ClientDetailsPage.js";

import QuotationsPage from "../features/quotations/admin/QuotationsPage.js";
import CreateQuotationPage from "../features/quotations/admin/CreateQuotationPage.js";
import QuotationDetailsPage from "../features/quotations/admin/QuotationDetailsPage.js";
import PublicQuotationPage from "../features/quotations/PublicQuotationPage.js";

import ContractsPage from "../features/contract/admin/ContractsPage.js";
import CreateContractPage from "../features/contract/admin/CreateContractPage.js";
import ContractDetailsPage from "../features/contract/admin/ContractDetailsPage.js";
import PublicContractPage from "../features/contract/public/PublicContractPage.js";

import AdminProjectsPage from "../features/projects/admin/ProjectsPage.js";
import CreateHistoricalProjectPage from "../features/projects/admin/CreateHistoricalProjectPage.js";
import ProjectDetailsPage from "../features/projects/admin/ProjectDetailsPage.js";

import ServicesAdminPage from "../features/services/admin/ServicesPage.js";
import ServiceCategoriesPage from "../features/services/admin/ServiceCategoriesPage.js";
import ServiceFormBuilderPage from "../features/services/admin/ServiceFormBuilderPage.js";

function RouteContent() {
  const location = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant"
    });
  }, [location.pathname, location.search, location.hash]);

  return (
    <div
      key={location.pathname}
      className="route-transition"
    >
      <Routes location={location}>
        {/* Public Website */}
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="contact" element={<ContactPage />} />

          <Route
            path="request-service"
            element={<ServiceRequestPage />}
          />
        </Route>

        {/* Public Client Access */}
        <Route
          path="/quotation/:token"
          element={<PublicQuotationPage />}
        />

        <Route
          path="/contract/:token"
          element={<PublicContractPage />}
        />

        <Route
          path="/review/:token"
          element={<PublicReviewPage />}
        />

        {/* Admin Authentication */}
        <Route
          path="/admin/login"
          element={<AdminLoginPage />}
        />

        {/* Protected Admin Workspace */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />

            <Route
              path="dashboard"
              element={<Navigate to="/admin" replace />}
            />

            {/* Service Requests */}
            <Route
              path="requests"
              element={<ServiceRequestsPage />}
            />

            <Route
              path="requests/:requestId"
              element={<ServiceRequestDetailsPage />}
            />

            {/* Clients */}
            <Route
              path="clients"
              element={<ClientsPage />}
            />

            <Route
              path="clients/:clientId"
              element={<ClientDetailsPage />}
            />

            {/* Services */}
            <Route
              path="services"
              element={<ServicesAdminPage />}
            />

            <Route
              path="services/categories"
              element={<ServiceCategoriesPage />}
            />

            <Route
              path="services/:serviceId/form"
              element={<ServiceFormBuilderPage />}
            />

            {/* Quotations */}
            <Route
              path="quotations"
              element={<QuotationsPage />}
            />

            <Route
              path="quotations/new"
              element={<CreateQuotationPage />}
            />

            <Route
              path="quotations/:quotationId"
              element={<QuotationDetailsPage />}
            />

            {/* Contracts */}
            <Route
              path="contracts"
              element={<ContractsPage />}
            />

            <Route
              path="contracts/create"
              element={<CreateContractPage />}
            />

            <Route
              path="contracts/:contractId"
              element={<ContractDetailsPage />}
            />

            {/* Projects */}
            <Route
              path="projects"
              element={<AdminProjectsPage />}
            />

            <Route
              path="projects/new"
              element={<CreateHistoricalProjectPage />}
            />

            <Route
              path="projects/:projectId"
              element={<ProjectDetailsPage />}
            />

            {/* Reviews */}
            <Route
              path="reviews"
              element={<ReviewsPage />}
            />

            {/* Review Invitations */}
            <Route
              path="review-invitations"
              element={<ReviewInvitationsPage />}
            />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <RouteContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default AppRouter;
