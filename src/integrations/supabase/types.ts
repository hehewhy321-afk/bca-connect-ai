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
      achievements: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          xp_reward: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          xp_reward?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
      ai_generated_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          model_used: string | null
          prompt: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          model_used?: string | null
          prompt: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          model_used?: string | null
          prompt?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_pinned: boolean | null
          priority: string | null
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_pinned?: boolean | null
          priority?: string | null
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_pinned?: boolean | null
          priority?: string | null
          title?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean | null
          message: string
          name: string
          phone: string | null
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean | null
          message: string
          name: string
          phone?: string | null
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean | null
          message?: string
          name?: string
          phone?: string | null
          subject?: string
        }
        Relationships: []
      }
      course_chapters: {
        Row: {
          course_id: string
          created_at: string
          id: string
          order_index: number | null
          resources_url: string | null
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          order_index?: number | null
          resources_url?: string | null
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          order_index?: number | null
          resources_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_chapters_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          course_id: string
          enrolled_at: string
          id: string
          payment_screenshot_url: string | null
          status: Database["public"]["Enums"]["course_enrollment_status"] | null
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          enrolled_at?: string
          id?: string
          payment_screenshot_url?: string | null
          status?: Database["public"]["Enums"]["course_enrollment_status"] | null
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          enrolled_at?: string
          id?: string
          payment_screenshot_url?: string | null
          status?: Database["public"]["Enums"]["course_enrollment_status"] | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          chapter_id: string
          created_at: string
          duration: string | null
          id: string
          is_free_preview: boolean | null
          order_index: number | null
          title: string
          video_url: string | null
        }
        Insert: {
          chapter_id: string
          created_at?: string
          duration?: string | null
          id?: string
          is_free_preview?: boolean | null
          order_index?: number | null
          title: string
          video_url?: string | null
        }
        Update: {
          chapter_id?: string
          created_at?: string
          duration?: string | null
          id?: string
          is_free_preview?: boolean | null
          order_index?: number | null
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "course_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_published: boolean | null
          language: string | null
          offer_price: number | null
          original_price: number | null
          price: number | null
          resources_url: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          language?: string | null
          offer_price?: number | null
          original_price?: number | null
          price?: number | null
          resources_url?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          language?: string | null
          offer_price?: number | null
          original_price?: number | null
          price?: number | null
          resources_url?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_feedback: {
        Row: {
          created_at: string
          event_id: string
          feedback: string | null
          id: string
          is_anonymous: boolean | null
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          feedback?: string | null
          id?: string
          is_anonymous?: boolean | null
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          feedback?: string | null
          id?: string
          is_anonymous?: boolean | null
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_feedback_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          attended: boolean | null
          check_in_code: string | null
          event_id: string
          id: string
          payment_receipt_url: string | null
          payment_status: string | null
          registered_at: string
          team_members: Json | null
          team_name: string | null
          user_id: string
        }
        Insert: {
          attended?: boolean | null
          check_in_code?: string | null
          event_id: string
          id?: string
          payment_receipt_url?: string | null
          payment_status?: string | null
          registered_at?: string
          team_members?: Json | null
          team_name?: string | null
          user_id: string
        }
        Update: {
          attended?: boolean | null
          check_in_code?: string | null
          event_id?: string
          id?: string
          payment_receipt_url?: string | null
          payment_status?: string | null
          registered_at?: string
          team_members?: Json | null
          team_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reminders: {
        Row: {
          created_at: string
          email: string
          event_id: string
          id: string
          reminder_sent: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          event_id: string
          id?: string
          reminder_sent?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          event_id?: string
          id?: string
          reminder_sent?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_reminders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          gallery_images: string[] | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          location: string | null
          max_attendees: number | null
          registration_fee: number | null
          start_date: string
          status: Database["public"]["Enums"]["event_status"] | null
          team_size_max: number | null
          team_size_min: number | null
          team_type: string | null
          title: string
          updated_at: string
          visibility: string | null
        }
        Insert: {
          admin_notes?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          gallery_images?: string[] | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          location?: string | null
          max_attendees?: number | null
          registration_fee?: number | null
          start_date: string
          status?: Database["public"]["Enums"]["event_status"] | null
          team_size_max?: number | null
          team_size_min?: number | null
          team_type?: string | null
          title: string
          updated_at?: string
          visibility?: string | null
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          gallery_images?: string[] | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          location?: string | null
          max_attendees?: number | null
          registration_fee?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["event_status"] | null
          team_size_max?: number | null
          team_size_min?: number | null
          team_type?: string | null
          title?: string
          updated_at?: string
          visibility?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      forum_posts: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_locked: boolean | null
          is_pinned: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
          upvotes: number | null
          user_id: string
          views: number | null
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string
          upvotes?: number | null
          user_id: string
          views?: number | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          upvotes?: number | null
          user_id?: string
          views?: number | null
        }
        Relationships: []
      }
      forum_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          is_solution: boolean | null
          parent_reply_id: string | null
          post_id: string
          updated_at: string
          upvotes: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_solution?: boolean | null
          parent_reply_id?: string | null
          post_id: string
          updated_at?: string
          upvotes?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_solution?: boolean | null
          parent_reply_id?: string | null
          post_id?: string
          updated_at?: string
          upvotes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_parent_reply_id_fkey"
            columns: ["parent_reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_votes: {
        Row: {
          created_at: string
          id: string
          post_id: string | null
          reply_id: string | null
          user_id: string
          vote_type: number
        }
        Insert: {
          created_at?: string
          id?: string
          post_id?: string | null
          reply_id?: string | null
          user_id: string
          vote_type?: number
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string | null
          reply_id?: string | null
          user_id?: string
          vote_type?: number
        }
        Relationships: [
          {
            foreignKeyName: "forum_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_votes_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies"
            referencedColumns: ["id"]
          },
        ]
      }
      founding_members: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_order: number | null
          email: string | null
          facebook_url: string | null
          full_name: string
          id: string
          is_active: boolean | null
          linkedin_url: string | null
          phone: string | null
          role: string
          twitter_url: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_order?: number | null
          email?: string | null
          facebook_url?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          linkedin_url?: string | null
          phone?: string | null
          role: string
          twitter_url?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_order?: number | null
          email?: string | null
          facebook_url?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          linkedin_url?: string | null
          phone?: string | null
          role?: string
          twitter_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          batch: string | null
          bio: string | null
          created_at: string
          current_company: string | null
          email: string
          full_name: string
          github_url: string | null
          graduation_year: number | null
          id: string
          is_alumni: boolean | null
          job_title: string | null
          level: number | null
          linkedin_url: string | null
          notification_preferences: any | null
          phone: string | null
          push_notifications_enabled: boolean | null
          semester: number | null
          skills: string[] | null
          updated_at: string
          user_id: string
          xp_points: number | null
        }
        Insert: {
          avatar_url?: string | null
          batch?: string | null
          bio?: string | null
          created_at?: string
          current_company?: string | null
          email: string
          full_name: string
          github_url?: string | null
          graduation_year?: number | null
          id?: string
          is_alumni?: boolean | null
          job_title?: string | null
          level?: number | null
          linkedin_url?: string | null
          notification_preferences?: any | null
          phone?: string | null
          push_notifications_enabled?: boolean | null
          semester?: number | null
          skills?: string[] | null
          updated_at?: string
          user_id: string
          xp_points?: number | null
        }
        Update: {
          avatar_url?: string | null
          batch?: string | null
          bio?: string | null
          created_at?: string
          current_company?: string | null
          email?: string
          full_name?: string
          github_url?: string | null
          graduation_year?: number | null
          id?: string
          is_alumni?: boolean | null
          job_title?: string | null
          level?: number | null
          linkedin_url?: string | null
          notification_preferences?: any | null
          phone?: string | null
          push_notifications_enabled?: boolean | null
          semester?: number | null
          skills?: string[] | null
          updated_at?: string
          user_id?: string
          xp_points?: number | null
        }
        Relationships: []
      }
      public_event_registrations: {
        Row: {
          check_in_code: string | null
          created_at: string
          email: string
          event_id: string
          full_name: string
          id: string
          message: string | null
          payment_receipt_url: string | null
          payment_status: string | null
          phone: string | null
          team_members: Json | null
          team_name: string | null
        }
        Insert: {
          check_in_code?: string | null
          created_at?: string
          email: string
          event_id: string
          full_name: string
          id?: string
          message?: string | null
          payment_receipt_url?: string | null
          payment_status?: string | null
          phone?: string | null
          team_members?: Json | null
          team_name?: string | null
        }
        Update: {
          check_in_code?: string | null
          created_at?: string
          email?: string
          event_id?: string
          full_name?: string
          id?: string
          message?: string | null
          payment_receipt_url?: string | null
          payment_status?: string | null
          phone?: string | null
          team_members?: Json | null
          team_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          downloads: number | null
          external_url: string | null
          file_url: string | null
          id: string
          language: string | null
          semester: number | null
          subject: string | null
          title: string
          topic: string | null
          type: Database["public"]["Enums"]["resource_type"]
          updated_at: string
          uploaded_by: string | null
          video_url: string | null
          views: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          downloads?: number | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          language?: string | null
          semester?: number | null
          subject?: string | null
          title: string
          topic?: string | null
          type: Database["public"]["Enums"]["resource_type"]
          updated_at?: string
          uploaded_by?: string | null
          video_url?: string | null
          views?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          downloads?: number | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          language?: string | null
          semester?: number | null
          subject?: string | null
          title?: string
          topic?: string | null
          type?: Database["public"]["Enums"]["resource_type"]
          updated_at?: string
          uploaded_by?: string | null
          video_url?: string | null
          views?: number | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
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
          role?: Database["public"]["Enums"]["app_role"]
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
      website_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: string | null
          updated_at?: string
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
      promote_to_admin: { Args: { user_email: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "moderator" | "member"
      course_enrollment_status: "pending" | "approved" | "rejected"
      event_status: "upcoming" | "ongoing" | "completed" | "cancelled"
      resource_type:
      | "study_material"
      | "past_paper"
      | "project"
      | "interview_prep"
      | "article"
      | "video"
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
      app_role: ["admin", "moderator", "member"],
      event_status: ["upcoming", "ongoing", "completed", "cancelled"],
      course_enrollment_status: ["pending", "approved", "rejected"],
      resource_type: [
        "study_material",
        "past_paper",
        "project",
        "interview_prep",
        "article",
        "video",
      ],
    },
  },
} as const
