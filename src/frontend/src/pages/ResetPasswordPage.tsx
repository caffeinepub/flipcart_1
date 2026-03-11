import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

function getPasswordStrength(password: string): {
  level: "weak" | "medium" | "strong";
  label: string;
  color: string;
  width: string;
  segments: number;
} {
  if (password.length === 0) {
    return {
      level: "weak",
      label: "",
      color: "bg-muted",
      width: "0%",
      segments: 0,
    };
  }
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) {
    return {
      level: "weak",
      label: "Weak",
      color: "bg-destructive",
      width: "33%",
      segments: 1,
    };
  }
  if (score <= 3) {
    return {
      level: "medium",
      label: "Medium",
      color: "bg-warning",
      width: "66%",
      segments: 2,
    };
  }
  return {
    level: "strong",
    label: "Strong",
    color: "bg-success",
    width: "100%",
    segments: 3,
  };
}

export function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>(
    {},
  );

  const strength = getPasswordStrength(password);

  const validate = () => {
    const newErrors: { password?: string; confirm?: string } = {};
    if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }
    if (!confirmPassword) {
      newErrors.confirm = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      newErrors.confirm = "Passwords do not match.";
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
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
                  <div className="w-12 h-12 bg-brand-navy/10 rounded-xl flex items-center justify-center mb-4">
                    <KeyRound className="w-6 h-6 text-brand-navy" />
                  </div>
                  <h1 className="font-display font-bold text-2xl text-foreground mb-2">
                    Set New Password
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Create a strong password for your account.
                  </p>
                </div>

                <form
                  onSubmit={(e) => void handleSubmit(e)}
                  className="space-y-5"
                >
                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setErrors((prev) => ({
                            ...prev,
                            password: undefined,
                          }));
                        }}
                        placeholder="Min. 8 characters"
                        className="pr-10 h-11"
                        disabled={isLoading}
                        autoComplete="new-password"
                        data-ocid="reset-password.password.input"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowPassword((v) => !v)}
                        data-ocid="reset-password.password.toggle"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Password strength indicator */}
                    {password.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-1"
                      >
                        <div className="flex gap-1">
                          {[1, 2, 3].map((seg) => (
                            <div
                              key={seg}
                              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                strength.segments >= seg
                                  ? strength.color
                                  : "bg-muted"
                              }`}
                            />
                          ))}
                        </div>
                        <p
                          className={`text-xs font-medium ${
                            strength.level === "weak"
                              ? "text-destructive"
                              : strength.level === "medium"
                                ? "text-warning"
                                : "text-success"
                          }`}
                        >
                          {strength.label} password
                        </p>
                      </motion.div>
                    )}

                    <AnimatePresence>
                      {errors.password && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-destructive text-xs"
                          data-ocid="reset-password.password.error_state"
                        >
                          {errors.password}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirm" className="text-sm font-medium">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm"
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setErrors((prev) => ({
                            ...prev,
                            confirm: undefined,
                          }));
                        }}
                        placeholder="Re-enter your password"
                        className="pr-10 h-11"
                        disabled={isLoading}
                        autoComplete="new-password"
                        data-ocid="reset-password.confirm.input"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowConfirm((v) => !v)}
                        data-ocid="reset-password.confirm.toggle"
                        tabIndex={-1}
                      >
                        {showConfirm ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <AnimatePresence>
                      {errors.confirm && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-destructive text-xs"
                          data-ocid="reset-password.confirm.error_state"
                        >
                          {errors.confirm}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-brand-orange hover:bg-orange-600 text-white font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                    disabled={isLoading}
                    data-ocid="reset-password.submit_button"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Resetting Password...
                      </>
                    ) : (
                      "Reset Password"
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
                data-ocid="reset-password.success_state"
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
                  Password Reset!
                </h2>
                <p className="text-muted-foreground text-sm mb-6">
                  Password reset successfully! You can now log in with your new
                  password.
                </p>
                <Link to="/account">
                  <Button
                    className="bg-brand-orange hover:bg-orange-600 text-white font-semibold px-8"
                    data-ocid="reset-password.go-to-login.button"
                  >
                    Go to Login
                  </Button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Back link */}
          {!isSuccess && (
            <div className="mt-6 pt-5 border-t border-border text-center">
              <Link
                to="/forgot-password"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-orange transition-colors font-medium"
                data-ocid="reset-password.back.link"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Forgot Password
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </main>
  );
}
