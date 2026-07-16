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
      amenities: {
        Row: {
          active: boolean
          available_from: string
          available_to: string
          blackout_dates: string[]
          capacity: number | null
          cover_image_url: string | null
          created_at: string
          daily_price: number | null
          deposit: number
          description: string | null
          hourly_price: number | null
          id: string
          name: string
          rules_text: string | null
          society_id: string
        }
        Insert: {
          active?: boolean
          available_from?: string
          available_to?: string
          blackout_dates?: string[]
          capacity?: number | null
          cover_image_url?: string | null
          created_at?: string
          daily_price?: number | null
          deposit?: number
          description?: string | null
          hourly_price?: number | null
          id?: string
          name: string
          rules_text?: string | null
          society_id: string
        }
        Update: {
          active?: boolean
          available_from?: string
          available_to?: string
          blackout_dates?: string[]
          capacity?: number | null
          cover_image_url?: string | null
          created_at?: string
          daily_price?: number | null
          deposit?: number
          description?: string | null
          hourly_price?: number | null
          id?: string
          name?: string
          rules_text?: string | null
          society_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "amenities_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      amenity_bookings: {
        Row: {
          amenity_id: string
          created_at: string
          deposit: number
          end_at: string
          flat_id: string
          id: string
          payment_id: string | null
          profile_id: string
          start_at: string
          status: Database["public"]["Enums"]["booking_status"]
          total_amount: number
        }
        Insert: {
          amenity_id: string
          created_at?: string
          deposit?: number
          end_at: string
          flat_id: string
          id?: string
          payment_id?: string | null
          profile_id: string
          start_at: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_amount: number
        }
        Update: {
          amenity_id?: string
          created_at?: string
          deposit?: number
          end_at?: string
          flat_id?: string
          id?: string
          payment_id?: string | null
          profile_id?: string
          start_at?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "amenity_bookings_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_bookings_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_bookings_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_bookings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_profile_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          society_id: string
        }
        Insert: {
          action: string
          actor_profile_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          society_id: string
        }
        Update: {
          action?: string
          actor_profile_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          society_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      complaint_updates: {
        Row: {
          body: string
          complaint_id: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["complaint_update_kind"]
          profile_id: string
        }
        Insert: {
          body: string
          complaint_id: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["complaint_update_kind"]
          profile_id: string
        }
        Update: {
          body?: string
          complaint_id?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["complaint_update_kind"]
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_updates_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaint_updates_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          assigned_service_provider_id: string | null
          assigned_to: string | null
          category: string
          created_at: string
          description: string
          flat_id: string
          id: string
          photos: Json
          priority: Database["public"]["Enums"]["complaint_priority"]
          raised_by: string
          resolved_at: string | null
          society_id: string
          status: Database["public"]["Enums"]["complaint_status"]
          title: string
        }
        Insert: {
          assigned_service_provider_id?: string | null
          assigned_to?: string | null
          category: string
          created_at?: string
          description: string
          flat_id: string
          id?: string
          photos?: Json
          priority?: Database["public"]["Enums"]["complaint_priority"]
          raised_by: string
          resolved_at?: string | null
          society_id: string
          status?: Database["public"]["Enums"]["complaint_status"]
          title: string
        }
        Update: {
          assigned_service_provider_id?: string | null
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string
          flat_id?: string
          id?: string
          photos?: Json
          priority?: Database["public"]["Enums"]["complaint_priority"]
          raised_by?: string
          resolved_at?: string | null
          society_id?: string
          status?: Database["public"]["Enums"]["complaint_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_assigned_service_provider_id_fkey"
            columns: ["assigned_service_provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_raised_by_fkey"
            columns: ["raised_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      dues: {
        Row: {
          created_at: string
          due_date: string
          flat_id: string
          id: string
          line_items: Json
          paid_at: string | null
          payment_id: string | null
          period: string
          society_id: string
          status: Database["public"]["Enums"]["dues_status"]
          total: number
        }
        Insert: {
          created_at?: string
          due_date: string
          flat_id: string
          id?: string
          line_items: Json
          paid_at?: string | null
          payment_id?: string | null
          period: string
          society_id: string
          status?: Database["public"]["Enums"]["dues_status"]
          total: number
        }
        Update: {
          created_at?: string
          due_date?: string
          flat_id?: string
          id?: string
          line_items?: Json
          paid_at?: string | null
          payment_id?: string | null
          period?: string
          society_id?: string
          status?: Database["public"]["Enums"]["dues_status"]
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "dues_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dues_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dues_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          age: number | null
          id: string
          name: string
          profile_id: string
          relation: string | null
        }
        Insert: {
          age?: number | null
          id?: string
          name: string
          profile_id: string
          relation?: string | null
        }
        Update: {
          age?: number | null
          id?: string
          name?: string
          profile_id?: string
          relation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      frequent_visitors: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          visitor_name: string
          visitor_phone: string
          visitor_type: Database['public']['Enums']['visitor_type']
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          visitor_name: string
          visitor_phone: string
          visitor_type?: Database['public']['Enums']['visitor_type']
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          visitor_name?: string
          visitor_phone?: string
          visitor_type?: Database['public']['Enums']['visitor_type']
        }
        Relationships: [
          {
            foreignKeyName: 'frequent_visitors_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      flat_residents: {
        Row: {
          flat_id: string
          is_head: boolean
          is_owner: boolean
          joined_at: string
          profile_id: string
        }
        Insert: {
          flat_id: string
          is_head?: boolean
          is_owner?: boolean
          joined_at?: string
          profile_id: string
        }
        Update: {
          flat_id?: string
          is_head?: boolean
          is_owner?: boolean
          joined_at?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flat_residents_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flat_residents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flats: {
        Row: {
          bhk: number | null
          created_at: string
          floor: number | null
          id: string
          number: string
          tower_id: string
        }
        Insert: {
          bhk?: number | null
          created_at?: string
          floor?: number | null
          id?: string
          number: string
          tower_id: string
        }
        Update: {
          bhk?: number | null
          created_at?: string
          floor?: number | null
          id?: string
          number?: string
          tower_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flats_tower_id_fkey"
            columns: ["tower_id"]
            isOneToOne: false
            referencedRelation: "towers"
            referencedColumns: ["id"]
          },
        ]
      }
      notice_reactions: {
        Row: {
          emoji: string
          notice_id: string
          profile_id: string
        }
        Insert: {
          emoji: string
          notice_id: string
          profile_id: string
        }
        Update: {
          emoji?: string
          notice_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notice_reactions_notice_id_fkey"
            columns: ["notice_id"]
            isOneToOne: false
            referencedRelation: "notices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notice_reactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notice_reads: {
        Row: {
          notice_id: string
          profile_id: string
          read_at: string
        }
        Insert: {
          notice_id: string
          profile_id: string
          read_at?: string
        }
        Update: {
          notice_id?: string
          profile_id?: string
          read_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notice_reads_notice_id_fkey"
            columns: ["notice_id"]
            isOneToOne: false
            referencedRelation: "notices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notice_reads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          attachments: Json
          body: string
          category: Database["public"]["Enums"]["notice_category"]
          created_at: string
          created_by: string
          id: string
          pinned: boolean
          published_at: string
          society_id: string
          target_audience: Json
          title: string
        }
        Insert: {
          attachments?: Json
          body: string
          category?: Database["public"]["Enums"]["notice_category"]
          created_at?: string
          created_by: string
          id?: string
          pinned?: boolean
          published_at?: string
          society_id: string
          target_audience?: Json
          title: string
        }
        Update: {
          attachments?: Json
          body?: string
          category?: Database["public"]["Enums"]["notice_category"]
          created_at?: string
          created_by?: string
          id?: string
          pinned?: boolean
          published_at?: string
          society_id?: string
          target_audience?: Json
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notices_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          complaints: boolean
          notices: boolean
          payments: boolean
          polls: boolean
          profile_id: string
          updated_at: string
          visitors: boolean
        }
        Insert: {
          complaints?: boolean
          notices?: boolean
          payments?: boolean
          polls?: boolean
          profile_id: string
          updated_at?: string
          visitors?: boolean
        }
        Update: {
          complaints?: boolean
          notices?: boolean
          payments?: boolean
          polls?: boolean
          profile_id?: string
          updated_at?: string
          visitors?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          category: string
          created_at: string
          data: Json
          id: string
          profile_id: string
          read_at: string | null
          title: string
        }
        Insert: {
          body?: string | null
          category: string
          created_at?: string
          data?: Json
          id?: string
          profile_id: string
          read_at?: string | null
          title: string
        }
        Update: {
          body?: string | null
          category?: string
          created_at?: string
          data?: Json
          id?: string
          profile_id?: string
          read_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          captured_at: string | null
          created_at: string
          currency: string
          id: string
          order_id: string
          profile_id: string
          purpose: Database["public"]["Enums"]["payment_purpose"]
          raw_webhook: Json | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          reference_id: string | null
          reference_ids: string[] | null
          society_id: string
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          captured_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          order_id: string
          profile_id: string
          purpose: Database["public"]["Enums"]["payment_purpose"]
          raw_webhook?: Json | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          reference_id?: string | null
          reference_ids?: string[] | null
          society_id: string
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          captured_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          order_id?: string
          profile_id?: string
          purpose?: Database["public"]["Enums"]["payment_purpose"]
          raw_webhook?: Json | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          reference_id?: string | null
          reference_ids?: string[] | null
          society_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          parent_id: string | null
          poll_id: string
          profile_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          parent_id?: string | null
          poll_id: string
          profile_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          poll_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "poll_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_comments_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_comments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          option_indices: number[]
          poll_id: string
          profile_id: string
          voted_at: string
        }
        Insert: {
          option_indices: number[]
          poll_id: string
          profile_id: string
          voted_at?: string
        }
        Update: {
          option_indices?: number[]
          poll_id?: string
          profile_id?: string
          voted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          allow_multiple: boolean
          anonymous: boolean
          category: Database["public"]["Enums"]["poll_category"]
          created_at: string
          created_by: string
          ends_at: string
          id: string
          options: Json
          question: string
          quorum: number
          show_results: boolean
          society_id: string
          starts_at: string
          target_audience: Json
        }
        Insert: {
          allow_multiple?: boolean
          anonymous?: boolean
          category?: Database["public"]["Enums"]["poll_category"]
          created_at?: string
          created_by: string
          ends_at: string
          id?: string
          options: Json
          question: string
          quorum?: number
          show_results?: boolean
          society_id: string
          starts_at?: string
          target_audience?: Json
        }
        Update: {
          allow_multiple?: boolean
          anonymous?: boolean
          category?: Database["public"]["Enums"]["poll_category"]
          created_at?: string
          created_by?: string
          ends_at?: string
          id?: string
          options?: Json
          question?: string
          quorum?: number
          show_results?: boolean
          society_id?: string
          starts_at?: string
          target_audience?: Json
        }
        Relationships: [
          {
            foreignKeyName: "polls_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "polls_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_approvals: {
        Row: {
          code: string
          created_at: string
          created_by_profile_id: string
          end_at: string
          flat_id: string
          id: string
          notes: string | null
          qr_used_at: string | null
          recurring: boolean
          start_at: string
          type: Database["public"]["Enums"]["visitor_type"]
          vehicle_plate: string | null
          visitor_name: string
          visitor_phone: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by_profile_id: string
          end_at: string
          flat_id: string
          id?: string
          notes?: string | null
          qr_used_at?: string | null
          recurring?: boolean
          start_at: string
          type: Database["public"]["Enums"]["visitor_type"]
          vehicle_plate?: string | null
          visitor_name: string
          visitor_phone?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by_profile_id?: string
          end_at?: string
          flat_id?: string
          id?: string
          notes?: string | null
          qr_used_at?: string | null
          recurring?: boolean
          start_at?: string
          type?: Database["public"]["Enums"]["visitor_type"]
          vehicle_plate?: string | null
          visitor_name?: string
          visitor_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pre_approvals_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_approvals_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          preferred_locale: string
          role: Database["public"]["Enums"]["user_role"]
          society_id: string | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          preferred_locale?: string
          role?: Database["public"]["Enums"]["user_role"]
          society_id?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          preferred_locale?: string
          role?: Database["public"]["Enums"]["user_role"]
          society_id?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          active: boolean
          created_at: string
          device_id: string | null
          expo_token: string
          id: string
          last_seen_at: string
          platform: string
          profile_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          device_id?: string | null
          expo_token: string
          id?: string
          last_seen_at?: string
          platform?: string
          profile_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          device_id?: string | null
          expo_token?: string
          id?: string
          last_seen_at?: string
          platform?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_providers: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          phone: string | null
          society_id: string
          verified: boolean
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          society_id: string
          verified?: boolean
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          society_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "service_providers_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      societies: {
        Row: {
          address: string | null
          city: string | null
          code: string
          created_at: string
          id: string
          logo_url: string | null
          name: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          phone: string | null
          photo_url: string | null
          role: string
          shift_end: string | null
          shift_start: string | null
          society_id: string
          verified: boolean
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          photo_url?: string | null
          role: string
          shift_end?: string | null
          shift_start?: string | null
          society_id: string
          verified?: boolean
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          photo_url?: string | null
          role?: string
          shift_end?: string | null
          shift_start?: string | null
          society_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "staff_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      towers: {
        Row: {
          created_at: string
          id: string
          name: string
          society_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          society_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          society_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "towers_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          color: string | null
          created_at: string
          flat_id: string
          id: string
          model: string | null
          plate_number: string
          type: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          flat_id: string
          id?: string
          model?: string | null
          plate_number: string
          type: string
        }
        Update: {
          color?: string | null
          created_at?: string
          flat_id?: string
          id?: string
          model?: string | null
          plate_number?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
        ]
      }
      visitors: {
        Row: {
          decided_at: string | null
          decided_by: string | null
          entered_at: string | null
          exited_at: string | null
          flat_id: string
          guard_id: string | null
          guard_note: string | null
          id: string
          pre_approval_id: string | null
          pre_approved: boolean
          purpose: string | null
          requested_at: string
          resident_instructions: string | null
          society_id: string
          status: Database["public"]["Enums"]["visitor_status"]
          type: Database["public"]["Enums"]["visitor_type"]
          visitor_name: string
          visitor_phone: string | null
          visitor_photo_path: string | null
        }
        Insert: {
          decided_at?: string | null
          decided_by?: string | null
          entered_at?: string | null
          exited_at?: string | null
          flat_id: string
          guard_id?: string | null
          guard_note?: string | null
          id?: string
          pre_approval_id?: string | null
          pre_approved?: boolean
          purpose?: string | null
          requested_at?: string
          resident_instructions?: string | null
          society_id: string
          status?: Database["public"]["Enums"]["visitor_status"]
          type: Database["public"]["Enums"]["visitor_type"]
          visitor_name: string
          visitor_phone?: string | null
          visitor_photo_path?: string | null
        }
        Update: {
          decided_at?: string | null
          decided_by?: string | null
          entered_at?: string | null
          exited_at?: string | null
          flat_id?: string
          guard_id?: string | null
          guard_note?: string | null
          id?: string
          pre_approval_id?: string | null
          pre_approved?: boolean
          purpose?: string | null
          requested_at?: string
          resident_instructions?: string | null
          society_id?: string
          status?: Database["public"]["Enums"]["visitor_status"]
          type?: Database["public"]["Enums"]["visitor_type"]
          visitor_name?: string
          visitor_phone?: string | null
          visitor_photo_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitors_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitors_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitors_guard_id_fkey"
            columns: ["guard_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitors_pre_approval_id_fkey"
            columns: ["pre_approval_id"]
            isOneToOne: false
            referencedRelation: "pre_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitors_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      sos_alerts: {
        Row: {
          id: string
          society_id: string
          flat_id: string | null
          created_by: string
          status: string
          resolved_by: string | null
          resolved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          society_id: string
          flat_id?: string | null
          created_by: string
          status?: string
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          society_id?: string
          flat_id?: string | null
          created_by?: string
          status?: string
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sos_alerts_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sos_alerts_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sos_alerts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sos_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      amenity_availability: {
        Row: {
          amenity_id: string
          end_at: string
          start_at: string
          status: Database["public"]["Enums"]["booking_status"]
        }
        Relationships: [
          {
            foreignKeyName: "amenity_bookings_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      consume_preapproval: {
        Args: { p_code: string }
        Returns: {
          reason: string
          valid: boolean
          visitor_id: string | null
        }[]
      }
      count_society_occupied_flats: {
        Args: { p_society: string }
        Returns: number
      }
      deactivate_push_token: {
        Args: { p_expo_token: string }
        Returns: undefined
      }
      enqueue_notification: {
        Args: {
          p_body: string
          p_category: string
          p_data?: Json
          p_profile_id: string
          p_title: string
        }
        Returns: string
      }
      is_active_in_society: { Args: { p_society: string }; Returns: boolean }
      my_flat_ids: { Args: never; Returns: string[] }
      my_profile_id: { Args: never; Returns: string }
      my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      my_society_id: { Args: never; Returns: string }
      update_preferred_locale: {
        Args: { p_locale: string }
        Returns: undefined
      }
      register_push_token: {
        Args: {
          p_device_id?: string
          p_expo_token: string
          p_platform?: string
        }
        Returns: undefined
      }
      generate_dues_cycle: {
        Args: {
          p_due_date: string
          p_line_items: Json
          p_period: string
          p_society: string
          p_total: number
        }
        Returns: number
      }
      search_flats: {
        Args: { p_query: string; p_society: string }
        Returns: {
          id: string
          number: string
          primary_resident: string | null
          tower_name: string
        }[]
      }
      verify_preapproval: {
        Args: { p_code: string }
        Returns: {
          flat_id: string | null
          pre_approval_id: string | null
          reason: string
          type: Database["public"]["Enums"]["visitor_type"] | null
          valid: boolean
          visitor_name: string | null
          visitor_phone: string | null
        }[]
      }
    }
    Enums: {
      booking_status: "pending" | "confirmed" | "cancelled" | "completed" | "failed"
      complaint_priority: "low" | "medium" | "high" | "urgent"
      complaint_status:
        | "new"
        | "assigned"
        | "in_progress"
        | "resolved"
        | "closed"
      complaint_update_kind: "comment" | "status_change"
      dues_status: "due" | "paid" | "overdue" | "partial"
      notice_category:
        | "general"
        | "event"
        | "maintenance"
        | "emergency"
        | "financial"
      payment_purpose: "dues" | "amenity" | "deposit" | "other"
      payment_status: "created" | "captured" | "failed" | "refunded" | "flagged"
      poll_category: "general" | "amenities" | "rules" | "events" | "finance"
      user_role: "resident" | "guard" | "admin"
      user_status: "pending" | "active" | "blocked"
      visitor_status:
        | "pending"
        | "approved"
        | "rejected"
        | "expired"
        | "entered"
        | "exited"
      visitor_type: "guest" | "delivery" | "cab" | "service"
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
      booking_status: ["pending", "confirmed", "cancelled", "completed", "failed"],
      complaint_priority: ["low", "medium", "high", "urgent"],
      complaint_status: [
        "new",
        "assigned",
        "in_progress",
        "resolved",
        "closed",
      ],
      complaint_update_kind: ["comment", "status_change"],
      dues_status: ["due", "paid", "overdue", "partial"],
      notice_category: [
        "general",
        "event",
        "maintenance",
        "emergency",
        "financial",
      ],
      payment_purpose: ["dues", "amenity", "deposit", "other"],
      payment_status: ["created", "captured", "failed", "refunded", "flagged"],
      poll_category: ["general", "amenities", "rules", "events", "finance"],
      user_role: ["resident", "guard", "admin"],
      user_status: ["pending", "active", "blocked"],
      visitor_status: [
        "pending",
        "approved",
        "rejected",
        "expired",
        "entered",
        "exited",
      ],
      visitor_type: ["guest", "delivery", "cab", "service"],
    },
  },
} as const
