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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_findings: {
        Row: {
          area: string
          created_at: string
          description: string
          finding_type: string
          id: string
          management_response: string | null
          recommendation: string | null
          risk_level: string | null
          status: string | null
          work_item_id: string
        }
        Insert: {
          area: string
          created_at?: string
          description: string
          finding_type: string
          id?: string
          management_response?: string | null
          recommendation?: string | null
          risk_level?: string | null
          status?: string | null
          work_item_id: string
        }
        Update: {
          area?: string
          created_at?: string
          description?: string
          finding_type?: string
          id?: string
          management_response?: string | null
          recommendation?: string | null
          risk_level?: string | null
          status?: string | null
          work_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_findings_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          cin: string | null
          company_name: string
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          financial_year_start: number | null
          gstin: string | null
          id: string
          pan: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          cin?: string | null
          company_name: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          financial_year_start?: number | null
          gstin?: string | null
          id?: string
          pan?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          cin?: string | null
          company_name?: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          financial_year_start?: number | null
          gstin?: string | null
          id?: string
          pan?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      compliance_tasks: {
        Row: {
          created_at: string
          due_date: string | null
          filed_date: string | null
          form_number: string | null
          id: string
          remarks: string | null
          srn: string | null
          task_type: string
          work_item_id: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          filed_date?: string | null
          form_number?: string | null
          id?: string
          remarks?: string | null
          srn?: string | null
          task_type: string
          work_item_id: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          filed_date?: string | null
          form_number?: string | null
          id?: string
          remarks?: string | null
          srn?: string | null
          task_type?: string
          work_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_tasks_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          metadata: Json | null
          name: string
          user_id: string
          work_item_id: string | null
        }
        Insert: {
          created_at?: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          metadata?: Json | null
          name: string
          user_id: string
          work_item_id?: string | null
        }
        Update: {
          created_at?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          metadata?: Json | null
          name?: string
          user_id?: string
          work_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_statements: {
        Row: {
          created_at: string
          data: Json
          id: string
          period: string
          statement_type: string
          work_item_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          period: string
          statement_type: string
          work_item_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          period?: string
          statement_type?: string
          work_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_statements_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      gst_returns: {
        Row: {
          arn: string | null
          cgst: number | null
          created_at: string
          filing_date: string | null
          id: string
          igst: number | null
          itc_claimed: number | null
          net_payable: number | null
          period: string
          return_type: string
          sgst: number | null
          taxable_value: number | null
          total_tax: number | null
          work_item_id: string
        }
        Insert: {
          arn?: string | null
          cgst?: number | null
          created_at?: string
          filing_date?: string | null
          id?: string
          igst?: number | null
          itc_claimed?: number | null
          net_payable?: number | null
          period: string
          return_type: string
          sgst?: number | null
          taxable_value?: number | null
          total_tax?: number | null
          work_item_id: string
        }
        Update: {
          arn?: string | null
          cgst?: number | null
          created_at?: string
          filing_date?: string | null
          id?: string
          igst?: number | null
          itc_claimed?: number | null
          net_payable?: number | null
          period?: string
          return_type?: string
          sgst?: number | null
          taxable_value?: number | null
          total_tax?: number | null
          work_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gst_returns_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      income_tax_computations: {
        Row: {
          advance_tax_paid: number | null
          assessment_year: string
          created_at: string
          deductions: Json | null
          gross_income: number | null
          id: string
          refund_due: number | null
          self_assessment_tax: number | null
          tax_liability: number | null
          taxable_income: number | null
          tds_credit: number | null
          work_item_id: string
        }
        Insert: {
          advance_tax_paid?: number | null
          assessment_year: string
          created_at?: string
          deductions?: Json | null
          gross_income?: number | null
          id?: string
          refund_due?: number | null
          self_assessment_tax?: number | null
          tax_liability?: number | null
          taxable_income?: number | null
          tds_credit?: number | null
          work_item_id: string
        }
        Update: {
          advance_tax_paid?: number | null
          assessment_year?: string
          created_at?: string
          deductions?: Json | null
          gross_income?: number | null
          id?: string
          refund_due?: number | null
          self_assessment_tax?: number | null
          tax_liability?: number | null
          taxable_income?: number | null
          tds_credit?: number | null
          work_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_tax_computations_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          amount: number
          created_at: string
          credit_account: string
          debit_account: string
          entry_date: string
          entry_number: string | null
          id: string
          narration: string | null
          work_item_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          credit_account: string
          debit_account: string
          entry_date: string
          entry_number?: string | null
          id?: string
          narration?: string | null
          work_item_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          credit_account?: string
          debit_account?: string
          entry_date?: string
          entry_number?: string | null
          id?: string
          narration?: string | null
          work_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          firm_name: string | null
          full_name: string
          id: string
          membership_number: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          firm_name?: string | null
          full_name: string
          id?: string
          membership_number?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          firm_name?: string | null
          full_name?: string
          id?: string
          membership_number?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          client_id: string | null
          created_at: string
          data: Json | null
          description: string | null
          file_size: string | null
          file_url: string | null
          id: string
          period: string | null
          report_type: string
          title: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          data?: Json | null
          description?: string | null
          file_size?: string | null
          file_url?: string | null
          id?: string
          period?: string | null
          report_type: string
          title: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          data?: Json | null
          description?: string | null
          file_size?: string | null
          file_url?: string | null
          id?: string
          period?: string | null
          report_type?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      work_items: {
        Row: {
          category: Database["public"]["Enums"]["work_category"]
          client_id: string
          completed_at: string | null
          created_at: string
          data: Json | null
          description: string | null
          due_date: string | null
          id: string
          status: Database["public"]["Enums"]["work_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["work_category"]
          client_id: string
          completed_at?: string | null
          created_at?: string
          data?: Json | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: Database["public"]["Enums"]["work_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["work_category"]
          client_id?: string
          completed_at?: string | null
          created_at?: string
          data?: Json | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: Database["public"]["Enums"]["work_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      work_category:
        | "accounting"
        | "gst"
        | "income_tax"
        | "audit"
        | "compliance"
        | "fpa"
        | "risk"
        | "advisory"
      work_status: "draft" | "in_progress" | "review" | "completed" | "filed"
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
      work_category: [
        "accounting",
        "gst",
        "income_tax",
        "audit",
        "compliance",
        "fpa",
        "risk",
        "advisory",
      ],
      work_status: ["draft", "in_progress", "review", "completed", "filed"],
    },
  },
} as const
