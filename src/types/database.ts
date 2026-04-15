// BarberFlow Database Types
// These types match the Supabase schema defined in barberflow_schema.sql

export type AppRole = 'super_admin' | 'owner' | 'manager' | 'professional' | 'receptionist'
export type AppointmentStatus = 'agendado' | 'confirmado' | 'em_atendimento' | 'concluido' | 'cancelado' | 'nao_compareceu'
export type PaymentMethod = 'dinheiro' | 'pix' | 'credito' | 'debito'
export type GoalType = 'faturamento' | 'atendimentos' | 'ticket_medio' | 'novos_clientes'
export type GoalPeriod = 'semanal' | 'mensal'
export type MembershipStatus = 'ativa' | 'pausada' | 'cancelada' | 'expirada'
export type SaasPlan = 'starter' | 'pro' | 'multi_unidade'

export interface Tenant {
  id: string
  name: string
  slug: string
  logo_url: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  opening_time: string
  closing_time: string
  working_days: number[]
  saas_plan: SaasPlan
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  tenant_id: string | null
  full_name: string
  avatar_url: string | null
  phone: string | null
  email: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserRole {
  id: string
  user_id: string
  tenant_id: string
  role: AppRole
  created_at: string
}

export interface Professional {
  id: string
  tenant_id: string
  user_id: string | null
  name: string
  avatar_url: string | null
  phone: string | null
  email: string | null
  specialty: string | null
  commission_rate: number
  work_start: string
  work_end: string
  working_days: number[]
  is_active: boolean
  rating: number
  created_at: string
  updated_at: string
}

export interface ServiceCategory {
  id: string
  tenant_id: string
  name: string
  description: string | null
  sort_order: number
  created_at: string
}

export interface Service {
  id: string
  tenant_id: string
  category_id: string | null
  name: string
  description: string | null
  price: number
  duration: number
  commission_rate: number | null
  is_combo: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  tenant_id: string
  name: string
  phone: string | null
  email: string | null
  avatar_url: string | null
  birthday: string | null
  notes: string | null
  preferences: string | null
  favorite_professional_id: string | null
  tags: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  tenant_id: string
  client_id: string
  professional_id: string
  service_id: string
  date: string
  start_time: string
  end_time: string
  duration: number
  price: number
  status: AppointmentStatus
  notes: string | null
  cancellation_reason: string | null
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  tenant_id: string
  appointment_id: string | null
  client_id: string | null
  professional_id: string | null
  amount: number
  payment_method: PaymentMethod
  description: string | null
  paid_at: string
  created_at: string
}

export interface Commission {
  id: string
  tenant_id: string
  professional_id: string
  appointment_id: string | null
  payment_id: string | null
  amount: number
  rate: number
  period_start: string | null
  period_end: string | null
  is_paid: boolean
  created_at: string
}

export interface Goal {
  id: string
  tenant_id: string
  professional_id: string | null
  type: GoalType
  target_value: number
  current_value: number
  period: GoalPeriod
  start_date: string
  end_date: string
  is_unit_goal: boolean
  created_at: string
  updated_at: string
}

export interface MembershipPlan {
  id: string
  tenant_id: string
  name: string
  description: string | null
  price: number
  duration_days: number
  benefits: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ClientMembership {
  id: string
  tenant_id: string
  client_id: string
  plan_id: string
  status: MembershipStatus
  started_at: string
  expires_at: string | null
  renewed_at: string | null
  created_at: string
  updated_at: string
}
