import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Menu,
    ChevronRight,
    PlayCircle,
    CheckCircle,
    ChevronLeft,
    Lock
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const LearningPlayer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [currentLesson, setCurrentLesson] = useState<any>(null);

    // Fetch Enrollment Status
    const { data: enrollment, isLoading: enrollmentLoading } = useQuery({
        queryKey: ["enrollment-check", id, user?.id],
        queryFn: async () => {
            if (!user) return null;
            const { data, error } = await supabase
                .from("course_enrollments")
                .select("*")
                .eq("course_id", id)
                .eq("user_id", user.id)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        },
        enabled: !!user && !!id
    });

    // Fetch Course Content
    const { data: courseData, isLoading } = useQuery({
        queryKey: ["course-content", id],
        queryFn: async () => {
            const { data: course } = await supabase.from("courses").select("title, price").eq("id", id).single();

            const { data: chapters } = await supabase
                .from("course_chapters")
                .select("*, lessons:course_lessons(*)")
                .eq("course_id", id)
                .order("order_index");

            const sortedChapters = chapters?.map((ch: any) => ({
                ...ch,
                lessons: ch.lessons.sort((a: any, b: any) => a.order_index - b.order_index)
            })) || [];

            // Flatten lessons for easier navigation
            const allLessons = sortedChapters.flatMap((ch: any) => ch.lessons);

            return { course, chapters: sortedChapters, allLessons };
        }
    });

    const isApproved = enrollment?.status === "approved";
    const isFree = courseData?.course?.price === 0; // Check if course is free

    // Check access and redirect if necessary
    useEffect(() => {
        if (!enrollmentLoading && !isLoading && courseData) {
            // Check if user has any free preview lessons
            const hasFreePreview = courseData.allLessons.some((l: any) => l.is_free_preview);

            if (!isApproved && !hasFreePreview) {
                toast.error("You need to enroll in this course to access the content");
                navigate(`/dashboard/courses/${id}`);
            }
        }
    }, [enrollment, isApproved, enrollmentLoading, isLoading, courseData, id, navigate]);

    useEffect(() => {
        if (courseData?.allLessons?.length > 0 && !currentLesson) {
            // Set first accessible lesson (free preview, free course, or if enrolled)
            const firstAccessible = courseData.allLessons.find((l: any) => isApproved || isFree || l.is_free_preview);
            if (firstAccessible) {
                setCurrentLesson(firstAccessible);
            }
        }
    }, [courseData, isApproved, isFree]);

    if (isLoading || enrollmentLoading || !courseData) {
        return <div className="flex h-screen items-center justify-center bg-black text-white">Loading class...</div>;
    }

    const { chapters, allLessons } = courseData;
    const currentIndex = allLessons.findIndex((l: any) => l.id === currentLesson?.id);
    const nextLesson = allLessons[currentIndex + 1];
    const prevLesson = allLessons[currentIndex - 1];

    // Check if a lesson can be played
    const canPlayLesson = (lesson: any) => {
        return isApproved || isFree || lesson.is_free_preview;
    };

    const handleLessonClick = (lesson: any) => {
        if (canPlayLesson(lesson)) {
            setCurrentLesson(lesson);
        } else {
            toast.error("This lesson is locked. Please enroll to access it.");
        }
    };

    const SidebarContent = () => (
        <div className="h-full flex flex-col bg-zinc-900 border-r border-white/10">
            <div className="p-4 border-b border-white/10">
                <Button variant="ghost" className="mb-2 pl-0 hover:bg-transparent text-zinc-400 hover:text-white" onClick={() => navigate(`/dashboard/courses/${id}`)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Course
                </Button>
                <h2 className="font-bold text-lg text-white line-clamp-2">{courseData.course?.title}</h2>
                <div className="mt-2 text-xs text-zinc-500 font-mono uppercase tracking-widest">
                    {Math.round((currentIndex / allLessons.length) * 100)}% Complete
                </div>
                <div className="mt-1 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(currentIndex / allLessons.length) * 100}%` }} />
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    {chapters.map((chapter: any) => (
                        <div key={chapter.id}>
                            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">{chapter.title}</h3>
                            <div className="space-y-1">
                                {chapter.lessons.map((lesson: any) => {
                                    const isActive = currentLesson?.id === lesson.id;
                                    const canPlay = canPlayLesson(lesson);
                                    return (
                                        <button
                                            key={lesson.id}
                                            onClick={() => handleLessonClick(lesson)}
                                            disabled={!canPlay}
                                            className={`w-full text-left p-3 rounded-xl flex items-start gap-3 transition-all ${isActive
                                                ? "bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20"
                                                : canPlay
                                                    ? "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                                                    : "text-zinc-600 opacity-50 cursor-not-allowed"
                                                }`}
                                        >
                                            <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${isActive ? "border-current" : "border-zinc-600"}`}>
                                                {!canPlay ? (
                                                    <Lock className="w-3 h-3" />
                                                ) : isActive ? (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                                ) : null}
                                            </div>
                                            <span className="text-sm leading-tight">{lesson.title}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );

    return (
        <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
            {/* Mobile Sidebar Trigger */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button size="icon" variant="secondary" className="rounded-full bg-zinc-800 text-white border-zinc-700">
                            <Menu className="w-5 h-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 border-r-zinc-800 w-80 bg-zinc-900">
                        <SidebarContent />
                    </SheetContent>
                </Sheet>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden lg:block w-80 flex-shrink-0 h-full">
                <SidebarContent />
            </div>

            {/* Main Player Area */}
            <div className="flex-1 flex flex-col h-full overflow-y-auto">
                {/* Video Container */}
                <div className="w-full aspect-video bg-zinc-950 relative shadow-2xl">
                    {currentLesson?.video_url && canPlayLesson(currentLesson) ? (
                        <iframe
                            src={currentLesson.video_url.includes("youtube") ? currentLesson.video_url.replace("watch?v=", "embed/") : currentLesson.video_url}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title="Video Player"
                        />
                    ) : currentLesson && !canPlayLesson(currentLesson) ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 space-y-4">
                            <Lock className="w-16 h-16 opacity-20" />
                            <p className="text-lg font-bold">This lesson is locked</p>
                            <p className="text-sm">Enroll in the course to unlock all lessons</p>
                            <Button onClick={() => navigate(`/dashboard/courses/${id}`)} className="mt-4">
                                View Course Details
                            </Button>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 space-y-4">
                            <PlayCircle className="w-16 h-16 opacity-20" />
                            <p>Select a lesson to start watching</p>
                        </div>
                    )}
                </div>

                {/* Lesson Info & Navigation */}
                <div className="p-8 max-w-4xl mx-auto w-full flex-1">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-black tracking-tight mb-2 flex items-center gap-3">
                                {currentLesson?.title}
                                {currentLesson && !canPlayLesson(currentLesson) && (
                                    <Lock className="w-5 h-5 text-yellow-500" />
                                )}
                            </h1>
                            <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                <span className="bg-zinc-800 px-2 py-1 rounded text-xs font-mono">LESSON {currentIndex + 1}</span>
                                {currentLesson?.duration && <span>• {currentLesson.duration}</span>}
                                {currentLesson?.is_free_preview && !isApproved && (
                                    <span className="bg-green-500/20 text-green-500 px-2 py-1 rounded text-xs font-bold">FREE PREVIEW</span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                className="rounded-xl border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                                disabled={!prevLesson || !canPlayLesson(prevLesson)}
                                onClick={() => prevLesson && handleLessonClick(prevLesson)}
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                            </Button>
                            <Button
                                className="rounded-xl bg-white text-black hover:bg-zinc-200 font-bold"
                                disabled={!nextLesson || !canPlayLesson(nextLesson)}
                                onClick={() => nextLesson && handleLessonClick(nextLesson)}
                            >
                                Next Lesson <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>

                    {/* Notes / Description could go here */}
                </div>
            </div>
        </div>
    );
};

export default LearningPlayer;
