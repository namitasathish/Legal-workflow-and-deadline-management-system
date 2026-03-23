# Legal Workflow and Deadline Management System

A comprehensive, dual-portal Customer Relationship Management (CRM) and Legal Workflow application built for modern legal professionals. This platform seamlessly bridges the gap between Lawyers and their Clients, providing robust tools for case tracking, secure communication, document management, and automated deadline reminders.

## 🚀 Key Features

The application operates on a role-aware architecture, presenting specialized interfaces for both "Lawyer" and "Client" profiles.

### ⚖️ For Lawyers (The Management Portal)
- **Case Management:** Create, track, and update cases with detailed timelines (Milestones).
- **Deadline Engine:** Mathematical date parsing that automatically surfaces "Urgent" (due within 3 days) and "Weekly" tasks.
- **Push Notifications:** Automated 7-day, 2-day, and same-day alerts for high-priority hearings.
- **Intelligent CRM:** Link cases to specific client profiles, track call/meeting follow-ups, and manage a unified address book.
- **In-App Messaging:** Real-time, localized chat securely segmented by individual cases.
- **Document Requests:** Proactively request files like identification cards from clients.
- **Financial Ledger:** Generate case-specific payment requests and track global invoices across all clients.
- **Global Appointments:** Accept, decline, and schedule meetings directly from case views or the master list.

### 👤 For Clients (The Collaborative Portal)
- **Read-Only Transparency:** Track their active cases, status changes, and upcoming court dates independently.
- **Chronological Milestones:** Visual timelines breaking down complex legal jargon into understandable progress steps.
- **Secure File Uploads:** Upload requested documents straight from their device directly to the lawyer's dashboard.
- **Appointment Booking:** Request strategy sessions or general consultations from their home screen.
- **Fee Transparency:** Monitor outstanding lawyer fees and review payment histories.
- **Satisfaction Tracking:** Opportunity to rate the lawyer (1-5 stars) upon case closure.

## 🛠️ Technology Stack

Designed for offline-first capabilities and cross-platform native execution:
* **Frontend Framework:** React Native / Expo (v54.0+)
* **Navigation:** React Navigation (Native Stack)
* **Local Database:** SQLite (`expo-sqlite`) for completely offline data persistence.
* **Storage state:** `@react-native-async-storage` for robust session and role memory.
* **Device Notifications:** `expo-notifications` for scheduled alerting.

## ⚙️ Installation & Setup

1. **Clone or Download the Repository**
2. **Navigate to the core project directory:**
   ```bash
   cd C:\college\Legalworkflowanddeadlinemgt\LegalworkflowApp\Legalworkflow
   ```
3. **Install Dependencies:**
   ```bash
   npm install
   ```

## 📱 Running the Application

To start the Expo development server, run:
```bash
npx expo start
```
From the Expo CLI, you can launch the app on an Android Emulator, iOS Simulator, or a physical device using the Expo Go application.

## 🧪 Testing the Application

The project includes custom-built `ManualTestUtils` that rigorously validate logic flows without requiring heavy transpilers. We have robust test coverage extending across Database Operations, Role Authentication, Notification Trigger Rules, Messaging Boundaries, Appt logic, and more.

To run the entire suite of **13 custom integration and unit tests**, simply execute:
```bash
npm test
```
*Wait for the green "PERFECT SCORE!" summary to verify all engines are operational.*

## 🔒 Security & Privacy Notes
This application adheres strictly to data containment rules. A registered `Client` can only query databases associated with their exact matching `email` linked by the `Lawyer`. Features like the `useFocusEffect` react hook ensure data clears and resets safely when navigating away from sensitive screens.

---
*Built as a state-of-the-art exploration into automated legal workflow management.*
