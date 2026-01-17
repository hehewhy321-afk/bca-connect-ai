import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Define the types for the props to ensure type safety and clarity
interface Feature {
    icon: React.ReactNode;
    title: string;
}

interface Benefit {
    icon: React.ReactNode;
    title: string;
}

export interface AppDownloadSectionProps {
    title: string;
    subtitle: string;
    features: Feature[];
    benefits: Benefit[];
    mainImageUrl: string;
    mainImageAlt: string;
    githubDownloadUrl?: string; // New prop for GitHub download link
    className?: string;
}

// Animation variants for Framer Motion
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: 'spring' as const,
            stiffness: 100,
        },
    },
};

const imageVariants = {
    hidden: { x: 50, opacity: 0, scale: 0.9 },
    visible: {
        x: 0,
        opacity: 1,
        scale: 1,
        transition: {
            type: 'spring' as const,
            duration: 1.2,
            bounce: 0.3,
        }
    }
}

export const AppDownloadSection = ({
    title,
    subtitle,
    features,
    benefits,
    mainImageUrl,
    mainImageAlt,
    githubDownloadUrl,
    className,
}: AppDownloadSectionProps) => {
    return (
        <section className={cn('w-full bg-background text-foreground py-16 lg:py-24 overflow-hidden', className)}>
            <motion.div
                className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center px-4"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={containerVariants}
            >
                {/* Left Content Column */}
                <div className="flex flex-col space-y-8">
                    <motion.div className="space-y-4" variants={itemVariants}>
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                            <span className="gradient-text-orange">{title.split(' ').slice(0, -1).join(' ')}</span>{' '}
                            <span className="text-foreground">{title.split(' ').slice(-1)}</span>
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-xl">{subtitle}</p>
                    </motion.div>

                    {/* Features Section */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                        {features.map((feature, index) => (
                            <motion.div key={index} className="flex flex-col items-center text-center space-y-3" variants={itemVariants}>
                                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
                                    {feature.icon}
                                </div>
                                <span className="text-sm font-semibold leading-tight">{feature.title}</span>
                            </motion.div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-8 pt-4">
                        {/* Benefits and Steps Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Benefits */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold mb-4">Why use the App?</h3>
                                {benefits.map((benefit, index) => (
                                    <motion.div key={index} className="flex items-center space-x-3 group" variants={itemVariants}>
                                        <div className='flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300'>
                                            {benefit.icon}
                                        </div>
                                        <span className="text-sm font-medium">{benefit.title}</span>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Installation Guide */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold mb-4">How to Install</h3>
                                <motion.div className="space-y-3" variants={itemVariants}>
                                    <div className="flex items-start gap-3">
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500/20 text-orange-500 text-xs font-bold shrink-0 mt-0.5">1</div>
                                        <p className="text-sm text-muted-foreground"><span className="text-foreground font-medium">Download APK:</span> Click the button below to get the installer.</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500/20 text-orange-500 text-xs font-bold shrink-0 mt-0.5">2</div>
                                        <p className="text-sm text-muted-foreground"><span className="text-foreground font-medium">Allow Sources:</span> Enable "Install from Unknown Sources" in settings.</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500/20 text-orange-500 text-xs font-bold shrink-0 mt-0.5">3</div>
                                        <p className="text-sm text-muted-foreground"><span className="text-foreground font-medium">Install:</span> Open the file and follow the prompts to complete.</p>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>

                    {/* GitHub Download Button */}
                    {githubDownloadUrl && (
                        <motion.div variants={itemVariants} className="pt-4">
                            <a
                                href={githubDownloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                            >
                                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                                Download Direct APK
                            </a>
                        </motion.div>
                    )}
                </div>

                {/* Right Image Column */}
                <motion.div className="flex items-center justify-center relative" variants={imageVariants}>
                    <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full -z-10 animate-pulse" />
                    <img
                        src={mainImageUrl}
                        alt={mainImageAlt}
                        className="max-w-md w-full h-auto object-contain drop-shadow-2xl"
                    />
                </motion.div>
            </motion.div>
        </section>
    );
};
