import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Search,
    BookOpen,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    Video
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AdminCourses = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");

    const { data: courses, isLoading, refetch } = useQuery({
        queryKey: ["admin-courses"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("courses")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
    });

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this course? This will verify all chapters and lessons.")) return;

        const { error } = await supabase
            .from("courses")
            .delete()
            .eq("id", id);

        if (error) {
            toast.error("Failed to delete course");
        } else {
            toast.success("Course deleted successfully");
            refetch();
        }
    };

    const filteredCourses = courses?.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                            <Video className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-foreground tracking-tight underline elevation-1 decoration-primary/30 decoration-4 underline-offset-8">
                                Course Hub
                            </h1>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">
                                Manage Paid & Premium Content
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => navigate("/admin/courses/new")}
                        className="h-14 px-8 rounded-2xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Course
                    </Button>
                </div>

                {/* Search & Filters */}
                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search courses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 h-12 rounded-xl bg-transparent border-none focus-visible:ring-0 text-base"
                        />
                    </div>
                </div>

                {/* Course Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {isLoading ? (
                        <p>Loading courses...</p>
                    ) : filteredCourses?.length === 0 ? (
                        <div className="col-span-full text-center py-20 text-muted-foreground">
                            No courses found. Create one to get started.
                        </div>
                    ) : (
                        filteredCourses?.map((course) => (
                            <Card key={course.id} className="glass-card border-white/5 overflow-hidden hover:border-primary/20 transition-all group">
                                <div className="relative aspect-video bg-black/20 overflow-hidden">
                                    {course.thumbnail_url ? (
                                        <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                            <BookOpen className="w-10 h-10 opacity-20" />
                                        </div>
                                    )}
                                    <Badge
                                        className={`absolute top-4 right-4 ${course.is_published ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'} backdrop-blur-md`}
                                    >
                                        {course.is_published ? "Published" : "Draft"}
                                    </Badge>
                                </div>

                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start gap-4">
                                        <CardTitle className="line-clamp-1 text-lg">{course.title}</CardTitle>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => navigate(`/admin/courses/${course.id}`)}>
                                                    <Edit className="w-4 h-4 mr-2" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => handleDelete(course.id)}>
                                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                                        {course.description || "No description provided."}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent>
                                    <div className="flex items-center justify-between text-sm font-medium">
                                        <span className="text-muted-foreground">{course.category || "Uncategorized"}</span>
                                        <span className="text-primary font-bold">
                                            {course.price && Number(course.price) > 0 ? `NPR ${course.price}` : "Free"}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminCourses;
