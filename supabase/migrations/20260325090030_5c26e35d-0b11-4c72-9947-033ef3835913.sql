
ALTER TABLE public.tasks DROP CONSTRAINT tasks_assigned_to_fkey;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id);

ALTER TABLE public.tasks DROP CONSTRAINT tasks_created_by_fkey;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);
