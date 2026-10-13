# Spec Delta: german-learning

## Purpose

Delivers a personalized German learning system for a Software Test Engineer targeting Goethe-Zertifikat B1 proficiency in Berlin, featuring independent dashboards, dual-language explanations, QA roleplays, and automated error logging.

## ADDED Requirements

### Requirement: Independent Dashboard Navigation
The system SHALL provide open, non-linear navigation across all study sections including Vocabulary, Grammar, Active Production, Quizzes, Error Log, and Mock Exams.

#### Scenario: Navigate to study section
- **WHEN** user selects any section such as "Grammar Drills" or "Error Log" from the dashboard
- **THEN** the system immediately opens that section without enforcing a linear progression gate

### Requirement: Four-Skill Practice Engine
The system SHALL support exercises for all four Goethe B1 examination skills: reading comprehension, audio listening dialogues, writing production, and spoken dialogue.

#### Scenario: Practice spoken dialogue
- **WHEN** user engages in a conversational roleplay and speaks into the microphone
- **THEN** the system transcribes the speech via browser speech recognition and provides situational feedback

#### Scenario: Practice listening comprehension
- **WHEN** user initiates a dialogue listening exercise
- **THEN** the system plays German dialogue audio using speech synthesis and prompts comprehension questions

### Requirement: Automated Error Log with Spaced Repetition
The system SHALL capture errors made during quizzes or roleplays, categorize the violated grammar rule, and schedule the item for spaced recall testing.

#### Scenario: Automatically log grammar mistake
- **WHEN** user inputs an incorrect sentence during a quiz or writing drill
- **THEN** the system saves the sentence, correct version, violated rule, and explanation into the Error Log with an SRS review interval

#### Scenario: Active recall from error log
- **WHEN** user starts an Active Recall session
- **THEN** the system tests the user on pending items from the Error Log and updates their SRS mastery level based on performance

### Requirement: Dual-Language Grammar Explanations
The system SHALL provide a bilingual toggle allowing users to view grammar breakdowns and concept explanations in either English or Gujarati.

#### Scenario: Switch explanation language
- **WHEN** user clicks the language toggle on a grammar rule or error explanation
- **THEN** the explanation switches dynamically between English and Gujarati without reloading the page

### Requirement: QA and Testing Domain Integration
The system SHALL provide specialized vocabulary and interactive communication scenarios tailored to Software Testing and QA engineering in Berlin.

#### Scenario: Practice QA bug reporting
- **WHEN** user launches the QA practice module
- **THEN** the system presents software defect templates requiring German technical phrasing for expected versus actual results and steps to reproduce

### Requirement: Goethe B1 Mock Exam Simulator
The system SHALL provide timed mock exams modeled on the Goethe-Zertifikat B1 format with automated scoring across reading and AI-graded writing.

#### Scenario: Grade B1 writing submission
- **WHEN** user submits a formal letter or essay within the mock exam module
- **THEN** the system evaluates the text against Goethe B1 rubrics (Task Achievement, Coherence, Vocabulary, Grammar) and outputs an overall score and feedback
