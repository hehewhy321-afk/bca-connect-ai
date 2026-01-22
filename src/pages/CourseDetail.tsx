import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    PlayCircle,
    Lock,
    CheckCircle,
    Clock,
    FileText,
    Video,
    Upload,
    AlertCircle,
    ChevronDown,
    ChevronRight
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const CourseDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [paymentScreenshot, setPaymentScreenshot] = useState("");
    const [transactionId, setTransactionId] = useState("");
    const [expandedChapters, setExpandedChapters] = useState<string[]>([]);

    // Fetch Course & Content
    const { data: courseData, isLoading } = useQuery({
        queryKey: ["course-detail", id],
        queryFn: async () => {
            // Course
            const { data: course, error: courseError } = await supabase
                .from("courses")
                .select("*")
                .eq("id", id)
                .single();
            if (courseError) throw courseError;

            // Chapters & Lessons
            const { data: chapters, error: chaptersError } = await supabase
                .from("course_chapters")
                .select("*, lessons:course_lessons(*)")
                .eq("course_id", id)
                .order("order_index");
            if (chaptersError) throw chaptersError;

            const sortedChapters = chapters.map((ch: any) => ({
                ...ch,
                lessons: ch.lessons.sort((a: any, b: any) => a.order_index - b.order_index)
            }));

            return { course, chapters: sortedChapters };
        }
    });

    // Fetch Enrollment Status
    const { data: enrollment } = useQuery({
        queryKey: ["enrollment-status", id, user?.id],
        queryFn: async () => {
            if (!user) return null;
            const { data, error } = await supabase
                .from("course_enrollments")
                .select("*")
                .eq("course_id", id)
                .eq("user_id", user.id)
                .maybeSingle(); // Use maybeSingle to avoid error if not found

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        },
        enabled: !!user && !!id
    });

    // Enroll Mutation
    const enrollMutation = useMutation({
        mutationFn: async () => {
            if (!user) throw new Error("Must be logged in");

            const { error } = await supabase.from("course_enrollments").insert({
                course_id: id,
                user_id: user.id,
                payment_screenshot_url: paymentScreenshot,
                transaction_id: transactionId,
                status: "pending"
            });

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Enrollment request submitted! Please wait for admin approval.");
            setIsEnrollDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ["enrollment-status", id] });
        },
        onError: (err) => toast.error(err.message)
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploading(true);
        try {
            const fileExt = file.name.split(".").pop();
            const fileName = `payment_${user.id}_${Date.now()}.${fileExt}`;
            const filePath = `payments/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("resources") // Reusing resources bucket for now, or create 'payments' bucket
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from("resources")
                .getPublicUrl(filePath);

            setPaymentScreenshot(urlData.publicUrl);
        } catch (error) {
            toast.error("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    // Toggle chapter expansion
    const toggleChapter = (chapterId: string) => {
        setExpandedChapters(prev =>
            prev.includes(chapterId)
                ? prev.filter(id => id !== chapterId)
                : [...prev, chapterId]
        );
    };

    // Expand first chapter by default
    useEffect(() => {
        if (courseData?.chapters?.length > 0 && expandedChapters.length === 0) {
            setExpandedChapters([courseData.chapters[0].id]);
        }
    }, [courseData]);

    if (isLoading || !courseData) {
        return <DashboardLayout><div className="text-center py-20">Loading course...</div></DashboardLayout>;
    }

    const { course, chapters } = courseData;
    const isEnrolled = !!enrollment;
    const isApproved = enrollment?.status === "approved";
    const isPending = enrollment?.status === "pending";
    const isFree = course.price === 0; // Check if course is free

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header/Hero */}
                <div className="relative rounded-[3rem] overflow-hidden bg-black/40 border border-white/5 pb-8">
                    <div className="h-64 w-full bg-cover bg-center masking-gradient" style={{ backgroundImage: `url(${course.thumbnail_url})` }}>
                        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                    </div>

                    <div className="px-8 md:px-12 -mt-20 relative z-10 flex flex-col md:flex-row gap-8 items-end">
                        <div className="w-48 h-48 rounded-3xl overflow-hidden border-4 border-background shadow-2xl flex-shrink-0 bg-muted">
                            <img src={course.thumbnail_url} className="w-full h-full object-cover" alt="Thumb" />
                        </div>

                        <div className="flex-1 pb-4">
                            <Badge className="mb-4 bg-primary text-primary-foreground text-xs uppercase tracking-widest">{course.category}</Badge>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-foreground">{course.title}</h1>
                            <p className="text-muted-foreground line-clamp-2 max-w-2xl">{course.description}</p>
                        </div>

                        <div className="pb-4 flex-shrink-0 w-full md:w-auto">
                            {isApproved || isFree ? (
                                <Button
                                    onClick={() => navigate(`/dashboard/courses/${id}/learn`)}
                                    className="w-full md:w-auto h-14 rounded-2xl text-lg font-bold bg-green-500 hover:bg-green-600 shadow-xl shadow-green-500/20"
                                >
                                    <PlayCircle className="w-6 h-6 mr-2" /> Continue Learning
                                </Button>
                            ) : isPending ? (
                                <Button disabled className="w-full md:w-auto h-14 rounded-2xl text-lg font-bold bg-yellow-500/20 text-yellow-500 border border-yellow-500/50">
                                    <Clock className="w-6 h-6 mr-2" /> Approval Pending
                                </Button>
                            ) : (
                                <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="w-full md:w-auto h-14 rounded-2xl text-lg font-bold px-8 shadow-xl shadow-primary/20">
                                            Enroll Now - NPR {course.price}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md bg-card border-white/10">
                                        <DialogHeader>
                                            <DialogTitle>Unlock Full Access</DialogTitle>
                                            <DialogDescription>
                                                Scan the QR code to pay <strong>NPR {course.price}</strong> and upload the screenshot.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-6 py-4">
                                            {/* Placeholder QR */}
                                            <div className="flex justify-center">
                                                <div className="w-48 h-48 bg-white p-2 rounded-xl">
                                                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=esewa_payment_link_placeholder" alt="QR" className="w-full h-full" />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <Label>Upload Payment Screenshot</Label>
                                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                                    <Input type="file" onChange={handleFileUpload} disabled={uploading} />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <Label>Transaction ID (Optional)</Label>
                                                <Input
                                                    placeholder="e.g. TXN-123456"
                                                    value={transactionId}
                                                    onChange={(e) => setTransactionId(e.target.value)}
                                                />
                                            </div>

                                            <Button
                                                onClick={() => enrollMutation.mutate()}
                                                className="w-full font-bold"
                                                disabled={!paymentScreenshot || enrollMutation.isPending}
                                            >
                                                {enrollMutation.isPending ? "Submitting..." : "Submit Payment"}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Tabs */}
                <div className="max-w-5xl mx-auto">
                    <Tabs defaultValue="syllabus" className="w-full">
                        <TabsList className="bg-white/5 rounded-2xl p-1 mb-6 w-full md:w-auto flex">
                            <TabsTrigger value="syllabus" className="rounded-xl flex-1 md:flex-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">Syllabus</TabsTrigger>
                            <TabsTrigger value="overview" className="rounded-xl flex-1 md:flex-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">Overview</TabsTrigger>
                        </TabsList>

                        <TabsContent value="syllabus" className="space-y-4">
                            {chapters.map((chapter: any, chapterIndex: number) => {
                                const isExpanded = expandedChapters.includes(chapter.id);
                                return (
                                    <div key={chapter.id} className="glass-card rounded-2xl border border-white/5 overflow-hidden">
                                        <button
                                            onClick={() => toggleChapter(chapter.id)}
                                            className="w-full bg-white/5 p-4 font-bold text-lg flex items-center justify-between hover:bg-white/10 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                {isExpanded ? (
                                                    <ChevronDown className="w-5 h-5 text-primary" />
                                                ) : (
                                                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                                )}
                                                <span>{chapter.title}</span>
                                            </div>
                                            <span className="text-xs font-normal text-muted-foreground bg-white/5 px-2 py-1 rounded-md">
                                                {chapter.lessons.length} Lessons
                                            </span>
                                        </button>
                                        {isExpanded && (
                                            <div className="divide-y divide-white/5">
                                                {chapter.lessons.map((lesson: any) => {
                                                    const canPlay = isApproved || isFree || lesson.is_free_preview;
                                                    return (
                                                        <div
                                                            key={lesson.id}
                                                            className={`p-4 flex items-center gap-4 transition-colors ${canPlay ? 'hover:bg-white/5 cursor-pointer' : 'opacity-60'}`}
                                                            onClick={() => {
                                                                if (canPlay) {
                                                                    navigate(`/dashboard/courses/${id}/learn`);
                                                                }
                                                            }}
                                                        >
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                                                {canPlay ? <PlayCircle size={16} /> : <Lock size={16} />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <h4 className="font-medium text-sm md:text-base flex items-center gap-2">
                                                                    {lesson.title}
                                                                    {lesson.is_free_preview && !isApproved && !isFree && <Badge variant="secondary" className="text-[10px] h-5">Free Preview</Badge>}
                                                                </h4>
                                                                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
                                                                    <span className="flex items-center gap-1"><Video size={10} /> Video</span>
                                                                    {lesson.duration && <span className="flex items-center gap-1"><Clock size={10} /> {lesson.duration}</span>}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </TabsContent>

                        <TabsContent value="overview">
                            <div className="glass-card rounded-3xl p-8 text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {course.description}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

            </div>
        </DashboardLayout>
    );
};

export default CourseDetail;
