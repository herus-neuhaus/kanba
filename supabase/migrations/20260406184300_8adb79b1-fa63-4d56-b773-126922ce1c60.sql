
-- Helper function to get user's agency_id without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_agency_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT agency_id FROM public.profiles WHERE id = auth.uid()
$$;

-- RLS for agencies
CREATE POLICY "Users can view their own agency"
  ON public.agencies FOR SELECT
  TO authenticated
  USING (id = public.get_user_agency_id());

CREATE POLICY "Users can update their own agency if owner"
  ON public.agencies FOR UPDATE
  TO authenticated
  USING (owner_user_id = auth.uid());

CREATE POLICY "Authenticated users can create agencies"
  ON public.agencies FOR INSERT
  TO authenticated
  WITH CHECK (owner_user_id = auth.uid());

-- RLS for profiles
CREATE POLICY "Users can view profiles in their agency"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (agency_id = public.get_user_agency_id() OR id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- RLS for projects
CREATE POLICY "Users can view projects in their agency"
  ON public.projects FOR SELECT
  TO authenticated
  USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Users can create projects in their agency"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (agency_id = public.get_user_agency_id());

CREATE POLICY "Users can update projects in their agency"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Users can delete projects in their agency"
  ON public.projects FOR DELETE
  TO authenticated
  USING (agency_id = public.get_user_agency_id());

-- RLS for tasks
CREATE POLICY "Users can view tasks in their agency"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Users can create tasks in their agency"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (agency_id = public.get_user_agency_id());

CREATE POLICY "Users can update tasks in their agency"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Users can delete tasks in their agency"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (agency_id = public.get_user_agency_id());

-- RLS for comments
CREATE POLICY "Users can view comments on tasks in their agency"
  ON public.comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id AND t.agency_id = public.get_user_agency_id()
    )
  );

CREATE POLICY "Users can create comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON public.comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
