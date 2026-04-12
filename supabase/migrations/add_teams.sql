-- ============================================================
-- Team workspace
-- ============================================================
-- Adds a top-level Team entity. Boards can belong to a team.
-- Team members automatically have access to all team boards.
-- ============================================================

-- ─── 1. teams ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS teams (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  slug         text NOT NULL UNIQUE,
  owner_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_color text NOT NULL DEFAULT '#E24E42',
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Owner can do everything
DROP POLICY IF EXISTS "Team owner full access" ON teams;
CREATE POLICY "Team owner full access" ON teams
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ─── 2. team_members ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS team_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  invited_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Members can see who else is on the team
DROP POLICY IF EXISTS "Team members can read members" ON team_members;
CREATE POLICY "Team members can read members" ON team_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM team_members tm2
      WHERE tm2.team_id = team_members.team_id
        AND tm2.user_id = auth.uid()
    )
  );

-- Members can read their team (defined here because team_members now exists)
DROP POLICY IF EXISTS "Team members can read" ON teams;
CREATE POLICY "Team members can read" ON teams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
        AND team_members.user_id = auth.uid()
    )
  );

-- Owner or admin can add members
DROP POLICY IF EXISTS "Team admins can insert members" ON team_members;
CREATE POLICY "Team admins can insert members" ON team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
        AND teams.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM team_members tm2
      WHERE tm2.team_id = team_members.team_id
        AND tm2.user_id = auth.uid()
        AND tm2.role = 'admin'
    )
  );

-- Owner or admin can update roles
DROP POLICY IF EXISTS "Team admins can update members" ON team_members;
CREATE POLICY "Team admins can update members" ON team_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
        AND teams.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM team_members tm2
      WHERE tm2.team_id = team_members.team_id
        AND tm2.user_id = auth.uid()
        AND tm2.role = 'admin'
    )
  );

-- Owner or admin can remove members; members can remove themselves
DROP POLICY IF EXISTS "Team members can be removed" ON team_members;
CREATE POLICY "Team members can be removed" ON team_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
        AND teams.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM team_members tm2
      WHERE tm2.team_id = team_members.team_id
        AND tm2.user_id = auth.uid()
        AND tm2.role = 'admin'
    )
  );

-- ─── 3. team_invitations ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS team_invitations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email       text NOT NULL,
  role        text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  token       text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at  timestamptz NOT NULL DEFAULT now() + interval '7 days',
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, email)
);

ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Admins/owner can manage invitations
DROP POLICY IF EXISTS "Team admins can manage invitations" ON team_invitations;
CREATE POLICY "Team admins can manage invitations" ON team_invitations
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_invitations.team_id
        AND teams.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_invitations.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_invitations.team_id
        AND teams.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_invitations.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.role = 'admin'
    )
  );

-- Anyone can read an invitation by token (needed for accept flow)
DROP POLICY IF EXISTS "Anyone can read invitation by token" ON team_invitations;
CREATE POLICY "Anyone can read invitation by token" ON team_invitations FOR SELECT
  USING (true);

-- ─── 4. Add team_id to boards ─────────────────────────────────────────────────

ALTER TABLE boards
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_boards_team_id ON boards(team_id) WHERE team_id IS NOT NULL;

-- Team members can read all boards in their team
DROP POLICY IF EXISTS "Team members can view team boards" ON boards;
CREATE POLICY "Team members can view team boards" ON boards FOR SELECT
  USING (
    team_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = boards.team_id
        AND team_members.user_id = auth.uid()
    )
  );

-- Team members with editor role (or team admin/owner) can insert tacks on team boards
-- (handled by existing tack RLS; team board access cascades via board visibility)

-- ─── 5. Indexes ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON team_invitations(team_id);
