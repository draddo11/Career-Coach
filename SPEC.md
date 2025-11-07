
# AI Career Copilot - Hackathon Specification

This document outlines the architectural and development guidelines for the AI Career Copilot project, ensuring all work aligns with the rules and judging criteria of the Cloud Run Hackathon.

## 1. Project Overview

**AI Career Copilot** is an innovative serverless application deployed on Google Cloud Run. It acts as an intelligent partner for job seekers, leveraging Google's Gemini models to provide services like resume analysis, job matching, cover letter generation, and mock interview preparation.

## 2. Hackathon Compliance Analysis

### 2.1. Selected Category: 🤖 AI Studio Category

The project is officially targeting the **AI Studio Category**.

**Justification:**
- The core of the application is an innovative AI-powered web service.
- The entire backend is built to be deployed on **Cloud Run**, satisfying the primary requirement.
- The application makes extensive use of Google's Gemini models, which is highly encouraged.

We will **not** pursue the *AI Agents* or *GPU* categories, as they would require significant architectural changes (ADK, L4 GPUs) that are outside the current project scope.

### 2.2. Core Requirements & Bonus Points Checklist

| Requirement                                   | Status                                                                                             | Notes                                                                                                                               |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Deployed on Google Cloud Run                  | ✅ **Met**                                                                                         | The backend is a Cloud Run Service as defined in `cloudbuild.yaml` and `firebase.json`.                                             |
| Use of Google AI Models                       | ✅ **Met (Bonus Points)**                                                                            | The application extensively uses `gemini-2.5-flash` and `gemini-2.5-pro`.                                                          |
| Leveraging Multiple Services (Frontend/Backend) | ✅ **Met (Bonus Points)**                                                                            | The architecture uses Firebase Hosting for the frontend and a separate Cloud Run service for the backend, connected via rewrites. |
| Integration with Google Cloud Services        | ✅ **Met**                                                                                         | Firestore is used for application statistics (`firestore-db.ts`).                                                                   |

### 2.3. Submission Deliverables Checklist

This checklist tracks the required submission items.

- [ ] **Text Description:** A summary of the project. (Can be adapted from `metadata.json`).
- [ ] **Demonstration Video:** A video (max 3 minutes) showcasing the app's features.
- [ ] **Public Code Repository URL:** A link to the source code.
- [ ] **Architecture Diagram:** A visual diagram of the frontend, backend, and cloud services.
- [ ] **Hosted Project URL:** A publicly accessible link to the deployed application.
- [ ] **AI Studio App Link:** A shareable link to the prompts used in AI Studio. **(Crucial for category)**

## 3. Guiding Principles for Development

All future development requests will be evaluated against these principles, derived from the hackathon's judging criteria.

### Principle 1: Prioritize Technical Excellence (40% of Score)

- **Code Quality:** Code must be clean, efficient, well-documented, and maintainable.
- **Scalability:** Solutions should be designed with serverless best practices in mind.
- **Robustness:** Implement comprehensive error handling on both the frontend and backend. The application must be resilient.

### Principle 2: Enhance User Experience & Presentation (40% of Score)

- **Intuitive UI/UX:** The application must be easy to use and visually appealing. All features should be self-explanatory.
- **Clarity of Purpose:** The UI and functionality must clearly define the problem it solves for the user.
- **Documentation:** An architecture diagram is a required deliverable and must be kept up-to-date.

### Principle 3: Deepen Innovation & Creativity (20% of Score)

- **Novelty:** New features should offer unique value and creative solutions to job-seeker problems.
- **Impact:** We must focus on features that solve significant, real-world challenges in the job application process.

## 4. Architectural Decisions Log

This section will log key architectural decisions made during development.

1.  **2024-01-01:** Project will officially target the **AI Studio Category** of the Cloud Run Hackathon. This decision focuses development on web-based AI features and avoids the overhead of the AI Agents (ADK) or GPU categories.