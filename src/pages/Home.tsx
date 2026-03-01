import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useData";
import { useLogEntries } from "@/hooks/useData";
import Bandit from "@/components/Bandit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Recycle, BarChart3, LogIn } from "lucide-react";
import heroBg from "@/art/collage_home.png";
import { toast } from "sonner";

const WHY_IT_MATTERS = [
  { icon: "🌍", title: "Save the Planet", text: "Recycling reduces landfill waste and conserves natural resources for future generations." },
  { icon: "💧", title: "Save Water & Energy", text: "Recycling aluminum cans saves 95% of the energy needed to make new ones." },
  { icon: "🌱", title: "Reduce Emissions", text: "Proper recycling keeps harmful materials out of our air and waterways." },
  { icon: "🤝", title: "Build Community", text: "Recycle with friends and influence your neighborhood to do better." },
];

export default function HomePage() {
  const { user, signUpWithUsername, signInWithUsernameAndCode, loginCodeToShow, dismissLoginCode } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { weeklyTotal } = useLogEntries();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [continuePending, setContinuePending] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [loginPending, setLoginPending] = useState(false);

  const handleContinue = async () => {
    if (!username.trim()) return;
    setContinuePending(true);
    const { error } = await signUpWithUsername(username);
    setContinuePending(false);
    if (error) {
      toast.error(error);
      return;
    }
    setUsername("");
  };

  const handleLogin = async () => {
    if (!loginUsername.trim() || !loginCode.trim()) {
      toast.error("Enter username and login code");
      return;
    }
    setLoginPending(true);
    const { error } = await signInWithUsernameAndCode(loginUsername, loginCode);
    setLoginPending(false);
    if (error) {
      toast.error(error);
      return;
    }
    setShowLogin(false);
    setLoginUsername("");
    setLoginCode("");
  };

  const handleNavWithAuth = (path: string) => {
    if (!user) {
      toast.info("Choose a username first to continue");
      return;
    }
    navigate(path);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-eco px-4 pt-8 pb-12 text-primary-foreground">
        <img
          src={heroBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
        />
        <div className="relative z-10 max-w-md mx-auto text-center">
          <Bandit
            hatId={profile?.bandit_hat_id ?? "none"}
            size="lg"
            showHatPicker={!!user}
            onHatChange={(hatId) => updateProfile.mutate({ bandit_hat_id: hatId })}
          />

          <h1 className="font-heading text-3xl font-black mt-4 mb-2 drop-shadow">
            Recycle with Bandit!
          </h1>
          <p className="text-primary-foreground/80 text-sm font-medium mb-1">
            Log your recycling, track your impact, compete with friends.
          </p>

          {!user ? (
            <>
              <div className="mt-4 space-y-2">
                <Input
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleContinue()}
                  className="bg-primary-foreground/15 border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/60 max-w-xs mx-auto font-medium"
                  maxLength={20}
                  aria-label="Choose a username"
                />
                <Button
                  size="lg"
                  className="font-heading font-bold shadow-warm gap-2"
                  onClick={handleContinue}
                  disabled={continuePending || !username.trim()}
                >
                  {continuePending ? "Creating…" : "Continue"}
                </Button>
              </div>
              <Button
                variant="ghost"
                className="mt-3 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 gap-2 text-sm"
                onClick={() => setShowLogin(true)}
              >
                <LogIn className="w-4 h-4" /> Already have an account? Log in
              </Button>
            </>
          ) : (
            <>
              <div className="bg-primary-foreground/15 backdrop-blur-sm rounded-xl px-4 py-3 mt-4 inline-block">
                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">This Week</p>
                <p className="text-4xl font-black">{weeklyTotal}</p>
                <p className="text-xs opacity-80">items recycled</p>
              </div>

              <div className="flex gap-3 justify-center mt-6">
                <Button
                  size="lg"
                  variant="secondary"
                  className="font-heading font-bold text-base shadow-warm gap-2"
                  onClick={() => handleNavWithAuth("/log")}
                >
                  <Recycle className="w-5 h-5" /> Recycle
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="font-heading font-bold text-base bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20 gap-2"
                  onClick={() => handleNavWithAuth("/stats")}
                >
                  <BarChart3 className="w-5 h-5" /> Stats
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Why it matters */}
      <section className="px-4 py-10 max-w-md mx-auto">
        <h2 className="font-heading text-xl font-bold text-center mb-6">Why It Matters</h2>
        <div className="grid gap-4">
          {WHY_IT_MATTERS.map((item) => (
            <div
              key={item.title}
              className="flex gap-3 items-start bg-card rounded-xl p-4 shadow-sm animate-slide-up"
            >
              <span className="text-2xl mt-0.5">{item.icon}</span>
              <div>
                <h3 className="font-heading font-bold text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom nav */}
      {user && <BottomNav />}

      {/* Login code shown once after signup */}
      <Dialog open={!!loginCodeToShow} onOpenChange={(open) => !open && dismissLoginCode()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save your login code</DialogTitle>
            <DialogDescription>
              You’ll need this to log in on another device. Use your username and this code.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-muted p-4 font-mono text-lg font-bold text-center tracking-wider">
            {loginCodeToShow}
          </div>
          <DialogFooter>
            <Button onClick={dismissLoginCode}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log in (username + code) */}
      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log in</DialogTitle>
            <DialogDescription>Enter your username and the login code you saved when you signed up.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Username"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              autoComplete="username"
            />
            <Input
              placeholder="Login code (e.g. sun-leaf-42)"
              value={loginCode}
              onChange={(e) => setLoginCode(e.target.value)}
              type="password"
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogin(false)}>Cancel</Button>
            <Button onClick={handleLogin} disabled={loginPending}>Log in</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function BottomNav() {
  const navigate = useNavigate();
  const location = window.location.pathname;

  const items = [
    { path: "/", label: "Home", icon: "🏠" },
    { path: "/log", label: "Recycle", icon: "♻️" },
    { path: "/stats", label: "Stats", icon: "📊" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border z-50" aria-label="Main navigation">
      <div className="max-w-md mx-auto flex justify-around py-2">
        {items.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-colors
              ${location === item.path
              ? "text-primary font-bold"
              : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label={item.label}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] font-semibold">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
