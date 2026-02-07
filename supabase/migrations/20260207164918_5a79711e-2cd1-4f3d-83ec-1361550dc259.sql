-- Create subscription plans enum
CREATE TYPE public.subscription_plan AS ENUM ('free', 'professional', 'enterprise');

-- Create subscription status enum
CREATE TYPE public.subscription_status AS ENUM ('active', 'cancelled', 'expired', 'pending');

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  plan subscription_plan NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  work_items_used INTEGER NOT NULL DEFAULT 0,
  work_items_limit INTEGER NOT NULL DEFAULT 5,
  razorpay_subscription_id TEXT,
  razorpay_customer_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table for tracking all transactions
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id),
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  razorpay_signature TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscriptions
CREATE POLICY "Users can view own subscription"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
ON public.subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
ON public.subscriptions FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for payments
CREATE POLICY "Users can view own payments"
ON public.payments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments"
ON public.payments FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create trigger to update updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment work items used
CREATE OR REPLACE FUNCTION public.increment_work_items_used(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription RECORD;
BEGIN
  SELECT * INTO v_subscription FROM public.subscriptions WHERE user_id = p_user_id;
  
  -- If no subscription exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.subscriptions (user_id, plan, status, work_items_used, work_items_limit)
    VALUES (p_user_id, 'free', 'active', 1, 5);
    RETURN TRUE;
  END IF;
  
  -- Check if user can create more work items
  IF v_subscription.plan = 'free' AND v_subscription.work_items_used >= v_subscription.work_items_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Increment usage
  UPDATE public.subscriptions 
  SET work_items_used = work_items_used + 1
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
END;
$$;

-- Function to check if user can create work items
CREATE OR REPLACE FUNCTION public.can_create_work_item(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription RECORD;
BEGIN
  SELECT * INTO v_subscription FROM public.subscriptions WHERE user_id = p_user_id;
  
  -- If no subscription, they can create (will be tracked on first creation)
  IF NOT FOUND THEN
    RETURN TRUE;
  END IF;
  
  -- Paid plans have unlimited access
  IF v_subscription.plan IN ('professional', 'enterprise') AND v_subscription.status = 'active' THEN
    RETURN TRUE;
  END IF;
  
  -- Free plan check limit
  IF v_subscription.work_items_used < v_subscription.work_items_limit THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Enable realtime for subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;