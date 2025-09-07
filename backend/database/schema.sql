-- Memorial Generator Database Schema
-- SQLite database for storing memorial sessions and analysis data

-- Memorial Sessions Table
CREATE TABLE IF NOT EXISTS memorial_sessions (
    id TEXT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active', -- active, completed, archived
    person_name TEXT NOT NULL,
    original_message TEXT,
    photo_path TEXT,
    photo_analysis TEXT, -- JSON string of analysis results
    cultural_context TEXT, -- JSON string of cultural preferences
    user_preferences TEXT -- JSON string of user preferences and feedback
);

-- Generated Memorials Table (for version history)
CREATE TABLE IF NOT EXISTS generated_memorials (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    greeting_type TEXT NOT NULL,
    generated_prompt TEXT NOT NULL,
    memorial_path TEXT,
    memorial_url TEXT,
    quality_score REAL DEFAULT 0,
    quality_assessment TEXT, -- JSON string of quality metrics
    user_feedback TEXT, -- JSON string of user feedback
    is_selected BOOLEAN DEFAULT FALSE,
    generation_metadata TEXT, -- JSON string with generation details
    FOREIGN KEY (session_id) REFERENCES memorial_sessions(id),
    UNIQUE(session_id, version)
);

-- User Feedback Table
CREATE TABLE IF NOT EXISTS user_feedback (
    id TEXT PRIMARY KEY,
    memorial_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    feedback_text TEXT NOT NULL,
    feedback_type TEXT NOT NULL, -- improvement, refinement, complaint, praise
    sentiment TEXT, -- positive, negative, neutral
    processed_feedback TEXT, -- JSON string of processed feedback
    applied_to_version INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (memorial_id) REFERENCES generated_memorials(id),
    FOREIGN KEY (session_id) REFERENCES memorial_sessions(id)
);

-- Cultural Knowledge Base Table
CREATE TABLE IF NOT EXISTS cultural_knowledge (
    id TEXT PRIMARY KEY,
    culture_name TEXT NOT NULL,
    religion TEXT,
    memorial_traditions TEXT NOT NULL, -- JSON array of traditions
    appropriate_colors TEXT NOT NULL, -- JSON array of colors
    inappropriate_colors TEXT, -- JSON array of colors to avoid
    symbolic_elements TEXT NOT NULL, -- JSON array of appropriate symbols
    language_preferences TEXT, -- JSON array of language considerations
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Quality Benchmarks Table
CREATE TABLE IF NOT EXISTS quality_benchmarks (
    id TEXT PRIMARY KEY,
    memorial_type TEXT NOT NULL,
    quality_criteria TEXT NOT NULL, -- JSON object with criteria
    benchmark_scores TEXT NOT NULL, -- JSON object with benchmark scores
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Analytics Table (for tracking improvements)
CREATE TABLE IF NOT EXISTS analytics_events (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    event_type TEXT NOT NULL, -- photo_uploaded, analysis_completed, memorial_generated, feedback_provided, etc.
    event_data TEXT, -- JSON string with event-specific data
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_memorial_sessions_status ON memorial_sessions(status);
CREATE INDEX IF NOT EXISTS idx_memorial_sessions_created ON memorial_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_generated_memorials_session ON generated_memorials(session_id);
CREATE INDEX IF NOT EXISTS idx_generated_memorials_selected ON generated_memorials(is_selected);
CREATE INDEX IF NOT EXISTS idx_user_feedback_session ON user_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_type ON user_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);