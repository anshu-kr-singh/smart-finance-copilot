-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for work status
CREATE TYPE public.work_status AS ENUM ('draft', 'in_progress', 'review', 'completed', 'filed');

-- Create enum for work category
CREATE TYPE public.work_category AS ENUM (
  'accounting',
  'gst',
  'income_tax',
  'audit',
  'compliance',
  'fpa',
  'risk',
  'advisory'
);

-- Create profiles table for CAs
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  firm_name TEXT,
  membership_number TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create clients table (companies managed by CAs)
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  gstin TEXT,
  pan TEXT,
  cin TEXT,
  address TEXT,
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  financial_year_start INTEGER DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create work_items table (main tracking table)
CREATE TABLE public.work_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  category work_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status work_status DEFAULT 'draft' NOT NULL,
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- GST Returns table
CREATE TABLE public.gst_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id UUID REFERENCES public.work_items(id) ON DELETE CASCADE NOT NULL,
  return_type TEXT NOT NULL, -- GSTR-1, GSTR-3B, GSTR-2B, etc.
  period TEXT NOT NULL, -- e.g., "Dec 2024", "Q3 FY24-25"
  taxable_value DECIMAL(15,2) DEFAULT 0,
  igst DECIMAL(15,2) DEFAULT 0,
  cgst DECIMAL(15,2) DEFAULT 0,
  sgst DECIMAL(15,2) DEFAULT 0,
  total_tax DECIMAL(15,2) DEFAULT 0,
  itc_claimed DECIMAL(15,2) DEFAULT 0,
  net_payable DECIMAL(15,2) DEFAULT 0,
  filing_date DATE,
  arn TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Income Tax Computations table
CREATE TABLE public.income_tax_computations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id UUID REFERENCES public.work_items(id) ON DELETE CASCADE NOT NULL,
  assessment_year TEXT NOT NULL,
  gross_income DECIMAL(15,2) DEFAULT 0,
  deductions JSONB DEFAULT '{}',
  taxable_income DECIMAL(15,2) DEFAULT 0,
  tax_liability DECIMAL(15,2) DEFAULT 0,
  tds_credit DECIMAL(15,2) DEFAULT 0,
  advance_tax_paid DECIMAL(15,2) DEFAULT 0,
  self_assessment_tax DECIMAL(15,2) DEFAULT 0,
  refund_due DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Journal Entries table (Accounting)
CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id UUID REFERENCES public.work_items(id) ON DELETE CASCADE NOT NULL,
  entry_date DATE NOT NULL,
  entry_number TEXT,
  narration TEXT,
  debit_account TEXT NOT NULL,
  credit_account TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Compliance Tasks table
CREATE TABLE public.compliance_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id UUID REFERENCES public.work_items(id) ON DELETE CASCADE NOT NULL,
  task_type TEXT NOT NULL, -- MCA filing, Board resolution, etc.
  form_number TEXT,
  due_date DATE,
  filed_date DATE,
  srn TEXT,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Audit Findings table
CREATE TABLE public.audit_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id UUID REFERENCES public.work_items(id) ON DELETE CASCADE NOT NULL,
  finding_type TEXT NOT NULL, -- observation, weakness, fraud, etc.
  area TEXT NOT NULL,
  description TEXT NOT NULL,
  risk_level TEXT DEFAULT 'medium',
  recommendation TEXT,
  management_response TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Financial Statements table
CREATE TABLE public.financial_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id UUID REFERENCES public.work_items(id) ON DELETE CASCADE NOT NULL,
  statement_type TEXT NOT NULL, -- balance_sheet, pnl, cash_flow
  period TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gst_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_tax_computations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_statements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for clients
CREATE POLICY "Users can view own clients" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clients" ON public.clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clients" ON public.clients FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for work_items
CREATE POLICY "Users can view own work items" ON public.work_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own work items" ON public.work_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own work items" ON public.work_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own work items" ON public.work_items FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for gst_returns (through work_items ownership)
CREATE POLICY "Users can view own GST returns" ON public.gst_returns FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.work_items WHERE work_items.id = gst_returns.work_item_id AND work_items.user_id = auth.uid()));
CREATE POLICY "Users can insert own GST returns" ON public.gst_returns FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.work_items WHERE work_items.id = gst_returns.work_item_id AND work_items.user_id = auth.uid()));
CREATE POLICY "Users can update own GST returns" ON public.gst_returns FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.work_items WHERE work_items.id = gst_returns.work_item_id AND work_items.user_id = auth.uid()));
CREATE POLICY "Users can delete own GST returns" ON public.gst_returns FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.work_items WHERE work_items.id = gst_returns.work_item_id AND work_items.user_id = auth.uid()));

-- RLS Policies for income_tax_computations
CREATE POLICY "Users can view own IT computations" ON public.income_tax_computations FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.work_items WHERE work_items.id = income_tax_computations.work_item_id AND work_items.user_id = auth.uid()));
CREATE POLICY "Users can insert own IT computations" ON public.income_tax_computations FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.work_items WHERE work_items.id = income_tax_computations.work_item_id AND work_items.user_id = auth.uid()));
CREATE POLICY "Users can update own IT computations" ON public.income_tax_computations FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.work_items WHERE work_items.id = income_tax_computations.work_item_id AND work_items.user_id = auth.uid()));
CREATE POLICY "Users can delete own IT computations" ON public.income_tax_computations FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.work_items WHERE work_items.id = income_tax_computations.work_item_id AND work_items.user_id = auth.uid()));

-- RLS Policies for journal_entries
CREATE POLICY "Users can view own journal entries" ON public.journal_entries FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.work_items WHERE work_items.id = journal_entries.work_item_id AND work_items.user_id = auth.uid()));
CREATE POLICY "Users can insert own journal entries" ON public.journal_entries FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.work_items WHERE work_items.id = journal_entries.work_item_id AND work_items.user_id = auth.uid()));
CREATE POLICY "Users can update own journal entries" ON public.journal_entries FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.work_items WHERE work_items.id = journal_entries.work_item_id AND work_items.user_id = auth.uid()));
CREATE POLICY "Users can delete own journal entries" ON public.journal_entries FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.work_items WHERE work_items.id = journal_entries.work_item_id AND work_items.user_id = auth.uid()));

-- RLS Policies for compliance_tasks
CREATE POLICY "Users can view own compliance tasks" ON public.compliance_tasks FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.work_items WHERE work_items.id = compliance_tasks.work_item_id AND work_items.user_id = auth.uid()));
CREATE POLICY "Users can insert own compliance tasks" ON public.compliance_tasks FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.work_items WHERE work_items.id = compliance_tasks.work_item_id AND work_items.user_id = auth.uid()));
CREATE POLICY "Users can update own compliance tasks" ON public.compliance_tasks FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.work_items WHERE work_items.id = compliance_tasks.work_item_id AND work_items.user_id = auth.uid()));
CREATE POLICY "Users can delete own compliance tasks" ON public.compliance_tasks FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.work_items WHERE work_items.id = compliance_tasks.work_item_id AND work_items.user_id = auth.uid()));

-- RLS Policies for audit_findings
CREATE POLICY "Users can view own audit findings" ON public.audit_findings FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.work_items WHERE work_items.id = audit_findings.work_item_id AND work_items.user_id = auth.uid()));
CREATE POLICY "Users can insert own audit findings" ON public.audit_findings FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.work_items WHERE work_items.id = audit_findings.work_item_id AND work_items.user_id = auth.uid()));
CREATE POLICY "Users can update own audit findings" ON public.audit_findings FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.work_items WHERE work_items.id = audit_findings.work_item_id AND work_items.user_id = auth.uid()));
CREATE POLICY "Users can delete own audit findings" ON public.audit_findings FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.work_items WHERE work_items.id = audit_findings.work_item_id AND work_items.user_id = auth.uid()));

-- RLS Policies for financial_statements
CREATE POLICY "Users can view own financial statements" ON public.financial_statements FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.work_items WHERE work_items.id = financial_statements.work_item_id AND work_items.user_id = auth.uid()));
CREATE POLICY "Users can insert own financial statements" ON public.financial_statements FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.work_items WHERE work_items.id = financial_statements.work_item_id AND work_items.user_id = auth.uid()));
CREATE POLICY "Users can update own financial statements" ON public.financial_statements FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.work_items WHERE work_items.id = financial_statements.work_item_id AND work_items.user_id = auth.uid()));
CREATE POLICY "Users can delete own financial statements" ON public.financial_statements FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.work_items WHERE work_items.id = financial_statements.work_item_id AND work_items.user_id = auth.uid()));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_work_items_updated_at BEFORE UPDATE ON public.work_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();