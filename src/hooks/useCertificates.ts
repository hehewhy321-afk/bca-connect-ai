import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Certificate {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    category_id: string | null;
    template_id: string | null;
    signature_id: string | null;
    event_date: string;
    issue_date: string;
    verification_code: string;
    certificate_data: any;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    category?: {
        name: string;
        icon: string;
    };
    template?: {
        name: string;
        type: string;
    };
    signature?: {
        name: string;
        title: string;
        signature_url: string;
    };
    user?: {
        full_name: string;
        email: string;
    };
}

export interface CertificateCategory {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
}

export interface CertificateSignature {
    id: string;
    name: string;
    title: string;
    signature_url: string;
    is_default: boolean;
}

export interface CertificateTemplate {
    id: string;
    name: string;
    type: "sports" | "code";
    description: string | null;
    is_active: boolean;
}

// Fetch user's certificates
export function useCertificates(filters?: {
    category?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
}) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["certificates", user?.id, filters],
        queryFn: async () => {
            if (!user) throw new Error("Not authenticated");

            let query = (supabase as any)
                .from("certificates")
                .select(`
          *,
          category:certificate_categories(*),
          template:certificate_templates(*),
          signature:certificate_signatures(*)
        `)
                .eq("user_id", user.id)
                .order("event_date", { ascending: false }) as any;

            if (filters?.category) {
                query = query.eq("category_id", filters.category);
            }

            if (filters?.startDate) {
                query = query.gte("event_date", filters.startDate);
            }

            if (filters?.endDate) {
                query = query.lte("event_date", filters.endDate);
            }

            if (filters?.search) {
                query = query.ilike("title", `%${filters.search}%`);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as Certificate[];
        },
        enabled: !!user,
    });
}

// Fetch all certificates (admin only)
export function useAllCertificates(filters?: {
    category?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
}) {
    return useQuery({
        queryKey: ["all-certificates", filters],
        queryFn: async () => {
            // Step 1: Fetch certificates without the problematic join
            let query = (supabase as any)
                .from("certificates")
                .select(`
          *,
          category:certificate_categories(*),
          template:certificate_templates(*),
          signature:certificate_signatures(*)
        `)
                .order("created_at", { ascending: false }) as any;

            if (filters?.category) {
                query = query.eq("category_id", filters.category);
            }

            if (filters?.startDate) {
                query = query.gte("event_date", filters.startDate);
            }

            if (filters?.endDate) {
                query = query.lte("event_date", filters.endDate);
            }

            // Note: Search on user name won't work perfectly in this step if filtering by user, 
            // but we can filter the results in memory if needed. 
            // For now, let's keep title search.
            if (filters?.search) {
                query = query.ilike("title", `%${filters.search}%`);
            }

            const { data: certData, error: certError } = await query;
            if (certError) throw certError;

            // Step 2: Fetch profiles for these certificates manually (Client-Side Join)
            // robust against FK naming issues
            const certs = certData as any[];
            const userIds = Array.from(new Set(certs.map((c) => c.user_id).filter(Boolean)));

            let profilesMap: Record<string, any> = {};

            if (userIds.length > 0) {
                const { data: profiles, error: profilesError } = await (supabase as any)
                    .from("profiles")
                    .select("user_id, full_name, email")
                    .in("user_id", userIds);

                if (!profilesError && profiles) {
                    profilesMap = profiles.reduce((acc, profile) => {
                        acc[profile.user_id] = profile;
                        return acc;
                    }, {} as Record<string, any>);
                }
            }

            // Step 3: Merge data
            const joinedData = certData.map((cert) => ({
                ...cert,
                user: profilesMap[cert.user_id] || { full_name: "Unknown User", email: "" }
            }));

            // Step 4: Apply client-side search if needed (since we couldn't filter by user name in DB)
            if (filters?.search) {
                const term = filters.search.toLowerCase();
                return joinedData.filter(cert =>
                    cert.title.toLowerCase().includes(term) ||
                    cert.user?.full_name?.toLowerCase().includes(term) ||
                    cert.user?.email?.toLowerCase().includes(term)
                ) as Certificate[];
            }

            return joinedData as Certificate[];
        },
    });
}

// Fetch certificate categories
export function useCertificateCategories() {
    return useQuery({
        queryKey: ["certificate-categories"],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("certificate_categories")
                .select("*")
                .order("name") as any;

            if (error) throw error;
            return data as CertificateCategory[];
        },
    });
}

// Fetch certificate signatures
export function useCertificateSignatures() {
    return useQuery({
        queryKey: ["certificate-signatures"],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("certificate_signatures")
                .select("*")
                .order("is_default", { ascending: false }) as any;

            if (error) throw error;
            return data as CertificateSignature[];
        },
    });
}

// Fetch certificate templates
export function useCertificateTemplates() {
    return useQuery({
        queryKey: ["certificate-templates"],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("certificate_templates")
                .select("*")
                .eq("is_active", true)
                .order("name") as any;

            if (error) throw error;
            return data as CertificateTemplate[];
        },
    });
}

// Create certificate
export function useCreateCertificate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (certificate: Partial<Certificate>) => {
            const { data, error } = await (supabase as any)
                .from("certificates")
                .insert(certificate)
                .select(`
          *,
          category:certificate_categories(*),
          template:certificate_templates(*),
          signature:certificate_signatures(*)
        `)
                .single() as any;

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["certificates"] });
            queryClient.invalidateQueries({ queryKey: ["all-certificates"] });
            toast.success("Certificate generated successfully!");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to generate certificate");
        },
    });
}

// Update certificate
export function useUpdateCertificate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            updates,
        }: {
            id: string;
            updates: Partial<Certificate>;
        }) => {
            const { data, error } = await (supabase as any)
                .from("certificates")
                .update(updates)
                .eq("id", id)
                .select()
                .single() as any;

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["certificates"] });
            queryClient.invalidateQueries({ queryKey: ["all-certificates"] });
            toast.success("Certificate updated successfully!");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update certificate");
        },
    });
}

// Delete certificate
export function useDeleteCertificate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase as any)
                .from("certificates")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["certificates"] });
            queryClient.invalidateQueries({ queryKey: ["all-certificates"] });
            toast.success("Certificate deleted successfully!");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete certificate");
        },
    });
}

// Create signature
export function useCreateSignature() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (signature: Partial<CertificateSignature>) => {
            const { data, error } = await (supabase as any)
                .from("certificate_signatures")
                .insert(signature)
                .select()
                .single() as any;

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["certificate-signatures"] });
            toast.success("Signature added successfully!");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to add signature");
        },
    });
}

// Update signature
export function useUpdateSignature() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            updates,
        }: {
            id: string;
            updates: Partial<CertificateSignature>;
        }) => {
            const { data, error } = await (supabase as any)
                .from("certificate_signatures")
                .update(updates)
                .eq("id", id)
                .select()
                .single() as any;

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["certificate-signatures"] });
            toast.success("Signature updated successfully!");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update signature");
        },
    });
}

// Delete signature
export function useDeleteSignature() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase as any)
                .from("certificate_signatures")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["certificate-signatures"] });
            toast.success("Signature deleted successfully!");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete signature");
        },
    });
}
