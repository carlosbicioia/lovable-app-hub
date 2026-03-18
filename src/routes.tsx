import { lazy } from "react";

// Lazy-loaded pages
export const Dashboard = lazy(() => import("@/pages/Dashboard"));
export const AdvancedDashboard = lazy(() => import("@/pages/AdvancedDashboard"));
export const Clients = lazy(() => import("@/pages/Clients"));
export const Collaborators = lazy(() => import("@/pages/Collaborators"));
export const CollaboratorDetail = lazy(() => import("@/pages/CollaboratorDetail"));
export const Services = lazy(() => import("@/pages/Services"));
export const ServiceDetail = lazy(() => import("@/pages/ServiceDetail"));
export const ServiceCreate = lazy(() => import("@/pages/ServiceCreate"));
export const ServiceEdit = lazy(() => import("@/pages/ServiceEdit"));
export const Budgets = lazy(() => import("@/pages/Budgets"));
export const BudgetDetail = lazy(() => import("@/pages/BudgetDetail"));
export const BudgetCreate = lazy(() => import("@/pages/BudgetCreate"));
export const BudgetEdit = lazy(() => import("@/pages/BudgetEdit"));
export const Articles = lazy(() => import("@/pages/Articles"));
export const InvoiceCreate = lazy(() => import("@/pages/InvoiceCreate"));
export const CalendarView = lazy(() => import("@/pages/CalendarView"));
export const Operators = lazy(() => import("@/pages/Operators"));
export const Purchases = lazy(() => import("@/pages/Purchases"));
export const PurchaseCreate = lazy(() => import("@/pages/PurchaseCreate"));
export const PurchaseDetail = lazy(() => import("@/pages/PurchaseDetail"));
export const DeliveryNoteCreate = lazy(() => import("@/pages/DeliveryNoteCreate"));
export const SalesOrders = lazy(() => import("@/pages/SalesOrders"));
export const Suppliers = lazy(() => import("@/pages/Suppliers"));
export const Vehicles = lazy(() => import("@/pages/Vehicles"));
export const Settings = lazy(() => import("@/pages/Settings"));
export const Profile = lazy(() => import("@/pages/Profile"));

// Reports
export const ReportsIndex = lazy(() => import("@/pages/reports/ReportsIndex"));
export const ServicesReport = lazy(() => import("@/pages/reports/ServicesReport"));
export const OperatorsReport = lazy(() => import("@/pages/reports/OperatorsReport"));
export const FinancialReport = lazy(() => import("@/pages/reports/FinancialReport"));
export const ClientsReport = lazy(() => import("@/pages/reports/ClientsReport"));
export const PurchasesReport = lazy(() => import("@/pages/reports/PurchasesReport"));
export const BudgetsReport = lazy(() => import("@/pages/reports/BudgetsReport"));

// Non-lazy (lightweight / critical path)
export { default as Auth } from "@/pages/Auth";
export { default as ResetPassword } from "@/pages/ResetPassword";
export { default as CollaboratorPortal } from "@/pages/CollaboratorPortal";
export { default as TvDashboard } from "@/pages/TvDashboard";
export { default as NotFound } from "@/pages/NotFound";
