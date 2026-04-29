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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      attendance_logs: {
        Row: {
          aluno_id: string
          created_at: string
          data: string
          data_realizacao: string | null
          id: string
          presente: string
          turma_id: string
        }
        Insert: {
          aluno_id: string
          created_at?: string
          data: string
          data_realizacao?: string | null
          id?: string
          presente: string
          turma_id: string
        }
        Update: {
          aluno_id?: string
          created_at?: string
          data?: string
          data_realizacao?: string | null
          id?: string
          presente?: string
          turma_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_logs_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_logs_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "schedule_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          aluno_id: string
          created_at: string
          id: string
          turma_id: string
        }
        Insert: {
          aluno_id: string
          created_at?: string
          id?: string
          turma_id: string
        }
        Update: {
          aluno_id?: string
          created_at?: string
          id?: string
          turma_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "schedule_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          categoria: string
          created_at: string
          id: string
          valor: number
        }
        Insert: {
          categoria: string
          created_at?: string
          id?: string
          valor?: number
        }
        Update: {
          categoria?: string
          created_at?: string
          id?: string
          valor?: number
        }
        Relationships: []
      }
      lesson_plans: {
        Row: {
          created_at: string
          data: string
          id: string
          lesson_type_id: string
          observacoes: string | null
          quadra: string | null
          turma_id: string
        }
        Insert: {
          created_at?: string
          data: string
          id?: string
          lesson_type_id: string
          observacoes?: string | null
          quadra?: string | null
          turma_id: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          lesson_type_id?: string
          observacoes?: string | null
          quadra?: string | null
          turma_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plans_lesson_type_id_fkey"
            columns: ["lesson_type_id"]
            isOneToOne: false
            referencedRelation: "lesson_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plans_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "schedule_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_types: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string
          frequencia: string
          id: string
          nome: string
          periodicidade: string
          turno: string
          updated_at: string
          valor: number
        }
        Insert: {
          created_at?: string
          frequencia: string
          id?: string
          nome: string
          periodicidade: string
          turno: string
          updated_at?: string
          valor?: number
        }
        Update: {
          created_at?: string
          frequencia?: string
          id?: string
          nome?: string
          periodicidade?: string
          turno?: string
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      revenues: {
        Row: {
          aluno_id: string | null
          aluno_nome: string
          created_at: string
          id: string
          pago_em: string | null
          plano_nome: string
          status: string
          updated_at: string
          valor: number
          vencimento: string
        }
        Insert: {
          aluno_id?: string | null
          aluno_nome: string
          created_at?: string
          id?: string
          pago_em?: string | null
          plano_nome: string
          status?: string
          updated_at?: string
          valor: number
          vencimento: string
        }
        Update: {
          aluno_id?: string | null
          aluno_nome?: string
          created_at?: string
          id?: string
          pago_em?: string | null
          plano_nome?: string
          status?: string
          updated_at?: string
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenues_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_slots: {
        Row: {
          created_at: string
          dia: string
          horario: string
          id: string
          quadra: string
          turma_codigo: string
        }
        Insert: {
          created_at?: string
          dia: string
          horario: string
          id?: string
          quadra: string
          turma_codigo: string
        }
        Update: {
          created_at?: string
          dia?: string
          horario?: string
          id?: string
          quadra?: string
          turma_codigo?: string
        }
        Relationships: []
      }
      scheduled_payments: {
        Row: {
          categoria: string
          created_at: string
          fornecedor: string
          id: string
          pago_em: string | null
          status: string
          updated_at: string
          valor: number
          vencimento: string
        }
        Insert: {
          categoria: string
          created_at?: string
          fornecedor: string
          id?: string
          pago_em?: string | null
          status?: string
          updated_at?: string
          valor: number
          vencimento: string
        }
        Update: {
          categoria?: string
          created_at?: string
          fornecedor?: string
          id?: string
          pago_em?: string | null
          status?: string
          updated_at?: string
          valor?: number
          vencimento?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          camiseta: string | null
          categoria: string
          created_at: string
          data_entrada: string
          data_nascimento: string | null
          id: string
          kit: string | null
          nome: string
          observacoes: string | null
          plano_id: string | null
          responsavel: string | null
          sexo: string | null
          status: string
          updated_at: string
          vencimento: string
          whatsapp_aluno: string | null
          whatsapp_responsavel: string | null
        }
        Insert: {
          camiseta?: string | null
          categoria: string
          created_at?: string
          data_entrada?: string
          data_nascimento?: string | null
          id?: string
          kit?: string | null
          nome: string
          observacoes?: string | null
          plano_id?: string | null
          responsavel?: string | null
          sexo?: string | null
          status?: string
          updated_at?: string
          vencimento: string
          whatsapp_aluno?: string | null
          whatsapp_responsavel?: string | null
        }
        Update: {
          camiseta?: string | null
          categoria?: string
          created_at?: string
          data_entrada?: string
          data_nascimento?: string | null
          id?: string
          kit?: string | null
          nome?: string
          observacoes?: string | null
          plano_id?: string | null
          responsavel?: string | null
          sexo?: string | null
          status?: string
          updated_at?: string
          vencimento?: string
          whatsapp_aluno?: string | null
          whatsapp_responsavel?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "professor" | "aluno"
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
      app_role: ["admin", "professor", "aluno"],
    },
  },
} as const
