import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { HelpCircle, Search } from "lucide-react";
import { useState } from "react";

const FAQ_DATA = [
  {
    category: "Shipping & Delivery",
    color: "bg-blue-100 text-blue-700",
    items: [
      {
        q: "How long does delivery take?",
        a: "Standard delivery takes 3–7 business days. Express delivery is available for select pincodes and takes 1–2 business days. You'll receive a tracking number once your order ships.",
      },
      {
        q: "Is free delivery available?",
        a: "Yes! Orders above ₹499 qualify for free standard delivery. For orders below ₹499, a delivery charge of ₹49 applies.",
      },
      {
        q: "Can I change my delivery address after placing an order?",
        a: "You can change your delivery address within 1 hour of placing the order. After that, the order is handed over to our delivery partner and address changes may not be possible. Please contact support immediately if needed.",
      },
      {
        q: "Do you deliver to all pincodes in India?",
        a: "We deliver to most major cities and towns across India. Enter your pincode during checkout to check delivery availability. We're constantly expanding our delivery network.",
      },
    ],
  },
  {
    category: "Returns & Refunds",
    color: "bg-green-100 text-green-700",
    items: [
      {
        q: "What is the return policy?",
        a: "We offer a 30-day hassle-free return policy for most products. Items must be unused, in original packaging with all tags intact. Electronics and certain categories may have different return windows.",
      },
      {
        q: "How do I initiate a return?",
        a: "Go to My Orders, select the order, and click 'Return/Refund'. Our team will schedule a pickup from your address within 2–3 business days. You can also contact our support for assistance.",
      },
      {
        q: "When will I receive my refund?",
        a: "Refunds are processed within 5–7 business days after we receive and inspect the returned item. The amount is credited to your original payment method. UPI/wallet refunds typically appear faster.",
      },
    ],
  },
  {
    category: "Payments",
    color: "bg-purple-100 text-purple-700",
    items: [
      {
        q: "What payment methods are accepted?",
        a: "We accept all major payment methods: UPI via Sky Pay, Credit/Debit cards (Visa, Mastercard, RuPay), Net Banking, and Stripe for international cards. Cash on Delivery is available for select pincodes.",
      },
      {
        q: "Is it safe to save my card details?",
        a: "We do not store your card details on our servers. All card transactions are processed by Stripe, which is PCI DSS Level 1 certified — the highest level of payment security.",
      },
      {
        q: "Can I pay using EMI?",
        a: "EMI options are available on orders above ₹3,000 for select credit cards. EMI options will be shown during the card payment step at checkout.",
      },
    ],
  },
  {
    category: "Account & Orders",
    color: "bg-orange-100 text-orange-700",
    items: [
      {
        q: "How do I track my order?",
        a: "Go to My Orders and click on the order you want to track. You'll see a detailed tracking timeline showing the current status — from Order Placed to Out for Delivery.",
      },
      {
        q: "Can I cancel my order?",
        a: "Yes, you can cancel an order as long as it hasn't been shipped. Go to My Orders, select the order, and click 'Cancel Order'. Once shipped, orders cannot be cancelled but can be returned after delivery.",
      },
      {
        q: "How do I update my delivery address in my profile?",
        a: "Go to My Account → Personal Information → Edit. Update your address and save. You can also save multiple addresses in the 'Saved Addresses' section for quick checkout.",
      },
    ],
  },
  {
    category: "Products",
    color: "bg-teal-100 text-teal-700",
    items: [
      {
        q: "Are all products genuine?",
        a: "Yes, ShopExpo only lists authentic products from verified sellers and brands. All electronics come with official manufacturer warranties. If you receive a counterfeit product, we'll issue a full refund.",
      },
      {
        q: "How do I find the right size for clothing?",
        a: "Each clothing product page has a detailed size chart. We recommend measuring yourself and comparing with the size chart before purchasing. Check the product description for brand-specific sizing notes.",
      },
    ],
  },
];

export function FAQPage() {
  const [search, setSearch] = useState("");

  const filtered = FAQ_DATA.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) =>
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase()),
    ),
  })).filter((section) => section.items.length > 0);

  const totalCount = FAQ_DATA.reduce((s, c) => s + c.items.length, 0);

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-brand-orange/10 flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-8 h-8 text-brand-orange" />
        </div>
        <h1 className="font-display font-bold text-3xl md:text-4xl mb-3">
          Frequently Asked Questions
        </h1>
        <p className="text-muted-foreground text-base max-w-md mx-auto">
          Find answers to the most common questions about ShopExpo. We're here
          to help!
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-10 h-11 text-base"
          placeholder={`Search ${totalCount} questions...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-ocid="faq.search_input"
        />
      </div>

      {/* FAQ Sections */}
      {filtered.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="faq.empty_state"
        >
          <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No results for "{search}"</p>
          <p className="text-sm mt-1">Try different keywords</p>
        </div>
      ) : (
        <div className="space-y-8">
          {filtered.map((section) => (
            <div key={section.category}>
              <div className="flex items-center gap-2 mb-4">
                <Badge className={`${section.color} border-0 font-semibold`}>
                  {section.category}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {section.items.length} question
                  {section.items.length !== 1 ? "s" : ""}
                </span>
              </div>
              <Accordion type="single" collapsible className="space-y-2">
                {section.items.map((item, i) => (
                  <AccordionItem
                    key={item.q}
                    value={`${section.category}-${i}`}
                    className="bg-white border border-border rounded-xl px-4 data-[state=open]:border-brand-orange/30 data-[state=open]:shadow-sm transition-all"
                    data-ocid={`faq.item.${i + 1}`}
                  >
                    <AccordionTrigger className="text-left font-semibold text-sm py-4 hover:no-underline hover:text-brand-orange">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      )}

      {/* Contact CTA */}
      <div className="mt-12 bg-gradient-to-r from-brand-navy to-blue-900 rounded-2xl p-6 text-white text-center">
        <h3 className="font-display font-bold text-lg mb-2">
          Still have questions?
        </h3>
        <p className="text-white/70 text-sm mb-4">
          Our support team is available 24/7 to help you
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <span className="bg-white/10 text-white text-sm font-medium px-4 py-2 rounded-lg">
            support@shopexpo.in
          </span>
          <span className="bg-brand-orange text-white text-sm font-medium px-4 py-2 rounded-lg">
            24/7 Live Chat
          </span>
        </div>
      </div>
    </main>
  );
}
