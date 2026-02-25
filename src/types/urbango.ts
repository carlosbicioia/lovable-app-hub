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
  dni: string;
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

export type ClaimStatus = "Abierto" | "En_Valoración" | "Aceptado" | "Rechazado" | "Cerrado";
export type ServiceType = "Presupuesto" | "Reparación_Directa";

export interface ServiceMedia {
  id: string;
  type: "photo" | "video";
  url: string;
  caption?: string;
  uploadedAt: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  comment: string;
  author?: string;
}

export interface ServiceComment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface Service {
  id: string;
  clientId: string;
  clientName: string;
  operatorId: string | null;
  operatorName: string | null;
  collaboratorId: string | null;
  collaboratorName: string | null;
  origin: ServiceOrigin;
  status: ServiceStatus;
  urgency: UrgencyLevel;
  specialty: Specialty;
  serviceType: ServiceType;
  claimStatus: ClaimStatus;
  receivedAt: string;
  contactedAt: string | null;
  scheduledAt: string | null;
  nps: number | null;
  budgetTotal: number | null;
  budgetStatus: "Pendiente" | "Enviado" | "Aprobado" | "Rechazado" | null;
  description?: string;
  address?: string;
  media?: ServiceMedia[];
  internalComments?: ServiceComment[];
  managerComments?: ServiceComment[];
  timelineEvents?: TimelineEvent[];
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
