# PerforMetrix Admin Portal — Build Brief

For use with Claude Code. This covers what the application needs to do, the data it needs to hold, and the scoring logic that already exists and just needs implementing correctly. A working single-file HTML prototype of the assessment and report flow already exists (PerforMetrix_Prototype.html), it's a good visual and interaction reference, but it has no backend, no persistence, and no multi-tenancy, all of which this build needs to add.

---

## What this is

A multi-tenant web application for administering the PerforMetrix AI Audit assessment across multiple customer organisations. Three user types:

- **PerforMetrix (super admin)**: sees every customer, every CHRO, every leader, every submission, across the whole business
- **CHRO**: logs into their own organisation's view only. Adds leaders, generates confidential assessment links, receives completed reports
- **Leader**: never logs in. Receives a one-time link, completes the assessment anonymously with respect to other leaders, sees only a confirmation on submit, not their own score

---

## Data model

**Customers**
- id, organisation name, created date, CHRO contact(s)

**Users**
- id, customer_id (nullable for Shiva), role (super_admin / chro), name, email, auth credentials

**Leaders**
- id, customer_id, name, unique assessment token, status (pending / completed), created date, completed date

**Submissions**
- id, leader_id, raw answers (JSON, see structure below), computed scores (JSON), submitted date

---

## Core user flows

1. CHRO logs in, sees their own leader list only, adds a new leader by name, gets a generated link
2. CHRO sends that link to the leader themselves, outside the system (email, Slack, whatever they use)
3. Leader opens the link, no login required, completes the assessment, submits
4. On submit: scores compute server-side, submission stored, leader sees a simple confirmation screen only
5. CHRO gets notified (email) that a report is ready, can view it in their dashboard
6. PerforMetrix gets a copy of every report across every customer, plus a cross-customer view showing completion rates and score patterns
7. PerforMetrix can also generate a standalone preview/demo report with sample data, for sales conversations, without it counting as a real customer submission

---

## Assessment structure and scoring

Four pillars: Succession-Ready, Judgment-Ready, Relationship-Ready, Globally-Ready. Two are forced-choice ranking (Succession, Global), two are scenario-based multiple choice (Judgment, Relationship). Each pillar has three sub-dimensions.

**Forced-choice pillars (Succession-Ready, Globally-Ready)**
- Two blocks per pillar, three statements per block, one statement per sub-dimension
- Leader ranks the three statements 1 to 3 within each block (3 = most like me, 1 = least like me)
- For each sub-dimension, sum the rank given across both blocks (range 2–6)
- Normalize: `(sum - 2) / 4 * 100`
- Pillar score = average of its three normalized sub-dimension scores

**Scenario pillars (Judgment-Ready, Relationship-Ready)**
- Two scenarios per pillar, four options each (A–D)
- Each option carries a pre-set score (1–3) against each of the pillar's three sub-dimensions
- Leader picks one option per scenario
- For each sub-dimension, sum the chosen option's value across both scenarios (range 2–6)
- Normalize the same way: `(sum - 2) / 4 * 100`
- Pillar score = average of its three normalized sub-dimension scores

**Overall score**
- Average of the four pillar scores
- Priority gap threshold: pillar score ≤ 80 gets flagged

The actual statement text, scenario text, option text, and dimension-to-score mappings are all in PerforMetrix_Assessment_v2.md and are also fully implemented in the JS of PerforMetrix_Prototype.html (see the `SUCCESSION`, `JUDGMENT`, `RELATIONSHIP`, `GLOBAL` constants, and the `scoreSession` function). That scoring logic can likely be lifted close to as-is and moved server-side.

---

## Report view requirements

- Overall score, four pillar scores, sub-dimension breakdown per pillar
- One-line plain-language description under every sub-dimension (already written, see `SUBDIM_DESC` in the prototype)
- Organisational impact text per pillar, shown more prominently when that pillar is flagged (already written, see `IMPACT` in the prototype)
- A short legend explaining how to read the score and what the priority threshold means
- Clear indication of who the report was delivered to (which CHRO, which organisation) and that PerforMetrix received a copy

---

## Non-functional requirements

- **Confidentiality is the core design constraint.** A leader's individual answers and scores must never be visible to another leader, and a CHRO must never see another customer's data
- Proper authentication for CHRO and PerforMetrix logins, no login for leaders, just the token-based link
- Email delivery for the CHRO's "report ready" notification. Sending the leader their initial link stays a manual step CHROs do themselves, at least for the first version, unless you want that automated too
- This holds real assessment data on named executives, so standard data protection practice applies, encryption at rest, access logging, a way to delete a leader's data on request

---

## Suggested scope for a first working version

- CHRO login and their own leader list
- Leader link generation and the assessment flow itself
- Automatic scoring and the report view
- Shiva's cross-customer view
- Basic email notification when a report is ready

Leave for a later phase: automated link delivery to leaders, the stakeholder 360 add-on for the paid coaching phase, any billing or self-serve customer onboarding.

