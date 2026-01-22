import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
    ArrowLeft,
    Save,
    Loader2,
    Plus,
    Trash2,
    Video,
    GripVertical,
    LayoutList,
    Upload
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// Types
interface Lesson {
    id: string;
    title: string;
    video_url: string;
    is_free_preview: boolean;
    duration: string;
    order_index: number;
}

interface Chapter {
    id: string;
    title: string;
    order_index: number;
    lessons: Lesson[];
}

const AdminCourseBuilder = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isEditing = !!id && id !== "new";

    // Course State
    const [courseData, setCourseData] = useState({
        title: "",
        description: "",
        thumbnail_url: "",
        price: "0",
        category: "",
        is_published: false
    });

    // Fetch Course Data & Content
    const { data: course, isLoading: isLoadingCourse } = useQuery({
        queryKey: ["course", id],
        queryFn: async () => {
            if (!isEditing) return null;

            // Fetch course details
            const { data: courseData, error: courseError } = await supabase
                .from("courses")
                .select("*")
                .eq("id", id)
                .single();

            if (courseError) throw courseError;

            // Fetch chapters and lessons sorted by order
            const { data: chaptersData, error: chaptersError } = await supabase
                .from("course_chapters")
                .select("*, lessons:course_lessons(*)") // Nested fetch
                .eq("course_id", id)
                .order("order_index", { ascending: true });

            if (chaptersError) throw chaptersError;

            // Sort lessons within chapters
            const chaptersWithSortedLessons = chaptersData.map(ch => ({
                ...ch,
                lessons: ch.lessons?.sort((a: any, b: any) => a.order_index - b.order_index) || []
            }));

            return { course: courseData, chapters: chaptersWithSortedLessons };
        },
        enabled: isEditing
    });

    useEffect(() => {
        if (course?.course) {
            setCourseData({
                title: course.course.title,
                description: course.course.description || "",
                thumbnail_url: course.course.thumbnail_url || "",
                price: course.course.price?.toString() || "0",
                category: course.course.category || "",
                is_published: course.course.is_published || false
            });
        }
    }, [course]);

    // Mutations
    const saveCourseMutation = useMutation({
        mutationFn: async () => {
            const payload = { ...courseData, price: parseFloat(courseData.price) };
            if (isEditing) {
                const { error } = await supabase.from("courses").update(payload).eq("id", id);
                if (error) throw error;
                return id;
            } else {
                const { data, error } = await supabase.from("courses").insert(payload).select().single();
                if (error) throw error;
                return data.id;
            }
        },
        onSuccess: (newId) => {
            toast.success(isEditing ? "Course updated!" : "Course created!");
            if (!isEditing) {
                navigate(`/admin/courses/${newId}`);
            } else {
                queryClient.invalidateQueries({ queryKey: ["course", id] });
            }
        },
        onError: (err: any) => toast.error(err.message)
    });

    const addChapterMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase.from("course_chapters").insert({
                course_id: id,
                title: "New Chapter",
                order_index: (course?.chapters?.length || 0) + 1
            });
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["course", id] })
    });

    const updateChapterMutation = useMutation({
        mutationFn: async ({ chapterId, title }: { chapterId: string, title: string }) => {
            const { error } = await supabase.from("course_chapters").update({ title }).eq("id", chapterId);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["course", id] })
    });

    const deleteChapterMutation = useMutation({
        mutationFn: async (chapterId: string) => {
            const { error } = await supabase.from("course_chapters").delete().eq("id", chapterId);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["course", id] })
    });

    const addLessonMutation = useMutation({
        mutationFn: async (chapterId: string) => {
            // Find current max index
            const chapter = course?.chapters.find((c: any) => c.id === chapterId);
            const newIndex = (chapter?.lessons?.length || 0) + 1;

            const { error } = await supabase.from("course_lessons").insert({
                chapter_id: chapterId,
                title: "New Lesson",
                order_index: newIndex
            });
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["course", id] })
    });

    const updateLessonMutation = useMutation({
        mutationFn: async ({ lessonId, updates }: { lessonId: string, updates: any }) => {
            const { error } = await supabase.from("course_lessons").update(updates).eq("id", lessonId);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["course", id] })
    });

    const deleteLessonMutation = useMutation({
        mutationFn: async (lessonId: string) => {
            const { error } = await supabase.from("course_lessons").delete().eq("id", lessonId);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["course", id] })
    });

    if (isLoadingCourse && isEditing) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <AdminLayout>
            <div className="max-w-5xl mx-auto pb-20 space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" className="rounded-full w-10 h-10 p-0" onClick={() => navigate("/admin/courses")}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-black text-foreground tracking-tight">
                            {isEditing ? "Edit Course" : "Create New Course"}
                        </h1>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                            {isEditing ? `Building: ${courseData.title}` : "Start a new journey"}
                        </p>
                    </div>
                    <Button
                        onClick={() => saveCourseMutation.mutate()}
                        disabled={saveCourseMutation.isPending}
                        className="rounded-xl font-bold"
                    >
                        {saveCourseMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Course
                    </Button>
                </div>

                {/* Basic Info Card */}
                <div className="glass-card p-6 md:p-8 rounded-[2rem] border-white/5 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-xs uppercase font-black text-muted-foreground ml-1">Course Title</Label>
                            <Input
                                id="title"
                                value={courseData.title}
                                onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                                placeholder="e.g. Advanced React Patterns"
                                className="bg-white/5 border-white/10 rounded-xl font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category" className="text-xs uppercase font-black text-muted-foreground ml-1">Category</Label>
                            <Input
                                id="category"
                                value={courseData.category}
                                onChange={(e) => setCourseData({ ...courseData, category: e.target.value })}
                                placeholder="e.g. Web Development"
                                className="bg-white/5 border-white/10 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="desc" className="text-xs uppercase font-black text-muted-foreground ml-1">Description</Label>
                        <Textarea
                            id="desc"
                            value={courseData.description}
                            onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                            className="bg-white/5 border-white/10 rounded-xl min-h-[100px]"
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 items-end">
                        <div className="space-y-2">
                            <Label htmlFor="price" className="text-xs uppercase font-black text-muted-foreground ml-1">Price (NPR)</Label>
                            <Input
                                id="price"
                                type="number"
                                value={courseData.price}
                                onChange={(e) => setCourseData({ ...courseData, price: e.target.value })}
                                className="bg-white/5 border-white/10 rounded-xl font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="thumb" className="text-xs uppercase font-black text-muted-foreground ml-1">Thumbnail URL</Label>
                            <Input
                                id="thumb"
                                value={courseData.thumbnail_url}
                                onChange={(e) => setCourseData({ ...courseData, thumbnail_url: e.target.value })}
                                placeholder="https://..."
                                className="bg-white/5 border-white/10 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <Switch
                            checked={courseData.is_published}
                            onCheckedChange={(checked) => setCourseData({ ...courseData, is_published: checked })}
                        />
                        <Label className="font-bold cursor-pointer" onClick={() => setCourseData({ ...courseData, is_published: !courseData.is_published })}>
                            Publish Course
                        </Label>
                    </div>
                </div>

                {/* Content Builder Section - Specific for ID */}
                {isEditing && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                                <LayoutList className="w-5 h-5 text-primary" />
                                Curriculum
                            </h2>
                            <Button onClick={() => addChapterMutation.mutate()} variant="outline" className="rounded-xl border-primary/20 hover:bg-primary/10 hover:text-primary">
                                <Plus className="w-4 h-4 mr-2" /> Add Chapter
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {course?.chapters?.length === 0 && (
                                <div className="p-10 border-2 border-dashed border-white/10 rounded-[2rem] text-center text-muted-foreground">
                                    No chapters yet. Click "Add Chapter" to begin.
                                </div>
                            )}

                            {course?.chapters?.map((chapter: any) => (
                                <div key={chapter.id} className="glass-card border-white/5 rounded-2xl overflow-hidden p-1">
                                    {/* Chapter Header */}
                                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-t-xl md:rounded-xl group hover:bg-white/10 transition-colors">
                                        <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab" />
                                        <Input
                                            defaultValue={chapter.title}
                                            onBlur={(e) => {
                                                if (e.target.value !== chapter.title) {
                                                    updateChapterMutation.mutate({ chapterId: chapter.id, title: e.target.value });
                                                }
                                            }}
                                            className="h-8 bg-transparent border-none font-bold text-lg p-0 focus-visible:ring-0"
                                        />
                                        <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="sm" onClick={() => deleteChapterMutation.mutate(chapter.id)} className="h-8 w-8 text-red-500 hover:bg-red-500/10">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Lessons List */}
                                    <div className="p-3 space-y-2 pl-8">
                                        {chapter.lessons.map((lesson: any) => (
                                            <div key={lesson.id} className="flex flex-col md:flex-row md:items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/5 hover:border-primary/20 transition-all">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <Video className="w-4 h-4 text-primary shrink-0" />
                                                    <Input
                                                        defaultValue={lesson.title}
                                                        onBlur={(e) => {
                                                            if (e.target.value !== lesson.title) {
                                                                updateLessonMutation.mutate({ lessonId: lesson.id, updates: { title: e.target.value } });
                                                            }
                                                        }}
                                                        className="h-7 bg-transparent border-none font-medium p-0 focus-visible:ring-0 flex-1 min-w-[150px]"
                                                        placeholder="Lesson Title"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <Input
                                                        defaultValue={lesson.video_url || ""}
                                                        onBlur={(e) => {
                                                            if (e.target.value !== lesson.video_url) {
                                                                updateLessonMutation.mutate({ lessonId: lesson.id, updates: { video_url: e.target.value } });
                                                            }
                                                        }}
                                                        className="h-8 w-40 md:w-64 bg-black/20 border-white/10 rounded-lg text-xs font-mono"
                                                        placeholder="Video URL"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground whitespace-nowrap">Free Preview</Label>
                                                        <Switch
                                                            checked={lesson.is_free_preview}
                                                            onCheckedChange={(c) => updateLessonMutation.mutate({ lessonId: lesson.id, updates: { is_free_preview: c } })}
                                                            className="scale-75"
                                                        />
                                                    </div>
                                                    <Button variant="ghost" size="sm" onClick={() => deleteLessonMutation.mutate(lesson.id)} className="h-8 w-8 text-red-500 hover:bg-red-500/10">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => addLessonMutation.mutate(chapter.id)}
                                            className="w-full justify-start text-muted-foreground hover:text-primary pl-2 text-xs uppercase font-bold tracking-wider"
                                        >
                                            <Plus className="w-3 h-3 mr-2" /> Add Lesson
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminCourseBuilder;
