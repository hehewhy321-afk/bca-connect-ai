import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayCircle, Lock, CheckCircle, Clock, FileText, Video, Upload, AlertCircle, ChevronDown, ChevronRight, Download, Percent, Globe, ExternalLink, ChevronLeft, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import DOMPurify from "dompurify";

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

    // Calculate effective price
    const originalPrice = (course as any).original_price ?? course.price ?? 0;
    const offerPrice = (course as any).offer_price;
    const effectivePrice = offerPrice ?? originalPrice;
    const isFree = effectivePrice === 0;
    const courseExtras = course as {
        language?: string | null;
        resources_url?: string | null;
    };
    const totalLessons = chapters.reduce(
        (total: number, chapter: { lessons?: unknown[] }) => total + (chapter.lessons?.length || 0),
        0
    );
    const hasDiscount = offerPrice != null && offerPrice < originalPrice;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <Link
                    to="/dashboard/courses"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                    All courses
                </Link>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
                    {/* Main column */}
                    <div className="space-y-6">
                        <div className="overflow-hidden rounded-lg border border-border bg-card">
                            <div className="aspect-video w-full overflow-hidden bg-muted">
                                {course.thumbnail_url ? (
                                    <img
                                        src={course.thumbnail_url}
                                        alt=""
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
                                        <Video className="h-10 w-10" aria-hidden />
                                    </div>
                                )}
                            </div>

                            <div className="p-5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge className="rounded bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                                        {course.category || "General"}
                                    </Badge>
                                    {courseExtras.language && (
                                        <Badge className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                            <Globe className="h-3 w-3" aria-hidden />
                                            {courseExtras.language}
                                        </Badge>
                                    )}
                                </div>

                                <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
                                    {course.title}
                                </h1>

                                <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <Video className="h-3.5 w-3.5" aria-hidden />
                                        {totalLessons} {totalLessons === 1 ? "lesson" : "lessons"}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <BookOpen className="h-3.5 w-3.5" aria-hidden />
                                        {chapters.length} {chapters.length === 1 ? "chapter" : "chapters"}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5" aria-hidden />
                                        Self-paced
                                    </span>
                                </p>
                            </div>
                        </div>

                        <Tabs defaultValue="syllabus" className="w-full">
                            <TabsList className="h-9 rounded-md bg-muted p-1">
                                <TabsTrigger value="syllabus" className="rounded text-xs font-semibold data-[state=active]:bg-background">
                                    Syllabus
                                </TabsTrigger>
                                <TabsTrigger value="overview" className="rounded text-xs font-semibold data-[state=active]:bg-background">
                                    Overview
                                </TabsTrigger>
                            </TabsList>

                    <TabsContent value="syllabus" className="space-y-4">
                        {chapters.map((chapter: any, chapterIndex: number) => {
                            const isExpanded = expandedChapters.includes(chapter.id);
                            return (
                                <div key={chapter.id} className="overflow-hidden rounded-lg border border-border bg-card">
                                    <button
                                        onClick={() => toggleChapter(chapter.id)}
                                        className="flex w-full items-center justify-between gap-3 p-4 text-left text-sm font-bold transition-colors hover:bg-muted/60"
                                    >
                                        <div className="flex items-center gap-3">
                                            {isExpanded ? (
                                                <ChevronDown className="w-5 h-5 text-primary" />
                                            ) : (
                                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                            )}
                                            <span>{chapter.title}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {chapter.resources_url && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 rounded-lg text-xs font-normal hover:bg-primary/10"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(chapter.resources_url, '_blank');
                                                    }}
                                                >
                                                    <Download className="w-3 h-3 mr-1" />
                                                    Resources
                                                    <ExternalLink className="w-2 h-2 ml-1" />
                                                </Button>
                                            )}
                                            <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                                {chapter.lessons.length} Lessons
                                            </span>
                                        </div>
                                    </button>
                                    {isExpanded && (
                                        <div className="divide-y divide-border border-t border-border">
                                            {chapter.lessons.map((lesson: any) => {
                                                const canPlay = isApproved || isFree || lesson.is_free_preview;
                                                return (
                                                    <div
                                                        key={lesson.id}
                                                        className={`flex items-center gap-3 p-3 transition-colors ${canPlay ? 'cursor-pointer hover:bg-muted/60' : 'opacity-60'}`}
                                                        onClick={() => {
                                                            if (canPlay) {
                                                                navigate(`/dashboard/courses/${id}/learn`);
                                                            }
                                                        }}
                                                    >
                                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                                            {canPlay ? <PlayCircle size={16} /> : <Lock size={16} />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
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

                            <TabsContent value="overview" className="mt-4">
                                <div className="rounded-lg border border-border bg-card p-5">
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: DOMPurify.sanitize(course.description || "", {
                                                ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'blockquote', 'code', 'pre', 'a'],
                                                ALLOWED_ATTR: ['href', 'target', 'rel']
                                            })
                                        }}
                                        className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-muted-foreground"
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Enrolment sidebar */}
                    <aside className="rounded-lg border border-border bg-card p-5 lg:sticky lg:top-24">
                        <div className="flex items-baseline gap-2">
                            {hasDiscount ? (
                                <>
                                    <span className="text-2xl font-bold text-foreground">
                                        {offerPrice > 0 ? `NPR ${offerPrice}` : "Free"}
                                    </span>
                                    <span className="text-sm text-muted-foreground line-through">
                                        NPR {originalPrice}
                                    </span>
                                    <Badge className="flex items-center gap-0.5 rounded bg-green-500/15 px-1.5 py-0 text-[11px] font-semibold text-green-600 dark:text-green-500">
                                        <Percent className="h-2.5 w-2.5" aria-hidden />
                                        {Math.round(((originalPrice - offerPrice) / originalPrice) * 100)}
                                    </Badge>
                                </>
                            ) : (
                                <span className="text-2xl font-bold text-foreground">
                                    {originalPrice > 0 ? `NPR ${originalPrice}` : "Free"}
                                </span>
                            )}
                        </div>

                        <div className="mt-4 space-y-2">
                            {isApproved || isFree ? (
                                <Button
                                    onClick={() => navigate(`/dashboard/courses/${id}/learn`)}
                                    className="h-10 w-full rounded-md font-semibold"
                                >
                                    <PlayCircle className="mr-2 h-4 w-4" aria-hidden />
                                    {isApproved ? "Continue learning" : "Start learning"}
                                </Button>
                            ) : isPending ? (
                                <Button disabled className="h-10 w-full rounded-md font-semibold">
                                    <Clock className="mr-2 h-4 w-4" aria-hidden />
                                    Awaiting approval
                                </Button>
                            ) : (
                        <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="h-10 w-full rounded-md font-semibold">
                                    Enroll Now - {hasDiscount ? `NPR ${offerPrice}` : `NPR ${originalPrice}`}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md rounded-lg">
                                <DialogHeader>
                                    <DialogTitle>Unlock Full Access</DialogTitle>
                                    <DialogDescription>
                                        Scan the QR code to pay <strong>NPR {effectivePrice}</strong> and upload the screenshot.
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

                            {courseExtras.resources_url && (
                                <Button
                                    variant="outline"
                                    className="h-10 w-full rounded-md border-border text-sm font-semibold"
                                    onClick={() => window.open(courseExtras.resources_url ?? '', '_blank')}
                                >
                                    <Download className="mr-2 h-4 w-4" aria-hidden />
                                    Course resources
                                    <ExternalLink className="ml-2 h-3 w-3" aria-hidden />
                                </Button>
                            )}
                        </div>

                        <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
                            <div className="flex items-center justify-between gap-3">
                                <dt className="text-muted-foreground">Lessons</dt>
                                <dd className="font-semibold text-foreground">{totalLessons}</dd>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <dt className="text-muted-foreground">Chapters</dt>
                                <dd className="font-semibold text-foreground">{chapters.length}</dd>
                            </div>
                            {courseExtras.language && (
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-muted-foreground">Language</dt>
                                    <dd className="font-semibold text-foreground">{courseExtras.language}</dd>
                                </div>
                            )}
                            <div className="flex items-center justify-between gap-3">
                                <dt className="text-muted-foreground">Access</dt>
                                <dd className="font-semibold text-foreground">Lifetime</dd>
                            </div>
                        </dl>

                        {isPending && (
                            <p className="mt-4 rounded-md border border-yellow-500/20 bg-yellow-500/10 p-3 text-xs leading-relaxed text-yellow-600 dark:text-yellow-500">
                                Your payment is with the admin team. You'll get access as soon as it's
                                approved.
                            </p>
                        )}
                    </aside>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default CourseDetail;
