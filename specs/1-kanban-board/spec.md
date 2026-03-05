# Feature Specification: Kanban Board for Small Teams

**Feature Branch**: `1-kanban-board`  
**Created**: 2026-03-04  
**Status**: Draft  
**Input**: User description: "Kanban board cho nhóm nhỏ (To Do / In Progress / Done). Người dùng tạo Board, List/Column, Card (task), kéo–thả để đổi trạng thái, comment và gán người phụ trách. Có Activity Log cơ bản."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Board & Column Setup (Priority: P1)

A team member creates a new Board and sees the three default columns (To Do, In Progress, Done)
ready for use immediately after creation.

**Why this priority**: Without a board, nothing else in the application is usable. This story
is the foundational prerequisite for all other stories.

**Independent Test**: Can be fully tested by having a user sign in, click "Create Board", provide
a board name, and confirm that three empty columns appear in the correct order. Delivers a usable,
shareable workspace.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the home screen, **When** they click "Create Board" and
   enter a board name, **Then** a new board is created with three columns in order:
   "To Do", "In Progress", "Done".
2. **Given** an existing board, **When** the owner shares the board URL with a team member,
   **Then** the team member (after authentication) can view the board and all its columns.
3. **Given** an existing board, **When** the owner renames or deletes a board, **Then** the
   change is immediately reflected for all members currently viewing the board.

---

### User Story 2 — Card Creation & Management (Priority: P1)

A team member adds a task card to any column, gives it a title and optional description, and the
card appears instantly on the board for all viewers.

**Why this priority**: Cards are the atomic unit of work. Without cards the board has no value
even when columns exist.

**Independent Test**: Can be fully tested by adding a card to "To Do", verifying it appears for
a second logged-in session, editing its title, and deleting it — all without any drag-and-drop
or assignment functionality.

**Acceptance Scenarios**:

1. **Given** a board with at least one column, **When** a member clicks "+ Add Card" inside a
   column and submits a title, **Then** a new card appears at the bottom of that column, visible
   to all active board members within 1 second.
2. **Given** an existing card, **When** a member edits its title or description, **Then** the
   updated content is saved and reflected for all viewers.
3. **Given** an existing card, **When** the card creator or board owner deletes it, **Then** the
   card is removed from the board and no longer visible to any member.
4. **Given** a card creation attempt with an empty title, **When** the user submits the form,
   **Then** the system rejects the submission and shows a validation message; no card is created.

---

### User Story 3 — Drag-and-Drop Status Change (Priority: P1)

A team member drags a card from one column to another to update its status, and the change
propagates instantaneously to all viewers.

**Why this priority**: Moving cards between columns is the core interaction that distinguishes a
Kanban board from a simple list. It must be P1 to deliver the Kanban workflow.

**Independent Test**: Can be fully tested by dragging one card across all three columns in a
single session while a second session passively watches, confirming each move appears within 1
second without a page refresh.

**Acceptance Scenarios**:

1. **Given** a card in "To Do", **When** a member drags it and drops it onto "In Progress",
   **Then** the card moves to "In Progress" immediately (optimistic update) and all other active
   sessions reflect the change within 1 second.
2. **Given** a card being dragged, **When** the member drops it back onto the same column,
   **Then** the card position may update within the column but the column assignment does not
   change.
3. **Given** two members dragging the same card concurrently to different columns, **When** both
   drop actions are received by the server, **Then** the server resolves the conflict using
   last-write-wins and all clients converge to the same final state within 2 seconds.
4. **Given** a member who loses network connectivity mid-drag, **When** the drop is attempted,
   **Then** the UI shows a "disconnected" indicator and reverts the card to its last known
   server-confirmed position once connectivity is restored.

---

### User Story 4 — Assignee & Card Details (Priority: P2)

A team member opens a card's detail view, assigns a responsible person from the board's member
list, and the assignee's name/avatar is shown on the card thumbnail.

**Why this priority**: Ownership visibility is essential for team coordination but the board
remains functional without it (P1 stories are self-contained).

**Independent Test**: Can be tested by opening a card, assigning it to a specific board member,
closing the detail panel, and confirming the assignee is displayed on the card thumbnail and
in the assignee field when reopened.

**Acceptance Scenarios**:

1. **Given** an open card detail panel, **When** a member selects another board member from the
   assignee picker, **Then** the chosen person is saved as the card's assignee and their name
   (or avatar) appears on the card thumbnail.
2. **Given** a card with an existing assignee, **When** the assignee is changed or cleared,
   **Then** the card thumbnail updates to reflect the new (or absent) assignee immediately.
3. **Given** a board member who is removed from the board, **When** any card previously assigned
   to them is viewed, **Then** the card displays the assignee as "Removed member" (or equivalent
   label) without breaking the card's functionality.
4. **Given** a card detail panel, **When** a due date is optionally set, **Then** the due date
   appears on the card thumbnail and is stored with the card.

---

### User Story 5 — Comments on Cards (Priority: P2)

A team member opens a card and posts a text comment; all board members can read existing comments
in chronological order.

**Why this priority**: Communication context on a card reduces the need for external messaging
tools but is not required for the core Kanban workflow.

**Independent Test**: Can be tested independently by posting several comments on a card from two
different user accounts and verifying chronological ordering and real-time delivery.

**Acceptance Scenarios**:

1. **Given** a card detail panel, **When** a member types a comment and submits it, **Then** the
   comment appears at the bottom of the comment list with the author's name and timestamp; other
   active sessions receive the new comment within 1 second.
2. **Given** a list of existing comments, **When** a member views the card, **Then** comments are
   displayed in ascending chronological order (oldest first).
3. **Given** a comment authored by the current user, **When** they choose to delete it, **Then**
   the comment is removed for all viewers; comments by others CANNOT be deleted by non-owners.
4. **Given** a comment submission with an empty body, **When** the user submits, **Then** the
   system rejects it and shows a validation message; no comment is stored.

---

### User Story 6 — Activity Log (Priority: P3)

A team member opens the Activity Log panel for a board and sees a chronological list of recent
events (card created, moved, assigned, commented).

**Why this priority**: Audit visibility is valuable for team awareness but not required for core
task management. It is the last story to implement.

**Independent Test**: Can be tested by performing a sequence of actions (create card, move card,
add comment, assign member) and verifying each appears as a distinct log entry in the Activity
Log panel in the correct order.

**Acceptance Scenarios**:

1. **Given** any board action has occurred (card create / move / assign / comment), **When** a
   member opens the Activity Log panel, **Then** each event appears as a human-readable entry
   (e.g., "Alice moved 'Design mockup' to In Progress — 2 minutes ago").
2. **Given** the Activity Log panel open, the log MUST display at minimum the last **50 events**
   in descending chronological order (newest first).
3. **Given** the Activity Log panel, **When** a new event occurs while the panel is open,
   **Then** the new entry appears at the top without requiring a page refresh.
4. **Given** a card is deleted, **When** the Activity Log is viewed, **Then** historical events
   referencing the deleted card still display the card's last known title (not a broken reference).

---

### Edge Cases

- What happens when a board has no members other than the owner — can cards still be assigned?
  (Yes: only the owner is available in the picker.)
- What happens when a user with open card detail panels is removed from the board mid-session?
  (They are shown an "access revoked" message and the panel closes.)
- How does the system handle a card title exceeding the maximum length?
  (Enforce a 255-character limit client- and server-side; surface a character counter.)
- What happens if a drag-and-drop operation is attempted on a touch device?
  (Touch drag-and-drop MUST be supported; it is not optional for mobile users.)
- What happens when two members post a comment on the same card at the same millisecond?
  (Server timestamp wins for ordering; both comments are preserved.)
- What happens if the board has zero cards in all columns?
  (Each column shows an empty-state prompt: "No tasks yet — click + to add one.")

---

## Requirements *(mandatory)*

### Functional Requirements

#### Authentication & Members

- **FR-001**: Users MUST authenticate before accessing any board or performing any action.
- **FR-002**: A board owner MUST be able to invite team members by entering their registered
  email address.
- **FR-003**: Invited members MUST receive access to the board upon acceptance; they MUST NOT
  gain access before accepting.
- **FR-004**: A board owner MUST be able to remove a member; the removed member MUST lose
  access immediately.

#### Boards

- **FR-005**: Authenticated users MUST be able to create a new board with a unique name
  (within their account scope).
- **FR-006**: Board creation MUST automatically generate three columns in order: "To Do",
  "In Progress", "Done".
- **FR-007**: Board owners MUST be able to rename or delete a board; deletion MUST cascade to
  all columns and cards.
- **FR-008**: A user MUST be able to view a list of all boards they own or are a member of.

#### Columns (Lists)

- **FR-009**: Board members MUST be able to add new columns to a board (beyond the default three).
- **FR-010**: Board members MUST be able to rename any column.
- **FR-011**: Board owners MUST be able to delete a column; deletion MUST warn the user if the
  column contains cards and MUST cascade-delete all cards within it upon confirmation.
- **FR-012**: Column order MUST be persistently saved; dragging to reorder columns is OPTIONAL
  for v1 (manual reorder via settings is acceptable).

#### Cards

- **FR-013**: Board members MUST be able to create a card in any column; a card MUST have at
  minimum a non-empty title (max 255 characters).
- **FR-014**: Cards MUST support an optional description field (rich text is out of scope for v1;
  plain text suffices).
- **FR-015**: Board members MUST be able to move a card to any column via drag-and-drop; the
  move MUST be persisted immediately server-side.
- **FR-016**: Board members MUST be able to open a card detail panel without navigating away
  from the board view.
- **FR-017**: The card creator or board owner MUST be able to delete a card.

#### Assignees

- **FR-018**: Any board member MUST be able to assign any card to exactly one board member
  (including themselves).
- **FR-019**: A card MAY have no assignee; the assignee field is optional.
- **FR-020**: The assignee's display name MUST appear on the card thumbnail in the board view.

#### Comments

- **FR-021**: Any board member MUST be able to post a plain-text comment on any card.
- **FR-022**: Comments MUST display the author's name and a human-readable relative timestamp
  (e.g., "3 minutes ago").
- **FR-023**: Comment authors MUST be able to delete their own comments; they MUST NOT be able
  to delete other members' comments.

#### Activity Log

- **FR-024**: The system MUST automatically record an activity entry for each of the following
  events: card created, card moved (column change), card assigned/unassigned, card deleted,
  comment added.
- **FR-025**: The Activity Log MUST be accessible as a panel on the board view and display the
  last 50 events in descending chronological order.
- **FR-026**: Activity log entries MUST include: event type, actor name, target card title,
  destination column (for moves), and timestamp.

#### Real-Time Synchronisation

- **FR-027**: All board mutation events (card CRUD, moves, comments, assignments) MUST be
  broadcast to all active board sessions within 1 second under normal network conditions.
- **FR-028**: The UI MUST display a visible "disconnected" indicator when the real-time
  connection is lost, and recover automatically when connectivity is restored.

### Key Entities

- **User**: Registered account; attributes: id, display name, email, avatar URL.
- **Board**: Workspace container; attributes: id, name, owner (User), created at, member list.
- **BoardMember**: Join entity between User and Board; attributes: userId, boardId, role
  (owner | member), joined at.
- **Column**: Ordered lane within a Board; attributes: id, boardId, name, position (integer).
- **Card**: Task unit within a Column; attributes: id, columnId, boardId, title, description,
  assigneeId (nullable), position (integer), created by, created at, updated at.
- **Comment**: Text message on a Card; attributes: id, cardId, authorId, body, created at.
- **ActivityEvent**: Immutable audit record; attributes: id, boardId, actorId, eventType,
  cardId, cardTitle (snapshot), fromColumnId (nullable), toColumnId (nullable), created at.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can create a board, add three cards across different columns, and
  invite a team member — all within **5 minutes** of first sign-in with no assistance.
- **SC-002**: Card moves between columns are reflected in all active browser sessions within
  **1 second** under a standard broadband connection (≥ 10 Mbps).
- **SC-003**: The board view loads and is interactive within **3 seconds** for a board
  containing up to **200 cards** on a mid-tier device.
- **SC-004**: The system correctly handles at least **10 concurrent board members** performing
  simultaneous actions without data loss or inconsistent board state.
- **SC-005**: **95 %** of drag-and-drop operations complete without error and without requiring
  a manual page refresh to see the correct state.
- **SC-006**: **100 %** of recorded activity events are visible in the Activity Log within
  **2 seconds** of the triggering action.
- **SC-007**: The application passes WCAG 2.1 Level AA accessibility audit for all primary
  user flows (board view, card detail, activity log).
- **SC-008**: Unit test coverage for all non-UI logic (API handlers, state management, utilities)
  is maintained at **≥ 80 %** throughout the project lifetime.
