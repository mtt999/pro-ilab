-- Solo Workspace Sharing Migration
-- Run this in your Supabase SQL Editor

-- 1. Track which solo user owns each project
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS solo_owner_id uuid REFERENCES solo_users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_solo_owner ON projects(solo_owner_id);

-- 2. Workspace invitations sent by a solo user to a teammate email
CREATE TABLE IF NOT EXISTS solo_workspace_invites (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id      uuid        NOT NULL REFERENCES solo_users(id) ON DELETE CASCADE,
  invitee_email text        NOT NULL,
  status        text        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, invitee_email)
);

CREATE INDEX IF NOT EXISTS idx_swi_owner    ON solo_workspace_invites(owner_id);
CREATE INDEX IF NOT EXISTS idx_swi_invitee  ON solo_workspace_invites(invitee_email);

-- 3. Accepted workspace memberships
CREATE TABLE IF NOT EXISTS solo_workspace_members (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id   uuid        NOT NULL REFERENCES solo_users(id) ON DELETE CASCADE,
  member_id  uuid        NOT NULL REFERENCES solo_users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_swm_owner  ON solo_workspace_members(owner_id);
CREATE INDEX IF NOT EXISTS idx_swm_member ON solo_workspace_members(member_id);
