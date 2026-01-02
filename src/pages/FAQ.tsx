import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, GraduationCap, Users, Calendar, BookOpen, MessageSquare } from "lucide-react";

const faqCategories = [
  {
    title: "General",
    icon: HelpCircle,
    faqs: [
      {
        question: "What is BCA Association MMAMC?",
        answer: "BCA Association MMAMC is a student-led organization at Madan Mohan Adhikari Memorial College, Nepal. We aim to bridge the gap between academic learning and industry requirements by providing resources, events, and networking opportunities for BCA students.",
      },
      {
        question: "Who can join the BCA Association?",
        answer: "All current BCA students and alumni of MMAMC College are welcome to join. We also welcome students from related IT programs who are interested in contributing to our community.",
      },
      {
        question: "How do I become a member?",
        answer: "Simply create an account on our platform using your email. Once registered, you'll have access to all member benefits including resources, events, and the community forum.",
      },
    ],
  },
  {
    title: "Academics",
    icon: GraduationCap,
    faqs: [
      {
        question: "What study materials are available?",
        answer: "We provide comprehensive study materials including lecture notes, past exam papers, project repositories, and interview preparation guides organized by semester and subject.",
      },
      {
        question: "How can I access past papers?",
        answer: "Past papers are available in the Resources section. Simply navigate to Resources, filter by 'Past Papers', and select your desired semester and subject.",
      },
      {
        question: "Can I contribute study materials?",
        answer: "Yes! We encourage members to contribute quality study materials. You can upload your notes, projects, or any educational content through your dashboard.",
      },
    ],
  },
  {
    title: "Events",
    icon: Calendar,
    faqs: [
      {
        question: "How do I register for events?",
        answer: "Log in to your account, navigate to the Events section, find the event you're interested in, and click the 'Register' button. You'll receive a confirmation email with event details.",
      },
      {
        question: "Are events free for members?",
        answer: "Most of our events are free for registered members. Some special workshops or seminars may have a nominal fee which will be clearly mentioned in the event details.",
      },
      {
        question: "Can I suggest event topics?",
        answer: "Absolutely! We value member input. You can suggest event topics through our forum or by contacting us directly. We regularly organize events based on member interests.",
      },
    ],
  },
  {
    title: "Community",
    icon: Users,
    faqs: [
      {
        question: "How does the forum work?",
        answer: "Our forum is a space for members to discuss topics, ask questions, and share knowledge. You can create posts, comment on others' posts, and upvote helpful content.",
      },
      {
        question: "What are XP points and levels?",
        answer: "XP (Experience Points) are earned through various activities like attending events, contributing resources, and participating in the forum. As you accumulate XP, you level up and unlock achievements.",
      },
      {
        question: "How can I connect with alumni?",
        answer: "Our platform features alumni profiles in the Community section. You can view their profiles, see their career paths, and connect with them for mentorship and networking.",
      },
    ],
  },
  {
    title: "Technical Support",
    icon: MessageSquare,
    faqs: [
      {
        question: "I forgot my password. How can I reset it?",
        answer: "Click on the 'Forgot Password' link on the login page. Enter your registered email address, and we'll send you a password reset link.",
      },
      {
        question: "How do I update my profile?",
        answer: "Go to Dashboard > Settings to update your profile information including your bio, skills, social links, and profile picture.",
      },
      {
        question: "Who do I contact for technical issues?",
        answer: "For technical issues, you can reach out through our Contact Us page or email us directly at bca@mmamc.edu.np. Our support team typically responds within 24 hours.",
      },
    ],
  },
];

export default function FAQ() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <HelpCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Find answers to common questions about BCA Association, our resources, events, and community.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {faqCategories.map((category, categoryIndex) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
              className="mb-10"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <category.icon className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-heading text-2xl font-semibold text-foreground">
                  {category.title}
                </h2>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                {category.faqs.map((faq, faqIndex) => (
                  <AccordionItem 
                    key={faqIndex} 
                    value={`${category.title}-${faqIndex}`}
                    className="border border-border rounded-lg mb-3 px-4 bg-card"
                  >
                    <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-4">
              Still Have Questions?
            </h2>
            <p className="text-muted-foreground mb-6">
              Can't find what you're looking for? Feel free to reach out to us.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
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
