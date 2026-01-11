-- Coastal Hazard Intelligence Database Schema
-- Requires PostgreSQL 14+ with PostGIS extension

-- Enable PostGIS extension for geographic queries
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Users Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'citizen' CHECK (role IN ('citizen', 'responder', 'admin')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Reports Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Location data
  latitude DECIMAL(10, 8) NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude DECIMAL(11, 8) NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  location_accuracy DECIMAL(10, 2),
  address TEXT,
  region VARCHAR(100),
  
  -- Source information
  source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('citizen', 'social', 'official')),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Content
  original_text TEXT NOT NULL,
  translated_text TEXT,
  language VARCHAR(10) DEFAULT 'en',
  
  -- Classification (AI-generated)
  hazard_type VARCHAR(50) CHECK (hazard_type IN ('flooding', 'storm_surge', 'high_waves', 'erosion', 'rip_current', 'tsunami', 'pollution', 'other')),
  severity VARCHAR(20) CHECK (severity IN ('low', 'moderate', 'high')),
  confidence DECIMAL(5, 2) DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  ai_summary TEXT,
  
  -- Metadata
  device_info TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Media Files Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS media_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Alerts Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Region information
  region_name VARCHAR(100) NOT NULL,
  region_bounds GEOMETRY(POLYGON, 4326),
  affected_population INTEGER DEFAULT 0,
  
  -- Classification
  hazard_type VARCHAR(50) NOT NULL CHECK (hazard_type IN ('flooding', 'storm_surge', 'high_waves', 'erosion', 'rip_current', 'tsunami', 'pollution', 'other')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'moderate', 'high')),
  confidence DECIMAL(5, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  
  -- Escalation details
  report_count INTEGER DEFAULT 0,
  source_types TEXT[],
  time_window VARCHAR(50),
  geographic_spread DECIMAL(10, 2),
  thresholds_met TEXT[],
  reasoning TEXT,
  
  -- Related data
  related_reports UUID[],
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'verified', 'resolved', 'false_alarm')),
  ai_summary TEXT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Audit Log Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('report', 'alert', 'user')),
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  performed_by_name VARCHAR(100),
  previous_state JSONB,
  new_state JSONB,
  reason_code VARCHAR(50),
  notes TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- System Configuration Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Reports indexes
CREATE INDEX IF NOT EXISTS idx_reports_timestamp ON reports(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_hazard_type ON reports(hazard_type);
CREATE INDEX IF NOT EXISTS idx_reports_severity ON reports(severity);
CREATE INDEX IF NOT EXISTS idx_reports_region ON reports(region);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);

-- Geographic index for reports (PostGIS)
CREATE INDEX IF NOT EXISTS idx_reports_location ON reports USING GIST (
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);

-- Alerts indexes
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_hazard_type ON alerts(hazard_type);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_region_name ON alerts(region_name);

-- Geographic index for alerts (PostGIS)
CREATE INDEX IF NOT EXISTS idx_alerts_region_bounds ON alerts USING GIST (region_bounds);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- Media files indexes
CREATE INDEX IF NOT EXISTS idx_media_files_report_id ON media_files(report_id);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================================
-- Default System Configuration
-- ============================================================================
INSERT INTO system_config (key, value, description) VALUES
  ('confidence_thresholds', '{"low": 30, "moderate": 60, "high": 80}', 'Confidence thresholds for alert escalation'),
  ('source_weights', '{"citizen": 1.0, "social": 0.8, "official": 1.5}', 'Weighting for different data sources'),
  ('clustering_radius', '5', 'Geographic clustering radius in kilometers'),
  ('temporal_window', '3600', 'Time window for clustering in seconds (1 hour)')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- Trigger for updated_at timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_alerts_updated_at ON alerts;
CREATE TRIGGER update_alerts_updated_at
  BEFORE UPDATE ON alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
