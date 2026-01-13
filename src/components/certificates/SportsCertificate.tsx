import React from "react";
import { Trophy, Award, Medal, Star, ShieldCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Certificate } from "@/hooks/useCertificates";
import logoImg from "@/assets/logo.jpg";

interface SportsCertificateProps {
    certificate: Certificate;
    userName: string;
}

export function SportsCertificate({ certificate, userName }: SportsCertificateProps) {
    return (
        <div className="w-[1056px] h-[816px] bg-white relative overflow-hidden print:shadow-none shadow-2xl font-serif">
            {/* Elegant Background Pattern */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-primary/20 to-transparent"></div>
            </div>

            {/* Decorative Borders */}
            <div className="absolute inset-0 border-[32px] border-primary/5">
                <div className="absolute inset-0 border-[4px] border-primary/20 m-4"></div>
                <div className="absolute inset-0 border-[1px] border-primary/40 m-8"></div>
            </div>

            {/* Corner Ornaments */}
            <div className="absolute top-12 left-12 w-24 h-24 border-t-4 border-l-4 border-primary/30"></div>
            <div className="absolute top-12 right-12 w-24 h-24 border-t-4 border-r-4 border-primary/30"></div>
            <div className="absolute bottom-12 left-12 w-24 h-24 border-b-4 border-l-4 border-primary/30"></div>
            <div className="absolute bottom-12 right-12 w-24 h-24 border-b-4 border-r-4 border-primary/30"></div>

            {/* Decorative Stars */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 flex gap-4 text-primary/20">
                <Star size={24} fill="currentColor" />
                <Star size={32} fill="currentColor" />
                <Star size={24} fill="currentColor" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full h-full flex flex-col items-center px-24 py-16">

                {/* Header: Logo and Title */}
                <div className="w-full flex justify-between items-start mb-16">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 shadow-xl bg-white">
                            <img src={logoImg} alt="BCA Logo" className="w-full h-full object-cover" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-serif font-black text-slate-800 text-lg leading-tight tracking-tight uppercase">
                                BCA Association
                            </h3>
                            <p className="text-[10px] text-primary font-bold uppercase tracking-[0.3em]">
                                Excellence in Sports
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Header */}
                <div className="text-center mb-10">
                    <h1 className="text-7xl font-serif font-black text-slate-900 mb-2 tracking-widest uppercase">
                        CERTIFICATE
                    </h1>
                    <div className="flex items-center justify-center gap-4">
                        <div className="h-1 w-20 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
                        <p className="text-2xl font-bold text-primary uppercase tracking-[0.5em]">
                            Of Achievement
                        </p>
                        <div className="h-1 w-20 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
                    </div>
                </div>

                {/* Presented To */}
                <div className="text-center mb-10">
                    <p className="text-lg text-slate-500 font-serif italic mb-4">
                        This is highly proud to present this certificate to
                    </p>
                    <h2 className="text-5xl font-black text-slate-900 mb-2 relative inline-block px-12">
                        {userName || "Pending Generation..."}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/20"></div>
                    </h2>
                </div>

                {/* Achievement Details */}
                <div className="text-center mb-12 max-w-2xl">
                    <p className="text-lg text-slate-600 leading-relaxed max-w-lg mx-auto mb-6">
                        For outstanding athletic performance and demonstrating
                        exceptional sportsmanship in the event of
                    </p>
                    <div className="px-8 py-4 bg-primary/5 rounded-2xl border border-primary/10 inline-block">
                        <h3 className="text-3xl font-black text-primary uppercase tracking-tight">
                            {certificate.title}
                        </h3>
                    </div>
                    {certificate.description && (
                        <p className="text-base text-slate-500 italic mt-6 max-w-md mx-auto">
                            "{certificate.description}"
                        </p>
                    )}
                </div>

                {/* Date and Category Information */}
                <div className="flex items-center gap-16 mb-12">
                    <div className="text-center">
                        <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-bold mb-1">
                            Event Date
                        </p>
                        <p className="text-xl font-bold text-slate-800">
                            {new Date(certificate.event_date).toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                            })}
                        </p>
                    </div>
                    <div className="h-12 w-px bg-slate-200"></div>
                    {certificate.category && (
                        <div className="text-center">
                            <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-bold mb-1">
                                Competition
                            </p>
                            <p className="text-xl font-bold text-primary">
                                {certificate.category.name}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Section: Signatures and QR */}
                <div className="mt-auto w-full flex items-end justify-between px-4">
                    {/* Authorized Signature */}
                    <div className="w-1/3 text-left">
                        {certificate.signature ? (
                            <div className="inline-block">
                                <div className="h-16 flex items-center mb-1 px-2">
                                    <img
                                        src={certificate.signature.signature_url}
                                        alt="Signature"
                                        className="max-h-full max-w-[200px] object-contain mix-blend-multiply"
                                    />
                                </div>
                                <div className="h-0.5 w-full bg-slate-800 mb-2"></div>
                                <p className="font-bold text-slate-900 text-sm">
                                    {certificate.signature.name}
                                </p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                    {certificate.signature.title}
                                </p>
                            </div>
                        ) : (
                            <div className="border-t border-slate-300 pt-2 w-48">
                                <p className="text-[10px] text-slate-400 font-bold uppercase italic">
                                    Signature Pending
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Badge */}
                    <div className="flex flex-col items-center gap-2 pb-2">
                        <div className="w-20 h-20 rounded-full border-4 border-double border-primary/40 flex items-center justify-center bg-white shadow-xl relative backdrop-blur-sm">
                            <Trophy className="w-10 h-10 text-primary" />
                            <div className="absolute -bottom-1 bg-primary text-[8px] text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-md">
                                Official
                            </div>
                        </div>
                    </div>

                    {/* QR Code Verification */}
                    <div className="w-1/3 flex flex-col items-end">
                        <div className="p-2 bg-white border-2 border-slate-100 rounded-xl shadow-lg mb-2">
                            <QRCodeSVG
                                value={`${window.location.origin}/verify/${certificate.verification_code}`}
                                size={72}
                                level="H"
                            />
                        </div>
                        <p className="text-[9px] font-mono font-bold text-slate-500 uppercase">
                            Verify ID: {certificate.verification_code}
                        </p>
                    </div>
                </div>
            </div>

            {/* Background Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none scale-[2.5] rotate-[15deg]">
                <Award className="w-96 h-96 text-primary" />
            </div>
        </div>
    );
}
