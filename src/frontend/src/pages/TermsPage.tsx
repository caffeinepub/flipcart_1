import { ScrollText } from "lucide-react";

const TERMS_SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    content:
      "By accessing or using ShopExpo, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not access our platform. These terms apply to all visitors, users, and others who access or use the service.",
  },
  {
    title: "2. Use of the Platform",
    content:
      "ShopExpo grants you a limited, non-exclusive, non-transferable license to access and use the platform for personal, non-commercial purposes. You agree not to use the platform for any unlawful purpose, to harm others, or to infringe on any intellectual property rights. We reserve the right to suspend or terminate access for any violation.",
  },
  {
    title: "3. Account Registration",
    content:
      "To access certain features, you must create an account via Internet Identity. You are responsible for maintaining the confidentiality of your account and for all activities under your account. You agree to provide accurate, complete, and current information and to update it as necessary.",
  },
  {
    title: "4. Orders & Purchases",
    content:
      "When you place an order, you are making an offer to purchase the product at the listed price. We reserve the right to accept or decline any order. Prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise. We reserve the right to cancel orders in case of pricing errors or stock issues.",
  },
  {
    title: "5. Payments",
    content:
      "We accept payments via Sky Pay (UPI) and Stripe (Credit/Debit Cards). All transactions are processed securely. We do not store your payment credentials. In case of payment failure, the amount will be refunded within 5–7 business days. Disputed charges should be reported within 30 days.",
  },
  {
    title: "6. Shipping & Delivery",
    content:
      "Delivery timelines are estimates and may vary due to logistics, weather, or other factors beyond our control. We are not liable for delays by third-party delivery partners. Title and risk of loss for purchased products pass to you upon delivery.",
  },
  {
    title: "7. Returns & Refunds",
    content:
      "Our return policy allows returns within 30 days of delivery for eligible products. Items must be unused, in original packaging, and with all accessories. Certain categories including perishables and hygiene products are non-returnable. Refunds are processed within 5–7 business days after inspection.",
  },
  {
    title: "8. Privacy",
    content:
      "Your use of ShopExpo is also governed by our Privacy Policy, which is incorporated into these Terms. By using the platform, you consent to the collection and use of your data as described in the Privacy Policy.",
  },
  {
    title: "9. Intellectual Property",
    content:
      "All content on ShopExpo, including logos, text, graphics, and software, is the property of ShopExpo or its content suppliers. You may not reproduce, distribute, or create derivative works without prior written permission.",
  },
  {
    title: "10. Limitation of Liability",
    content:
      "ShopExpo is not liable for any indirect, incidental, special, or consequential damages arising from your use of the platform. Our total liability to you for any claim shall not exceed the amount paid for the specific order in question.",
  },
  {
    title: "11. Changes to Terms",
    content:
      "We reserve the right to modify these terms at any time. Changes will be posted on this page with an updated effective date. Your continued use of the platform after changes constitutes acceptance of the new terms.",
  },
  {
    title: "12. Contact Us",
    content:
      "For any questions about these Terms, please contact us at legal@shopexpo.in or write to: ShopExpo Legal Team, India. We aim to respond to all legal inquiries within 5 business days.",
  },
];

export function TermsPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-brand-navy/10 flex items-center justify-center mx-auto mb-4">
          <ScrollText className="w-8 h-8 text-brand-navy" />
        </div>
        <h1 className="font-display font-bold text-3xl md:text-4xl mb-3">
          Terms &amp; Conditions
        </h1>
        <p className="text-muted-foreground text-sm">
          Last updated: January 2026 · Effective date: January 1, 2026
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-8 text-sm text-amber-800">
        Please read these terms carefully before using ShopExpo. By using our
        platform, you agree to be bound by these terms.
      </div>

      <div className="space-y-6">
        {TERMS_SECTIONS.map((section) => (
          <div
            key={section.title}
            className="bg-white rounded-xl border border-border p-5"
          >
            <h2 className="font-display font-bold text-base mb-2 text-foreground">
              {section.title}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {section.content}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center text-xs text-muted-foreground">
        <p>
          These terms were last updated on January 1, 2026. For questions,
          contact{" "}
          <span className="text-brand-orange font-medium">
            legal@shopexpo.in
          </span>
        </p>
      </div>
    </main>
  );
}
