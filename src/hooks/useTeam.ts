import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
}

export const useTeam = () => {
  const { profile } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeamMembers = async () => {
    if (!profile?.company_id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setTeamMembers(data as TeamMember[]);
    } catch (error) {
      console.error("Error fetching team members:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateMemberStatus = async (memberId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ is_active: isActive })
        .eq("id", memberId);

      if (error) throw error;

      await fetchTeamMembers();
      return true;
    } catch (error) {
      console.error("Error updating member status:", error);
      return false;
    }
  };

  const updateMemberRole = async (memberId: string, role: string) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ role })
        .eq("id", memberId);

      if (error) throw error;

      await fetchTeamMembers();
      return true;
    } catch (error) {
      console.error("Error updating member role:", error);
      return false;
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, [profile?.company_id]);

  return {
    teamMembers,
    loading,
    updateMemberStatus,
    updateMemberRole,
    refetch: fetchTeamMembers,
  };
};
