-- Shop.destiny_ratioを小数点から整数（0〜10）に変更するSQL
ALTER TABLE "Shop" 
  ALTER COLUMN "destiny_ratio" TYPE integer
  USING ("destiny_ratio"::integer),
  ADD CONSTRAINT "destiny_ratio_range" 
  CHECK ("destiny_ratio" >= 0 AND "destiny_ratio" <= 10);

-- すでに存在するデータを四捨五入して整数に変換
UPDATE "Shop"
SET "destiny_ratio" = ROUND("destiny_ratio"::numeric)
WHERE "destiny_ratio" IS NOT NULL;