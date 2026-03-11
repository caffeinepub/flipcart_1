import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  ShoppingBag,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
    setIsSuccess(true);
  };

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 bg-brand-navy rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-brand-navy">
              ShopExpo
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-product border border-border p-8">
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Heading */}
                <div className="mb-6">
                  <h1 className="font-display font-bold text-2xl text-foreground mb-2">
                    Forgot Password?
                  </h1>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    No worries! Enter your registered email address and we'll
                    send you a link to reset your password.
                  </p>
                </div>

                {/* Form */}
                <form
                  onSubmit={(e) => void handleSubmit(e)}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-foreground"
                    >
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError("");
                        }}
                        placeholder="you@example.com"
                        className="pl-10 h-11 border-border focus:border-brand-orange focus:ring-brand-orange/20"
                        disabled={isLoading}
                        autoComplete="email"
                        data-ocid="forgot-password.email.input"
                      />
                    </div>
                    <AnimatePresence>
                      {error && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="text-destructive text-xs mt-1"
                          data-ocid="forgot-password.error_state"
                        >
                          {error}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-brand-orange hover:bg-orange-600 text-white font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                    disabled={isLoading}
                    data-ocid="forgot-password.submit_button"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Sending Reset Link...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                </form>
              </motion.div>
            ) : (
              /* Success State */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
                className="text-center py-4"
                data-ocid="forgot-password.success_state"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </motion.div>
                <h2 className="font-display font-bold text-xl mb-2 text-foreground">
                  Check your inbox!
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-1">
                  Reset link sent! Check your email.
                </p>
                <p className="text-muted-foreground text-xs">
                  Sent to{" "}
                  <span className="font-semibold text-foreground">{email}</span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Back to Login */}
          <div className="mt-6 pt-5 border-t border-border text-center">
            <Link
              to="/account"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-orange transition-colors font-medium"
              data-ocid="forgot-password.back.link"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Remember your password?{" "}
          <Link
            to="/account"
            className="text-brand-orange hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
