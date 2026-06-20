export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          plan_id: string
          name: string
          status: 'trial' | 'active' | 'suspended'
          domain: string | null
          website_url: string | null
          short_id: string | null
          plan_type: string | null
          secondary_axis_name: string | null
          kpi_secondary_axis_name: string | null
          secondary_axis_size_kpi_id: string | null
          addon_labor_analytics: boolean
          manual_ai_runs_used_this_month: number
          trial_expires_at: string | null
          survey_deadline_day: number | null
          industry: string | null
          size_category: 'micro' | 'small' | 'medium' | 'large' | null
          fiscal_year_start_month: number | null
          anomaly_threshold_absolute: number | null
          anomaly_threshold_drop: number | null
          anomaly_threshold_gap: number | null
          created_at: string
          updated_at: string
        }
        Insert: { /* omit for brevity */ }
        Update: { /* omit for brevity */ }
      }
      users: {
        Row: {
          id: string
          company_id: string | null
          role: 'super_admin' | 'admin' | 'executive' | 'manager' | 'player' | 'partner'
          department_id: string | null
          display_name: string | null
          email: string | null
          slack_user_id: string | null
          axis_id: string | null
          created_at: string
        }
      }
      departments: {
        Row: {
          id: string
          company_id: string | null
          name: string
          headcount: number | null
          sort_order: number | null
          created_at: string
        }
      }
      kpi_definitions: {
        Row: {
          id: string
          company_id: string | null
          name: string
          description: string | null
          unit: string | null
          target_default: number | null
          is_higher_better: boolean
          owner_department_id: string | null
          owner_dept_id: string | null
          is_revenue: boolean
          is_main: boolean
          is_secondary_size_metric: boolean
          is_public_to_players: boolean
          sort_order: number | null
          created_at: string
        }
      }
      executive_monthly_focus: {
        Row: {
          id: string
          company_id: string
          month: string  // YYYY-MM
          title: string
          content: string
          created_at: string
          updated_at: string
          created_by: string | null
        }
      }
      kpi_records: {
        Row: {
          id: string
          kpi_definition_id: string | null
          company_id: string | null
          department_id: string | null
          axis_id: string | null
          recorded_month: string
          value: number
          target_value: number
          user_id: string | null
          created_at: string
        }
      }
      kpi_axes: {
        Row: {
          id: string
          company_id: string | null
          name: string
          headcount: number | null
          sort_order: number | null
          created_at: string
        }
      }
      survey_responses: {
        Row: {
          id: string
          company_id: string | null
          user_id: string | null
          department_id: string | null
          axis_id: string | null
          recorded_month: string
          free_comment: string | null
          cross_dept_feedback: string | null
          fingerprint: string | null
          bottleneck_tags: string | null
          related_kpi: string | null
          submitted_at: string | null
          created_at: string
        }
      }
      survey_answers: {
        Row: {
          id: string
          response_id: string | null
          question_id: number | null
          score: number
        }
      }
      semantic_layers: {
        Row: {
          id: string
          company_id: string | null
          content: string
          valid_from: string | null
          created_at: string
        }
      }
      ai_insights: {
        Row: {
          id: string
          company_id: string | null
          target_month: string | null
          insight_type: string | null
          content: Json | any
          model_used: string | null
          created_at: string
        }
      }
      action_items: {
        Row: {
          id: string
          company_id: string | null
          department_id: string | null
          title: string
          description: string | null
          priority: 'urgent' | 'high' | 'normal'
          is_ai_generated: boolean
          status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'kept' | 'under_review'
          is_archived: boolean
          archived_at: string | null
          created_at: string
        }
      }
      resource_records: {
        Row: {
          id: string
          company_id: string | null
          department_id: string | null
          axis_id: string | null
          recorded_month: string
          head_count: number
          labor_cost: number | null
          created_at: string
        }
      }
      invitations: {
        Row: {
          id: string
          company_id: string | null
          inviter_id: string | null
          email: string
          role: 'super_admin' | 'admin' | 'executive' | 'manager' | 'player' | 'partner' | null
          department_id: string | null
          axis_id: string | null
          slack_user_id: string | null
          token: string
          status: string | null
          deleted_at: string | null
          created_at: string
        }
      }
      admin_activity_logs: {
        Row: {
          id: string
          admin_id: string | null
          target_company_id: string | null
          action_type: string
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id?: string | null
          target_company_id?: string | null
          action_type: string
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string | null
          target_company_id?: string | null
          action_type?: string
          details?: Json | null
          created_at?: string
        }
      }
      plans: {
        Row: {
          id: string
          name: string
          max_departments: number
          max_kpis: number
          max_headcount: number
          ai_analysis_frequency: number
          ai_insight_depth: string
          retention_period_months: number
          enable_second_axis: boolean
          enable_slack: boolean
          enable_labor_analytics: boolean
          enable_pdf_export: boolean
          ai_badge_frequency: 'monthly' | 'weekly'
          manual_ai_runs_per_month: number
          extra_member_unit: number | null
          extra_member_price: number | null
          trial_duration_days: number | null
          created_at: string
        }
      }
      manager_directive_notes: {
        Row: {
          id: string
          company_id: string
          department_id: string
          manager_user_id: string
          month: string
          focus_id: string | null
          note: string
          created_at: string
          updated_at: string
        }
      }
      dept_ai_summaries: {
        Row: {
          id: string
          company_id: string
          department_id: string
          month: string
          topics: { title: string; sentiment: 'positive' | 'negative' | 'neutral'; count: number }[]
          positive_summary: string
          negative_summary: string
          manager_hint: string
          deep_dive: string | null
          generated_at: string
        }
      }
      dept_action_plans: {
        Row: {
          id: string
          company_id: string
          department_id: string
          manager_user_id: string | null
          month: string
          title: string
          description: string | null
          source: 'manual' | 'ai_proposed'
          status: 'proposed' | 'accepted' | 'in_progress' | 'done' | 'dismissed'
          is_shared_with_players: boolean
          created_at: string
          updated_at: string
        }
      }
      notifications: {
        Row: {
          id: string
          company_id: string
          user_id: string | null
          target_role: string | null
          target_department_id: string | null
          type: string
          title: string
          body: string | null
          link: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          user_id?: string | null
          target_role?: string | null
          target_department_id?: string | null
          type: string
          title: string
          body?: string | null
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          user_id?: string | null
          target_role?: string | null
          target_department_id?: string | null
          type?: string
          title?: string
          body?: string | null
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
    }
  }
}

// 便利なように各テーブルのRow型をexportしておく
export type Company = Database['public']['Tables']['companies']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Department = Database['public']['Tables']['departments']['Row']
export type KpiDefinition = Database['public']['Tables']['kpi_definitions']['Row']
export type KpiRecord = Database['public']['Tables']['kpi_records']['Row']
export type KpiAxis = Database['public']['Tables']['kpi_axes']['Row']
export type SurveyResponse = Database['public']['Tables']['survey_responses']['Row']
export type SurveyAnswer = Database['public']['Tables']['survey_answers']['Row']
export type SemanticLayer = Database['public']['Tables']['semantic_layers']['Row']
export type AiInsight = Database['public']['Tables']['ai_insights']['Row']
export type ActionItem = Database['public']['Tables']['action_items']['Row']
export type ResourceRecord = Database['public']['Tables']['resource_records']['Row']
export type Invitation = Database['public']['Tables']['invitations']['Row']
export type AdminActivityLog = Database['public']['Tables']['admin_activity_logs']['Row']
export type Plan = Database['public']['Tables']['plans']['Row']
export type ExecutiveMonthlyFocus = Database['public']['Tables']['executive_monthly_focus']['Row']
export type ManagerDirectiveNote = Database['public']['Tables']['manager_directive_notes']['Row']
export type DeptAiSummary = Database['public']['Tables']['dept_ai_summaries']['Row']
export type DeptActionPlan = Database['public']['Tables']['dept_action_plans']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
