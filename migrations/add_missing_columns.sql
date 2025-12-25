-- Migration to add missing columns to watchlists and portfolios tables

-- Add is_default column to watchlists if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='watchlists' AND column_name='is_default'
    ) THEN
        ALTER TABLE watchlists ADD COLUMN is_default BOOLEAN DEFAULT FALSE NOT NULL;
        RAISE NOTICE 'Added is_default column to watchlists';
    ELSE
        RAISE NOTICE 'is_default column already exists in watchlists';
    END IF;
END $$;

-- Add is_default column to portfolios if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='portfolios' AND column_name='is_default'
    ) THEN
        ALTER TABLE portfolios ADD COLUMN is_default BOOLEAN DEFAULT FALSE NOT NULL;
        RAISE NOTICE 'Added is_default column to portfolios';
    ELSE
        RAISE NOTICE 'is_default column already exists in portfolios';
    END IF;
END $$;

-- Add currency column to portfolios if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='portfolios' AND column_name='currency'
    ) THEN
        ALTER TABLE portfolios ADD COLUMN currency VARCHAR(10) DEFAULT 'USD';
        RAISE NOTICE 'Added currency column to portfolios';
    ELSE
        RAISE NOTICE 'currency column already exists in portfolios';
    END IF;
END $$;
