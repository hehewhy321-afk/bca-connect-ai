import React from "react";
import { Code, Terminal, Laptop, Trophy, ShieldCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Certificate } from "@/hooks/useCertificates";
import logoImg from "@/assets/logo.jpg";

interface CodeCertificateProps {
    certificate: Certificate;
    userName: string;
}

export function CodeCertificate({ certificate, userName }: CodeCertificateProps) {
    return (
        <div className="w-[1056px] h-[816px] bg-slate-50 relative overflow-hidden print:shadow-none shadow-2xl font-sans">
            {/* Base Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#0f172a 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
            </div>

            {/* Main Border */}
            <div className="absolute inset-0 border-[32px] border-slate-900/5">
                <div className="absolute inset-0 border-[2px] border-primary/20 m-4"></div>
            </div>

            {/* Corner Brackets */}
            <div className="absolute top-12 left-12 text-6xl font-mono text-primary/20 mt-4 ml-4">{"{"}</div>
            <div className="absolute top-12 right-12 text-6xl font-mono text-primary/20 mt-4 mr-4">{"}"}</div>
            <div className="absolute bottom-12 left-12 text-6xl font-mono text-primary/20 mb-4 ml-4">{"<"}</div>
            <div className="absolute bottom-12 right-12 text-6xl font-mono text-primary/20 mb-4 mr-4">{"/>"}</div>

            {/* Content Container */}
            <div className="relative z-10 w-full h-full flex flex-col items-center px-24 py-16">

                {/* Header Section */}
                <div className="w-full flex justify-between items-start mb-12">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-primary/20 shadow-lg">
                            <img src={logoImg} alt="BCA Logo" className="w-full h-full object-cover" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-black text-slate-900 text-lg leading-tight uppercase tracking-tighter">
                                BCA Association
                            </h3>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">
                                MMAMC College Nepal
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Title Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-4 mb-4">
                        <div className="h-px w-12 bg-primary/30"></div>
                        <h1 className="text-6xl font-black text-slate-900 tracking-[-0.04em] font-mono">
                            &lt;CERTIFICATE/&gt;
                        </h1>
                        <div className="h-px w-12 bg-primary/30"></div>
                    </div>
                    <p className="text-sm font-bold text-primary uppercase tracking-[0.4em] mb-2 opacity-80">
                        Official Recognition of Excellence
                    </p>
                </div>

                {/* Recipient Section - OPEN TERMINAL STYLE */}
                <div className="w-full max-w-4xl mb-12 relative">
                    <div className="text-left font-mono space-y-2">
                        {/* Variable Declaration Line */}
                        <div className="flex items-center gap-3 text-slate-500 text-sm ml-2">
                            <span className="select-none text-slate-400">01</span>
                            <p>
                                <span className="text-purple-600 font-bold">const</span>{" "}
                                <span className="text-blue-600 font-bold">recipient</span> =
                            </p>
                        </div>

                        {/* Name Value - Massive & Open */}
                        <div className="relative group">
                            <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-slate-300 font-mono text-4xl">{">"}</span>
                            </div>
                            <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-tight break-words whitespace-normal py-2 px-4 border-l-4 border-primary/20 bg-primary/5 rounded-r-xl">
                                "{userName || "Pending..."}"<span className="text-slate-400">;</span>
                            </h2>
                        </div>

                        {/* Date Line */}
                        <div className="flex items-center gap-3 text-slate-500 text-sm mt-4 ml-2">
                            <span className="select-none text-slate-400">02</span>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-purple-600 font-bold">const</span>
                                <span className="text-blue-600 font-bold">issuedAt</span> =
                                <span className="text-emerald-600 font-bold">
                                    "{new Date(certificate.event_date).toLocaleDateString("en-US", {
                                        month: "long",
                                        day: "numeric",
                                        year: "numeric",
                                    })}"
                                </span>;
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body Text */}
                <div className="text-center mb-12 max-w-2xl px-4">
                    <p className="text-slate-600 leading-relaxed mb-4">
                        This document serves as formal evidence that the aforementioned individual has
                        successfully met all criteria and requirements for the completion of
                    </p>
                    <h2 className="text-4xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                        {certificate.title}
                    </h2>
                    <div className="h-0.5 w-16 bg-primary mx-auto mb-4"></div>
                </div>

            </div>

            {/* Bottom Section: Signatures & QR - ABSOLUTE POSITIONING TO FIX LOCATION */}
            <div className="absolute bottom-12 left-0 right-0 px-24 pb-4">
                <div className="w-full flex items-end justify-between border-t border-slate-200 pt-8">
                    {/* Authorized Signature - FIXED ALIGNMENT */}
                    <div className="w-1/3 text-left">
                        {certificate.signature ? (
                            <div className="w-56 flex flex-col items-center">
                                <div className="h-20 w-full flex items-center justify-center mb-2">
                                    <img
                                        src={certificate.signature.signature_url}
                                        alt="Signature"
                                        className="max-h-full max-w-full object-contain mix-blend-multiply"
                                    />
                                </div>
                                <div className="h-0.5 w-full bg-slate-900 mb-2"></div>
                                <p className="font-bold text-slate-900 text-sm uppercase text-center w-full">
                                    {certificate.signature.name}
                                </p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-center w-full">
                                    {certificate.signature.title}
                                </p>
                            </div>
                        ) : (
                            <div className="w-56 border-t border-slate-300 pt-2 text-center">
                                <p className="text-[10px] text-slate-400 font-bold uppercase italic">
                                    Signature Pending
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Official Stamp/Badge */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-20 h-20 rounded-full border-4 border-double border-primary/40 flex items-center justify-center bg-white shadow-inner">
                            <ShieldCheck className="w-10 h-10 text-primary" />
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Verified Achievement
                        </span>
                    </div>

                    {/* QR Verification */}
                    <div className="w-1/3 flex flex-col items-end">
                        <div className="p-2 bg-white border border-slate-200 rounded-xl shadow-lg mb-2">
                            <QRCodeSVG
                                value={`${window.location.origin}/verify/${certificate.verification_code}`}
                                size={72}
                                level="H"
                            />
                        </div>
                        <p className="text-[10px] font-mono font-bold text-primary/60">
                            ID: {certificate.verification_code}
                        </p>
                    </div>
                </div>
            </div>

            {/* Decorative Overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none scale-150">
                <Code className="w-96 h-96 text-slate-900" />
            </div>
        </div>
    );
}
