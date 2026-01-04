-- Make payment-receipts bucket public for image display
UPDATE storage.buckets SET public = true WHERE id = 'payment-receipts';