export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      class_schedules: {
        Row: {
          canonical_program_name: string | null
          category_primary: string | null
          comparison_key: string | null
          confidence: number | null
          created_at: string
          duration_minutes: number | null
          end_time: string
          extracted_at: string | null
          id: string
          instructor_name: string | null
          location_id: string
          match_method: string | null
          needs_review: boolean
          normalized_text: string | null
          program_brand: string | null
          program_id: string
          raw_program_name: string
          source_page_url: string | null
          source_snapshot_id: string | null
          start_time: string
          studio_name: string | null
          tags: string[] | null
          updated_at: string
          valid_from: string | null
          valid_to: string | null
          weekday: string
        }
        Insert: {
          canonical_program_name?: string | null
          category_primary?: string | null
          comparison_key?: string | null
          confidence?: number | null
          created_at?: string
          duration_minutes?: number | null
          end_time: string
          extracted_at?: string | null
          id?: string
          instructor_name?: string | null
          location_id: string
          match_method?: string | null
          needs_review?: boolean
          normalized_text?: string | null
          program_brand?: string | null
          program_id: string
          raw_program_name: string
          source_page_url?: string | null
          source_snapshot_id?: string | null
          start_time: string
          studio_name?: string | null
          tags?: string[] | null
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          weekday: string
        }
        Update: {
          canonical_program_name?: string | null
          category_primary?: string | null
          comparison_key?: string | null
          confidence?: number | null
          created_at?: string
          duration_minutes?: number | null
          end_time?: string
          extracted_at?: string | null
          id?: string
          instructor_name?: string | null
          location_id?: string
          match_method?: string | null
          needs_review?: boolean
          normalized_text?: string | null
          program_brand?: string | null
          program_id?: string
          raw_program_name?: string
          source_page_url?: string | null
          source_snapshot_id?: string | null
          start_time?: string
          studio_name?: string | null
          tags?: string[] | null
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          weekday?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_schedules_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "gym_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_schedules_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      discipline_equipment_requirements: {
        Row: {
          created_at: string
          discipline_id: string
          display_order: number
          equipment_type_id: string
          notes: string | null
          requirement_level: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          discipline_id: string
          display_order?: number
          equipment_type_id: string
          notes?: string | null
          requirement_level: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          discipline_id?: string
          display_order?: number
          equipment_type_id?: string
          notes?: string | null
          requirement_level?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discipline_equipment_requirements_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "published_training_discipline_summary"
            referencedColumns: ["discipline_id"]
          },
          {
            foreignKeyName: "discipline_equipment_requirements_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "training_disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipline_equipment_requirements_equipment_type_id_fkey"
            columns: ["equipment_type_id"]
            isOneToOne: false
            referencedRelation: "equipment_types"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_types: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      gym_brands: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          official_url: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          official_url?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          official_url?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      gym_locations: {
        Row: {
          address_line: string | null
          brand_id: string
          city: string | null
          created_at: string
          id: string
          is_active: boolean
          last_verified_at: string | null
          latitude: number | null
          location_type: string | null
          longitude: number | null
          name: string
          nearest_station: string | null
          official_url: string | null
          postal_code: string | null
          prefecture: string | null
          slug: string
          source_url: string | null
          updated_at: string
        }
        Insert: {
          address_line?: string | null
          brand_id: string
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_verified_at?: string | null
          latitude?: number | null
          location_type?: string | null
          longitude?: number | null
          name: string
          nearest_station?: string | null
          official_url?: string | null
          postal_code?: string | null
          prefecture?: string | null
          slug: string
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          address_line?: string | null
          brand_id?: string
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_verified_at?: string | null
          latitude?: number | null
          location_type?: string | null
          longitude?: number | null
          name?: string
          nearest_station?: string | null
          official_url?: string | null
          postal_code?: string | null
          prefecture?: string | null
          slug?: string
          source_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_locations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "gym_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_location_memberships: {
        Row: {
          authority_source: string
          created_at: string
          location_id: string
          updated_at: string
        }
        Insert: {
          authority_source: string
          created_at?: string
          location_id: string
          updated_at?: string
        }
        Update: {
          authority_source?: string
          created_at?: string
          location_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_location_memberships_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: true
            referencedRelation: "gym_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      ingestion_items: {
        Row: {
          created_at: string
          detected_records: number
          error_message: string | null
          id: string
          inserted_records: number
          raw_output_json: Json | null
          run_id: string
          source_page_id: string | null
          status: string
          updated_records: number
        }
        Insert: {
          created_at?: string
          detected_records?: number
          error_message?: string | null
          id?: string
          inserted_records?: number
          raw_output_json?: Json | null
          run_id: string
          source_page_id?: string | null
          status: string
          updated_records?: number
        }
        Update: {
          created_at?: string
          detected_records?: number
          error_message?: string | null
          id?: string
          inserted_records?: number
          raw_output_json?: Json | null
          run_id?: string
          source_page_id?: string | null
          status?: string
          updated_records?: number
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_items_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "ingestion_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingestion_items_source_page_id_fkey"
            columns: ["source_page_id"]
            isOneToOne: false
            referencedRelation: "source_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      ingestion_runs: {
        Row: {
          failed_count: number
          finished_at: string | null
          id: string
          logs_json: Json | null
          started_at: string
          status: string
          success_count: number
          total_sources: number
          trigger_type: string
          warning_count: number
        }
        Insert: {
          failed_count?: number
          finished_at?: string | null
          id?: string
          logs_json?: Json | null
          started_at?: string
          status: string
          success_count?: number
          total_sources?: number
          trigger_type: string
          warning_count?: number
        }
        Update: {
          failed_count?: number
          finished_at?: string | null
          id?: string
          logs_json?: Json | null
          started_at?: string
          status?: string
          success_count?: number
          total_sources?: number
          trigger_type?: string
          warning_count?: number
        }
        Relationships: []
      }
      location_equipment: {
        Row: {
          access_mode: string
          availability_state: string
          created_at: string
          equipment_type_id: string
          id: string
          last_confirmed_at: string | null
          location_id: string
          notes: string | null
          quantity: number | null
          reservation_requirement: string
          stale_at: string | null
          updated_at: string
          verification_status: string
        }
        Insert: {
          access_mode?: string
          availability_state?: string
          created_at?: string
          equipment_type_id: string
          id?: string
          last_confirmed_at?: string | null
          location_id: string
          notes?: string | null
          quantity?: number | null
          reservation_requirement?: string
          stale_at?: string | null
          updated_at?: string
          verification_status?: string
        }
        Update: {
          access_mode?: string
          availability_state?: string
          created_at?: string
          equipment_type_id?: string
          id?: string
          last_confirmed_at?: string | null
          location_id?: string
          notes?: string | null
          quantity?: number | null
          reservation_requirement?: string
          stale_at?: string | null
          updated_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_equipment_equipment_type_id_fkey"
            columns: ["equipment_type_id"]
            isOneToOne: false
            referencedRelation: "equipment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_equipment_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "gym_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      location_external_identifiers: {
        Row: {
          created_at: string
          external_identifier: string
          id: string
          location_id: string
          metadata_json: Json
          namespace: string
          training_source_id: string | null
          updated_at: string
          verification_status: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          external_identifier: string
          id?: string
          location_id: string
          metadata_json?: Json
          namespace: string
          training_source_id?: string | null
          updated_at?: string
          verification_status?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          external_identifier?: string
          id?: string
          location_id?: string
          metadata_json?: Json
          namespace?: string
          training_source_id?: string | null
          updated_at?: string
          verification_status?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "location_external_identifiers_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "gym_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_external_identifiers_training_source_id_fkey"
            columns: ["training_source_id"]
            isOneToOne: false
            referencedRelation: "training_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      location_training_capabilities: {
        Row: {
          access_mode: string
          availability_state: string
          capability_type_id: string
          created_at: string
          id: string
          last_confirmed_at: string | null
          location_training_discipline_id: string
          notes: string | null
          reservation_requirement: string
          stale_at: string | null
          updated_at: string
          verification_status: string
        }
        Insert: {
          access_mode?: string
          availability_state?: string
          capability_type_id: string
          created_at?: string
          id?: string
          last_confirmed_at?: string | null
          location_training_discipline_id: string
          notes?: string | null
          reservation_requirement?: string
          stale_at?: string | null
          updated_at?: string
          verification_status?: string
        }
        Update: {
          access_mode?: string
          availability_state?: string
          capability_type_id?: string
          created_at?: string
          id?: string
          last_confirmed_at?: string | null
          location_training_discipline_id?: string
          notes?: string | null
          reservation_requirement?: string
          stale_at?: string | null
          updated_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_training_capabilitie_location_training_discipline_fkey"
            columns: ["location_training_discipline_id"]
            isOneToOne: false
            referencedRelation: "location_training_disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_training_capabilities_capability_type_id_fkey"
            columns: ["capability_type_id"]
            isOneToOne: false
            referencedRelation: "training_capability_types"
            referencedColumns: ["id"]
          },
        ]
      }
      location_training_disciplines: {
        Row: {
          created_at: string
          discipline_id: string
          id: string
          last_confirmed_at: string | null
          location_id: string
          notes: string | null
          stale_at: string | null
          support_state: string
          updated_at: string
          verification_status: string
        }
        Insert: {
          created_at?: string
          discipline_id: string
          id?: string
          last_confirmed_at?: string | null
          location_id: string
          notes?: string | null
          stale_at?: string | null
          support_state?: string
          updated_at?: string
          verification_status?: string
        }
        Update: {
          created_at?: string
          discipline_id?: string
          id?: string
          last_confirmed_at?: string | null
          location_id?: string
          notes?: string | null
          stale_at?: string | null
          support_state?: string
          updated_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_training_disciplines_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "published_training_discipline_summary"
            referencedColumns: ["discipline_id"]
          },
          {
            foreignKeyName: "location_training_disciplines_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "training_disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_training_disciplines_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "gym_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      program_aliases: {
        Row: {
          alias_name: string
          created_at: string
          id: string
          program_id: string
        }
        Insert: {
          alias_name: string
          created_at?: string
          id?: string
          program_id: string
        }
        Update: {
          alias_name?: string
          created_at?: string
          id?: string
          program_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_aliases_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_training_disciplines: {
        Row: {
          created_at: string
          discipline_id: string
          last_confirmed_at: string | null
          notes: string | null
          program_id: string
          relation_type: string
          stale_at: string | null
          updated_at: string
          verification_status: string
        }
        Insert: {
          created_at?: string
          discipline_id: string
          last_confirmed_at?: string | null
          notes?: string | null
          program_id: string
          relation_type?: string
          stale_at?: string | null
          updated_at?: string
          verification_status?: string
        }
        Update: {
          created_at?: string
          discipline_id?: string
          last_confirmed_at?: string | null
          notes?: string | null
          program_id?: string
          relation_type?: string
          stale_at?: string | null
          updated_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_training_disciplines_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "published_training_discipline_summary"
            referencedColumns: ["discipline_id"]
          },
          {
            foreignKeyName: "program_training_disciplines_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "training_disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_training_disciplines_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          beginner_friendly: boolean
          category: string | null
          created_at: string
          default_duration_minutes: number | null
          description: string | null
          id: string
          intensity_level: number | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          beginner_friendly?: boolean
          category?: string | null
          created_at?: string
          default_duration_minutes?: number | null
          description?: string | null
          id?: string
          intensity_level?: number | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          beginner_friendly?: boolean
          category?: string | null
          created_at?: string
          default_duration_minutes?: number | null
          description?: string | null
          id?: string
          intensity_level?: number | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      source_pages: {
        Row: {
          created_at: string
          fetch_status: string | null
          format: string | null
          id: string
          last_fetched_at: string | null
          last_parsed_at: string | null
          location_id: string
          notes: string | null
          parse_status: string | null
          parser_key: string | null
          source_type: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          fetch_status?: string | null
          format?: string | null
          id?: string
          last_fetched_at?: string | null
          last_parsed_at?: string | null
          location_id: string
          notes?: string | null
          parse_status?: string | null
          parser_key?: string | null
          source_type: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          fetch_status?: string | null
          format?: string | null
          id?: string
          last_fetched_at?: string | null
          last_parsed_at?: string | null
          location_id?: string
          notes?: string | null
          parse_status?: string | null
          parser_key?: string | null
          source_type?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_pages_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "gym_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      training_affiliations: {
        Row: {
          affiliation_state: string
          affiliation_type: string
          awarding_organization: string
          created_at: string
          discipline_id: string
          external_identifier: string | null
          id: string
          last_confirmed_at: string | null
          location_id: string
          notes: string | null
          stale_at: string | null
          updated_at: string
          valid_from: string | null
          valid_to: string | null
          verification_status: string
        }
        Insert: {
          affiliation_state?: string
          affiliation_type: string
          awarding_organization: string
          created_at?: string
          discipline_id: string
          external_identifier?: string | null
          id?: string
          last_confirmed_at?: string | null
          location_id: string
          notes?: string | null
          stale_at?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          verification_status?: string
        }
        Update: {
          affiliation_state?: string
          affiliation_type?: string
          awarding_organization?: string
          created_at?: string
          discipline_id?: string
          external_identifier?: string | null
          id?: string
          last_confirmed_at?: string | null
          location_id?: string
          notes?: string | null
          stale_at?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_affiliations_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "published_training_discipline_summary"
            referencedColumns: ["discipline_id"]
          },
          {
            foreignKeyName: "training_affiliations_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "training_disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_affiliations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "gym_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      training_capability_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_disciplines: {
        Row: {
          created_at: string
          default_stale_after_days: number
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_stale_after_days?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_stale_after_days?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_evidence: {
        Row: {
          assertion: string
          content_hash: string | null
          created_at: string
          evidence_text: string | null
          id: string
          location_equipment_id: string | null
          location_training_capability_id: string | null
          location_training_discipline_id: string | null
          observed_at: string
          program_training_discipline_discipline_id: string | null
          program_training_discipline_program_id: string | null
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          structured_evidence: Json
          training_affiliation_id: string | null
          training_source_id: string
        }
        Insert: {
          assertion: string
          content_hash?: string | null
          created_at?: string
          evidence_text?: string | null
          id?: string
          location_equipment_id?: string | null
          location_training_capability_id?: string | null
          location_training_discipline_id?: string | null
          observed_at: string
          program_training_discipline_discipline_id?: string | null
          program_training_discipline_program_id?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          structured_evidence?: Json
          training_affiliation_id?: string | null
          training_source_id: string
        }
        Update: {
          assertion?: string
          content_hash?: string | null
          created_at?: string
          evidence_text?: string | null
          id?: string
          location_equipment_id?: string | null
          location_training_capability_id?: string | null
          location_training_discipline_id?: string | null
          observed_at?: string
          program_training_discipline_discipline_id?: string | null
          program_training_discipline_program_id?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          structured_evidence?: Json
          training_affiliation_id?: string | null
          training_source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_evidence_location_equipment_id_fkey"
            columns: ["location_equipment_id"]
            isOneToOne: false
            referencedRelation: "location_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_evidence_location_training_capability_id_fkey"
            columns: ["location_training_capability_id"]
            isOneToOne: false
            referencedRelation: "location_training_capabilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_evidence_location_training_discipline_id_fkey"
            columns: ["location_training_discipline_id"]
            isOneToOne: false
            referencedRelation: "location_training_disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_evidence_program_target_fk"
            columns: [
              "program_training_discipline_program_id",
              "program_training_discipline_discipline_id",
            ]
            isOneToOne: false
            referencedRelation: "program_training_disciplines"
            referencedColumns: ["program_id", "discipline_id"]
          },
          {
            foreignKeyName: "training_evidence_program_target_fk"
            columns: [
              "program_training_discipline_program_id",
              "program_training_discipline_discipline_id",
            ]
            isOneToOne: false
            referencedRelation: "published_program_training_disciplines"
            referencedColumns: ["program_id", "discipline_id"]
          },
          {
            foreignKeyName: "training_evidence_training_affiliation_id_fkey"
            columns: ["training_affiliation_id"]
            isOneToOne: false
            referencedRelation: "training_affiliations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_evidence_training_source_id_fkey"
            columns: ["training_source_id"]
            isOneToOne: false
            referencedRelation: "training_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      training_review_cycles: {
        Row: {
          created_at: string
          cycle_key: string
          cycle_kind: string
          discipline_id: string
          id: string
          location_id: string
          notes: string | null
          protocol_id: string
          reviewed_at: string
          reviewer_authority: string
          supersedes_review_cycle_id: string | null
          supersession_reason: string | null
        }
        Insert: {
          created_at?: string
          cycle_key: string
          cycle_kind?: string
          discipline_id: string
          id?: string
          location_id: string
          notes?: string | null
          protocol_id: string
          reviewed_at: string
          reviewer_authority: string
          supersedes_review_cycle_id?: string | null
          supersession_reason?: string | null
        }
        Update: {
          created_at?: string
          cycle_key?: string
          cycle_kind?: string
          discipline_id?: string
          id?: string
          location_id?: string
          notes?: string | null
          protocol_id?: string
          reviewed_at?: string
          reviewer_authority?: string
          supersedes_review_cycle_id?: string | null
          supersession_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_review_cycles_discipline_fk"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "training_disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_review_cycles_location_fk"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "gym_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_review_cycles_protocol_discipline_fk"
            columns: ["protocol_id", "discipline_id"]
            isOneToOne: false
            referencedRelation: "training_review_protocols"
            referencedColumns: ["id", "discipline_id"]
          },
          {
            foreignKeyName: "training_review_cycles_supersedes_same_scope_fk"
            columns: ["supersedes_review_cycle_id", "location_id", "discipline_id"]
            isOneToOne: false
            referencedRelation: "training_review_cycles"
            referencedColumns: ["id", "location_id", "discipline_id"]
          },
        ]
      }
      training_review_dimensions: {
        Row: {
          created_at: string
          discipline_id: string
          display_order: number
          dimension_kind: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          discipline_id: string
          display_order?: number
          dimension_kind: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          discipline_id?: string
          display_order?: number
          dimension_kind?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_review_dimensions_discipline_fk"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "training_disciplines"
            referencedColumns: ["id"]
          },
        ]
      }
      training_review_invalidations: {
        Row: {
          created_at: string
          details: string | null
          discipline_id: string
          id: string
          invalidated_at: string
          invalidation_authority: string
          invalidation_key: string
          reason_code: string
          replacement_protocol_id: string | null
          review_unit_id: string
          training_source_id: string | null
        }
        Insert: {
          created_at?: string
          details?: string | null
          discipline_id: string
          id?: string
          invalidated_at: string
          invalidation_authority: string
          invalidation_key: string
          reason_code: string
          replacement_protocol_id?: string | null
          review_unit_id: string
          training_source_id?: string | null
        }
        Update: {
          created_at?: string
          details?: string | null
          discipline_id?: string
          id?: string
          invalidated_at?: string
          invalidation_authority?: string
          invalidation_key?: string
          reason_code?: string
          replacement_protocol_id?: string | null
          review_unit_id?: string
          training_source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_review_invalidations_protocol_discipline_fk"
            columns: ["replacement_protocol_id", "discipline_id"]
            isOneToOne: false
            referencedRelation: "training_review_protocols"
            referencedColumns: ["id", "discipline_id"]
          },
          {
            foreignKeyName: "training_review_invalidations_source_fk"
            columns: ["training_source_id"]
            isOneToOne: false
            referencedRelation: "training_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_review_invalidations_unit_discipline_fk"
            columns: ["review_unit_id", "discipline_id"]
            isOneToOne: false
            referencedRelation: "training_review_units"
            referencedColumns: ["id", "discipline_id"]
          },
        ]
      }
      training_review_protocols: {
        Row: {
          authority_commit_sha: string
          authority_document_path: string
          authority_document_sha256: string
          authority_matrix_path: string
          authority_matrix_sha256: string
          created_at: string
          discipline_id: string
          id: string
          protocol_key: string
          protocol_version: string
        }
        Insert: {
          authority_commit_sha: string
          authority_document_path: string
          authority_document_sha256: string
          authority_matrix_path: string
          authority_matrix_sha256: string
          created_at?: string
          discipline_id: string
          id?: string
          protocol_key: string
          protocol_version: string
        }
        Update: {
          authority_commit_sha?: string
          authority_document_path?: string
          authority_document_sha256?: string
          authority_matrix_path?: string
          authority_matrix_sha256?: string
          created_at?: string
          discipline_id?: string
          id?: string
          protocol_key?: string
          protocol_version?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_review_protocols_discipline_fk"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "training_disciplines"
            referencedColumns: ["id"]
          },
        ]
      }
      training_review_unit_sources: {
        Row: {
          binding_basis: string | null
          created_at: string
          facility_binding: string
          id: string
          notes: string | null
          observed_at: string
          review_unit_id: string
          reviewed_at: string
          source_availability_state_at_review: string
          source_class: string
          source_content_hash_at_review: string | null
          sufficiency_role: string
          training_source_id: string
        }
        Insert: {
          binding_basis?: string | null
          created_at?: string
          facility_binding: string
          id?: string
          notes?: string | null
          observed_at: string
          review_unit_id: string
          reviewed_at: string
          source_availability_state_at_review: string
          source_class: string
          source_content_hash_at_review?: string | null
          sufficiency_role: string
          training_source_id: string
        }
        Update: {
          binding_basis?: string | null
          created_at?: string
          facility_binding?: string
          id?: string
          notes?: string | null
          observed_at?: string
          review_unit_id?: string
          reviewed_at?: string
          source_availability_state_at_review?: string
          source_class?: string
          source_content_hash_at_review?: string | null
          sufficiency_role?: string
          training_source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_review_unit_sources_source_fk"
            columns: ["training_source_id"]
            isOneToOne: false
            referencedRelation: "training_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_review_unit_sources_unit_fk"
            columns: ["review_unit_id"]
            isOneToOne: false
            referencedRelation: "training_review_units"
            referencedColumns: ["id"]
          },
        ]
      }
      training_review_units: {
        Row: {
          coverage_expires_at: string | null
          created_at: string
          discipline_id: string
          freshness_policy_key_at_review: string | null
          id: string
          notes: string | null
          positive_outcome: string
          review_aspect: string
          review_cycle_id: string
          review_dimension_id: string
          review_progress: string
          source_sufficiency: string
        }
        Insert: {
          coverage_expires_at?: string | null
          created_at?: string
          discipline_id: string
          freshness_policy_key_at_review?: string | null
          id?: string
          notes?: string | null
          positive_outcome: string
          review_aspect: string
          review_cycle_id: string
          review_dimension_id: string
          review_progress: string
          source_sufficiency: string
        }
        Update: {
          coverage_expires_at?: string | null
          created_at?: string
          discipline_id?: string
          freshness_policy_key_at_review?: string | null
          id?: string
          notes?: string | null
          positive_outcome?: string
          review_aspect?: string
          review_cycle_id?: string
          review_dimension_id?: string
          review_progress?: string
          source_sufficiency?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_review_units_cycle_discipline_fk"
            columns: ["review_cycle_id", "discipline_id"]
            isOneToOne: false
            referencedRelation: "training_review_cycles"
            referencedColumns: ["id", "discipline_id"]
          },
          {
            foreignKeyName: "training_review_units_dimension_discipline_fk"
            columns: ["review_dimension_id", "discipline_id"]
            isOneToOne: false
            referencedRelation: "training_review_dimensions"
            referencedColumns: ["id", "discipline_id"]
          },
        ]
      }
      training_sources: {
        Row: {
          availability_state: string
          canonical_url: string | null
          content_hash: string | null
          created_at: string
          id: string
          last_changed_at: string | null
          last_checked_at: string | null
          location_id: string | null
          metadata_json: Json
          publisher_authority: string
          review_required: boolean
          source_kind: string
          unavailable_since: string | null
          updated_at: string
          url: string
        }
        Insert: {
          availability_state?: string
          canonical_url?: string | null
          content_hash?: string | null
          created_at?: string
          id?: string
          last_changed_at?: string | null
          last_checked_at?: string | null
          location_id?: string | null
          metadata_json?: Json
          publisher_authority: string
          review_required?: boolean
          source_kind: string
          unavailable_since?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          availability_state?: string
          canonical_url?: string | null
          content_hash?: string | null
          created_at?: string
          id?: string
          last_changed_at?: string | null
          last_checked_at?: string | null
          location_id?: string | null
          metadata_json?: Json
          publisher_authority?: string
          review_required?: boolean
          source_kind?: string
          unavailable_since?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_sources_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "gym_locations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      current_class_schedules: {
        Row: {
          canonical_program_name: string | null
          category_primary: string | null
          comparison_key: string | null
          confidence: number | null
          created_at: string | null
          duration_minutes: number | null
          end_time: string | null
          extracted_at: string | null
          id: string | null
          instructor_name: string | null
          location_id: string | null
          match_method: string | null
          needs_review: boolean | null
          normalized_text: string | null
          program_brand: string | null
          program_id: string | null
          raw_program_name: string | null
          source_page_url: string | null
          source_snapshot_id: string | null
          start_time: string | null
          studio_name: string | null
          tags: string[] | null
          updated_at: string | null
          valid_from: string | null
          valid_to: string | null
          weekday: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_schedules_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "gym_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_schedules_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      published_location_equipment: {
        Row: {
          access_mode: string | null
          equipment_slug: string | null
          equipment_type_id: string | null
          last_confirmed_at: string | null
          location_id: string | null
          quantity: number | null
          reservation_requirement: string | null
          stale_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "location_equipment_equipment_type_id_fkey"
            columns: ["equipment_type_id"]
            isOneToOne: false
            referencedRelation: "equipment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_equipment_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "gym_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      published_location_training_capabilities: {
        Row: {
          access_mode: string | null
          availability_state: string | null
          capability_slug: string | null
          capability_type_id: string | null
          discipline_id: string | null
          last_confirmed_at: string | null
          location_id: string | null
          reservation_requirement: string | null
          stale_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "location_training_capabilities_capability_type_id_fkey"
            columns: ["capability_type_id"]
            isOneToOne: false
            referencedRelation: "training_capability_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_training_disciplines_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "published_training_discipline_summary"
            referencedColumns: ["discipline_id"]
          },
          {
            foreignKeyName: "location_training_disciplines_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "training_disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_training_disciplines_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "gym_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      published_location_training_disciplines: {
        Row: {
          discipline_id: string | null
          discipline_slug: string | null
          last_confirmed_at: string | null
          location_id: string | null
          stale_at: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "location_training_disciplines_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "published_training_discipline_summary"
            referencedColumns: ["discipline_id"]
          },
          {
            foreignKeyName: "location_training_disciplines_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "training_disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_training_disciplines_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "gym_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      published_program_training_disciplines: {
        Row: {
          discipline_id: string | null
          discipline_slug: string | null
          last_confirmed_at: string | null
          program_id: string | null
          relation_type: string | null
          stale_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_training_disciplines_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "published_training_discipline_summary"
            referencedColumns: ["discipline_id"]
          },
          {
            foreignKeyName: "program_training_disciplines_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "training_disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_training_disciplines_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      published_training_affiliations: {
        Row: {
          affiliation_type: string | null
          awarding_organization: string | null
          discipline_id: string | null
          discipline_slug: string | null
          external_identifier: string | null
          is_official: boolean | null
          last_confirmed_at: string | null
          location_id: string | null
          stale_at: string | null
          valid_from: string | null
          valid_to: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_affiliations_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "published_training_discipline_summary"
            referencedColumns: ["discipline_id"]
          },
          {
            foreignKeyName: "training_affiliations_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "training_disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_affiliations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "gym_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      published_training_discipline_summary: {
        Row: {
          discipline_id: string | null
          last_modified_at: string | null
          name: string | null
          official_location_count: number | null
          published_location_count: number | null
          slug: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      favorite_lesson_class_schedule_week: {
        Args: {
          p_area?: string
          p_limit?: number
          p_program_ids?: string[]
          p_start_weekday?: number
        }
        Returns: {
          latest_schedule_update: string
          result_order: number
          schedule_id: string
          total_count: number
        }[]
      }
      favorite_class_schedule_week: {
        Args: {
          p_area?: string
          p_limit?: number
          p_program_ids?: string[]
          p_start_weekday?: number
        }
        Returns: {
          latest_schedule_update: string
          result_order: number
          schedule_id: string
          total_count: number
        }[]
      }
      get_latest_schedule_periods_by_location: {
        Args: never
        Returns: {
          latest_valid_from: string
          location_id: string
        }[]
      }
      get_lesson_latest_schedule_periods_by_location: {
        Args: never
        Returns: {
          latest_valid_from: string
          location_id: string
        }[]
      }
      get_lesson_popular_program_summary: {
        Args: never
        Returns: {
          beginner_friendly: boolean
          category: string
          created_at: string
          default_duration_minutes: number
          description: string
          id: string
          intensity_level: number
          name: string
          schedule_count: number
          slug: string
          updated_at: string
        }[]
      }
      get_popular_program_summary: {
        Args: never
        Returns: {
          beginner_friendly: boolean
          category: string
          created_at: string
          default_duration_minutes: number
          description: string
          id: string
          intensity_level: number
          name: string
          schedule_count: number
          slug: string
          updated_at: string
        }[]
      }
      search_class_schedule_page: {
        Args: {
          p_area?: string
          p_brand?: string
          p_canonical_names?: string[]
          p_duration_range?: string
          p_limit?: number
          p_offset?: number
          p_program_brands?: string[]
          p_query?: string
          p_query_compact?: string
          p_time_range?: string
          p_weekday?: string
        }
        Returns: {
          latest_schedule_update: string
          result_order: number
          schedule_id: string
          total_count: number
        }[]
      }
      search_lesson_class_schedule_page: {
        Args: {
          p_area?: string
          p_brand?: string
          p_canonical_names?: string[]
          p_duration_range?: string
          p_limit?: number
          p_offset?: number
          p_program_brands?: string[]
          p_query?: string
          p_query_compact?: string
          p_time_range?: string
          p_weekday?: string
        }
        Returns: {
          latest_schedule_update: string
          result_order: number
          schedule_id: string
          total_count: number
        }[]
      }
      search_structured_lesson_class_schedule_page: {
        Args: {
          p_brand?: string
          p_canonical_names?: string[]
          p_duration_range?: string
          p_limit?: number
          p_municipality?: string
          p_offset?: number
          p_prefecture?: string
          p_program_brands?: string[]
          p_query?: string
          p_query_compact?: string
          p_time_range?: string
          p_weekday?: string
        }
        Returns: {
          latest_schedule_update: string
          result_order: number
          schedule_id: string
          total_count: number
        }[]
      }
      search_training_locations: {
        Args: {
          p_capability_slugs?: string[]
          p_city?: string
          p_discipline_slug: string
          p_equipment_slugs?: string[]
          p_has_class?: boolean
          p_limit?: number
          p_official_only?: boolean
          p_offset?: number
          p_prefecture?: string
        }
        Returns: {
          address: string
          brand_id: string
          brand_name: string
          capability_slugs: string[]
          city: string
          class_available: boolean
          equipment_slugs: string[]
          last_confirmed_at: string
          latitude: number
          location_id: string
          location_name: string
          location_slug: string
          longitude: number
          official: boolean
          open_training_available: boolean
          prefecture: string
          total_count: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
