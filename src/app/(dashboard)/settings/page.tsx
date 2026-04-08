'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { initiateSignOut } from "@/firebase/non-blocking-login";
import { BILLING_PLANS } from "@/lib/plans";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ArrowRight,
  Check,
  CreditCard,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  Save,
  Shield,
  ShieldCheck,
  User,
} from "lucide-react";

async function parseJsonResponse(response: Response) {
  const payloadText = await response.text();
  if (!payloadText) return {};

  try {
    return JSON.parse(payloadText);
  } catch {
    throw new Error("The billing service returned an unexpected response.");
  }
}

export default function SettingsPage() {
  const auth = useAuth();
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const isMobile = useIsMobile();

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: profile, isLoading } = useDoc(userDocRef);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
  const [isLaunchingPortal, setIsLaunchingPortal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFormData({
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      email: profile.email || user?.email || "",
    });
  }, [profile, user]);

  const plans = BILLING_PLANS.map((plan) => ({
    ...plan,
    isCurrent: profile?.plan === plan.id,
  }));

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!userDocRef) return;

    setIsSaving(true);
    try {
      await updateDoc(userDocRef, {
        ...formData,
        updatedAt: serverTimestamp(),
      });
      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (!user) return;

    setIsUpgrading(planId);
    const selectedPlan = plans.find((plan) => plan.id === planId);
    if (!selectedPlan || selectedPlan.id === "free") {
      toast({
        variant: "destructive",
        title: "Error",
        description: "This plan cannot be started from checkout.",
      });
      setIsUpgrading(null);
      return;
    }

    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
        }),
      });

      const data = await parseJsonResponse(response);
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      window.location.assign(data.url);
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        variant: "destructive",
        title: "Billing Error",
        description: error.message || "Failed to initiate checkout.",
      });
    } finally {
      setIsUpgrading(null);
    }
  };

  const handleLaunchPortal = async () => {
    if (!user) return;

    setIsLaunchingPortal(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/billing-portal", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await parseJsonResponse(response);
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to open billing portal.");
      }

      window.location.assign(data.url);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Portal unavailable",
        description: error.message || "Upgrade to a paid plan first, then try again.",
      });
    } finally {
      setIsLaunchingPortal(false);
    }
  };

  const handleSignOutCurrentDevice = async () => {
    if (!auth) return;

    setIsSigningOut(true);
    try {
      await initiateSignOut(auth);
      toast({
        title: "Signed out",
        description: "Your session on this device has been closed safely.",
      });
      router.push("/login");
    } catch (error) {
      console.error("Sign out failed:", error);
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: "We couldn't close your session right now. Please try again.",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isMobile) {
    return (
      <MobileSettingsExperience
        formData={formData}
        setFormData={setFormData}
        isSaving={isSaving}
        plans={plans}
        profile={profile}
        isUpgrading={isUpgrading}
        isLaunchingPortal={isLaunchingPortal}
        isSigningOut={isSigningOut}
        handleUpdateProfile={handleUpdateProfile}
        handleUpgrade={handleUpgrade}
        handleLaunchPortal={handleLaunchPortal}
        handleSignOutCurrentDevice={handleSignOutCurrentDevice}
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 pb-24 md:space-y-8 md:px-8 md:pb-0">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary md:text-3xl">Settings</h1>
          <p className="text-muted-foreground">Control your profile, billing, and account recovery paths.</p>
        </div>
        <Badge className="h-10 gap-2 rounded-full border-primary/20 bg-primary/5 px-4 font-bold text-primary">
          <ShieldCheck className="h-4 w-4" /> SECURE SESSION
        </Badge>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-8 h-14 w-full justify-start gap-8 overflow-x-auto overflow-y-hidden whitespace-nowrap rounded-none border-b bg-transparent p-0 no-scrollbar scroll-smooth">
          <TabsTrigger value="profile" className="rounded-none border-b-2 border-transparent bg-transparent px-2 pb-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:border-primary">Profile</TabsTrigger>
          <TabsTrigger value="billing" className="rounded-none border-b-2 border-transparent bg-transparent px-2 pb-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:border-primary">Billing & Plans</TabsTrigger>
          <TabsTrigger value="security" className="rounded-none border-b-2 border-transparent bg-transparent px-2 pb-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:border-primary">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-0 space-y-6">
          <Card className="rounded-[2rem] border-none shadow-sm">
            <CardHeader className="p-5 md:p-8">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </CardTitle>
              <CardDescription>Update the name and contact details used on your CVs.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 md:p-8 md:pt-0">
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="h-12 border-none bg-[#F9FAFB] focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="h-12 border-none bg-[#F9FAFB] focus-visible:ring-primary"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Address</Label>
                  <Input
                    id="email"
                    value={formData.email}
                    disabled
                    className="h-12 border-none bg-[#F9FAFB] opacity-60"
                  />
                  <p className="text-[10px] text-muted-foreground">Authenticated email cannot be changed here.</p>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" className="h-12 rounded-xl bg-primary px-10 font-bold shadow-lg hover:bg-primary/90" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-0 space-y-8">
          <div className="grid gap-5 md:grid-cols-3 md:gap-6">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={cn(
                  "flex flex-col overflow-hidden rounded-[2rem] border-2 transition-all",
                  plan.isCurrent ? "border-primary bg-primary/5 shadow-inner" : "border-border hover:border-primary/50",
                  plan.highlight && !plan.isCurrent && "scale-[1.02] border-accent/30 shadow-lg"
                )}
              >
                <CardHeader className="p-5 pb-4 md:p-8 md:pb-4">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    {plan.isCurrent && (
                      <Badge className="bg-primary py-0.5 text-[10px] font-black uppercase tracking-widest text-white">Active</Badge>
                    )}
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-black">{plan.price}</span>
                    <span className="text-xs text-muted-foreground">/ month</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-5 pt-4 md:p-8 md:pt-4">
                  <ul className="space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm">
                        <Check className="h-4 w-4 shrink-0 text-green-500" />
                        <span className="font-medium opacity-80">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="p-5 pt-0 md:p-8 md:pt-0">
                  <Button
                    className={cn(
                      "h-12 w-full rounded-xl font-bold shadow-sm",
                      plan.isCurrent ? "pointer-events-none bg-primary/20 text-white" :
                      plan.highlight ? "bg-accent hover:bg-accent/90" : "bg-primary hover:bg-primary/90"
                    )}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={plan.isCurrent || plan.id === "free" || isUpgrading !== null}
                  >
                    {isUpgrading === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> :
                      plan.isCurrent ? "Current Plan" : plan.id === "free" ? "Included by default" : `Upgrade to ${plan.name}`}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <Card className="rounded-[2rem] border-none bg-muted/20 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-primary" />
                Billing History
              </CardTitle>
              <CardDescription>Open the Stripe customer portal to manage invoices and payment methods.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 md:p-8 md:pt-0">
              <div className="flex flex-col justify-between gap-4 rounded-2xl border bg-white p-5 shadow-sm md:flex-row md:items-center md:p-6">
                <div className="space-y-1">
                  <p className="font-bold text-primary">Stripe Customer Portal</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">View past transactions, update card details, and download tax receipts.</p>
                </div>
                <Button
                  variant="outline"
                  className="h-11 gap-2 rounded-xl border-2 px-8 font-bold"
                  onClick={handleLaunchPortal}
                  disabled={isLaunchingPortal}
                >
                  {isLaunchingPortal ? <Loader2 className="h-4 w-4 animate-spin" /> : "Launch Portal"}
                  {!isLaunchingPortal && <ArrowRight className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-0 space-y-6">
          <Card className="rounded-[2rem] border-none shadow-sm">
            <CardHeader className="p-5 md:p-8">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" />
                Login & Security
              </CardTitle>
              <CardDescription>Use the available recovery and session actions instead of running into dead controls.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-5 pt-0 md:p-8 md:pt-0">
              <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border bg-[#F9FAFB] p-5 md:flex-row md:items-center">
                <div className="space-y-1">
                  <p className="text-sm font-bold">Password Recovery</p>
                  <p className="text-xs text-muted-foreground">Reset your password if you lose access or want to rotate credentials.</p>
                </div>
                <Button variant="outline" className="h-10 rounded-xl border-2 font-bold" asChild>
                  <Link href="/forgot-password">
                    <KeyRound className="mr-2 h-4 w-4" />
                    Reset Password
                  </Link>
                </Button>
              </div>
              <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border bg-[#F9FAFB] p-5 md:flex-row md:items-center">
                <div className="space-y-1">
                  <p className="text-sm font-bold">Current Session</p>
                  <p className="text-xs text-muted-foreground">Sign out on this browser immediately. Cross-device resets are handled by support.</p>
                </div>
                <Button
                  variant="outline"
                  className="h-10 rounded-xl border-2 font-bold"
                  onClick={handleSignOutCurrentDevice}
                  disabled={isSigningOut}
                >
                  {isSigningOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                  Sign Out Here
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 border-t p-5 md:flex-row md:justify-between md:p-8">
              <Button variant="ghost" className="h-11 justify-start rounded-xl px-4 font-bold text-destructive hover:bg-destructive/10 md:px-6" asChild>
                <a href={`mailto:${siteConfig.supportEmail}?subject=Account%20Deletion%20Request`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Request Account Deletion
                </a>
              </Button>
              <Button variant="outline" className="h-11 justify-start rounded-xl border-2 px-4 font-bold md:px-6" asChild>
                <a href={`mailto:${siteConfig.supportEmail}?subject=Global%20Device%20Sign-out%20Request`}>
                  <Shield className="mr-2 h-4 w-4" />
                  Request Device Reset
                </a>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MobileSettingsExperience({
  formData,
  setFormData,
  isSaving,
  plans,
  profile,
  isUpgrading,
  isLaunchingPortal,
  isSigningOut,
  handleUpdateProfile,
  handleUpgrade,
  handleLaunchPortal,
  handleSignOutCurrentDevice,
}: {
  formData: { firstName: string; lastName: string; email: string }
  setFormData: Dispatch<SetStateAction<{ firstName: string; lastName: string; email: string }>>
  isSaving: boolean
  plans: Array<(typeof BILLING_PLANS)[number] & { isCurrent: boolean }>
  profile: any
  isUpgrading: string | null
  isLaunchingPortal: boolean
  isSigningOut: boolean
  handleUpdateProfile: (e: FormEvent) => Promise<void>
  handleUpgrade: (planId: string) => Promise<void>
  handleLaunchPortal: () => Promise<void>
  handleSignOutCurrentDevice: () => Promise<void>
}) {
  return (
    <div className="space-y-4 pb-2">
      <section className="rounded-[1.6rem] border border-white/80 bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(244,247,255,0.96))] px-4 py-4 shadow-[0_28px_60px_-42px_rgba(15,23,42,0.35)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Account center</p>
            <h1 className="mt-2 text-[1.7rem] font-black leading-[0.95] tracking-[-0.05em] text-primary">Settings built for phone-first control.</h1>
            <p className="mt-2.5 text-[0.92rem] leading-relaxed text-muted-foreground">
              Update your profile, manage billing, and handle security actions without crowded desktop tabs.
            </p>
          </div>
          <Badge className="rounded-full border-primary/20 bg-primary/5 px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.18em] text-primary">
            {(profile?.plan || "free").toUpperCase()}
          </Badge>
        </div>
      </section>

      <Card className="rounded-[1.55rem] border-none bg-white shadow-sm">
        <CardHeader className="space-y-2 p-4">
          <CardTitle className="flex items-center gap-2 text-lg font-black text-primary">
            <User className="h-5 w-5 text-primary" />
            Profile
          </CardTitle>
          <CardDescription>Keep the name and contact details on your CV up to date.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mobile-firstName" className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">First Name</Label>
              <Input
                id="mobile-firstName"
                value={formData.firstName}
                onChange={(e) => setFormData((current) => ({ ...current, firstName: e.target.value }))}
                className="h-11 rounded-2xl border-none bg-[#F9FAFB]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile-lastName" className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">Last Name</Label>
              <Input
                id="mobile-lastName"
                value={formData.lastName}
                onChange={(e) => setFormData((current) => ({ ...current, lastName: e.target.value }))}
                className="h-11 rounded-2xl border-none bg-[#F9FAFB]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile-email" className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">Email Address</Label>
              <Input id="mobile-email" value={formData.email} disabled className="h-11 rounded-2xl border-none bg-[#F9FAFB] opacity-60" />
              <p className="text-[0.68rem] text-muted-foreground">Authenticated email cannot be changed here.</p>
            </div>
            <Button type="submit" className="h-11 w-full rounded-2xl font-bold shadow-lg shadow-primary/10" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save profile changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-[1.55rem] border-none bg-white shadow-sm">
        <CardHeader className="space-y-2 p-4">
          <CardTitle className="flex items-center gap-2 text-lg font-black text-primary">
            <CreditCard className="h-5 w-5 text-primary" />
            Billing and plans
          </CardTitle>
          <CardDescription>See your current plan, compare upgrades, and open the billing portal.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                "rounded-[1.2rem] border-2 shadow-none",
                plan.isCurrent ? "border-primary bg-primary/5" : "border-border/70 bg-[#fafbfd]",
                plan.highlight && !plan.isCurrent && "border-accent/30"
              )}
            >
              <CardHeader className="space-y-3 p-4 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg font-black text-primary">{plan.name}</CardTitle>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-[1.6rem] font-black text-primary">{plan.price}</span>
                      <span className="text-xs text-muted-foreground">/ month</span>
                    </div>
                  </div>
                  {plan.isCurrent ? (
                    <Badge className="rounded-full bg-primary px-3 py-1 text-[0.6rem] font-black uppercase tracking-[0.18em] text-white">Active</Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-0">
                {plan.features.slice(0, 4).map((feature) => (
                  <div key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{feature}</span>
                  </div>
                ))}
                <Button
                  className={cn(
                    "mt-2 h-10 w-full rounded-2xl font-bold",
                    plan.isCurrent ? "pointer-events-none bg-primary/20 text-white" : plan.highlight ? "bg-accent hover:bg-accent/90" : "bg-primary hover:bg-primary/90"
                  )}
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={plan.isCurrent || plan.id === "free" || isUpgrading !== null}
                >
                  {isUpgrading === plan.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : plan.isCurrent ? (
                    "Current plan"
                  ) : plan.id === "free" ? (
                    "Included by default"
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}

          <div className="rounded-[1.2rem] border border-border/70 bg-muted/20 p-4">
            <p className="text-sm font-black text-primary">Stripe customer portal</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Manage payment methods, invoices, and subscription changes in one secure place.
            </p>
            <Button variant="outline" className="mt-4 h-10 w-full rounded-2xl border-2 font-bold" onClick={handleLaunchPortal} disabled={isLaunchingPortal}>
              {isLaunchingPortal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              Launch portal
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[1.55rem] border-none bg-white shadow-sm">
        <CardHeader className="space-y-2 p-4">
          <CardTitle className="flex items-center gap-2 text-lg font-black text-primary">
            <Shield className="h-5 w-5 text-primary" />
            Security
          </CardTitle>
          <CardDescription>Reset access, sign out securely, or contact support for account-level help.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0">
          <Button variant="outline" className="h-11 w-full justify-start rounded-2xl border-2 font-bold" asChild>
            <Link href="/forgot-password">
              <KeyRound className="mr-3 h-4 w-4" />
              Reset password
            </Link>
          </Button>
          <Button variant="outline" className="h-11 w-full justify-start rounded-2xl border-2 font-bold" onClick={handleSignOutCurrentDevice} disabled={isSigningOut}>
            {isSigningOut ? <Loader2 className="mr-3 h-4 w-4 animate-spin" /> : <LogOut className="mr-3 h-4 w-4" />}
            Sign out on this device
          </Button>
          <Button variant="ghost" className="h-11 w-full justify-start rounded-2xl font-bold text-destructive hover:bg-destructive/10" asChild>
            <a href={`mailto:${siteConfig.supportEmail}?subject=Account%20Deletion%20Request`}>
              <Mail className="mr-3 h-4 w-4" />
              Request account deletion
            </a>
          </Button>
          <Button variant="ghost" className="h-11 w-full justify-start rounded-2xl font-bold" asChild>
            <a href={`mailto:${siteConfig.supportEmail}?subject=Global%20Device%20Sign-out%20Request`}>
              <ShieldCheck className="mr-3 h-4 w-4" />
              Request device reset
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
