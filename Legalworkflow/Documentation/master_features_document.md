# Legal Workflow & CRM Platform: Master Features Document

This document serves as the master record of all functionalities, modules, and features currently implemented in the **Legal Workflow and Deadline Management Application**. The platform consists of two distinct portals—one for Legal Professionals (Lawyers) and one for their Clients—tied together by a unified, role-aware architecture.

---

## 1. Lawyer Portal Features

The Lawyer Portal is the primary control center, designed designed for comprehensive case and client management.

### 1.1 Comprehensive Case Management
- **Dashboard Overview**: Quick glance at urgent deadlines, active cases, and recent notifications.
- **Detailed Case Records**: Manage case title, court name, priority levels (High/Medium/Low), filing dates, next hearing dates, and current status.
- **Checklist & Tasks**: Add actionable next steps with a built-in checklist for every case. Track completion status.
- **Case Milestones (Timeline)**: Build an interactive chronological timeline with custom icons to track progress visible to the client.
- **Lawyer's Private Notes**: Internal case notes that are shared read-only with the client to keep them updated on strategy.
- **Case Closure & Outcomes**: Process to finalize cases, selecting resolution outcomes (Won, Lost, Settled, Withdrawn) and tracking delay notes.

### 1.2 Client Relationship Management (CRM)
- **Client Database**: Add, edit, and search through client profiles (Name, Phone, Email, Address).
- **Client Linkage**: Securely link clients to specific cases using their registered email.
- **Interaction Logs**: Log calls, meetings, or notes for a client with a dedicated CRM follow-up date and "Mark Follow-Up Done" functionality.

### 1.3 Communication & Collaboration
- **In-App Messaging (Chat)**: Real-time, per-case messaging interface with **5-second auto-polling** for near-real-time updates. Features **date-grouped message separators** (Today/Yesterday/Date) and **read receipts** (✓ sent, ✓✓ read) for delivery visibility. Unread badges clear automatically via `useFocusEffect`.
- **Contextual Notification Badges**: Visual indicators (red dots and unread counts) alert the lawyer to new messages from clients or newly uploaded documents. Badges automatically clear via immediate focus refresh logic.
- **Dashboard Notification Bell Badge**: A 🔔 icon with a **red numbered badge** on both the Lawyer and Client dashboards showing the **total count of actionable items** (unread messages + pending documents + appointment requests). Tapping the bell reveals a detailed breakdown alert. The badge auto-refreshes via `useFocusEffect`.
- **Document Requests**: Directly request specific files (e.g., "Aadhaar Card") from a client with detailed instructions. Track status from 'Pending' to 'Uploaded', and formally 'Accept' files.
- **Quick Case Summary Export**: One-tap PDF/text export of case details for sharing with clients via WhatsApp/email share targets.

### 1.4 Financial Management
- **Fee Tracking**: Ledger system to request payments tied to specific cases. 
- **Invoice Status**: Track outstanding fees vs. paid fees. One-click "Mark Paid" button once funds are received off-line.
- **Global Billing View**: Dedicated screen to view outstanding and paid invoices across the entire clientele.

### 1.5 Scheduling & Appointments
- **In-Case Booking with Date/Time Pickers**: Schedule a meeting pre-linked to a specific client and case directly from the Case Detail view using **native date and time picker components** (no manual text entry).
- **Global Appointments Manager**: View a master calendar list of all requested, confirmed, or completed appointments.
- **Status Workflows**: Accept or Decline meeting requests initiated by clients.

### 1.6 Legal Utilities
- **FIR Builder**: A structured form generator to help lawyers format First Information Reports instantly.
- **FIR History (My FIRs)**: A dedicated screen listing all previously generated FIRs with case-linkage status (Linked/Unlinked), creation date, and a text preview. Accessible from the Home screen shortcuts.
- **Bare Acts Library**: An offline, searchable database of fundamental legal acts and penal codes for quick reference.

### 1.7 Global Document Management
- **Vault**: Upload, rename, and securely store general legal documents independent of cases.
- **Case Files**: Attach documents explicitly to specific cases for organized retrieval.

### 1.8 Analytics & Activity Logging
- **Activity Log**: An automated audit trail tracking every system action (creation, updates, deletions, status changes) across all entities.
- **Performance Analytics**: Visual data detailing average case closure times (duration days) and court-wise breakdown of resolved cases, plus:
  - Priority distribution pie chart (High/Medium/Low)
  - Monthly case filing trend (last 6 months)
  - Client-wise case count (top clients)
  - Outstanding payment totals (pending vs paid)
- **Feedback Monitor**: View star ratings (1-5) and comments submitted by clients upon case closure.

---

## 2. Client Portal Features

The Client Portal provides a streamlined, read-only perspective on active casework, empowering clients to collaborate without overwhelming them with legalese.

### 2.1 Clean Dashboard & Overview
- **Welcome Screen**: Personalized greeting displaying active cases, pending document requests, and outstanding fees.
- **Case Search**: A search bar on the client dashboard allowing clients to **filter their active cases** by title or court name.
- **Quick Actions**: One-tap access to generic payments, appointments, and settings.

### 2.2 Case Tracking (Read-Only)
- **Status & Deadlines**: Clients can independently view the current court, hearing dates, and priority of their case.
- **Progress Timeline**: View the chronological milestones established by the lawyer to understand case momentum.
- **Lawyer's Notes**: Dedicated section where clients can read strategy updates or summaries left by their legal counsel.

### 2.3 Collaboration & Communication
- **Dedicated Chat Screen**: Full screen, per-case messaging allowing clients to securely text their lawyer. Features **auto-polling** for near-real-time updates, **date-grouped conversations**, and **read receipt indicators** (✓/✓✓).
- **Document Upload Center**: Clients see exactly what documents the lawyer requires and can upload them directly from their device (via **Choose File** or by taking a **photo** using the in-app camera).

### 2.4 Scheduling
- **Appointment Booking**: Clients can proactively request meetings (specifying date, time, and topic). They can do this globally or tied explicitly to an active case via the case Action Grid.
- **Meeting Status**: Track whether the lawyer has Confirmed, Declined, or Completed an appointment.

### 2.5 Financials & Feedback
- **Invoices**: View exact amounts requested by the lawyer and see when they are recorded as 'Paid'.
- **Case Satisfaction Survey**: Upon a case being marked 'Closed' by the lawyer, clients are prompted to submit a 1-to-5 star rating and optional textual feedback regarding their experience.

---

## 3. Core System & Security Functionalities

- **Dual-Stack Navigation Architecture**: A robust routing system ([App.js](file:///c:/college/Legalworkflowanddeadlinemgt/LegalworkflowApp/Legalworkflow/App.js)) that physically separates the screens a Lawyer can access from the screens a Client can access based on their authentication role.
- **Role-Aware Authentication with Password Hashing**: Secure Registration/Login system using **salted multi-round password hashing** ([crypto.js](file:///c:/college/Legalworkflowanddeadlinemgt/LegalworkflowApp/Legalworkflow/utils/crypto.js)). Passwords are never stored as plaintext. Backward-compatible `verifyPassword()` handles legacy plaintext migration. Client accounts uniquely link to CRM database profiles via email matching.
- **Native Date/Time Picker Integration**: All date and time inputs across the application use the native `@react-native-community/datetimepicker` component, replacing raw text entry to prevent invalid date inputs and improve UX.
- **Intelligent Focus Refresh (`useFocusEffect`)**: Across the entire platform, screens automatically refresh data upon coming into view, ensuring that notification badges, chat logs, and appointment statuses are always perfectly synchronized in real-time.
- **Loading States (No Blank Screens)**: Screens now render shared `LoadingState` spinners while data is fetched to prevent “nothing on screen” moments during navigation and initialization.
- **Deadline Engine**: Mathematical algorithms that continuously scan all scheduled dates to surface "Urgent" (due within 3 days) and "Weekly" tasks/hearings on the lawyer's dashboard.
- **Local SQLite Database Platform**: Fully offline-capable relational database ([migrations.js](file:///c:/college/Legalworkflowanddeadlinemgt/LegalworkflowApp/Legalworkflow/database/migrations.js)) mapping cases, tasks, users, interactions, documents, messages, milestones, payments, and appointments seamlessly.

---

## 4. Appearance & Client Capture Features

### 4.1 Dark Mode Configuration
- The app uses `ThemeContext` (`LegalworkflowApp/Legalworkflow/context/ThemeContext.js`) to provide an `isDark` boolean and a theme-aware `colors` palette.
- The dark mode choice is persisted in `AsyncStorage`, and the UI dynamically consumes theme colors via `useTheme()`.
- Both portals expose the control:
  - Lawyer: `SettingsScreen` includes a dedicated **Dark mode** toggle.
  - Client: `ClientSettingsScreen` includes a dedicated **Dark mode** toggle.

### 4.2 Client-Side Document Camera Integration
- The client document upload flow lives in `ClientDocUploadScreen`.
- When a document request is in **Pending**, the client is shown two options:
  - **Choose File**: Uses `expo-document-picker` to pick a file from the device.
  - **Take Photo**: Uses `expo-image-picker` (`launchCameraAsync`) to capture an image using the device camera.
- Whether the source is picked or captured, the app:
  1. Saves the file metadata (including the captured/picked URI) into the local `documents` table.
  2. Links the newly created document record to the specific `document_requests` entry via `uploadDocumentForRequest()`.
  3. Shows a preview for images and then marks the request as uploaded (so the lawyer can accept it).
