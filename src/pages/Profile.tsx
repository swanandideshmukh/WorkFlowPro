import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Camera, LogOut, Save, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  manager: 'bg-yellow-100 text-yellow-700',
  employee: 'bg-emerald-100 text-emerald-700',
};

export default function Profile() {
  const { user, profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setAvatarUrl(profile.avatar_url);
    }
    setDarkMode(document.documentElement.classList.contains('dark'));
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      setAvatarUrl(publicUrl);
      toast({ title: 'Avatar updated' });
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
    toast({ title: 'Profile updated' });
    setSaving(false);
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Password updated successfully' });
      setNewPassword('');
    }
    setChangingPassword(false);
  };

  const toggleDarkMode = (enabled: boolean) => {
    setDarkMode(enabled);
    document.documentElement.classList.toggle('dark', enabled);
  };

  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold" style={{ fontFamily: 'Inter' }}>Profile</h1>

      {/* Avatar & Name */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="h-20 w-20">
                {avatarUrl ? <AvatarImage src={avatarUrl} /> : null}
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">{initials}</AvatarFallback>
              </Avatar>
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                {uploading ? <LoadingSpinner size="sm" className="text-white" /> : <Camera className="h-5 w-5 text-white" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-semibold">{profile?.full_name}</h2>
                {role && <Badge className={`${roleColors[role]} border-0 text-xs`}>{role}</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit name */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={profile?.email || ''} disabled className="bg-muted" />
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <LoadingSpinner size="sm" className="text-white" /> : <><Save className="h-4 w-4" /> Save Changes</>}
          </Button>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Appearance</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Dark Mode</p>
              <p className="text-xs text-muted-foreground">Toggle dark theme</p>
            </div>
            <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
          </div>
        </CardContent>
      </Card>

      {/* Password */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>New Password</Label>
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="At least 6 characters" />
          </div>
          <Button onClick={handlePasswordChange} disabled={changingPassword} variant="outline" className="gap-2">
            {changingPassword ? <LoadingSpinner size="sm" /> : <><Lock className="h-4 w-4" /> Update Password</>}
          </Button>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button variant="destructive" className="w-full gap-2" onClick={() => { signOut(); navigate('/login'); }}>
        <LogOut className="h-4 w-4" /> Sign Out
      </Button>
    </div>
  );
}
