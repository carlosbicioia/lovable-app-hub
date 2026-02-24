// UrbanGO Domain Types

export type ClientPlanType = "Ninguno" | "Agua" | "Luz" | "Clima";
export type CollaboratorCategory = "Administrador" | "Corredor" | "Gestoría" | "Otros";
export type ServiceOrigin = "App" | "B2B" | "Directo" | "API_Externa";
export type ServiceStatus = "Pendiente_Contacto" | "Agendado" | "En_Curso" | "Finalizado" | "Liquidado";
export type UrgencyLevel = "Estándar" | "24h" | "Inmediato";
export type Specialty = "Fontanería/Agua" | "Electricidad/Luz" | "Clima";

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  province: string;
  clusterId: string;
  collaboratorId: string | null;
  collaboratorName: string | null;
  planType: ClientPlanType;
  lastServiceDate: string | null;
}

export interface Collaborator {
  id: string;
  companyName: string;
  category: CollaboratorCategory;
  email: string;
  phone: string;
  npsMean: number;
  activeServices: number;
  totalClients: number;
  contactPerson: string;
}

export interface Service {
  id: string;
  clientId: string;
  clientName: string;
  operatorId: string | null;
  operatorName: string | null;
  origin: ServiceOrigin;
  status: ServiceStatus;
  urgency: UrgencyLevel;
  specialty: Specialty;
  receivedAt: string;
  contactedAt: string | null;
  scheduledAt: string | null;
  nps: number | null;
  budgetTotal: number | null;
  budgetStatus: "Pendiente" | "Enviado" | "Aprobado" | "Rechazado" | null;
}

export interface Operator {
  id: string;
  name: string;
  specialty: Specialty;
  clusterId: string;
  npsMean: number;
  available: boolean;
  totalRevenue: number;
  completedServices: number;
}
