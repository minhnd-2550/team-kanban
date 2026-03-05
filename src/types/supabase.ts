// Placeholder generated Supabase types.
// Run `pnpm db:types` after `supabase start` to regenerate with real schema.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string
          email: string
          avatar_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
      boards: {
        Row: {
          id: string
          name: string
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: Pick<Database['public']['Tables']['boards']['Row'], 'name' | 'owner_id'>
        Update: Partial<Pick<Database['public']['Tables']['boards']['Row'], 'name'>>
        Relationships: [
          {
            foreignKeyName: 'boards_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      board_members: {
        Row: {
          id: string
          board_id: string
          user_id: string
          role: 'owner' | 'member'
          joined_at: string
        }
        Insert: Omit<Database['public']['Tables']['board_members']['Row'], 'id' | 'joined_at'>
        Update: Partial<Pick<Database['public']['Tables']['board_members']['Row'], 'role'>>
        Relationships: [
          {
            foreignKeyName: 'board_members_board_id_fkey'
            columns: ['board_id']
            isOneToOne: false
            referencedRelation: 'boards'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'board_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      columns: {
        Row: {
          id: string
          board_id: string
          name: string
          position: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['columns']['Row'], 'id' | 'created_at'>
        Update: Partial<Pick<Database['public']['Tables']['columns']['Row'], 'name' | 'position'>>
        Relationships: [
          {
            foreignKeyName: 'columns_board_id_fkey'
            columns: ['board_id']
            isOneToOne: false
            referencedRelation: 'boards'
            referencedColumns: ['id']
          }
        ]
      }
      cards: {
        Row: {
          id: string
          column_id: string
          board_id: string
          title: string
          description: string | null
          assignee_id: string | null
          position: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['cards']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Pick<Database['public']['Tables']['cards']['Row'], 'title' | 'description' | 'assignee_id' | 'column_id' | 'position'>>
        Relationships: [
          {
            foreignKeyName: 'cards_column_id_fkey'
            columns: ['column_id']
            isOneToOne: false
            referencedRelation: 'columns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'cards_board_id_fkey'
            columns: ['board_id']
            isOneToOne: false
            referencedRelation: 'boards'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'cards_assignee_id_fkey'
            columns: ['assignee_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      comments: {
        Row: {
          id: string
          card_id: string
          board_id: string
          author_id: string
          body: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['comments']['Row'], 'id' | 'created_at'>
        Update: Partial<Pick<Database['public']['Tables']['comments']['Row'], 'body'>>
        Relationships: [
          {
            foreignKeyName: 'comments_card_id_fkey'
            columns: ['card_id']
            isOneToOne: false
            referencedRelation: 'cards'
            referencedColumns: ['id']
          }
        ]
      }
      activity_events: {
        Row: {
          id: string
          board_id: string
          actor_id: string
          event_type: string
          card_id: string | null
          card_title_snapshot: string | null
          from_column_id: string | null
          to_column_id: string | null
          from_column_name: string | null
          to_column_name: string | null
          meta: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['activity_events']['Row'], 'id' | 'created_at'>
        Update: Partial<Pick<Database['public']['Tables']['activity_events']['Row'], 'event_type'>>
        Relationships: [
          {
            foreignKeyName: 'activity_events_board_id_fkey'
            columns: ['board_id']
            isOneToOne: false
            referencedRelation: 'boards'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      is_board_member: { Args: { p_board_id: string }; Returns: boolean }
      is_board_owner: { Args: { p_board_id: string }; Returns: boolean }
      create_board: {
        Args: { p_name: string }
        Returns: {
          id: string
          name: string
          owner_id: string
          created_at: string
          updated_at: string
        }
      }
    }
    Enums: Record<string, never>
  }
}

