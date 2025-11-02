-- Criar tabela de empresas
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  cnpj varchar(18) UNIQUE NOT NULL,
  email varchar(255) NOT NULL,
  phone varchar(20),
  address text,
  type varchar(20) NOT NULL CHECK (type IN ('VENDEDOR', 'COMPRADOR', 'AMBOS')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Criar tabela de usuários (estende auth.users)
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  full_name varchar(255) NOT NULL,
  email varchar(255) UNIQUE NOT NULL,
  role varchar(20) DEFAULT 'USER' NOT NULL CHECK (role IN ('ADMIN', 'USER')),
  avatar_url text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Criar tabela de entregas
CREATE TABLE public.deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  buyer_company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  created_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  nf_number varchar(50) NOT NULL,
  nf_series varchar(10),
  nf_date date NOT NULL,
  nf_value decimal(15,2) NOT NULL,
  nf_file_url text,
  delivery_address text NOT NULL,
  delivery_city varchar(100) NOT NULL,
  delivery_state varchar(2) NOT NULL,
  delivery_postal_code varchar(10),
  proposed_date date,
  proposed_time_start time,
  proposed_time_end time,
  confirmed_date date,
  confirmed_time_start time,
  confirmed_time_end time,
  status varchar(30) DEFAULT 'DRAFT' NOT NULL CHECK (status IN ('DRAFT', 'AGUARDANDO_COMPRADOR', 'AGUARDANDO_VENDEDOR', 'CONFIRMADA', 'EM_TRANSITO', 'ENTREGUE', 'CANCELADA')),
  ball_with varchar(20) CHECK (ball_with IN ('VENDEDOR', 'COMPRADOR', 'NINGUEM')),
  notes text,
  internal_notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text
);

-- Criar tabela de linha do tempo de entregas
CREATE TABLE public.delivery_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid REFERENCES public.deliveries(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  action varchar(50) NOT NULL,
  description text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Criar tabela de mensagens de entregas
CREATE TABLE public.delivery_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid REFERENCES public.deliveries(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Criar tabela de notificações
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  delivery_id uuid REFERENCES public.deliveries(id) ON DELETE CASCADE,
  type varchar(50) NOT NULL,
  title varchar(255) NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Criar tabela de relacionamentos entre empresas
CREATE TABLE public.company_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  buyer_company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  status varchar(20) DEFAULT 'ACTIVE' NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(seller_company_id, buyer_company_id)
);

-- Criar índices para performance
CREATE INDEX idx_deliveries_seller ON public.deliveries(seller_company_id);
CREATE INDEX idx_deliveries_buyer ON public.deliveries(buyer_company_id);
CREATE INDEX idx_deliveries_status ON public.deliveries(status);
CREATE INDEX idx_deliveries_ball_with ON public.deliveries(ball_with);
CREATE INDEX idx_timeline_delivery ON public.delivery_timeline(delivery_id);
CREATE INDEX idx_messages_delivery ON public.delivery_messages(delivery_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(is_read);

-- Ativar Row Level Security em todas as tabelas
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_relationships ENABLE ROW LEVEL SECURITY;

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at
  BEFORE UPDATE ON public.deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();