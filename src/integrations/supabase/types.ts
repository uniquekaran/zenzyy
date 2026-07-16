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
      add_ons: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          price: number
          type: string
          variant: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          price: number
          type: string
          variant?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          price?: number
          type?: string
          variant?: string | null
        }
        Relationships: []
      }
      booking_events: {
        Row: {
          booking_id: string
          created_at: string
          event_type: string
          from_date: string | null
          id: string
          reason: string | null
          to_date: string | null
          user_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          event_type: string
          from_date?: string | null
          id?: string
          reason?: string | null
          to_date?: string | null
          user_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          event_type?: string
          from_date?: string | null
          id?: string
          reason?: string | null
          to_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          addons: Json
          adult_count: number
          booking_code: string
          child_count: number
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          discount_amount: number
          discount_reason: string | null
          id: string
          original_visit_date: string | null
          park_id: string
          referral_code_used: string | null
          status: string
          subtotal: number
          ticket_data: Json
          tier_code: string
          total_amount: number
          transport: Json
          user_id: string
          visit_date: string
          wallet_applied: number
        }
        Insert: {
          addons?: Json
          adult_count?: number
          booking_code?: string
          child_count?: number
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          discount_amount?: number
          discount_reason?: string | null
          id?: string
          original_visit_date?: string | null
          park_id: string
          referral_code_used?: string | null
          status?: string
          subtotal?: number
          ticket_data?: Json
          tier_code?: string
          total_amount: number
          transport?: Json
          user_id: string
          visit_date: string
          wallet_applied?: number
        }
        Update: {
          addons?: Json
          adult_count?: number
          booking_code?: string
          child_count?: number
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          discount_amount?: number
          discount_reason?: string | null
          id?: string
          original_visit_date?: string | null
          park_id?: string
          referral_code_used?: string | null
          status?: string
          subtotal?: number
          ticket_data?: Json
          tier_code?: string
          total_amount?: number
          transport?: Json
          user_id?: string
          visit_date?: string
          wallet_applied?: number
        }
        Relationships: [
          {
            foreignKeyName: "bookings_park_id_fkey"
            columns: ["park_id"]
            isOneToOne: false
            referencedRelation: "parks"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          keywords: string[]
          question: string
          sort_order: number
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          keywords?: string[]
          question: string
          sort_order?: number
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          keywords?: string[]
          question?: string
          sort_order?: number
        }
        Relationships: []
      }
      park_zones: {
        Row: {
          avg_wait_minutes: number
          created_at: string
          height_min_cm: number | null
          icon: string | null
          id: string
          name: string
          park_id: string
          safety_notes: string | null
          weight_max_kg: number | null
          x_pct: number
          y_pct: number
          zone_type: string
        }
        Insert: {
          avg_wait_minutes?: number
          created_at?: string
          height_min_cm?: number | null
          icon?: string | null
          id?: string
          name: string
          park_id: string
          safety_notes?: string | null
          weight_max_kg?: number | null
          x_pct?: number
          y_pct?: number
          zone_type: string
        }
        Update: {
          avg_wait_minutes?: number
          created_at?: string
          height_min_cm?: number | null
          icon?: string | null
          id?: string
          name?: string
          park_id?: string
          safety_notes?: string | null
          weight_max_kg?: number | null
          x_pct?: number
          y_pct?: number
          zone_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "park_zones_park_id_fkey"
            columns: ["park_id"]
            isOneToOne: false
            referencedRelation: "parks"
            referencedColumns: ["id"]
          },
        ]
      }
      parks: {
        Row: {
          city: string
          created_at: string
          description: string
          facilities: Json
          gallery: Json
          id: string
          image_url: string
          latitude: number | null
          location: string
          longitude: number | null
          name: string
          price: number
          rating: number
          rules: Json
        }
        Insert: {
          city: string
          created_at?: string
          description: string
          facilities?: Json
          gallery?: Json
          id?: string
          image_url: string
          latitude?: number | null
          location: string
          longitude?: number | null
          name: string
          price: number
          rating?: number
          rules?: Json
        }
        Update: {
          city?: string
          created_at?: string
          description?: string
          facilities?: Json
          gallery?: Json
          id?: string
          image_url?: string
          latitude?: number | null
          location?: string
          longitude?: number | null
          name?: string
          price?: number
          rating?: number
          rules?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          credited_at: string | null
          id: string
          referred_id: string
          referrer_id: string
          status: string
        }
        Insert: {
          created_at?: string
          credited_at?: string | null
          id?: string
          referred_id: string
          referrer_id: string
          status?: string
        }
        Update: {
          created_at?: string
          credited_at?: string | null
          id?: string
          referred_id?: string
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      rush_overrides: {
        Row: {
          active_until: string | null
          created_at: string
          id: string
          level: string
          park_id: string
          set_by: string | null
        }
        Insert: {
          active_until?: string | null
          created_at?: string
          id?: string
          level: string
          park_id: string
          set_by?: string | null
        }
        Update: {
          active_until?: string | null
          created_at?: string
          id?: string
          level?: string
          park_id?: string
          set_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rush_overrides_park_id_fkey"
            columns: ["park_id"]
            isOneToOne: false
            referencedRelation: "parks"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_tiers: {
        Row: {
          active: boolean
          adult_price: number
          child_price: number
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          park_id: string | null
          perks: Json
        }
        Insert: {
          active?: boolean
          adult_price: number
          child_price: number
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          park_id?: string | null
          perks?: Json
        }
        Update: {
          active?: boolean
          adult_price?: number
          child_price?: number
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          park_id?: string | null
          perks?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ticket_tiers_park_id_fkey"
            columns: ["park_id"]
            isOneToOne: false
            referencedRelation: "parks"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_options: {
        Row: {
          active: boolean
          base_fare: number
          capacity: number
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          per_km: number
        }
        Insert: {
          active?: boolean
          base_fare: number
          capacity?: number
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          per_km?: number
        }
        Update: {
          active?: boolean
          base_fare?: number
          capacity?: number
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          per_km?: number
        }
        Relationships: []
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
      wallet_accounts: {
        Row: {
          balance: number
          created_at: string
          id: string
          referral_code: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          referral_code: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          referral_code?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          id: string
          reason: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          id?: string
          reason: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          id?: string
          reason?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
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
      app_role: "admin" | "user"
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
    },
  },
} as const
