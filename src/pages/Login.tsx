import { useState } from 'react';        /*React hook that lets the component remember values*/
import { useNavigate, Link } from 'react-router-dom';   /*lets the code redirect the user to another page after login, without full page reloads.*/
import { useAuth } from '@/contexts/AuthContext';     /*brings in the authentication functions from our custom AuthContext file.*/
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Eye, EyeOff, CheckSquare } from 'lucide-react';   /*show/hide password button*/

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-[hsl(215,28%,17%)] p-12">
        <div className="max-w-md text-white">
          <div className="flex items-center gap-3 mb-8">
            <CheckSquare className="h-10 w-10 text-[hsl(217,91%,60%)]" />
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Inter' }}>WorkFlowPro</h1>
          </div>
          <p className="text-lg text-slate-300 leading-relaxed">
            Streamline your team's workflow with powerful task management, real-time collaboration, and insightful analytics.
          </p>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <CheckSquare className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Inter' }}>WorkFlowPro</h1>
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Inter' }}>Welcome back</h2>
          <p className="text-muted-foreground mb-6 text-sm">Sign in to your account to continue</p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(v) => setRememberMe(v as boolean)}
              />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">Remember me</Label>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" className="text-white" /> : 'Sign In'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
