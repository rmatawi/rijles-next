-- Table for single-use invite links
CREATE TABLE IF NOT EXISTS drv_invite_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES drv_schools(id) ON DELETE CASCADE,
  created_by UUID NOT NULL, -- ID of the admin/instructor who created the invite
  recipient_email VARCHAR(255), -- Optional: specific email the invite is for
  token VARCHAR(255) NOT NULL UNIQUE, -- The unique token for the invite link
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'), -- Expires in 7 days by default
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0, -- Track how many times link was accessed
  first_used_at TIMESTAMP WITH TIME ZONE, -- When the link was first used
  last_used_at TIMESTAMP WITH TIME ZONE  -- When the link was last used
);

-- Index for efficient lookups (with IF NOT EXISTS if your version supports it)
-- For older PostgreSQL versions, you may need to handle index creation separately
DO $$ 
BEGIN
    -- Try to create indexes, ignore if they already exist
    BEGIN
        CREATE INDEX idx_drv_invite_links_token ON drv_invite_links(token);
    EXCEPTION
        WHEN duplicate_table THEN -- This will catch the duplicate index error
            RAISE NOTICE 'Index idx_drv_invite_links_token already exists';
    END;

    BEGIN
        CREATE INDEX idx_drv_invite_links_school_id ON drv_invite_links(school_id);
    EXCEPTION
        WHEN duplicate_table THEN
            RAISE NOTICE 'Index idx_drv_invite_links_school_id already exists';
    END;

    BEGIN
        CREATE INDEX idx_drv_invite_links_is_used ON drv_invite_links(is_used);
    EXCEPTION
        WHEN duplicate_table THEN
            RAISE NOTICE 'Index idx_drv_invite_links_is_used already exists';
    END;

    BEGIN
        CREATE INDEX idx_drv_invite_links_expires_at ON drv_invite_links(expires_at);
    EXCEPTION
        WHEN duplicate_table THEN
            RAISE NOTICE 'Index idx_drv_invite_links_expires_at already exists';
    END;
END $$;

-- Function to update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS 
$$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ 
LANGUAGE plpgsql;

-- Drop trigger if it exists before creating (to avoid conflicts)
DROP TRIGGER IF EXISTS update_drv_invite_links_updated_at ON drv_invite_links;

-- Trigger to automatically update 'updated_at' on row updates
CREATE TRIGGER update_drv_invite_links_updated_at 
    BEFORE UPDATE ON drv_invite_links 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) policies
ALTER TABLE drv_invite_links ENABLE ROW LEVEL SECURITY;

-- Drop policy if it exists first
DROP POLICY IF EXISTS drv_invite_links_school_admin_policy ON drv_invite_links;

-- Policy to allow school admins to view and manage their school's invites
CREATE POLICY drv_invite_links_school_admin_policy ON drv_invite_links
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM drv_schools 
            WHERE drv_schools.id = drv_invite_links.school_id 
            AND (
                drv_schools.admin_id = auth.uid() 
                OR auth.uid() = drv_invite_links.created_by
            )
        )
    );

-- Function to create a new invite link
CREATE OR REPLACE FUNCTION create_invite_link(
    p_school_id UUID,
    p_created_by UUID,
    p_recipient_email VARCHAR DEFAULT NULL
) 
RETURNS TEXT
AS 
$$
DECLARE
    v_token TEXT;
BEGIN
    -- Generate unique token
    v_token := encode(gen_random_bytes(32), 'hex');
    
    -- Insert the new invite record
    INSERT INTO drv_invite_links (school_id, created_by, recipient_email, token)
    VALUES (p_school_id, p_created_by, p_recipient_email, v_token);
    
    RETURN v_token;
END;
$$ 
LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate and use an invite token
CREATE OR REPLACE FUNCTION use_invite_token(
    p_token TEXT
) 
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    school_id UUID,
    recipient_email TEXT
) 
AS 
$$
DECLARE
    v_invite_record drv_invite_links%ROWTYPE;
BEGIN
    -- Find the invite by token
    SELECT * INTO v_invite_record FROM drv_invite_links WHERE token = p_token;
    
    -- Check if token exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            FALSE, 
            'Invalid invite token', 
            NULL::UUID, 
            NULL::TEXT;
    END IF;
    
    -- Check if invite has expired
    IF v_invite_record.expires_at < NOW() THEN
        RETURN QUERY SELECT 
            FALSE, 
            'Invite link has expired', 
            NULL::UUID, 
            NULL::TEXT;
    END IF;
    
    -- Check if invite has already been used
    IF v_invite_record.is_used THEN
        RETURN QUERY SELECT 
            FALSE, 
            'Invite link has already been used', 
            NULL::UUID, 
            NULL::TEXT;
    END IF;
    
    -- Update the invite record to mark as used
    UPDATE drv_invite_links 
    SET 
        is_used = TRUE,
        usage_count = usage_count + 1,
        first_used_at = COALESCE(first_used_at, NOW()),
        last_used_at = NOW()
    WHERE token = p_token;
    
    -- Return success with school information
    RETURN QUERY SELECT 
        TRUE,
        'Invite validated successfully',
        v_invite_record.school_id,
        v_invite_record.recipient_email;
        
END;
$$ 
LANGUAGE plpgsql SECURITY DEFINER;