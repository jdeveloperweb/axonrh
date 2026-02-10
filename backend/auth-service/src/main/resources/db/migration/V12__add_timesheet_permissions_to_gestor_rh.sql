-- V12: Add timesheet permissions to Gestor RH
-- Grant TIMESHEET permissions to GESTOR_RH role

INSERT INTO shared.role_permissions (role_id, permission_id)
SELECT '22222222-2222-2222-2222-222222222222', id 
FROM shared.permissions
WHERE module = 'timesheet'
ON CONFLICT DO NOTHING;
