import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if demo data exists
    const { data: existingProjects } = await supabase.from('projects').select('id').limit(1);
    if (existingProjects && existingProjects.length > 0) {
      return new Response(JSON.stringify({ message: 'Demo data already exists' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create demo users
    const demoUsers = [
      { email: 'admin@workflowpro.com', password: 'Demo@123', full_name: 'Alice Johnson', role: 'admin' },
      { email: 'manager@workflowpro.com', password: 'Demo@123', full_name: 'Bob Smith', role: 'manager' },
      { email: 'employee@workflowpro.com', password: 'Demo@123', full_name: 'Sara Lee', role: 'employee' },
    ];

    const userIds: Record<string, string> = {};

    for (const u of demoUsers) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.full_name },
      });

      if (authError) {
        // User might already exist, try to find them
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existing = users?.find(eu => eu.email === u.email);
        if (existing) {
          userIds[u.email] = existing.id;
        } else {
          console.error(`Failed to create user ${u.email}:`, authError.message);
          continue;
        }
      } else if (authData.user) {
        userIds[u.email] = authData.user.id;
      }

      // Update role (the trigger creates 'employee' by default)
      if (u.role !== 'employee' && userIds[u.email]) {
        await supabase.from('user_roles')
          .update({ role: u.role })
          .eq('user_id', userIds[u.email]);
      }
    }

    const aliceId = userIds['admin@workflowpro.com'];
    const bobId = userIds['manager@workflowpro.com'];
    const saraId = userIds['employee@workflowpro.com'];

    // Create projects
    const { data: projectsData } = await supabase.from('projects').insert([
      { name: 'Website Redesign', description: 'Complete overhaul of the company website with modern design and improved UX', created_by: aliceId },
      { name: 'Mobile App Launch', description: 'Develop and launch the new mobile application for iOS and Android', created_by: bobId },
      { name: 'Q4 Marketing Campaign', description: 'Plan and execute the Q4 marketing campaign across all channels', created_by: aliceId },
    ]).select('id, name');

    const projectIds: Record<string, string> = {};
    if (projectsData) {
      for (const p of projectsData) {
        projectIds[p.name] = p.id;
      }
    }

    // Create tasks
    await supabase.from('tasks').insert([
      { title: 'Design new homepage mockup', description: 'Create wireframes and high-fidelity mockups for the new homepage', status: 'inprogress', priority: 'high', assigned_to: saraId, project_id: projectIds['Website Redesign'], created_by: aliceId, deadline: new Date(Date.now() + 2 * 86400000).toISOString() },
      { title: 'Implement responsive navigation', description: 'Build mobile-first responsive navigation component', status: 'todo', priority: 'high', assigned_to: bobId, project_id: projectIds['Website Redesign'], created_by: aliceId, deadline: new Date(Date.now() + 5 * 86400000).toISOString() },
      { title: 'Set up CI/CD pipeline', description: 'Configure automated testing and deployment pipeline', status: 'completed', priority: 'medium', assigned_to: aliceId, project_id: projectIds['Website Redesign'], created_by: bobId, deadline: new Date(Date.now() - 1 * 86400000).toISOString() },
      { title: 'API integration for user auth', description: 'Integrate OAuth2 authentication flow', status: 'inprogress', priority: 'high', assigned_to: aliceId, project_id: projectIds['Mobile App Launch'], created_by: bobId, deadline: new Date(Date.now() + 3 * 86400000).toISOString() },
      { title: 'Design app onboarding screens', description: 'Create 4 onboarding screens with illustrations', status: 'todo', priority: 'medium', assigned_to: saraId, project_id: projectIds['Mobile App Launch'], created_by: bobId, deadline: new Date(Date.now() + 7 * 86400000).toISOString() },
      { title: 'Push notification system', description: 'Implement Firebase push notifications for iOS and Android', status: 'todo', priority: 'low', assigned_to: aliceId, project_id: projectIds['Mobile App Launch'], created_by: bobId, deadline: new Date(Date.now() + 10 * 86400000).toISOString() },
      { title: 'Write blog post for Q4 launch', description: 'Draft 1500-word blog post announcing Q4 campaign', status: 'inprogress', priority: 'medium', assigned_to: saraId, project_id: projectIds['Q4 Marketing Campaign'], created_by: aliceId, deadline: new Date(Date.now() + 1 * 86400000).toISOString() },
      { title: 'Social media ad creatives', description: 'Design 10 ad creatives for Facebook, Instagram, and LinkedIn', status: 'todo', priority: 'high', assigned_to: saraId, project_id: projectIds['Q4 Marketing Campaign'], created_by: aliceId, deadline: new Date(Date.now() + 4 * 86400000).toISOString() },
      { title: 'Email newsletter template', description: 'Design and code responsive email template for Q4 campaign', status: 'completed', priority: 'low', assigned_to: bobId, project_id: projectIds['Q4 Marketing Campaign'], created_by: aliceId, deadline: new Date(Date.now() - 2 * 86400000).toISOString() },
      { title: 'Analytics dashboard setup', description: 'Set up tracking and analytics dashboard for campaign metrics', status: 'todo', priority: 'medium', assigned_to: aliceId, project_id: projectIds['Q4 Marketing Campaign'], created_by: bobId, deadline: new Date(Date.now() + 6 * 86400000).toISOString() },
    ]);

    // Create meetings
    const today = new Date();
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
    const nextWednesday = new Date(nextMonday);
    nextWednesday.setDate(nextMonday.getDate() + 2);
    const nextFriday = new Date(nextMonday);
    nextFriday.setDate(nextMonday.getDate() + 4);

    await supabase.from('meetings').insert([
      { title: 'Team Standup', date: nextMonday.toISOString().split('T')[0], time: '09:00', duration: 15, participants: [aliceId, bobId, saraId].filter(Boolean), meeting_link: 'https://meet.google.com/abc-defg-hij', description: 'Daily team sync', created_by: aliceId },
      { title: 'Project Review', date: nextWednesday.toISOString().split('T')[0], time: '14:00', duration: 60, participants: [aliceId, bobId].filter(Boolean), meeting_link: 'https://meet.google.com/xyz-uvwx-rst', description: 'Review project progress and blockers', created_by: bobId },
      { title: 'Client Call', date: nextFriday.toISOString().split('T')[0], time: '11:00', duration: 30, participants: [aliceId, saraId].filter(Boolean), meeting_link: 'https://zoom.us/j/123456789', description: 'Quarterly client review', created_by: aliceId },
    ]);

    // Create sample notifications
    if (aliceId) {
      await supabase.from('notifications').insert([
        { user_id: aliceId, message: 'Task "Design new homepage mockup" is due tomorrow', type: 'deadline', is_read: false },
        { user_id: aliceId, message: 'You have been assigned to "Push notification system"', type: 'assignment', is_read: false },
        { user_id: aliceId, message: 'Bob commented on "API integration for user auth"', type: 'comment', is_read: true },
      ]);
    }
    if (bobId) {
      await supabase.from('notifications').insert([
        { user_id: bobId, message: 'Task "Implement responsive navigation" is overdue', type: 'overdue', is_read: false },
        { user_id: bobId, message: 'Sara completed "Email newsletter template"', type: 'info', is_read: false },
      ]);
    }
    if (saraId) {
      await supabase.from('notifications').insert([
        { user_id: saraId, message: 'New task assigned: "Social media ad creatives"', type: 'assignment', is_read: false },
        { user_id: saraId, message: 'Meeting "Client Call" scheduled for Friday', type: 'info', is_read: false },
      ]);
    }

    return new Response(JSON.stringify({ message: 'Demo data seeded successfully', userIds }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
