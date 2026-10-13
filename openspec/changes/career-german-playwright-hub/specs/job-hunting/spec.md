# Spec Delta: job-hunting

## Purpose

Manages the software testing job hunt pipeline in Berlin, including application stage tracking, multimodal job posting ingestion, master CV match analysis, and customized PDF cover letter generation.

## ADDED Requirements

### Requirement: Application Pipeline Tracking
The system SHALL provide a dual-view application tracker featuring both an interactive Kanban board and a sortable table with full-text search and stage filtering.

#### Scenario: Drag-and-drop or update stage
- **WHEN** user moves an application from "Applied" to "Screening" on the Kanban board or selects a new stage in table view
- **THEN** the system updates the application stage immediately and logs the transition timestamp

#### Scenario: Filter and search applications
- **WHEN** user enters a query in the search box or selects a filter for "Berlin" or "Technical"
- **THEN** the view updates to display only matching applications across all pipeline stages

### Requirement: Multimodal Job Posting Ingestion
The system SHALL extract structured job posting fields from either a provided web URL or an uploaded image screenshot using the Google Gemini multimodal API.

#### Scenario: Extract job details from screenshot
- **WHEN** user uploads a screenshot of a LinkedIn or StepStone job description
- **THEN** the system parses company name, role title, salary range, location, key technical requirements, and required German language proficiency level

### Requirement: Master CV Fit and Gap Analysis
The system SHALL compare extracted job requirements against the user's master CV and generate an overall match score with strengths and missing skills.

#### Scenario: Generate match score
- **WHEN** user requests fit analysis for a saved job posting
- **THEN** the system displays a fit score (0-100%), matching qualifications, and missing keyword gaps based on the stored master CV

### Requirement: Tailored PDF Cover Letter Generation
The system SHALL generate a customized German or English cover letter tailored to the job description and user CV, exporting it directly to PDF using a reference template.

#### Scenario: Generate and export cover letter
- **WHEN** user clicks "Generate Cover Letter" on an application
- **THEN** the system generates targeted letter content adhering to the user's template style and allows one-click download as a formatted PDF

### Requirement: Follow-up Reminders and Notes
The system SHALL highlight applications that have had no status updates for more than 7 days and maintain an application activity notes log.

#### Scenario: Trigger follow-up alert
- **WHEN** an application in "Applied" status has had no contact for more than 7 days
- **THEN** the system displays a visual follow-up reminder badge on the application card and table row
