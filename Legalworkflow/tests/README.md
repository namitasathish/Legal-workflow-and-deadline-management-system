# Legal Workflow App - Testing Suite

This directory contains all the automated tests for the Legal Workflow and Deadline Management Application. The tests are executed using a custom runner (`ManualTestUtils.js`) that validates independent blocks of logic without requiring a heavy transpiler or specific testing framework.

## Test Categories

The test suites are broadly classified into three categories: **Unit Tests**, **Functional Tests**, and **Integration Tests**.

---

### 1. Unit Tests
*These tests isolate specific algorithmic logic, calculations, and data transformations to ensure core engines are accurate.*

- **`unit.test.js`**
  - **Purpose:** Tests the core mathematical and string manipulation helpers.
  - **How it Tests:** Calculates accurate date differences, computes "Urgent" vs "Normal" casing statuses based on days left, and verifies string truncation algorithms for the UI.
- **`notifications.test.js`**
  - **Purpose:** Validates the logic triggering automated push notifications based on case urgency.
  - **How it Tests:** Ensures High-priority cases generate three alerts (7, 2, 0 days prior), Medium-priority generates two (2, 0 days), and verifies the correct scheduled payload format.
- **`milestones.test.js`**
  - **Purpose:** Verifies timeline sequence logic.
  - **How it Tests:** Ensures that when multiple case milestones are added, they are strictly sorted in ascending chronological order for the case timeline viewer.

### 2. Functional & Workflow Tests
*These suites test business logic workflows—ensuring that inputs result in the correct state changes and feature outcomes.*

- **`functionality.test.js`**
  - **Purpose:** Tests high-level app input validation and data filtering.
  - **How it Tests:** Validates case addition forms (preventing empty/whitespace titles) and tests the Home screen's search engine (filtering active cases by title, court name, and status).
- **`authRoles.test.js`**
  - **Purpose:** Validates the dual-role authentication system workflow.
  - **How it Tests:** Ensures new clients are securely mapped to existing lawyer-created profiles via email matching, and validates that login sessions inherit correct roles (`client` vs `lawyer`).
- **`appointments.test.js`**
  - **Purpose:** Verifies the meeting request and scheduling engine.
  - **How it Tests:** Ensures new appointments default to 'Requested', status can transition correctly (to 'Confirmed', 'Completed', etc.), and tests filtering between global views and case-specific views.
- **`messaging.test.js`**
  - **Purpose:** Tests the chat engine and real-time notification badge logic.
  - **How it Tests:** Checks that lawyer messages increment the client's unread counter (and vice versa) and verifies that `markAsRead` accurately zeros out the counter based on the viewer's role.
- **`payments.test.js`**
  - **Purpose:** Verifies billing logic and fee tracking constraints.
  - **How it Tests:** Checks the workflow of marking a pending invoice as 'Paid', ensuring correct timestamping, and testing that clients only see invoices securely scoped to their own ID.
- **`docRequests.test.js`**
  - **Purpose:** Tests the logic controlling document workflow between lawyer and client.
  - **How it Tests:** Validates document requesting constraints (valid titles), correctly maps request statuses ('Pending', 'Uploaded', 'Accepted') to UI colors, and calculates aggregated document pipeline statuses.
- **`clientCRM.test.js`**
  - **Purpose:** Verifies internal Lawyer-CRM interaction logs.
  - **How it Tests:** Checks that interactions logged with a follow-up date appear in the 'Pending' pipeline, and successfully drop off the pipeline when marked as resolved.
- **`feedback.test.js`**
  - **Purpose:** Tests case closure workflows and satisfaction metrics.
  - **How it Tests:** Guarantees cases close using valid outcome enums ('Won', 'Lost', etc.) and guarantees client ratings are strictly bounded between 1 and 5 stars.
- **`privacyScopes.test.js`**
  - **Purpose:** Critical data isolation checks.
  - **How it Tests:** Imitates the SQLite wrapper to prove that queries restrict returning Case or Document records to only those matching the requesting Client's ID, preventing data leakage across accounts.

### 3. Integration Tests
*These tests validate the application's interaction with the underlying local data persistence layer.*

- **`db.test.js`**
  - **Purpose:** Tests complete Create, Read, Update, and Delete (CRUD) pipelines against a mock SQLite instance representing `migrations.js`.
  - **How it Tests:** Verifies SQL injections format correctly, testing the insertion of new records, querying by ID, complex `UPDATE` queries on 10+ columns simultaneously, and database record deletions to ensure no ghost records persist.

---

## How to Run the Tests
run all the tests via
```bash
npm test 
```
from here C:\college\Legalworkflowanddeadlinemgt\LegalworkflowApp\Legalworkflow>

To execute any specific test suite, run it via Node.js from the root of the project:
```bash
node tests/unit.test.js
node tests/messaging.test.js
node tests/payments.test.js
node tests/docRequests.test.js
node tests/clientCRM.test.js
node tests/feedback.test.js
node tests/privacyScopes.test.js
node tests/db.test.js
node tests/functionality.test.js
node tests/authRoles.test.js
node tests/appointments.test.js
node tests/milestones.test.js
node tests/messaging.test.js
node tests/payments.test.js
node tests/docRequests.test.js
node tests/clientCRM.test.js
node tests/feedback.test.js
node tests/privacyScopes.test.js
node tests/db.test.js
```
*Note: These tests use standard `require()` modules to maintain compatibility with vanilla Node execution, bypassing the need for transpilation configurations like Babel or Jest while providing fast, reliable logic validation.*
