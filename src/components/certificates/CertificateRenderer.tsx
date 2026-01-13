import React from "react";
import { Certificate } from "@/hooks/useCertificates";
import { SportsCertificate } from "./SportsCertificate";
import { CodeCertificate } from "./CodeCertificate";

interface CertificateRendererProps {
    certificate: Certificate;
    userName: string;
}

export function CertificateRenderer({ certificate, userName }: CertificateRendererProps) {
    if (!certificate.template) {
        return (
            <div className="w-full h-96 flex items-center justify-center bg-muted rounded-lg">
                <p className="text-muted-foreground">No template selected</p>
            </div>
        );
    }

    switch (certificate.template.type) {
        case "sports":
            return <SportsCertificate certificate={certificate} userName={userName} />;
        case "code":
            return <CodeCertificate certificate={certificate} userName={userName} />;
        default:
            return (
                <div className="w-full h-96 flex items-center justify-center bg-muted rounded-lg">
                    <p className="text-muted-foreground">Unknown template type</p>
                </div>
            );
    }
}
