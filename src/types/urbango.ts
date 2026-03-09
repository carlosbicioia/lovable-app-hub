// UrbanGO Domain Types

export type ClientPlanType = "Ninguno" | "Agua" | "Luz" | "Clima";
export type CollaboratorCategory = "Administrador" | "Corredor" | "Gestoría" | "Otros";
export type ServiceOrigin = "App" | "B2B" | "Directo" | "API_Externa";
export type ServiceStatus = "Pendiente_Contacto" | "Pte_Asignacion" | "Asignado" | "Agendado" | "En_Curso" | "Finalizado" | "Liquidado";
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
  taxId: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  website: string;
  notes: string;
  branchId: string | null;
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

export interface ServiceMaterial {
  id: string;
  name: string;
  units: number;
  costPrice: number;
  hasKnownPvp: boolean;
  pvp: number | null; // if known, use this; otherwise costPrice * 1.30
}

export interface Service {
  id: string;
  clientId: string;
  clientName: string;
  operatorId: string | null;
  operatorName: string | null;
  collaboratorId: string | null;
  collaboratorName: string | null;
  clusterId: string;
  branchId?: string | null;
  origin: ServiceOrigin;
  status: ServiceStatus;
  urgency: UrgencyLevel;
  specialty: Specialty;
  serviceType: ServiceType;
  serviceCategory: "Correctivo" | "Plan_Preventivo";
  claimStatus: ClaimStatus;
  receivedAt: string;
  contactedAt: string | null;
  scheduledAt: string | null;
  scheduledEndAt: string | null;
  diagnosisComplete: boolean;
  nps: number | null;
  budgetTotal: number | null;
  budgetStatus: "Pendiente" | "Enviado" | "Aprobado" | "Rechazado" | null;
  description?: string;
  address?: string;
  contactName?: string;
  contactPhone?: string;
  postalCode?: string;
  media?: ServiceMedia[];
  internalNotes?: string;
  collaboratorNotes?: string;
  internalComments?: ServiceComment[];
  managerComments?: ServiceComment[];
  timelineEvents?: TimelineEvent[];
  materials?: ServiceMaterial[];
  realHours?: number | null;
  signatureUrl?: string | null;
  signedAt?: string | null;
  signedBy?: string | null;
}

export type OperatorStatus = "Activo" | "Inactivo" | "Vacaciones" | "Baja";

export interface OperatorMonthlyRevenue {
  month: string; // "2026-01", "2026-02"
  revenue: number;
  services: number;
}

export interface Operator {
  id: string;
  firstName: string;
  lastName: string;
  name: string; // computed display name
  dni: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  photo: string;
  specialty: Specialty;
  secondarySpecialty: Specialty | null;
  clusterId: string;
  clusterIds: string[]; // can cover multiple clusters
  status: OperatorStatus;
  available: boolean;
  npsMean: number;
  totalRevenue: number;
  completedServices: number;
  activeServices: number;
  color: string; // unique HSL color identifier e.g. "210 80% 52%"
  hireDate: string;
  vehiclePlate: string | null;
  certifications: string[];
  monthlyRevenue: OperatorMonthlyRevenue[];
  lastServiceDate: string | null;
  avgResponseTime: number; // minutes avg to first contact
}

export type TaxRate = 0 | 10 | 21;

export interface BudgetLine {
  id: string;
  concept: string;
  description?: string;
  units: number;
  costPrice: number;
  margin: number; // percentage e.g. 30
  taxRate: TaxRate;
}

export type BudgetStatus = "Borrador" | "Enviado" | "Aprobado" | "Rechazado" | "Pte_Facturación" | "Finalizado";

export interface Budget {
  id: string;
  serviceId: string;
  serviceName: string;
  clientName: string;
  clientAddress: string;
  collaboratorName: string | null;
  createdAt: string;
  status: BudgetStatus;
  lines: BudgetLine[];
  termsAndConditions: string;
  proformaPaid: boolean;
  proformaPaidAt: string | null;
  proformaSent: boolean;
  proformaSentAt: string | null;
}

export type ArticleCategory = "Material" | "Mano_de_Obra";

export interface Article {
  id: string;
  title: string;
  description: string;
  category: ArticleCategory;
  specialty: Specialty;
  costPrice: number;
  hasKnownPvp: boolean;
  pvp: number | null; // if known; otherwise calculated as costPrice * 1.30
  unit: string; // "ud", "m", "m²", "h", "kg"
}
