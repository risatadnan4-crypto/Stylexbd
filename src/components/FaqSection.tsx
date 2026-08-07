import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, HelpCircle, MessageSquare } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

export default function FaqSection() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    // Attempt to dynamically parse index.html schema
    const parseFaqSchema = () => {
      try {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of Array.from(scripts)) {
          if (!script.textContent) continue;
          const parsed = JSON.parse(script.textContent);
          if (parsed && parsed['@type'] === 'FAQPage' && Array.isArray(parsed.mainEntity)) {
            const items: FaqItem[] = parsed.mainEntity.map((item: any) => ({
              question: item.name || '',
              answer: item.acceptedAnswer?.text || ''
            })).filter((item: FaqItem) => item.question && item.answer);

            if (items.length > 0) {
              return items;
            }
          }
        }
      } catch (error) {
        console.error('Failed to parse FAQ schema from index.html:', error);
      }
      return null;
    };

    const parsedFaqs = parseFaqSchema();
    if (parsedFaqs && parsedFaqs.length > 0) {
      setFaqs(parsedFaqs);
    } else {
      // Robust static fallback representing the identical schema structure in index.html
      setFaqs([
        {
          question: "What is the delivery timeline for Style X products?",
          answer: "Style X offers super fast delivery across Bangladesh. Inner-Dhaka orders are dispatched and delivered within 24 to 48 hours, while outer-Dhaka orders take 2 to 3 business days."
        },
        {
          question: "Does Style X support Cash on Delivery?",
          answer: "Yes! Style X provides secure Cash on Delivery (COD) services nationwide. Customers can inspect their packages physically before completing the payment handoff."
        },
        {
          question: "Are the garments from Style X authentic?",
          answer: "Every single garment and lifestyle item in the Style X collection is 100% authentic, curated carefully, and tagged with high-integrity custom luxury tags."
        },
        {
          question: "How can I contact Style X customer support?",
          answer: "Our elite private concierge is available 24/7 on WhatsApp (+8801755104443). Additionally, you can chat with our interactive AI assistant, Xoro, directly on the Style X platform."
        }
      ]);
    }
  }, []);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (faqs.length === 0) return null;

  return (
    <section id="faq-section" className="bg-[#050505] border-t border-white/5 py-20 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 bg-luxury-gold/10 border border-luxury-gold/20 px-3 py-1 rounded-full text-[10px] font-mono text-luxury-gold tracking-widest uppercase">
            <HelpCircle className="w-3 h-3 animate-pulse" />
            <span>Concierge FAQ</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-serif text-white tracking-wider">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-white/50 max-w-lg mx-auto font-light leading-relaxed">
            Discover standard timelines, operational integrity details, and instant concierge support access coordinates.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`border rounded-lg transition-all duration-300 ${
                  isOpen 
                    ? 'bg-[#080808] border-luxury-gold/30 shadow-[0_0_15px_rgba(212,175,55,0.05)]' 
                    : 'bg-transparent border-white/5 hover:border-white/10'
                }`}
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="font-serif text-sm md:text-base text-zinc-100 font-medium tracking-wide">
                    {faq.question}
                  </span>
                  <div className={`p-1.5 rounded-full border bg-white/5 transition-all duration-300 ${
                    isOpen ? 'border-luxury-gold/50 text-luxury-gold' : 'border-white/5 text-white/40'
                  }`}>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-1 text-xs md:text-sm text-zinc-400 font-light leading-relaxed border-t border-white/5 mt-1">
                        <p>{faq.answer}</p>
                        {faq.question.toLowerCase().includes('contact') && (
                          <div className="mt-4 flex flex-wrap gap-3">
                            <a 
                              href="https://wa.me/8801755104443" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 text-xs text-[#25D366] transition-all font-mono"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Conierge WhatsApp</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
