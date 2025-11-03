import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface PartnerCompany {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  phone: string | null;
  address: string | null;
  deliveryCount?: number;
}

export const usePartners = () => {
  const { profile } = useAuth();
  const [partners, setPartners] = useState<PartnerCompany[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPartners = async () => {
    if (!profile?.company_id) return;

    setLoading(true);
    try {
      // Get partner relationships
      const { data: relationships, error: relError } = await supabase
        .from("company_relationships")
        .select("buyer_company_id")
        .eq("seller_company_id", profile.company_id)
        .eq("status", "ACTIVE");

      if (relError) throw relError;

      if (!relationships || relationships.length === 0) {
        setPartners([]);
        setLoading(false);
        return;
      }

      const companyIds = relationships.map((r) => r.buyer_company_id);

      // Get companies data
      const { data: companies, error: compError } = await supabase
        .from("companies")
        .select("*")
        .in("id", companyIds);

      if (compError) throw compError;

      // Get delivery counts for each company
      const partnersWithCounts = await Promise.all(
        (companies || []).map(async (company) => {
          const { count } = await supabase
            .from("deliveries")
            .select("*", { count: "exact", head: true })
            .eq("seller_company_id", profile.company_id)
            .eq("buyer_company_id", company.id);

          return {
            ...company,
            deliveryCount: count || 0,
          };
        })
      );

      setPartners(partnersWithCounts);
    } catch (error) {
      console.error("Error fetching partners:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [profile?.company_id]);

  const addPartner = async (companyData: Omit<PartnerCompany, "id" | "deliveryCount">) => {
    if (!profile?.company_id) return null;

    try {
      // Check if company already exists by CNPJ
      const { data: existingCompany } = await supabase
        .from("companies")
        .select("*")
        .eq("cnpj", companyData.cnpj)
        .single();

      let companyId: string;

      if (existingCompany) {
        companyId = existingCompany.id;
      } else {
        // Create new company
        const { data: newCompany, error: companyError } = await supabase
          .from("companies")
          .insert({
            name: companyData.name,
            cnpj: companyData.cnpj,
            email: companyData.email,
            phone: companyData.phone,
            address: companyData.address,
            type: "COMPRADOR",
          })
          .select()
          .single();

        if (companyError) throw companyError;
        companyId = newCompany.id;
      }

      // Create relationship
      const { error: relError } = await supabase
        .from("company_relationships")
        .insert({
          seller_company_id: profile.company_id,
          buyer_company_id: companyId,
          status: "ACTIVE",
        });

      if (relError) throw relError;

      await fetchPartners();
      return companyId;
    } catch (error) {
      console.error("Error adding partner:", error);
      throw error;
    }
  };

  return {
    partners,
    loading,
    addPartner,
    refetch: fetchPartners,
  };
};
