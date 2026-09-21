import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube
} from "lucide-react";

export default function Contact() {
  const { toast } = useToast();
  const { data: settings } = useWebsiteSettings();
  const reduceMotion = useReducedMotion();

  const contactInfo = [
    {
      icon: MapPin,
      title: "Address",
      details: (settings?.address || "MMAMC College, Biratnagar, Nepal")
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
    },
    {
      icon: Mail,
      title: "Email",
      details: [settings?.email_primary, settings?.email_secondary].filter(Boolean) as string[],
    },
    {
      icon: Phone,
      title: "Phone",
      details: [settings?.phone].filter(Boolean) as string[],
    },
    {
      icon: Clock,
      title: "Office Hours",
      details: ["Sunday - Friday", "10:00 AM - 5:00 PM"],
    },
  ].filter((info) => info.details.length > 0);

  const socialLinks = [
    { icon: Facebook, href: settings?.facebook_url, label: "Facebook" },
    { icon: Instagram, href: settings?.instagram_url, label: "Instagram" },
    { icon: Twitter, href: settings?.twitter_url, label: "Twitter" },
    { icon: Linkedin, href: settings?.linkedin_url, label: "LinkedIn" },
    { icon: Youtube, href: settings?.youtube_url, label: "YouTube" },
  ].filter((social) => Boolean(social.href));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('contact_submissions')
        .insert({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          subject: formData.subject.trim(),
          message: formData.message.trim(),
        });

      if (error) throw error;

      toast({
        title: "Message Sent!",
        description: "Thank you for contacting us. We'll get back to you soon.",
      });

      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-6 pb-20 pt-28 sm:pt-32">
        {/* Hero */}
        <motion.header
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-2xl"
        >
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Contact <span className="italic text-primary">us</span>
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Questions about events, the study library, or joining the association? Send a
            message and someone will get back to you.
          </p>
        </motion.header>

        {/* Form + details */}
        <div className="mt-10 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[1.15fr_1fr]">
          {/* Form */}
          <motion.section
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="flex h-full flex-col rounded-lg border border-border bg-card p-5 sm:p-6"
          >
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Send us a message
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Fields marked with * are required.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-1 flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm">Your name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="h-10 rounded-md"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm">Email address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="h-10 rounded-md"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm">Phone number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+977 9800000000"
                    value={formData.phone}
                    onChange={handleChange}
                    className="h-10 rounded-md"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subject" className="text-sm">Subject *</Label>
                  <Input
                    id="subject"
                    name="subject"
                    placeholder="What is this about?"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="h-10 rounded-md"
                  />
                </div>
              </div>

              <div className="flex flex-1 flex-col space-y-1.5">
                <Label htmlFor="message" className="text-sm">Message *</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Tell us what you need"
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="min-h-[140px] flex-1 rounded-md"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-10 w-full rounded-md font-semibold sm:w-auto sm:px-6"
              >
                {isSubmitting ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" aria-hidden />
                    Send message
                  </>
                )}
              </Button>
            </form>
          </motion.section>

          {/* Details */}
          <motion.aside
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex h-full flex-col"
          >
            <section className="flex h-full flex-col rounded-lg border border-border bg-card p-5 sm:p-6">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Get in touch
              </h2>

              <dl className="mt-5 divide-y divide-border">
                {contactInfo.map((info) => (
                  <div key={info.title} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <info.icon className="h-[18px] w-[18px]" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-sm font-semibold text-foreground">{info.title}</dt>
                      <dd className="mt-0.5 space-y-0.5">
                        {info.details.map((detail, i) => (
                          <p key={i} className="break-words text-sm text-muted-foreground">
                            {info.title === "Email" ? (
                              <a href={`mailto:${detail}`} className="transition-colors hover:text-primary">
                                {detail}
                              </a>
                            ) : info.title === "Phone" ? (
                              <a href={`tel:${detail.replace(/\s/g, "")}`} className="transition-colors hover:text-primary">
                                {detail}
                              </a>
                            ) : (
                              detail
                            )}
                          </p>
                        ))}
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>

              {socialLinks.length > 0 && (
                <div className="mt-5 border-t border-border pt-5">
                  <h3 className="text-sm font-semibold text-foreground">Follow us</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Updates and announcements as they happen.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    {socialLinks.map((social) => (
                      <a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.label}
                        className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <social.icon className="h-[18px] w-[18px]" aria-hidden />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </section>

          </motion.aside>
        </div>

        {/* Map spans the full width under the two columns */}
        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-6 overflow-hidden rounded-lg border border-border bg-card"
        >
          <h2 className="border-b border-border px-5 py-4 font-heading text-lg font-semibold text-foreground sm:px-6">
            Find us
          </h2>
            <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3571.8977654589453!2d87.27679867543865!3d26.454047976908867!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39ef744e8c5f1b47%3A0x5f0be6c0a1d9c8e9!2sMMAMC%20Biratnagar!5e0!3m2!1sen!2snp!4v1704067200000!5m2!1sen!2snp"
            width="100%"
            height="420"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="MMAMC College location"
            className="block w-full"
            />
        </motion.section>
      </main>

      <Footer />
    </div>
  );
}
