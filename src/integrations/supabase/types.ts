export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_users: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          name: string
          role: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          id?: string
          name: string
          role?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      budget_lines: {
        Row: {
          budget_id: string
          concept: string
          cost_price: number
          created_at: string
          description: string | null
          id: string
          margin: number
          sort_order: number
          tax_rate: number
          units: number
        }
        Insert: {
          budget_id: string
          concept?: string
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          margin?: number
          sort_order?: number
          tax_rate?: number
          units?: number
        }
        Update: {
          budget_id?: string
          concept?: string
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          margin?: number
          sort_order?: number
          tax_rate?: number
          units?: number
        }
        Relationships: [
          {
            foreignKeyName: "budget_lines_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          client_address: string
          client_name: string
          collaborator_name: string | null
          created_at: string
          id: string
          proforma_paid: boolean
          proforma_paid_at: string | null
          proforma_sent: boolean
          proforma_sent_at: string | null
          service_id: string
          service_name: string
          status: string
          terms_and_conditions: string
          updated_at: string
        }
        Insert: {
          client_address?: string
          client_name?: string
          collaborator_name?: string | null
          created_at?: string
          id: string
          proforma_paid?: boolean
          proforma_paid_at?: string | null
          proforma_sent?: boolean
          proforma_sent_at?: string | null
          service_id: string
          service_name?: string
          status?: string
          terms_and_conditions?: string
          updated_at?: string
        }
        Update: {
          client_address?: string
          client_name?: string
          collaborator_name?: string | null
          created_at?: string
          id?: string
          proforma_paid?: boolean
          proforma_paid_at?: string | null
          proforma_sent?: boolean
          proforma_sent_at?: string | null
          service_id?: string
          service_name?: string
          status?: string
          terms_and_conditions?: string
          updated_at?: string
        }
        Relationships: []
      }
      certifications: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          read: boolean
          sender: string
          text: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          read?: boolean
          sender: string
          text: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          read?: boolean
          sender?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborators: {
        Row: {
          active_services: number
          additional_contacts: Json
          category: string
          company_name: string
          contact_person: string
          created_at: string
          email: string
          id: string
          logo_url: string | null
          nps_mean: number
          phone: string
          portal_email: string
          portal_enabled: boolean
          total_clients: number
          updated_at: string
        }
        Insert: {
          active_services?: number
          additional_contacts?: Json
          category?: string
          company_name?: string
          contact_person?: string
          created_at?: string
          email?: string
          id: string
          logo_url?: string | null
          nps_mean?: number
          phone?: string
          portal_email?: string
          portal_enabled?: boolean
          total_clients?: number
          updated_at?: string
        }
        Update: {
          active_services?: number
          additional_contacts?: Json
          category?: string
          company_name?: string
          contact_person?: string
          created_at?: string
          email?: string
          id?: string
          logo_url?: string | null
          nps_mean?: number
          phone?: string
          portal_email?: string
          portal_enabled?: boolean
          total_clients?: number
          updated_at?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          address: string
          budget_next_number: number
          budget_prefix: string
          budget_terms: string
          budget_validity_days: number
          company_name: string
          created_at: string
          currency: string
          date_format: string
          default_vat: number
          document_footer: string
          email: string
          id: string
          invoice_prefix: string
          language: string
          legal_conditions: string
          logo_url: string | null
          phone: string
          purchase_order_prefix: string
          service_prefix: string
          sla_first_contact_hours: number
          sla_resolution_hours: number
          tax_id: string
          theme: string
          timezone: string
          updated_at: string
          website: string
        }
        Insert: {
          address?: string
          budget_next_number?: number
          budget_prefix?: string
          budget_terms?: string
          budget_validity_days?: number
          company_name?: string
          created_at?: string
          currency?: string
          date_format?: string
          default_vat?: number
          document_footer?: string
          email?: string
          id?: string
          invoice_prefix?: string
          language?: string
          legal_conditions?: string
          logo_url?: string | null
          phone?: string
          purchase_order_prefix?: string
          service_prefix?: string
          sla_first_contact_hours?: number
          sla_resolution_hours?: number
          tax_id?: string
          theme?: string
          timezone?: string
          updated_at?: string
          website?: string
        }
        Update: {
          address?: string
          budget_next_number?: number
          budget_prefix?: string
          budget_terms?: string
          budget_validity_days?: number
          company_name?: string
          created_at?: string
          currency?: string
          date_format?: string
          default_vat?: number
          document_footer?: string
          email?: string
          id?: string
          invoice_prefix?: string
          language?: string
          legal_conditions?: string
          logo_url?: string | null
          phone?: string
          purchase_order_prefix?: string
          service_prefix?: string
          sla_first_contact_hours?: number
          sla_resolution_hours?: number
          tax_id?: string
          theme?: string
          timezone?: string
          updated_at?: string
          website?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          online: boolean
          participant_id: string | null
          photo: string | null
          type: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          online?: boolean
          participant_id?: string | null
          photo?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          online?: boolean
          participant_id?: string | null
          photo?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      delivery_note_lines: {
        Row: {
          article_name: string
          cost_price: number
          created_at: string
          delivery_note_id: string
          description: string | null
          id: string
          sort_order: number
          units: number
        }
        Insert: {
          article_name?: string
          cost_price?: number
          created_at?: string
          delivery_note_id: string
          description?: string | null
          id?: string
          sort_order?: number
          units?: number
        }
        Update: {
          article_name?: string
          cost_price?: number
          created_at?: string
          delivery_note_id?: string
          description?: string | null
          id?: string
          sort_order?: number
          units?: number
        }
        Relationships: [
          {
            foreignKeyName: "delivery_note_lines_delivery_note_id_fkey"
            columns: ["delivery_note_id"]
            isOneToOne: false
            referencedRelation: "delivery_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_notes: {
        Row: {
          code: string
          collected_at: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          operator_id: string | null
          operator_name: string | null
          pdf_path: string | null
          purchase_order_id: string | null
          service_id: string
          status: string
          supplier_id: string | null
          supplier_name: string
          total_cost: number | null
          updated_at: string
        }
        Insert: {
          code?: string
          collected_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          operator_id?: string | null
          operator_name?: string | null
          pdf_path?: string | null
          purchase_order_id?: string | null
          service_id: string
          status?: string
          supplier_id?: string | null
          supplier_name?: string
          total_cost?: number | null
          updated_at?: string
        }
        Update: {
          code?: string
          collected_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          operator_id?: string | null
          operator_name?: string | null
          pdf_path?: string | null
          purchase_order_id?: string | null
          service_id?: string
          status?: string
          supplier_id?: string | null
          supplier_name?: string
          total_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_notes_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_notes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_dismissals: {
        Row: {
          dismissed_at: string
          id: string
          notification_id: string
          user_id: string
        }
        Insert: {
          dismissed_at?: string
          id?: string
          notification_id: string
          user_id: string
        }
        Update: {
          dismissed_at?: string
          id?: string
          notification_id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      protocol_checks: {
        Row: {
          check_id: string
          checked: boolean
          checked_at: string | null
          checked_by: string | null
          created_at: string
          id: string
          service_id: string
          updated_at: string
        }
        Insert: {
          check_id: string
          checked?: boolean
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          id?: string
          service_id: string
          updated_at?: string
        }
        Update: {
          check_id?: string
          checked?: boolean
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          id?: string
          service_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchase_invoice_lines: {
        Row: {
          created_at: string
          delivery_note_id: string | null
          description: string
          id: string
          invoice_id: string
          purchase_order_id: string | null
          service_id: string | null
          sort_order: number
          tax_rate: number
          total: number
          unit_price: number
          units: number
        }
        Insert: {
          created_at?: string
          delivery_note_id?: string | null
          description?: string
          id?: string
          invoice_id: string
          purchase_order_id?: string | null
          service_id?: string | null
          sort_order?: number
          tax_rate?: number
          total?: number
          unit_price?: number
          units?: number
        }
        Update: {
          created_at?: string
          delivery_note_id?: string | null
          description?: string
          id?: string
          invoice_id?: string
          purchase_order_id?: string | null
          service_id?: string | null
          sort_order?: number
          tax_rate?: number
          total?: number
          unit_price?: number
          units?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_invoice_lines_delivery_note_id_fkey"
            columns: ["delivery_note_id"]
            isOneToOne: false
            referencedRelation: "delivery_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "purchase_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_invoice_lines_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_invoices: {
        Row: {
          created_at: string
          created_by: string | null
          due_date: string | null
          id: string
          invoice_date: string | null
          invoice_number: string
          notes: string | null
          pdf_path: string | null
          status: string
          subtotal: number
          supplier_id: string | null
          supplier_name: string
          tax_amount: number
          tax_rate: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string
          notes?: string | null
          pdf_path?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string | null
          supplier_name?: string
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string
          notes?: string | null
          pdf_path?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string | null
          supplier_name?: string
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_lines: {
        Row: {
          article_name: string
          cost_price: number
          created_at: string
          description: string | null
          id: string
          purchase_order_id: string
          sort_order: number
          tax_rate: number
          units: number
        }
        Insert: {
          article_name?: string
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          purchase_order_id: string
          sort_order?: number
          tax_rate?: number
          units?: number
        }
        Update: {
          article_name?: string
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          purchase_order_id?: string
          sort_order?: number
          tax_rate?: number
          units?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_lines_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          operator_id: string | null
          operator_name: string | null
          pdf_path: string | null
          service_id: string
          status: string
          supplier_id: string | null
          supplier_name: string
          total_cost: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id: string
          notes?: string | null
          operator_id?: string | null
          operator_name?: string | null
          pdf_path?: string | null
          service_id: string
          status?: string
          supplier_id?: string | null
          supplier_name?: string
          total_cost?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          operator_id?: string | null
          operator_name?: string | null
          pdf_path?: string | null
          service_id?: string
          status?: string
          supplier_id?: string | null
          supplier_name?: string
          total_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_media: {
        Row: {
          caption: string | null
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          service_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string
          id?: string
          service_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_media_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          address: string | null
          budget_status: string | null
          budget_total: number | null
          claim_status: string
          client_id: string
          client_name: string
          cluster_id: string
          collaborator_id: string | null
          collaborator_name: string | null
          contacted_at: string | null
          created_at: string
          description: string | null
          diagnosis_complete: boolean
          id: string
          nps: number | null
          operator_id: string | null
          operator_name: string | null
          origin: string
          real_hours: number | null
          received_at: string
          scheduled_at: string | null
          scheduled_end_at: string | null
          service_category: string
          service_type: string
          signature_url: string | null
          signed_at: string | null
          signed_by: string | null
          specialty: string
          status: string
          updated_at: string
          urgency: string
        }
        Insert: {
          address?: string | null
          budget_status?: string | null
          budget_total?: number | null
          claim_status?: string
          client_id?: string
          client_name?: string
          cluster_id?: string
          collaborator_id?: string | null
          collaborator_name?: string | null
          contacted_at?: string | null
          created_at?: string
          description?: string | null
          diagnosis_complete?: boolean
          id: string
          nps?: number | null
          operator_id?: string | null
          operator_name?: string | null
          origin?: string
          real_hours?: number | null
          received_at?: string
          scheduled_at?: string | null
          scheduled_end_at?: string | null
          service_category?: string
          service_type?: string
          signature_url?: string | null
          signed_at?: string | null
          signed_by?: string | null
          specialty?: string
          status?: string
          updated_at?: string
          urgency?: string
        }
        Update: {
          address?: string | null
          budget_status?: string | null
          budget_total?: number | null
          claim_status?: string
          client_id?: string
          client_name?: string
          cluster_id?: string
          collaborator_id?: string | null
          collaborator_name?: string | null
          contacted_at?: string | null
          created_at?: string
          description?: string | null
          diagnosis_complete?: boolean
          id?: string
          nps?: number | null
          operator_id?: string | null
          operator_name?: string | null
          origin?: string
          real_hours?: number | null
          received_at?: string
          scheduled_at?: string | null
          scheduled_end_at?: string | null
          service_category?: string
          service_type?: string
          signature_url?: string | null
          signed_at?: string | null
          signed_by?: string | null
          specialty?: string
          status?: string
          updated_at?: string
          urgency?: string
        }
        Relationships: []
      }
      specialties: {
        Row: {
          active: boolean
          color: string
          created_at: string
          icon: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          active: boolean
          address: string
          city: string
          contact_person: string
          created_at: string
          due_days: number
          email: string
          iban: string
          id: string
          name: string
          notes: string
          payment_terms: string
          phone: string
          province: string
          tax_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string
          city?: string
          contact_person?: string
          created_at?: string
          due_days?: number
          email?: string
          iban?: string
          id?: string
          name?: string
          notes?: string
          payment_terms?: string
          phone?: string
          province?: string
          tax_id?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string
          city?: string
          contact_person?: string
          created_at?: string
          due_days?: number
          email?: string
          iban?: string
          id?: string
          name?: string
          notes?: string
          payment_terms?: string
          phone?: string
          province?: string
          tax_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tax_types: {
        Row: {
          active: boolean
          created_at: string
          id: string
          is_default: boolean
          name: string
          rate: number
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          rate?: number
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          rate?: number
          sort_order?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          collaborator_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          collaborator_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          collaborator_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_collaborator_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_gestor: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "gestor" | "operario" | "colaborador" | "lectura"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "gestor", "operario", "colaborador", "lectura"],
    },
  },
} as const
