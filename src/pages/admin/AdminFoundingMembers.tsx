import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Plus, Pencil, Trash2, ArrowLeft, Search,
  Filter,
  User
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface FoundingMember {
  id: string;
  full_name: string;
  role: string;
  avatar_url: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  bio: string | null;
  display_order: number;
  is_active: boolean;
}

export default function AdminFoundingMembers() {
  const [members, setMembers] = useState<FoundingMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { toast } = useToast();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("founding_members")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    navigate("/admin/founding-members/new");
  };

  const handleEdit = (member: FoundingMember) => {
    navigate(`/admin/founding-members/${member.id}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this member?")) return;

    try {
      const { error } = await supabase
        .from("founding_members")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Member deleted successfully" });
      fetchMembers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const activeCount = members.filter((member) => member.is_active).length;

  const filteredMembers = members.filter(
    (m) =>
      m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Founding <span className="italic text-primary">members</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {loading
                ? "Loading the roster."
                : members.length === 0
                  ? "Nobody is on the home page yet."
                  : `${activeCount} of ${members.length} ${members.length === 1 ? "person" : "people"} shown on the home page, in this order.`}
            </p>
          </div>

          <Button
            onClick={handleAdd}
            className="h-9 shrink-0 rounded-md bg-primary px-4 font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="mr-1.5 h-4 w-4" aria-hidden />
            Add member
          </Button>
        </div>

        {/* Search */}
        <div className="group relative max-w-sm">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
            aria-hidden
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or role"
            className="h-9 rounded-md border-border bg-background/60 pl-9 text-sm"
          />
        </div>

        {/* Roster */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-16 text-center">
            <User className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" aria-hidden />
            <h2 className="text-sm font-bold text-foreground">
              {searchQuery ? "No one matches that search" : "No founding members yet"}
            </h2>
            <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
              {searchQuery
                ? "Try a different name or role."
                : "Add the first one and the Founding Members section appears on the home page."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {filteredMembers.map((member, index) => (
              <motion.article
                key={member.id}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.03 }}
                className="group overflow-hidden rounded-lg border border-border bg-card/40 transition-colors focus-within:border-primary/40 hover:border-primary/40"
              >
                {/* The photo is what the public actually sees */}
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt=""
                      loading="lazy"
                      className={`h-full w-full object-cover ${member.is_active ? "" : "opacity-40 grayscale"}`}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/10 text-3xl font-bold uppercase text-primary">
                      {member.full_name.charAt(0)}
                    </div>
                  )}

                  {!member.is_active && (
                    <span className="absolute left-2 top-2 rounded bg-background/90 px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      Not shown
                    </span>
                  )}

                  <div className="absolute right-2 top-2 flex gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => handleEdit(member)}
                      aria-label={`Edit ${member.full_name}`}
                      className="h-7 w-7 rounded-md bg-background/90 hover:text-primary"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => handleDelete(member.id)}
                      aria-label={`Delete ${member.full_name}`}
                      className="h-7 w-7 rounded-md bg-background/90 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  </div>
                </div>

                {/* Position is the one number that changes what visitors see */}
                <div className="flex items-baseline gap-3 p-3">
                  <span className="text-sm font-bold tabular-nums text-primary">
                    {member.display_order}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-[15px] font-semibold capitalize leading-tight text-foreground">
                      {member.full_name}
                    </h2>
                    <p className="truncate text-[13px] capitalize text-muted-foreground">
                      {member.role}
                    </p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>

    </AdminLayout>
  );
}
