import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    BookOpen,
    Search,
    Video,
    Clock,
    CheckCircle,
    PlayCircle,
    Download,
    Percent,
    Globe
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DOMPurify from "dompurify";

const Courses = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    const { data: courses, isLoading } = useQuery({
        queryKey: ["courses-public"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("courses")
                .select("*")
                .eq("is_published", true)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
    });

    // Fetch user enrollments
    const { data: enrollments } = useQuery({
        queryKey: ["user-enrollments", user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from("course_enrollments")
                .select("course_id, status")
                .eq("user_id", user.id);

            if (error) throw error;
            return data;
        },
        enabled: !!user
    });

    // Get unique categories
    const categories = useMemo(() => {
        if (!courses) return [];
        const uniqueCategories = [...new Set(courses.map(c => c.category).filter(Boolean))];
        return uniqueCategories;
    }, [courses]);

    // Apply    // Filter courses
    const filteredCourses = useMemo(() => {
        if (!courses) return [];

        return courses.filter((course) => {
            // Search filter
            const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.description?.toLowerCase().includes(searchQuery.toLowerCase());

            // Price filter - check both offer_price and original_price
            const effectivePrice = course.offer_price ?? course.original_price ?? course.price ?? 0;
            const matchesPrice =
                priceFilter === "all" ||
                (priceFilter === "free" && effectivePrice === 0) ||
                (priceFilter === "paid" && effectivePrice > 0);

            // Category filter
            const matchesCategory = selectedCategory === "all" || course.category === selectedCategory;

            return matchesSearch && matchesPrice && matchesCategory;
        });
    }, [courses, searchQuery, priceFilter, selectedCategory]);

    // Helper to check enrollment status
    const getEnrollmentStatus = (courseId: string) => {
        return enrollments?.find(e => e.course_id === courseId);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent text-primary-foreground">
                            <Video className="h-[18px] w-[18px]" aria-hidden />
                        </span>
                        <div>
                            <h1 className="text-base font-bold text-foreground">
                                Study <span className="italic text-primary">courses</span>
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Work through lessons at your own pace
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="group relative min-w-[200px] flex-1 lg:flex-none">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" aria-hidden />
                            <Input
                                placeholder="Search courses"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 rounded-md border-border bg-background/60 pl-9 text-sm"
                            />
                        </div>

                        <Select value={priceFilter} onValueChange={(value: "all" | "free" | "paid") => setPriceFilter(value)}>
                            <SelectTrigger className="h-9 w-[140px] rounded-md border-border bg-background/60 text-sm">
                                <SelectValue placeholder="Price" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All prices</SelectItem>
                                <SelectItem value="free">Free only</SelectItem>
                                <SelectItem value="paid">Paid only</SelectItem>
                            </SelectContent>
                        </Select>

                        {categories.length > 0 && (
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="h-9 w-[160px] rounded-md border-border bg-background/60 text-sm">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All categories</SelectItem>
                                    {categories.map(category => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>

                {/* Grid */}
                {isLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-80 animate-pulse rounded-lg bg-muted" />
                        ))}
                    </div>
                ) : filteredCourses?.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border py-16 text-center">
                        <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" aria-hidden />
                        <h2 className="text-sm font-bold text-foreground">No courses match your filters</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Try a different search term, price or category.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {filteredCourses?.map((course) => {
                            const enrollment = getEnrollmentStatus(course.id);
                            const isEnrolled = !!enrollment;
                            const isApproved = enrollment?.status === "approved";
                            const isPending = enrollment?.status === "pending";

                            const originalPrice = (course as any).original_price ?? course.price ?? 0;
                            const offerPrice = (course as any).offer_price;
                            const hasDiscount = offerPrice != null && offerPrice < originalPrice;
                            const discount = hasDiscount
                                ? Math.round(((originalPrice - offerPrice) / originalPrice) * 100)
                                : 0;

                            return (
                                <article
                                    key={course.id}
                                    className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/40"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative aspect-video overflow-hidden bg-muted">
                                        {course.thumbnail_url ? (
                                            <img
                                                src={course.thumbnail_url}
                                                alt=""
                                                loading="lazy"
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
                                                <BookOpen className="h-10 w-10" aria-hidden />
                                            </div>
                                        )}

                                        <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
                                            {isEnrolled ? (
                                                <Badge className="rounded bg-green-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                                    {isPending ? "Pending" : "Enrolled"}
                                                </Badge>
                                            ) : (
                                                <span />
                                            )}
                                            <Badge className="rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                                                {course.category || "General"}
                                            </Badge>
                                        </div>

                                        {(course as any).language && (
                                            <Badge className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                                                <Globe className="h-3 w-3" aria-hidden />
                                                {(course as any).language}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Body */}
                                    <div className="flex flex-1 flex-col p-4">
                                        <h2 className="line-clamp-2 text-sm font-bold text-foreground">
                                            {course.title}
                                        </h2>
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: DOMPurify.sanitize(course.description || "", {
                                                    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
                                                    ALLOWED_ATTR: []
                                                })
                                            }}
                                            className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground [&_p]:m-0"
                                        />

                                        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1.5">
                                                <Video className="h-3 w-3" aria-hidden /> Online
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="h-3 w-3" aria-hidden /> Self-paced
                                            </span>
                                        </div>

                                        {/* Price + actions */}
                                        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
                                            <div className="min-w-0">
                                                {hasDiscount ? (
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-base font-bold text-foreground">
                                                            {offerPrice > 0 ? `NPR ${offerPrice}` : "Free"}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground line-through">
                                                            NPR {originalPrice}
                                                        </span>
                                                        <Badge className="flex items-center gap-0.5 rounded bg-green-500/15 px-1 py-0 text-[10px] font-semibold text-green-600 dark:text-green-500">
                                                            <Percent className="h-2.5 w-2.5" aria-hidden />
                                                            {discount}
                                                        </Badge>
                                                    </div>
                                                ) : (
                                                    <span className="text-base font-bold text-foreground">
                                                        {originalPrice > 0 ? `NPR ${originalPrice}` : "Free"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-3 flex gap-2">
                                            <Button
                                                onClick={() => navigate(`/dashboard/courses/${course.id}`)}
                                                variant="outline"
                                                className="h-9 flex-1 rounded-md border-border text-xs font-semibold"
                                            >
                                                Details
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    if (isApproved) {
                                                        navigate(`/dashboard/courses/${course.id}/learn`);
                                                    } else {
                                                        navigate(`/dashboard/courses/${course.id}`);
                                                    }
                                                }}
                                                disabled={isPending}
                                                className="h-9 flex-1 rounded-md text-xs font-semibold"
                                            >
                                                {isApproved ? (
                                                    <>
                                                        <PlayCircle className="mr-1.5 h-4 w-4" aria-hidden />
                                                        Continue
                                                    </>
                                                ) : isPending ? (
                                                    "Awaiting approval"
                                                ) : originalPrice > 0 ? (
                                                    "Enroll"
                                                ) : (
                                                    "Start"
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Courses;
