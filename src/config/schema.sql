-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  avatar_color VARCHAR(7) DEFAULT '#0052CC',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Boards table
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  background VARCHAR(255) DEFAULT 'gradient-blue',
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lists table
CREATE TABLE IF NOT EXISTS lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cards table
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  due_date TIMESTAMPTZ,
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Labels table
CREATE TABLE IF NOT EXISTS labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100),
  color VARCHAR(7) NOT NULL,
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE
);

-- Card Labels junction
CREATE TABLE IF NOT EXISTS card_labels (
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  label_id UUID REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, label_id)
);

-- Card Members junction
CREATE TABLE IF NOT EXISTS card_members (
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, user_id)
);

-- Checklist items
CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text VARCHAR(500) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  position INTEGER NOT NULL DEFAULT 0,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lists_board_id ON lists(board_id);
CREATE INDEX IF NOT EXISTS idx_cards_list_id ON cards(list_id);
CREATE INDEX IF NOT EXISTS idx_checklist_card_id ON checklist_items(card_id);
CREATE INDEX IF NOT EXISTS idx_labels_board_id ON labels(board_id);
