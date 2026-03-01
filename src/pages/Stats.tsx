import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useLogEntries, useLifetimeEntries, useFriends } from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Bandit from "@/components/Bandit";
import banditThumbsUp from "@/art/bandit_thumbsup.png";
import { BottomNav } from "@/pages/Home";
import { Copy, UserPlus, Check, X, Settings, LogOut, ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function StatsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { weeklyTotal } = useLogEntries();
  const { lifetimeTotal } = useLifetimeEntries();
  const { accepted, pendingIncoming, sendRequest, respondToRequest } = useFriends();
  const [friendCode, setFriendCode] = useState("");
  const [friendProfiles, setFriendProfiles] = useState<Record<string, any>>({});
  const [friendTotals, setFriendTotals] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  // Load friend data (username, rolling 7-day total, Bandit hat)
  useEffect(() => {
    if (!user || accepted.length === 0) return;
    const load = async () => {
      for (const rel of accepted) {
        const friendId = rel.requester_id === user.id ? rel.addressee_id : rel.requester_id;
        const { data: fp } = await supabase.from("profiles").select("*").eq("user_id", friendId).single();
        if (fp) setFriendProfiles((prev) => ({ ...prev, [friendId]: fp }));
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: logs } = await supabase
          .from("log_entries")
          .select("quantity")
          .eq("user_id", friendId)
          .gte("created_at", sevenDaysAgo);
        const total = (logs ?? []).reduce((s, l) => s + l.quantity, 0);
        setFriendTotals((prev) => ({ ...prev, [friendId]: total }));
      }
    };
    load();
  }, [user?.id, accepted]);

  const copyCode = () => {
    if (profile?.friend_code) {
      navigator.clipboard.writeText(profile.friend_code);
      toast.success("Friend code copied!");
    }
  };

  const handleSendRequest = async () => {
    if (!friendCode.trim()) return;
    try {
      await sendRequest.mutateAsync(friendCode.trim());
      toast.success("Friend request sent!");
      setFriendCode("");
    } catch (error: any) {
      toast.error(error.message ?? "Failed to send request");
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
    toast.info("To delete your account data, please contact support.");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-gradient-eco text-primary-foreground px-4 py-4">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/")} className="hover:opacity-80" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-heading text-lg font-bold flex-1">Stats & Friends</h1>
          <button onClick={signOut} className="p-2 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20" aria-label="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4">
        <Tabs defaultValue="stats">
          <TabsList className="w-full">
            <TabsTrigger value="stats" className="flex-1 font-heading font-bold">My Stats</TabsTrigger>
            <TabsTrigger value="friends" className="flex-1 font-heading font-bold">Friends</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="mt-4 space-y-4">
            {/* Personal stats: username, rolling 7-day, lifetime */}
            <div className="bg-card rounded-2xl p-5 text-center shadow-sm">
              <img src={banditThumbsUp} alt="" className="mx-auto h-24 w-auto object-contain mb-3" aria-hidden />
              <h2 className="font-heading text-lg font-bold">{profile?.display_name ?? "Recycler"}</h2>
              <p className="text-xs text-muted-foreground">{profile?.location_label}</p>

              <div className="flex justify-center gap-6 mt-4">
                <div>
                  <p className="text-3xl font-black text-primary">{weeklyTotal}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold">Rolling 7-day</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-secondary">{lifetimeTotal}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold">Lifetime</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="default" className="flex-1 text-xs gap-1" onClick={() => navigate("/setup")}>
                <Settings className="w-3.5 h-3.5" /> Edit Local Guidance
              </Button>
              <Button variant="default" className="text-xs gap-1" onClick={handleDeleteAccount}>
                <Trash2 className="w-3.5 h-3.5" /> Delete Account
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="friends" className="mt-4 space-y-4">
            {/* Friend code */}
            <div className="bg-card rounded-2xl p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Your Friend Code</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted px-3 py-2 rounded-lg font-mono text-sm font-bold tracking-widest">
                  {profile?.friend_code ?? "..."}
                </code>
                <Button size="icon" variant="outline" onClick={copyCode} aria-label="Copy friend code">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Add friend */}
            <div className="bg-card rounded-2xl p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Add Friend</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter friend code"
                  value={friendCode}
                  onChange={(e) => setFriendCode(e.target.value)}
                  className="font-mono"
                />
                <Button onClick={handleSendRequest} disabled={sendRequest.isPending} className="gap-1">
                  <UserPlus className="w-4 h-4" /> Add
                </Button>
              </div>
            </div>

            {/* Pending requests */}
            {pendingIncoming.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Pending Requests</p>
                {pendingIncoming.map((req) => (
                  <div key={req.id} className="bg-card rounded-xl px-4 py-3 flex items-center gap-3">
                    <span className="text-sm flex-1">Friend request</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => respondToRequest.mutate({ id: req.id, status: "accepted" })}
                    >
                      <Check className="w-3 h-3" /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-destructive gap-1"
                      onClick={() => respondToRequest.mutate({ id: req.id, status: "denied" })}
                    >
                      <X className="w-3 h-3" /> Deny
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Friends list */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Friends</p>
              {accepted.length === 0 ? (
                <div className="bg-card rounded-xl p-6 text-center">
                  <p className="text-muted-foreground text-sm">No friends yet. Share your code!</p>
                </div>
              ) : (
                accepted.map((rel) => {
                  const friendId = rel.requester_id === user?.id ? rel.addressee_id : rel.requester_id;
                  const fp = friendProfiles[friendId];
                  const total = friendTotals[friendId] ?? 0;
                  return (
                    <div key={rel.id} className="bg-card rounded-xl px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{fp?.display_name ?? "Friend"}</p>
                        <p className="text-xs text-muted-foreground">{total} items (rolling 7-day)</p>
                      </div>
                      <Bandit hatId={fp?.bandit_hat_id ?? "none"} size="sm" />
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
}
