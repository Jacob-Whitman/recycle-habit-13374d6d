-- Track which users have claimed the 100-item Solana reward (one-time per user)
CREATE TABLE public.sol_reward_claimed (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sol_reward_claimed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own claim" ON public.sol_reward_claimed FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own claim" ON public.sol_reward_claimed FOR INSERT WITH CHECK (auth.uid() = user_id);
