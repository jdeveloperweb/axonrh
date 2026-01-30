-- Add Geofence functionality to Company Profile
ALTER TABLE company_profiles 
ADD COLUMN geofence_enabled BOOLEAN DEFAULT false,
ADD COLUMN geofence_latitude DOUBLE PRECISION,
ADD COLUMN geofence_longitude DOUBLE PRECISION,
ADD COLUMN geofence_radius INTEGER DEFAULT 100;
