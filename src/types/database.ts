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
          name: string
          created_at: string
          domain: string | null
          plan_type: string | null
          secondary_axis_name: string | null
          secondary_axis_size_kpi_id: string | null
        }
        Insert: { /* omit for brevity */ }
        Update: { /* omit for brevity */ }
      }
      users: {
        Row: {
          id: string
          company_id: string | null
          role: string
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
          is_main: boolean
          is_secondary_size_metric: boolean
          sort_order: number | null
          created_at: string
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
          email: string
          role: string | null
          department_id: string | null
          token: string
          status: string | null
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
