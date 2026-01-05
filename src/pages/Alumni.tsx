import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Search,
  Building2,
  Briefcase,
  Calendar,
  Github,
  Linkedin,
  Users,
  Filter,
  X,
  MapPin,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Alumni {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  batch: string | null;
  bio: string | null;
  skills: string[] | null;
  github_url: string | null;
  linkedin_url: string | null;
  graduation_year: number | null;
  current_company: string | null;
  job_title: string | null;
  xp_points: number;
  level: number;
}

interface Filters {
  graduationYear: string;
  company: string;
  industry: string;
  location: string;
}

export default function AlumniPage() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    graduationYear: "all",
    company: "all",
    industry: "all",
    location: "all",
  });

  useEffect(() => {
    fetchAlumni();
  }, []);

  const fetchAlumni = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_alumni", true)
        .order("graduation_year", { ascending: false });

      if (error) throw error;
      setAlumni(data || []);
    } catch (error) {
      console.error("Error fetching alumni:", error);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique values for filters
  const filterOptions = useMemo(() => {
    const years = [...new Set(alumni.filter(a => a.graduation_year).map(a => a.graduation_year!))].sort((a, b) => b - a);
    const companies = [...new Set(alumni.filter(a => a.current_company).map(a => a.current_company!))].sort();
    
    // Extract industries from job titles (simplified approach)
    const industries = [...new Set(alumni.filter(a => a.job_title).map(a => {
      const title = a.job_title!.toLowerCase();
      if (title.includes("engineer") || title.includes("developer") || title.includes("programmer")) return "Engineering";
      if (title.includes("design")) return "Design";
      if (title.includes("product")) return "Product";
      if (title.includes("data") || title.includes("analyst")) return "Data & Analytics";
      if (title.includes("manager") || title.includes("lead")) return "Management";
      if (title.includes("marketing")) return "Marketing";
      if (title.includes("sales")) return "Sales";
      return "Other";
    }))].sort();

    // Extract locations from batch (simplified - in real app you'd have a location field)
    const locations = [...new Set(alumni.filter(a => a.batch).map(a => a.batch!))].sort();

    return { years, companies, industries, locations };
  }, [alumni]);

  const filteredAlumni = useMemo(() => {
    return alumni.filter((member) => {
      // Search filter
      const matchesSearch = 
        member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.current_company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.batch?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Graduation year filter
      if (filters.graduationYear !== "all" && member.graduation_year?.toString() !== filters.graduationYear) {
        return false;
      }

      // Company filter
      if (filters.company !== "all" && member.current_company !== filters.company) {
        return false;
      }

      // Industry filter (based on job title)
      if (filters.industry !== "all" && member.job_title) {
        const title = member.job_title.toLowerCase();
        let industry = "Other";
        if (title.includes("engineer") || title.includes("developer") || title.includes("programmer")) industry = "Engineering";
        else if (title.includes("design")) industry = "Design";
        else if (title.includes("product")) industry = "Product";
        else if (title.includes("data") || title.includes("analyst")) industry = "Data & Analytics";
        else if (title.includes("manager") || title.includes("lead")) industry = "Management";
        else if (title.includes("marketing")) industry = "Marketing";
        else if (title.includes("sales")) industry = "Sales";
        
        if (industry !== filters.industry) return false;
      } else if (filters.industry !== "all" && !member.job_title) {
        return false;
      }

      // Location filter (using batch as proxy)
      if (filters.location !== "all" && member.batch !== filters.location) {
        return false;
      }

      return true;
    });
  }, [alumni, searchQuery, filters]);

  const activeFiltersCount = Object.values(filters).filter(v => v !== "all").length;

  const clearFilters = () => {
    setFilters({
      graduationYear: "all",
      company: "all",
      industry: "all",
      location: "all",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="w-8 h-8 text-primary" />
            <h1 className="font-heading text-2xl font-bold text-foreground">
              Alumni Directory
            </h1>
          </div>
          <p className="text-muted-foreground">
            Connect with our graduated members and explore their career journeys.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Users className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="font-heading text-2xl font-bold text-primary">
              {alumni.length}
            </p>
            <p className="text-sm text-muted-foreground">Total Alumni</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Building2 className="w-6 h-6 text-secondary mx-auto mb-2" />
            <p className="font-heading text-2xl font-bold text-secondary">
              {filterOptions.companies.length}
            </p>
            <p className="text-sm text-muted-foreground">Companies</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Briefcase className="w-6 h-6 text-accent mx-auto mb-2" />
            <p className="font-heading text-2xl font-bold text-accent">
              {filterOptions.industries.length}
            </p>
            <p className="text-sm text-muted-foreground">Industries</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Calendar className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="font-heading text-2xl font-bold text-primary">
              {filterOptions.years.length}
            </p>
            <p className="text-sm text-muted-foreground">Grad Years</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search alumni by name, company, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={showFilters ? "secondary" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="default" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-card rounded-xl border border-border p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Advanced Filters
                </h3>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Graduation Year */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Graduation Year
                  </label>
                  <Select value={filters.graduationYear} onValueChange={(v) => setFilters(prev => ({ ...prev, graduationYear: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {filterOptions.years.map(year => (
                        <SelectItem key={year} value={year.toString()}>Class of {year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Company */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    Company
                  </label>
                  <Select value={filters.company} onValueChange={(v) => setFilters(prev => ({ ...prev, company: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Companies" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Companies</SelectItem>
                      {filterOptions.companies.map(company => (
                        <SelectItem key={company} value={company}>{company}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Industry */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    Industry
                  </label>
                  <Select value={filters.industry} onValueChange={(v) => setFilters(prev => ({ ...prev, industry: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Industries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Industries</SelectItem>
                      {filterOptions.industries.map(industry => (
                        <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location/Batch */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Batch
                  </label>
                  <Select value={filters.location} onValueChange={(v) => setFilters(prev => ({ ...prev, location: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Batches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Batches</SelectItem>
                      {filterOptions.locations.map(location => (
                        <SelectItem key={location} value={location}>{location}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active Filters Display */}
              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                  {filters.graduationYear !== "all" && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Class of {filters.graduationYear}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, graduationYear: "all" }))} />
                    </Badge>
                  )}
                  {filters.company !== "all" && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {filters.company}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, company: "all" }))} />
                    </Badge>
                  )}
                  {filters.industry !== "all" && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {filters.industry}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, industry: "all" }))} />
                    </Badge>
                  )}
                  {filters.location !== "all" && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {filters.location}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, location: "all" }))} />
                    </Badge>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Results Count */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredAlumni.length} of {alumni.length} alumni
        </div>

        {/* Alumni Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-64 bg-card rounded-2xl border border-border animate-pulse"
              />
            ))}
          </div>
        ) : filteredAlumni.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border">
            <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading text-lg font-medium text-foreground mb-2">
              No alumni found
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              {searchQuery || activeFiltersCount > 0 ? "Try adjusting your search or filters" : "Alumni profiles will appear here"}
            </p>
            {activeFiltersCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAlumni.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-card rounded-2xl border border-border p-5 hover:border-primary/30 transition-all"
              >
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                      {getInitials(member.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">
                      {member.full_name}
                    </h3>
                    {member.job_title && (
                      <p className="text-sm text-primary font-medium truncate">
                        {member.job_title}
                      </p>
                    )}
                    {member.current_company && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                        <Building2 className="w-3 h-3 flex-shrink-0" />
                        {member.current_company}
                      </p>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {member.graduation_year && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Class of {member.graduation_year}
                      </span>
                    )}
                    {member.batch && (
                      <span>Batch: {member.batch}</span>
                    )}
                  </div>
                  
                  {member.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {member.bio}
                    </p>
                  )}
                </div>

                {/* Skills */}
                {member.skills && member.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {member.skills.slice(0, 3).map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                    {member.skills.length > 3 && (
                      <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full text-xs">
                        +{member.skills.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Social Links */}
                <div className="flex items-center gap-2">
                  {member.github_url && (
                    <a
                      href={member.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <Github className="w-4 h-4 text-muted-foreground" />
                    </a>
                  )}
                  {member.linkedin_url && (
                    <a
                      href={member.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <Linkedin className="w-4 h-4 text-muted-foreground" />
                    </a>
                  )}
                  <div className="ml-auto text-xs text-muted-foreground">
                    Level {member.level} • {member.xp_points} XP
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
