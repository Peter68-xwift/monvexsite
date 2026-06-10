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
      packages_catalog: {
        Row: {
          code: string
          daily_income: number
          deposit: number
          duration_days: number
          name: string
          sort_order: number
          total_return: number
        }
        Insert: {
          code: string
          daily_income: number
          deposit: number
          duration_days?: number
          name: string
          sort_order?: number
          total_return: number
        }
        Update: {
          code?: string
          daily_income?: number
          deposit?: number
          duration_days?: number
          name?: string
          sort_order?: number
          total_return?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          balance: number
          created_at: string
          full_name: string | null
          fund_password_hash: string | null
          id: string
          phone: string
          referral_code: string
          referred_by: string | null
          updated_at: string
          withdrawal_enabled: boolean
        }
        Insert: {
          balance?: number
          created_at?: string
          full_name?: string | null
          fund_password_hash?: string | null
          id: string
          phone: string
          referral_code: string
          referred_by?: string | null
          updated_at?: string
          withdrawal_enabled?: boolean
        }
        Update: {
          balance?: number
          created_at?: string
          full_name?: string | null
          fund_password_hash?: string | null
          id?: string
          phone?: string
          referral_code?: string
          referred_by?: string | null
          updated_at?: string
          withdrawal_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          id: number
          maintenance_mode: boolean
          min_deposit: number
          min_withdrawal: number
          registrations_enabled: boolean
          tasks_enabled: boolean
          updated_at: string
          withdrawals_enabled: boolean
        }
        Insert: {
          id?: number
          maintenance_mode?: boolean
          min_deposit?: number
          min_withdrawal?: number
          registrations_enabled?: boolean
          tasks_enabled?: boolean
          updated_at?: string
          withdrawals_enabled?: boolean
        }
        Update: {
          id?: number
          maintenance_mode?: boolean
          min_deposit?: number
          min_withdrawal?: number
          registrations_enabled?: boolean
          tasks_enabled?: boolean
          updated_at?: string
          withdrawals_enabled?: boolean
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          checkout_request_id: string | null
          created_at: string
          description: string | null
          id: string
          merchant_request_id: string | null
          meta: Json
          mpesa_number: string | null
          mpesa_receipt: string | null
          reference: string | null
          status: Database["public"]["Enums"]["tx_status"]
          type: Database["public"]["Enums"]["tx_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          checkout_request_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          merchant_request_id?: string | null
          meta?: Json
          mpesa_number?: string | null
          mpesa_receipt?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["tx_status"]
          type: Database["public"]["Enums"]["tx_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          checkout_request_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          merchant_request_id?: string | null
          meta?: Json
          mpesa_number?: string | null
          mpesa_receipt?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["tx_status"]
          type?: Database["public"]["Enums"]["tx_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_packages: {
        Row: {
          expires_at: string
          id: string
          last_income_at: string | null
          package_code: string
          started_at: string
          status: Database["public"]["Enums"]["package_status"]
          total_earned: number
          user_id: string
        }
        Insert: {
          expires_at: string
          id?: string
          last_income_at?: string | null
          package_code: string
          started_at?: string
          status?: Database["public"]["Enums"]["package_status"]
          total_earned?: number
          user_id: string
        }
        Update: {
          expires_at?: string
          id?: string
          last_income_at?: string | null
          package_code?: string
          started_at?: string
          status?: Database["public"]["Enums"]["package_status"]
          total_earned?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_packages_package_code_fkey"
            columns: ["package_code"]
            isOneToOne: false
            referencedRelation: "packages_catalog"
            referencedColumns: ["code"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      generate_referral_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      package_status: "active" | "expired" | "cancelled"
      tx_status: "pending" | "success" | "failed"
      tx_type: "deposit" | "withdrawal" | "rebate" | "gift"
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
      app_role: ["admin", "user"],
      package_status: ["active", "expired", "cancelled"],
      tx_status: ["pending", "success", "failed"],
      tx_type: ["deposit", "withdrawal", "rebate", "gift"],
    },
  },
} as const
