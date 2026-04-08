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
      articles: {
        Row: {
          active: boolean
          category: string
          cost_price: number
          created_at: string
          description: string
          has_known_pvp: boolean
          id: string
          margin: number
          pvp: number | null
          sort_order: number
          specialty: string
          title: string
          unit: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string
          cost_price?: number
          created_at?: string
          description?: string
          has_known_pvp?: boolean
          id: string
          margin?: number
          pvp?: number | null
          sort_order?: number
          specialty?: string
          title?: string
          unit?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          cost_price?: number
          created_at?: string
          description?: string
          has_known_pvp?: boolean
          id?: string
          margin?: number
          pvp?: number | null
          sort_order?: number
          specialty?: string
          title?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      branches: {
        Row: {
          active: boolean
          address: string
          address_extra: string
          city: string
          cluster_ids: string[]
          created_at: string
          email: string
          floor: string
          id: string
          logo_url: string | null
          manager_name: string
          name: string
          phone: string
          postal_code: string
          province: string
          street_number: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string
          address_extra?: string
          city?: string
          cluster_ids?: string[]
          created_at?: string
          email?: string
          floor?: string
          id?: string
          logo_url?: string | null
          manager_name?: string
          name?: string
          phone?: string
          postal_code?: string
          province?: string
          street_number?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string
          address_extra?: string
          city?: string
          cluster_ids?: string[]
          created_at?: string
          email?: string
          floor?: string
          id?: string
          logo_url?: string | null
          manager_name?: string
          name?: string
          phone?: string
          postal_code?: string
          province?: string
          street_number?: string
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
      clients: {
        Row: {
          address: string
          address_extra: string
          city: string
          client_type: string
          cluster_id: string
          collaborator_id: string | null
          collaborator_name: string | null
          company_name: string
          created_at: string
          dni: string
          email: string
          floor: string
          id: string
          last_name: string
          last_service_date: string | null
          name: string
          origin: string
          phone: string
          plan_type: string
          postal_code: string
          province: string
          street_number: string
          tax_id: string
          updated_at: string
        }
        Insert: {
          address?: string
          address_extra?: string
          city?: string
          client_type?: string
          cluster_id?: string
          collaborator_id?: string | null
          collaborator_name?: string | null
          company_name?: string
          created_at?: string
          dni?: string
          email?: string
          floor?: string
          id: string
          last_name?: string
          last_service_date?: string | null
          name?: string
          origin?: string
          phone?: string
          plan_type?: string
          postal_code?: string
          province?: string
          street_number?: string
          tax_id?: string
          updated_at?: string
        }
        Update: {
          address?: string
          address_extra?: string
          city?: string
          client_type?: string
          cluster_id?: string
          collaborator_id?: string | null
          collaborator_name?: string | null
          company_name?: string
          created_at?: string
          dni?: string
          email?: string
          floor?: string
          id?: string
          last_name?: string
          last_service_date?: string | null
          name?: string
          origin?: string
          phone?: string
          plan_type?: string
          postal_code?: string
          province?: string
          street_number?: string
          tax_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      collaborators: {
        Row: {
          active_services: number
          additional_contacts: Json
          address: string
          address_extra: string
          branch_id: string | null
          category: string
          city: string
          commission_rate: number
          company_name: string
          contact_person: string
          created_at: string
          email: string
          floor: string
          id: string
          logo_url: string | null
          notes: string
          nps_mean: number
          phone: string
          portal_email: string
          portal_enabled: boolean
          postal_code: string
          province: string
          street_number: string
          tax_id: string
          total_clients: number
          updated_at: string
          website: string
        }
        Insert: {
          active_services?: number
          additional_contacts?: Json
          address?: string
          address_extra?: string
          branch_id?: string | null
          category?: string
          city?: string
          commission_rate?: number
          company_name?: string
          contact_person?: string
          created_at?: string
          email?: string
          floor?: string
          id: string
          logo_url?: string | null
          notes?: string
          nps_mean?: number
          phone?: string
          portal_email?: string
          portal_enabled?: boolean
          postal_code?: string
          province?: string
          street_number?: string
          tax_id?: string
          total_clients?: number
          updated_at?: string
          website?: string
        }
        Update: {
          active_services?: number
          additional_contacts?: Json
          address?: string
          address_extra?: string
          branch_id?: string | null
          category?: string
          city?: string
          commission_rate?: number
          company_name?: string
          contact_person?: string
          created_at?: string
          email?: string
          floor?: string
          id?: string
          logo_url?: string | null
          notes?: string
          nps_mean?: number
          phone?: string
          portal_email?: string
          portal_enabled?: boolean
          postal_code?: string
          province?: string
          street_number?: string
          tax_id?: string
          total_clients?: number
          updated_at?: string
          website?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborators_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          address: string
          address_extra: string
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
          floor: string
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
          street_number: string
          tax_id: string
          theme: string
          timezone: string
          updated_at: string
          website: string
        }
        Insert: {
          address?: string
          address_extra?: string
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
          floor?: string
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
          street_number?: string
          tax_id?: string
          theme?: string
          timezone?: string
          updated_at?: string
          website?: string
        }
        Update: {
          address?: string
          address_extra?: string
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
          floor?: string
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
          street_number?: string
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
      monthly_targets: {
        Row: {
          branch_id: string | null
          created_at: string
          id: string
          month: string
          notes: string
          target_avg_response_hours: number
          target_margin: number
          target_max_costs: number
          target_new_clients: number
          target_nps: number
          target_operators: number
          target_revenue: number
          target_services: number
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          id?: string
          month: string
          notes?: string
          target_avg_response_hours?: number
          target_margin?: number
          target_max_costs?: number
          target_new_clients?: number
          target_nps?: number
          target_operators?: number
          target_revenue?: number
          target_services?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          id?: string
          month?: string
          notes?: string
          target_avg_response_hours?: number
          target_margin?: number
          target_max_costs?: number
          target_new_clients?: number
          target_nps?: number
          target_operators?: number
          target_revenue?: number
          target_services?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_targets_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      municipalities: {
        Row: {
          id: string
          name: string
          province: string
        }
        Insert: {
          id?: string
          name: string
          province: string
        }
        Update: {
          id?: string
          name?: string
          province?: string
        }
        Relationships: []
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
      notification_settings: {
        Row: {
          app_enabled: boolean
          created_at: string
          event_description: string
          event_key: string
          event_label: string
          id: string
          slack_enabled: boolean
          updated_at: string
        }
        Insert: {
          app_enabled?: boolean
          created_at?: string
          event_description?: string
          event_key: string
          event_label?: string
          id?: string
          slack_enabled?: boolean
          updated_at?: string
        }
        Update: {
          app_enabled?: boolean
          created_at?: string
          event_description?: string
          event_key?: string
          event_label?: string
          id?: string
          slack_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      operator_monthly_revenue: {
        Row: {
          created_at: string
          id: string
          month: string
          operator_id: string
          revenue: number
          services: number
        }
        Insert: {
          created_at?: string
          id?: string
          month: string
          operator_id: string
          revenue?: number
          services?: number
        }
        Update: {
          created_at?: string
          id?: string
          month?: string
          operator_id?: string
          revenue?: number
          services?: number
        }
        Relationships: [
          {
            foreignKeyName: "operator_monthly_revenue_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_vacations: {
        Row: {
          created_at: string
          days: number
          end_date: string
          id: string
          notes: string | null
          operator_id: string
          start_date: string
        }
        Insert: {
          created_at?: string
          days?: number
          end_date: string
          id?: string
          notes?: string | null
          operator_id: string
          start_date: string
        }
        Update: {
          created_at?: string
          days?: number
          end_date?: string
          id?: string
          notes?: string | null
          operator_id?: string
          start_date?: string
        }
        Relationships: []
      }
      operators: {
        Row: {
          active_services: number
          address: string
          address_extra: string
          article_app_hour_id: string | null
          article_dia_guardia_id: string | null
          article_hora_guardia_id: string | null
          article_salida_id: string | null
          article_standard_hour_id: string | null
          article_urgency_hour_id: string | null
          available: boolean
          avg_response_time: number
          branch_id: string | null
          certifications: string[]
          city: string
          cluster_id: string
          cluster_ids: string[]
          color: string
          completed_services: number
          cost_article_app_hour_id: string | null
          cost_article_dia_guardia_id: string | null
          cost_article_hora_guardia_id: string | null
          cost_article_salida_id: string | null
          cost_article_standard_hour_id: string | null
          cost_article_urgency_hour_id: string | null
          created_at: string
          dni: string
          email: string
          first_name: string
          floor: string
          hire_date: string | null
          id: string
          last_name: string
          last_service_date: string | null
          name: string
          nps_mean: number
          operator_type: string
          phone: string
          photo: string
          province: string
          secondary_specialty: string | null
          specialty: string
          status: string
          street_number: string
          total_revenue: number
          updated_at: string
          vehicle_plate: string | null
        }
        Insert: {
          active_services?: number
          address?: string
          address_extra?: string
          article_app_hour_id?: string | null
          article_dia_guardia_id?: string | null
          article_hora_guardia_id?: string | null
          article_salida_id?: string | null
          article_standard_hour_id?: string | null
          article_urgency_hour_id?: string | null
          available?: boolean
          avg_response_time?: number
          branch_id?: string | null
          certifications?: string[]
          city?: string
          cluster_id?: string
          cluster_ids?: string[]
          color?: string
          completed_services?: number
          cost_article_app_hour_id?: string | null
          cost_article_dia_guardia_id?: string | null
          cost_article_hora_guardia_id?: string | null
          cost_article_salida_id?: string | null
          cost_article_standard_hour_id?: string | null
          cost_article_urgency_hour_id?: string | null
          created_at?: string
          dni?: string
          email?: string
          first_name?: string
          floor?: string
          hire_date?: string | null
          id: string
          last_name?: string
          last_service_date?: string | null
          name?: string
          nps_mean?: number
          operator_type?: string
          phone?: string
          photo?: string
          province?: string
          secondary_specialty?: string | null
          specialty?: string
          status?: string
          street_number?: string
          total_revenue?: number
          updated_at?: string
          vehicle_plate?: string | null
        }
        Update: {
          active_services?: number
          address?: string
          address_extra?: string
          article_app_hour_id?: string | null
          article_dia_guardia_id?: string | null
          article_hora_guardia_id?: string | null
          article_salida_id?: string | null
          article_standard_hour_id?: string | null
          article_urgency_hour_id?: string | null
          available?: boolean
          avg_response_time?: number
          branch_id?: string | null
          certifications?: string[]
          city?: string
          cluster_id?: string
          cluster_ids?: string[]
          color?: string
          completed_services?: number
          cost_article_app_hour_id?: string | null
          cost_article_dia_guardia_id?: string | null
          cost_article_hora_guardia_id?: string | null
          cost_article_salida_id?: string | null
          cost_article_standard_hour_id?: string | null
          cost_article_urgency_hour_id?: string | null
          created_at?: string
          dni?: string
          email?: string
          first_name?: string
          floor?: string
          hire_date?: string | null
          id?: string
          last_name?: string
          last_service_date?: string | null
          name?: string
          nps_mean?: number
          operator_type?: string
          phone?: string
          photo?: string
          province?: string
          secondary_specialty?: string | null
          specialty?: string
          status?: string
          street_number?: string
          total_revenue?: number
          updated_at?: string
          vehicle_plate?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operators_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
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
      protocol_steps: {
        Row: {
          created_at: string
          description: string
          enabled: boolean
          id: string
          label: string
          sort_order: number
          step_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          enabled?: boolean
          id?: string
          label?: string
          sort_order?: number
          step_id: string
        }
        Update: {
          created_at?: string
          description?: string
          enabled?: boolean
          id?: string
          label?: string
          sort_order?: number
          step_id?: string
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
          supplier_invoice_number: string
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
          supplier_invoice_number?: string
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
          supplier_invoice_number?: string
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
      sales_order_lines: {
        Row: {
          concept: string
          cost_price: number
          created_at: string
          description: string | null
          id: string
          margin: number
          sales_order_id: string
          sort_order: number
          tax_rate: number
          units: number
        }
        Insert: {
          concept?: string
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          margin?: number
          sales_order_id: string
          sort_order?: number
          tax_rate?: number
          units?: number
        }
        Update: {
          concept?: string
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          margin?: number
          sales_order_id?: string
          sort_order?: number
          tax_rate?: number
          units?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_lines_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          budget_id: string
          client_address: string
          client_name: string
          collaborator_name: string | null
          created_at: string
          holded_doc_id: string | null
          id: string
          notes: string
          pdf_path: string | null
          sent_to_holded: boolean
          sent_to_holded_at: string | null
          service_id: string
          status: string
          total: number
          updated_at: string
        }
        Insert: {
          budget_id: string
          client_address?: string
          client_name?: string
          collaborator_name?: string | null
          created_at?: string
          holded_doc_id?: string | null
          id: string
          notes?: string
          pdf_path?: string | null
          sent_to_holded?: boolean
          sent_to_holded_at?: string | null
          service_id: string
          status?: string
          total?: number
          updated_at?: string
        }
        Update: {
          budget_id?: string
          client_address?: string
          client_name?: string
          collaborator_name?: string | null
          created_at?: string
          holded_doc_id?: string | null
          id?: string
          notes?: string
          pdf_path?: string | null
          sent_to_holded?: boolean
          sent_to_holded_at?: string | null
          service_id?: string
          status?: string
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      service_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          service_id: string
          user_email: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          service_id: string
          user_email?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          service_id?: string
          user_email?: string
          user_id?: string | null
        }
        Relationships: []
      }
      service_materials_used: {
        Row: {
          brand: string
          created_at: string
          id: string
          material: string
          model: string
          notes: string
          purchase_date: string | null
          service_id: string
          sort_order: number
          supplier_name: string
        }
        Insert: {
          brand?: string
          created_at?: string
          id?: string
          material?: string
          model?: string
          notes?: string
          purchase_date?: string | null
          service_id: string
          sort_order?: number
          supplier_name?: string
        }
        Update: {
          brand?: string
          created_at?: string
          id?: string
          material?: string
          model?: string
          notes?: string
          purchase_date?: string | null
          service_id?: string
          sort_order?: number
          supplier_name?: string
        }
        Relationships: []
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
      service_notes_history: {
        Row: {
          content: string
          created_at: string
          field: string
          id: string
          service_id: string
          user_email: string
          user_id: string | null
        }
        Insert: {
          content?: string
          created_at?: string
          field: string
          id?: string
          service_id: string
          user_email?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          field?: string
          id?: string
          service_id?: string
          user_email?: string
          user_id?: string | null
        }
        Relationships: []
      }
      service_operators: {
        Row: {
          created_at: string
          id: string
          operator_id: string
          operator_name: string
          service_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          operator_id: string
          operator_name?: string
          service_id: string
        }
        Update: {
          created_at?: string
          id?: string
          operator_id?: string
          operator_name?: string
          service_id?: string
        }
        Relationships: []
      }
      service_origins: {
        Row: {
          active: boolean
          created_at: string
          id: string
          is_assistance: boolean
          name: string
          show_collaborator: boolean
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          is_assistance?: boolean
          name: string
          show_collaborator?: boolean
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          is_assistance?: boolean
          name?: string
          show_collaborator?: boolean
          sort_order?: number
        }
        Relationships: []
      }
      service_timeline_events: {
        Row: {
          author_email: string
          author_id: string | null
          comment: string
          created_at: string
          event_date: string
          id: string
          service_id: string
        }
        Insert: {
          author_email?: string
          author_id?: string | null
          comment?: string
          created_at?: string
          event_date: string
          id?: string
          service_id: string
        }
        Update: {
          author_email?: string
          author_id?: string | null
          comment?: string
          created_at?: string
          event_date?: string
          id?: string
          service_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          address: string | null
          address_extra: string
          assistance_service_number: string
          branch_id: string | null
          budget_status: string | null
          budget_total: number | null
          claim_status: string
          client_id: string
          client_name: string
          cluster_id: string
          collaborator_id: string | null
          collaborator_name: string | null
          collaborator_notes: string
          contact_name: string
          contact_phone: string
          contacted_at: string | null
          created_at: string
          created_by_email: string
          created_by_name: string
          description: string | null
          diagnosis_complete: boolean
          floor: string
          id: string
          internal_notes: string
          managed_by_email: string
          managed_by_name: string
          no_media_available: boolean
          nps: number | null
          operator_id: string | null
          operator_name: string | null
          origin: string
          postal_code: string
          real_hours: number | null
          received_at: string
          scheduled_at: string | null
          scheduled_end_at: string | null
          service_category: string
          service_type: string
          signature_url: string | null
          signed_at: string | null
          signed_by: string | null
          skip_sales_order_reason: string | null
          specialty: string
          status: string
          street_number: string
          updated_at: string
          urgency: string
        }
        Insert: {
          address?: string | null
          address_extra?: string
          assistance_service_number?: string
          branch_id?: string | null
          budget_status?: string | null
          budget_total?: number | null
          claim_status?: string
          client_id?: string
          client_name?: string
          cluster_id?: string
          collaborator_id?: string | null
          collaborator_name?: string | null
          collaborator_notes?: string
          contact_name?: string
          contact_phone?: string
          contacted_at?: string | null
          created_at?: string
          created_by_email?: string
          created_by_name?: string
          description?: string | null
          diagnosis_complete?: boolean
          floor?: string
          id: string
          internal_notes?: string
          managed_by_email?: string
          managed_by_name?: string
          no_media_available?: boolean
          nps?: number | null
          operator_id?: string | null
          operator_name?: string | null
          origin?: string
          postal_code?: string
          real_hours?: number | null
          received_at?: string
          scheduled_at?: string | null
          scheduled_end_at?: string | null
          service_category?: string
          service_type?: string
          signature_url?: string | null
          signed_at?: string | null
          signed_by?: string | null
          skip_sales_order_reason?: string | null
          specialty?: string
          status?: string
          street_number?: string
          updated_at?: string
          urgency?: string
        }
        Update: {
          address?: string | null
          address_extra?: string
          assistance_service_number?: string
          branch_id?: string | null
          budget_status?: string | null
          budget_total?: number | null
          claim_status?: string
          client_id?: string
          client_name?: string
          cluster_id?: string
          collaborator_id?: string | null
          collaborator_name?: string | null
          collaborator_notes?: string
          contact_name?: string
          contact_phone?: string
          contacted_at?: string | null
          created_at?: string
          created_by_email?: string
          created_by_name?: string
          description?: string | null
          diagnosis_complete?: boolean
          floor?: string
          id?: string
          internal_notes?: string
          managed_by_email?: string
          managed_by_name?: string
          no_media_available?: boolean
          nps?: number | null
          operator_id?: string | null
          operator_name?: string | null
          origin?: string
          postal_code?: string
          real_hours?: number | null
          received_at?: string
          scheduled_at?: string | null
          scheduled_end_at?: string | null
          service_category?: string
          service_type?: string
          signature_url?: string | null
          signed_at?: string | null
          signed_by?: string | null
          skip_sales_order_reason?: string | null
          specialty?: string
          status?: string
          street_number?: string
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
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
      subscription_plans: {
        Row: {
          active: boolean
          annual_price: number
          color: string
          created_at: string
          description: string
          features: Json
          founder_price: number | null
          founder_slots: number | null
          id: string
          max_homes: number | null
          min_months: number
          monthly_price: number
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          annual_price?: number
          color?: string
          created_at?: string
          description?: string
          features?: Json
          founder_price?: number | null
          founder_slots?: number | null
          id?: string
          max_homes?: number | null
          min_months?: number
          monthly_price?: number
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          annual_price?: number
          color?: string
          created_at?: string
          description?: string
          features?: Json
          founder_price?: number | null
          founder_slots?: number | null
          id?: string
          max_homes?: number | null
          min_months?: number
          monthly_price?: number
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          active: boolean
          address: string
          address_extra: string
          city: string
          contact_person: string
          created_at: string
          due_days: number
          email: string
          floor: string
          iban: string
          id: string
          name: string
          notes: string
          payment_terms: string
          phone: string
          province: string
          street_number: string
          tax_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string
          address_extra?: string
          city?: string
          contact_person?: string
          created_at?: string
          due_days?: number
          email?: string
          floor?: string
          iban?: string
          id?: string
          name?: string
          notes?: string
          payment_terms?: string
          phone?: string
          province?: string
          street_number?: string
          tax_id?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string
          address_extra?: string
          city?: string
          contact_person?: string
          created_at?: string
          due_days?: number
          email?: string
          floor?: string
          iban?: string
          id?: string
          name?: string
          notes?: string
          payment_terms?: string
          phone?: string
          province?: string
          street_number?: string
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
      time_records: {
        Row: {
          created_at: string
          end_time: string | null
          hours: number
          id: string
          latitude: number | null
          location: string
          longitude: number | null
          notes: string | null
          operator_id: string
          record_date: string
          service_id: string | null
          source: string
          start_time: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          hours?: number
          id?: string
          latitude?: number | null
          location?: string
          longitude?: number | null
          notes?: string | null
          operator_id: string
          record_date?: string
          service_id?: string | null
          source?: string
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: string | null
          hours?: number
          id?: string
          latitude?: number | null
          location?: string
          longitude?: number | null
          notes?: string | null
          operator_id?: string
          record_date?: string
          service_id?: string | null
          source?: string
          start_time?: string | null
          updated_at?: string
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
      user_slack_channels: {
        Row: {
          active: boolean
          created_at: string
          id: string
          operator_id: string | null
          slack_channel_id: string
          slack_channel_name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          operator_id?: string | null
          slack_channel_id?: string
          slack_channel_name?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          operator_id?: string | null
          slack_channel_id?: string
          slack_channel_name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          active: boolean
          branch_id: string | null
          brand: string
          color: string
          created_at: string
          fuel_type: string
          id: string
          insurance_company: string
          insurance_expiry: string | null
          insurance_policy: string
          itv_expiry: string | null
          last_maintenance_date: string | null
          mileage: number
          model: string
          next_maintenance_date: string | null
          notes: string
          operator_id: string | null
          photo: string
          plate: string
          status: string
          updated_at: string
          vin: string
          year: number | null
        }
        Insert: {
          active?: boolean
          branch_id?: string | null
          brand?: string
          color?: string
          created_at?: string
          fuel_type?: string
          id?: string
          insurance_company?: string
          insurance_expiry?: string | null
          insurance_policy?: string
          itv_expiry?: string | null
          last_maintenance_date?: string | null
          mileage?: number
          model?: string
          next_maintenance_date?: string | null
          notes?: string
          operator_id?: string | null
          photo?: string
          plate?: string
          status?: string
          updated_at?: string
          vin?: string
          year?: number | null
        }
        Update: {
          active?: boolean
          branch_id?: string | null
          brand?: string
          color?: string
          created_at?: string
          fuel_type?: string
          id?: string
          insurance_company?: string
          insurance_expiry?: string | null
          insurance_policy?: string
          itv_expiry?: string | null
          last_maintenance_date?: string | null
          mileage?: number
          model?: string
          next_maintenance_date?: string | null
          notes?: string
          operator_id?: string | null
          photo?: string
          plate?: string
          status?: string
          updated_at?: string
          vin?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_start_scheduled_services: { Args: never; Returns: number }
      get_user_collaborator_id: { Args: { _user_id: string }; Returns: string }
      get_user_operator_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_gestor: { Args: { _user_id: string }; Returns: boolean }
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "gestor"
        | "operario"
        | "colaborador"
        | "lectura"
        | "pantalla"
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
      app_role: [
        "admin",
        "gestor",
        "operario",
        "colaborador",
        "lectura",
        "pantalla",
      ],
    },
  },
} as const
