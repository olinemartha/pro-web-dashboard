// Types générés depuis le projet Supabase « StageManager » (schéma public).
// À régénérer après chaque migration (outil generate_typescript_types).

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Rel = { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[] }[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.18" };
  public: {
    Tables: {
      admin_actions: {
        Row: { admin_id: string | null; created_at: string; id: string; kind: string; reason: string; target: string };
        Insert: { admin_id?: string | null; created_at?: string; id?: string; kind: string; reason?: string; target: string };
        Update: { admin_id?: string | null; created_at?: string; id?: string; kind?: string; reason?: string; target?: string };
        Relationships: Rel;
      };
      applications: {
        Row: {
          applied_at: string;
          created_at: string;
          history: Json;
          id: string;
          offer_id: string;
          refusal_reason: string | null;
          status: string;
          student_choice: string | null;
          student_id: string;
        };
        Insert: {
          applied_at?: string;
          created_at?: string;
          history?: Json;
          id?: string;
          offer_id: string;
          refusal_reason?: string | null;
          status?: string;
          student_choice?: string | null;
          student_id: string;
        };
        Update: {
          applied_at?: string;
          created_at?: string;
          history?: Json;
          id?: string;
          offer_id?: string;
          refusal_reason?: string | null;
          status?: string;
          student_choice?: string | null;
          student_id?: string;
        };
        Relationships: Rel;
      };
      assignment_decisions: {
        Row: {
          decided_at: string;
          decided_by: string;
          engine_version: string;
          id: string;
          intern_id: string;
          reason: string;
          run_id: string | null;
          service: string;
          service_id: string | null;
          source: string;
        };
        Insert: {
          decided_at?: string;
          decided_by: string;
          engine_version: string;
          id?: string;
          intern_id: string;
          reason?: string;
          run_id?: string | null;
          service: string;
          service_id?: string | null;
          source: string;
        };
        Update: Partial<Database["public"]["Tables"]["assignment_decisions"]["Row"]>;
        Relationships: Rel;
      };
      companies: {
        Row: {
          activities: string;
          address: string;
          city: string;
          created_at: string;
          description: string;
          domains: string;
          email: string;
          hosting: Json | null;
          id: string;
          initials: string;
          legal_refs: string;
          logo_url: string | null;
          name: string;
          phone: string;
          registration: string;
          representative_email: string;
          representative_name: string;
          representative_phone: string;
          representative_role: string;
          sector: string;
          website: string;
        };
        Insert: Partial<Database["public"]["Tables"]["companies"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["companies"]["Row"]>;
        Relationships: Rel;
      };
      expert_runs: {
        Row: {
          created_at: string;
          engine_version: string;
          facts: Json;
          id: string;
          intern_id: string;
          missing_facts: string[];
          proposals: Json;
          rules: Json;
          status: string;
        };
        Insert: Partial<Database["public"]["Tables"]["expert_runs"]["Row"]> & { engine_version: string; intern_id: string; status: string };
        Update: Partial<Database["public"]["Tables"]["expert_runs"]["Row"]>;
        Relationships: Rel;
      };
      interns: {
        Row: {
          application_id: string;
          assignment_reason: string;
          assignment_source: string | null;
          certificate: string;
          company_id: string;
          confirmed: boolean;
          created_at: string;
          decided_at: string | null;
          decided_by: string | null;
          end_date: string | null;
          evaluation: Json | null;
          id: string;
          missions: string;
          objectives: string;
          reports: Json;
          service_id: string | null;
          start_date: string | null;
          supervisor_id: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["interns"]["Row"]> & { application_id: string; company_id: string };
        Update: Partial<Database["public"]["Tables"]["interns"]["Row"]>;
        Relationships: Rel;
      };
      interviews: {
        Row: { application_id: string; created_at: string; date: string; id: string; location: string; status: string; time: string };
        Insert: { application_id: string; created_at?: string; date: string; id?: string; location?: string; status?: string; time: string };
        Update: Partial<Database["public"]["Tables"]["interviews"]["Row"]>;
        Relationships: Rel;
      };
      notifications: {
        Row: { body: string; created_at: string; id: string; kind: string; read: boolean; title: string; user_id: string };
        Insert: { body?: string; created_at?: string; id?: string; kind?: string; read?: boolean; title: string; user_id: string };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
        Relationships: Rel;
      };
      offers: {
        Row: {
          company_id: string;
          created_at: string;
          deadline: string;
          department: string;
          description: string;
          duration: string;
          id: string;
          level: string;
          location: string;
          missions: string[];
          profile: string;
          published: string;
          skills: string[];
          status: string;
          title: string;
          type: string;
        };
        Insert: Partial<Database["public"]["Tables"]["offers"]["Row"]> & { company_id: string; deadline: string; title: string };
        Update: Partial<Database["public"]["Tables"]["offers"]["Row"]>;
        Relationships: Rel;
      };
      profiles: {
        Row: {
          company_id: string | null;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          onboarded: boolean;
          role: string;
          suspended: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { email: string; id: string; role: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: Rel;
      };
      services: {
        Row: {
          company_id: string;
          education: string;
          id: string;
          interns_needed: number;
          name: string;
          profiles: string;
          skills: string[];
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["services"]["Row"]> & { company_id: string; name: string };
        Update: Partial<Database["public"]["Tables"]["services"]["Row"]>;
        Relationships: Rel;
      };
      student_profiles: {
        Row: {
          adresse: string;
          competences: string[];
          cv: Json | null;
          experiences: string;
          faculte: string;
          filiere: string;
          id: string;
          infos: string;
          niveau: string;
          nom: string;
          photo_url: string | null;
          postnom: string;
          prenom: string;
          projets: string;
          telephone: string;
          universite: string;
          updated_at: string;
          visible: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["student_profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["student_profiles"]["Row"]>;
        Relationships: Rel;
      };
      supervisors: {
        Row: {
          capacity: number;
          company_id: string;
          email: string;
          id: string;
          initials: string;
          name: string;
          phone: string;
          role: string;
          service_id: string;
        };
        Insert: Partial<Database["public"]["Tables"]["supervisors"]["Row"]> & { company_id: string; name: string; service_id: string };
        Update: Partial<Database["public"]["Tables"]["supervisors"]["Row"]>;
        Relationships: Rel;
      };
    };
    Views: { [_ in never]: never };
    Functions: { complete_company_onboarding: { Args: { company: Json }; Returns: string } };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicTables = Database["public"]["Tables"];
export type Tables<T extends keyof PublicTables> = PublicTables[T]["Row"];
export type TablesInsert<T extends keyof PublicTables> = PublicTables[T]["Insert"];
export type TablesUpdate<T extends keyof PublicTables> = PublicTables[T]["Update"];
