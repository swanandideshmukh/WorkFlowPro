
ALTER TABLE public.comments DROP CONSTRAINT comments_author_id_fkey;
ALTER TABLE public.comments ADD CONSTRAINT comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id);

ALTER TABLE public.file_attachments DROP CONSTRAINT file_attachments_uploaded_by_fkey;
ALTER TABLE public.file_attachments ADD CONSTRAINT file_attachments_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id);
