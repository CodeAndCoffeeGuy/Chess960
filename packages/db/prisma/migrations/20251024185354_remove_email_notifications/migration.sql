-- RemoveEmailNotifications
-- This migration removes the emailNotifications column from the users table
-- as email notifications have been removed from the platform

ALTER TABLE "users" DROP COLUMN "email_notifications";
