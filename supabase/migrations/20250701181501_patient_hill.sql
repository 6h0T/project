/*
  # Fix Supabase signup database error

  1. Problem
    - The handle_new_user trigger fails to insert into user_profiles table
    - RLS policies prevent the service role from inserting user profiles
    - This causes signup to fail with "Database error saving new user"

  2. Solution
    - Add a policy that allows service_role to insert user profiles
    - This enables the handle_new_user trigger to work properly during signup

  3. Security
    - Only affects service_role operations (internal Supabase functions)
    - Does not change user-facing security policies
*/

-- Add policy to allow service role to insert user profiles
-- This is needed for the handle_new_user trigger to work during signup
CREATE POLICY "Service role can insert user profiles"
  ON user_profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);