ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS checkout_request_id text,
  ADD COLUMN IF NOT EXISTS merchant_request_id text,
  ADD COLUMN IF NOT EXISTS mpesa_receipt text;

CREATE INDEX IF NOT EXISTS idx_tx_checkout ON public.transactions(checkout_request_id);