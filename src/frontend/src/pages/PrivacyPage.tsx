import { Shield } from "lucide-react";

const PRIVACY_SECTIONS = [
  {
    title: "Information We Collect",
    items: [
      {
        subtitle: "Account Information",
        text: "When you create an account via Internet Identity, we receive a pseudonymous principal ID. If you update your profile, we collect your name, email address, phone number, and delivery address.",
      },
      {
        subtitle: "Order & Transaction Data",
        text: "We collect details of purchases you make, including items ordered, prices, delivery addresses, and payment method type (not card details). This is used to process and fulfill your orders.",
      },
      {
        subtitle: "Usage Data",
        text: "We collect information about how you interact with ShopExpo, including pages visited, search queries, products viewed, and actions taken. This helps us improve the platform.",
      },
      {
        subtitle: "Device & Technical Data",
        text: "We may collect your IP address, browser type, device type, and operating system for security and analytics purposes.",
      },
    ],
  },
  {
    title: "How We Use Your Information",
    items: [
      {
        subtitle: "Order Fulfillment",
        text: "Your information is used to process orders, arrange delivery, send order updates, and handle returns and refunds.",
      },
      {
        subtitle: "Customer Support",
        text: "We use your contact information to respond to your queries and resolve issues with orders or the platform.",
      },
      {
        subtitle: "Platform Improvement",
        text: "Aggregated and anonymized usage data helps us improve our product catalog, search, and user experience.",
      },
      {
        subtitle: "Marketing Communications",
        text: "With your consent, we may send promotional emails about deals, new products, and special offers. You can unsubscribe at any time.",
      },
    ],
  },
  {
    title: "Cookies",
    items: [
      {
        subtitle: "Essential Cookies",
        text: "We use cookies to maintain your session, remember your cart, and keep you logged in. These are necessary for the platform to function and cannot be disabled.",
      },
      {
        subtitle: "Analytics Cookies",
        text: "We use anonymized analytics to understand how users navigate ShopExpo. This data is aggregated and not linked to individual users.",
      },
      {
        subtitle: "Preference Cookies",
        text: "We store your preferences (like saved addresses and wishlist) in your browser's localStorage for convenience. This data never leaves your device.",
      },
    ],
  },
  {
    title: "Third-Party Services",
    items: [
      {
        subtitle: "Stripe",
        text: "Payment processing is handled by Stripe. When you pay by card, your card details are processed directly by Stripe and never stored on our servers. Stripe's privacy policy applies to payment data.",
      },
      {
        subtitle: "Delivery Partners",
        text: "Your name, phone number, and delivery address are shared with our logistics partners to fulfill your orders.",
      },
      {
        subtitle: "Internet Identity",
        text: "Login is powered by Internet Identity (ICP). We receive only your principal ID — no email, password, or personal data is shared by the authentication system.",
      },
    ],
  },
  {
    title: "Data Retention",
    items: [
      {
        subtitle: "Order History",
        text: "Order data is retained for 7 years for accounting and legal compliance purposes.",
      },
      {
        subtitle: "Account Data",
        text: "Profile data is retained as long as your account is active. You can request deletion by contacting support.",
      },
    ],
  },
  {
    title: "Your Rights",
    items: [
      {
        subtitle: "Access & Portability",
        text: "You can access all your data from the My Account and My Orders sections. You may request a data export by contacting privacy@shopexpo.in.",
      },
      {
        subtitle: "Correction",
        text: "You can update your profile information at any time from the My Account page.",
      },
      {
        subtitle: "Deletion",
        text: "You can request deletion of your account and personal data by contacting privacy@shopexpo.in. Note that order records may be retained for legal purposes.",
      },
    ],
  },
  {
    title: "Contact Us",
    items: [
      {
        subtitle: "Privacy Inquiries",
        text: "For any privacy-related questions or to exercise your rights, contact our Data Protection Officer at privacy@shopexpo.in. We respond to all privacy requests within 30 days.",
      },
    ],
  },
];

export function PrivacyPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="font-display font-bold text-3xl md:text-4xl mb-3">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground text-sm">
          Last updated: January 2026 · We take your privacy seriously
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-8 text-sm text-green-800">
        ShopExpo is committed to protecting your personal data. This policy
        explains how we collect, use, and safeguard your information.
      </div>

      <div className="space-y-8">
        {PRIVACY_SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="font-display font-bold text-lg mb-4 text-foreground border-b border-border pb-2">
              {section.title}
            </h2>
            <div className="space-y-4">
              {section.items.map((item) => (
                <div
                  key={item.subtitle}
                  className="bg-white rounded-xl border border-border p-4"
                >
                  <h3 className="font-semibold text-sm mb-1.5 text-foreground">
                    {item.subtitle}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center text-xs text-muted-foreground">
        <p>
          Questions about your privacy? Contact{" "}
          <span className="text-green-600 font-medium">
            privacy@shopexpo.in
          </span>
        </p>
      </div>
    </main>
  );
}
