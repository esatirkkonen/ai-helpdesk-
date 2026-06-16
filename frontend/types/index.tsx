export type Status = 'Uusi' | 'Luokiteltu' | 'Käsittelyssä' | 'Odottaa' | 'Ratkaistu' | 'Suljettu'
export type Priority = 'Matala' | 'Normaali' | 'Kiireellinen'

export type Ticket = {
  id: string
  ticket_number: number
  title: string
  description: string
  status: Status
  priority: Priority
  ticket_type: string
  customer: string
  customer_email: string
  customer_phone: string
  company: string
  agent: string | null
  agent_id: string | null
  time_spent_seconds: number
  first_response_deadline: string | null
  resolution_deadline: string | null
  sla_breached: boolean
  created_at: string
  updated_at: string
}

export type Agent = {
  id: string
  name: string
  email: string
}

export type Comment = {
  id: string
  content: string
  is_internal: boolean
  created_at: string
  user_id: string
  user_name: string
}