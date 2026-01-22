import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    BookOpen,
    Search,
    Video,
    Clock,
    CheckCircle,
    PlayCircle,
    Filter
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

    // Apply all filters
    const filteredCourses = useMemo(() => {
        return courses?.filter(course => {
            // Search filter
            const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.category?.toLowerCase().includes(searchQuery.toLowerCase());

            // Price filter
            const matchesPrice = priceFilter === "all" ||
                (priceFilter === "free" && course.price === 0) ||
                (priceFilter === "paid" && course.price > 0);

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
            <div className="space-y-8 max-w-7xl mx-auto">

                {/* Hero Section */}
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-white/5 p-8 md:p-12 text-center md:text-left">
                    <div className="relative z-10 max-w-2xl">
                        <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-4">
                            Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Skills</span>
                        </h1>
                        <p className="text-lg text-muted-foreground mb-8">
                            Premium video courses designed to take your BCA journey to the next level.
                            Learn from industry experts and seniors.
                        </p>
                        <div className="relative max-w-md mx-auto md:mx-0">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                                placeholder="Find a course..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 h-14 rounded-2xl bg-background/50 backdrop-blur-sm border-white/10 text-lg shadow-xl focus:ring-primary/50"
                            />
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -z-0 opacity-50 pointer-events-none" />
                    <div className="hidden md:block absolute right-10 top-1/2 -translate-y-1/2">
                        <Video className="w-64 h-64 text-primary/10 rotate-12" />
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Filters:</span>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {/* Price Filter */}
                        <Select value={priceFilter} onValueChange={(value: "all" | "free" | "paid") => setPriceFilter(value)}>
                            <SelectTrigger className="w-[180px] rounded-xl bg-background/50 border-white/10">
                                <SelectValue placeholder="Select price" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Courses</SelectItem>
                                <SelectItem value="free">Free Only</SelectItem>
                                <SelectItem value="paid">Paid Only</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Category Filter */}
                        {categories.length > 0 && (
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="w-[180px] rounded-xl bg-background/50 border-white/10">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
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

                {/* Course Grid */}
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {isLoading ? (
                        <div className="col-span-full py-20 text-center">Loading courses...</div>
                    ) : filteredCourses?.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-muted-foreground">
                            No courses found matching your criteria.
                        </div>
                    ) : (
                        filteredCourses?.map((course) => {
                            const enrollment = getEnrollmentStatus(course.id);
                            const isEnrolled = !!enrollment;
                            const isApproved = enrollment?.status === "approved";
                            const isPending = enrollment?.status === "pending";

                            return (
                                <Card key={course.id} className="group glass-card border-white/5 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 flex flex-col h-full rounded-3xl">
                                    {/* Thumbnail */}
                                    <div className="relative aspect-video bg-black/40 overflow-hidden">
                                        {course.thumbnail_url ? (
                                            <img
                                                src={course.thumbnail_url}
                                                alt={course.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                                                <BookOpen className="w-16 h-16" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                                            <Button
                                                onClick={() => navigate(`/dashboard/courses/${course.id}`)}
                                                className="w-full rounded-xl font-bold bg-white text-black hover:bg-white/90"
                                            >
                                                <PlayCircle className="w-4 h-4 mr-2" /> View Details
                                            </Button>
                                        </div>
                                        <Badge className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10">
                                            {course.category || "General"}
                                        </Badge>
                                        {isEnrolled && (
                                            <Badge className="absolute top-4 left-4 bg-green-500/80 backdrop-blur-md border border-green-400/20 text-white">
                                                {isApproved ? "Enrolled" : isPending ? "Pending" : "Enrolled"}
                                            </Badge>
                                        )}
                                    </div>

                                    <CardHeader className="pb-2 flex-grow">
                                        <CardTitle className="text-xl font-black tracking-tight line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                                            {course.title}
                                        </CardTitle>
                                        <CardDescription className="line-clamp-2">
                                            {course.description}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="py-2">
                                        <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                            <div className="flex items-center gap-1.5">
                                                <Video className="w-3 h-3" /> Online
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" /> Self-paced
                                            </div>
                                        </div>
                                    </CardContent>

                                    <CardFooter className="pt-4 mt-auto border-t border-white/5 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Price</span>
                                            <span className="text-lg font-black text-foreground">
                                                {course.price > 0 ? `NPR ${course.price}` : "FREE"}
                                            </span>
                                        </div>
                                        <Button
                                            onClick={() => {
                                                if (isApproved) {
                                                    navigate(`/dashboard/courses/${course.id}/learn`);
                                                } else {
                                                    navigate(`/dashboard/courses/${course.id}`);
                                                }
                                            }}
                                            variant={isApproved ? "default" : course.price > 0 ? "default" : "secondary"}
                                            className={`rounded-xl px-6 font-bold ${isApproved || course.price > 0 ? 'shadow-lg shadow-primary/20' : ''}`}
                                            disabled={isPending}
                                        >
                                            {isApproved ? (
                                                <>
                                                    <PlayCircle className="w-4 h-4 mr-2" />
                                                    View Course
                                                </>
                                            ) : isPending ? (
                                                "Pending Approval"
                                            ) : course.price > 0 ? (
                                                "Enroll Now"
                                            ) : (
                                                "Start Learning"
                                            )}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Courses;
