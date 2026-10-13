# Spec Delta: playwright-lab

## Purpose

Provides an interactive Playwright test automation laboratory featuring a built-in QA challenge sandbox, in-app test execution dashboard, reusable snippet vault, job scraping runner, and AI mentor.

## ADDED Requirements

### Requirement: Built-in QA Challenge Sandbox
The system SHALL host dedicated sandbox pages engineered with real-world test automation challenges, including dynamic asynchronous loaders, shadow DOM, nested iframes, file uploads, and authentication states.

#### Scenario: Navigate to challenge sandbox
- **WHEN** user opens the Sandbox section and selects a challenge category (such as "Async Elements")
- **THEN** the system displays an interactive test page specifically designed with delayed rendering and race condition triggers for Playwright testing

### Requirement: In-App Test Suite Execution and Reporting
The system SHALL allow users to execute Playwright test suites directly from the browser dashboard and display execution results, console logs, failure screenshots, and trace links.

#### Scenario: Run Playwright test suite
- **WHEN** user clicks "Run Tests" on a test suite in the dashboard
- **THEN** the backend triggers the Playwright test runner, streams live terminal output to the UI, and presents pass/fail indicators with execution durations

#### Scenario: View test failure artifacts
- **WHEN** a Playwright test execution fails
- **THEN** the system captures the failure screenshot and links to the Playwright trace viewer directly within the test report card

### Requirement: Code Snippets and Cheatsheet Vault
The system SHALL provide an organized repository for storing and searching reusable Playwright code snippets, Page Object Model patterns, custom fixtures, and locator best practices.

#### Scenario: Search and copy snippet
- **WHEN** user searches for "network route" or "getByRole" in the snippet vault
- **THEN** the system filters matching TypeScript snippets with one-click copy and syntax highlighting

### Requirement: Parameterized Web Scraper Runner
The system SHALL provide an interface to trigger and configure Playwright web scrapers (such as German job board scanners) and inspect extracted tabular data.

#### Scenario: Execute job scraper
- **WHEN** user provides search keywords (e.g. "QA Automation Berlin") and triggers the job scraper
- **THEN** the system runs the scraper in the background and populates the results table with discovered job links and titles

### Requirement: Gemini AI Playwright Mentor
The system SHALL provide an AI assistant capable of suggesting accessible locators, debugging Playwright failure logs, and generating Page Object Model classes.

#### Scenario: Debug failed test run
- **WHEN** user pastes a Playwright error trace or timeout exception into the AI Mentor
- **THEN** the system analyzes the log, identifies the root cause (e.g., locator ambiguity or timing race), and provides a corrected TypeScript code snippet
