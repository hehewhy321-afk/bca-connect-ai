import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Loader2 } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  display_order: number;
}

export default function FAQ() {
  const { data: faqs, isLoading } = useQuery({
    queryKey: ["public-faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as FAQ[];
    },
  });

  // Group FAQs by category
  const groupedFaqs = faqs?.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-10 sm:pb-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-primary/10 mb-4 sm:mb-6">
              <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <h1 className="font-heading text-2xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4 px-2">
              Frequently Asked Questions
            </h1>
            <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto px-2">
              Find answers to common questions about BCA Association, our resources, events, and community.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-10 sm:py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !faqs || faqs.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No FAQs available at the moment.</p>
            </div>
          ) : (
            Object.entries(groupedFaqs || {}).map(([category, categoryFaqs], categoryIndex) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
                className="mb-6 sm:mb-10"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <h2 className="font-heading text-lg sm:text-2xl font-semibold text-foreground">
                    {category}
                  </h2>
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                  {categoryFaqs.map((faq, faqIndex) => (
                    <AccordionItem 
                      key={faq.id} 
                      value={`${category}-${faqIndex}`}
                      className="border border-border rounded-lg mb-2 sm:mb-3 px-3 sm:px-4 bg-card"
                    >
                      <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary text-sm sm:text-base py-3 sm:py-4">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-sm sm:text-base pb-3 sm:pb-4">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-10 sm:py-16 px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 sm:mb-4">
              Still Have Questions?
            </h2>
            <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base px-2">
              Can't find what you're looking for? Feel free to reach out to us.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors text-sm sm:text-base"
            >
              Contact Us
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
