import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login, resetPassword } = useAuth();
    const navigate = useNavigate();
    const { startPhoneSignIn, confirmPhoneCode } = useAuth();
    const [usePhone, setUsePhone] = useState(false);
    const [phone, setPhone] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [code, setCode] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!usePhone) {
            if (!email || !password) {
                toast.error('Please fill in all fields');
                return;
            }

            setLoading(true);
            const result = await login(email.trim(), password);
            setLoading(false);

            if (result.success) {
                toast.success('Successfully signed in.');
                navigate('/');
            } else {
                toast.error(result.error);
            }
        } else {
            // Phone flow: send code or confirm
            if (!codeSent) {
                if (!phone) { toast.error('Enter phone number'); return; }
                setLoading(true);
                const resp = await startPhoneSignIn(phone);
                setLoading(false);
                if (resp.success) {
                    setCodeSent(true);
                    toast.success('Verification code sent to your phone.');
                } else {
                    toast.error(resp.error || 'Unable to send verification code.');
                }
            } else {
                if (!code) { toast.error('Enter verification code'); return; }
                setLoading(true);
                const resp = await confirmPhoneCode(code);
                setLoading(false);
                if (resp.success) {
                    toast.success('Signed in successfully.');
                    navigate('/');
                } else {
                    toast.error(resp.error || 'Verification failed');
                }
            }
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            toast.error('Please enter your email address above to reset password');
            return;
        }
        const result = await resetPassword(email.trim());
        if (result.success) {
            toast.success('Password reset link sent to your email.');
        } else {
            toast.error(result.error);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-white to-pink-50">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8 fade-in">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white mb-4 shadow-lg">
                        <Shield size={32} />
                    </div>
                    <h1 className="text-3xl font-bold gradient-text">SafeHer</h1>
                    <p className="text-gray-500 mt-2">Your safety, our priority</p>
                </div>

                {/* Login Card */}
                <div className="card slide-up">
                    <h2 className="text-xl font-semibold mb-6 text-center">Welcome Back</h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="flex gap-2 items-center">
                            <button type="button" onClick={() => setUsePhone(false)} className={`px-3 py-1 rounded ${!usePhone ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Email</button>
                            <button type="button" onClick={() => setUsePhone(true)} className={`px-3 py-1 rounded ${usePhone ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Phone</button>
                        </div>

                        {usePhone ? (
                            <>
                                <div>
                                    <label className="label" htmlFor="phone">Phone Number</label>
                                    <div className="relative">
                                        <input
                                            id="phone"
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+91XXXXXXXXXX"
                                            className="input"
                                        />
                                    </div>
                                </div>

                                {!codeSent ? null : (
                                    <div>
                                        <label className="label" htmlFor="code">Verification Code</label>
                                        <input id="code" value={code} onChange={(e) => setCode(e.target.value)} className="input" />
                                    </div>
                                )}

                                <div id="recaptcha-container" />
                            </>
                        ) : (
                            <>
                                {/* Email */}
                                <div>
                                    <label className="label" htmlFor="email">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className="input pl-11"
                                            autoComplete="email"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="label" htmlFor="password">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="input pl-11 pr-11"
                                            autoComplete="current-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                    <div className="flex justify-end mt-1">
                                        <button
                                            type="button"
                                            onClick={handleForgotPassword}
                                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                        >
                                            Forgot Password?
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                        {/* Submit Button */}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full py-3"
                        >
                            {loading ? (
                                <>
                                    <span className="spinner" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                        {/* Demo Credentials */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-sm text-blue-700 font-medium mb-1">Demo Account:</p>
                        <p className="text-sm text-blue-600">Email: demo@safeher.app</p>
                        <p className="text-sm text-blue-600">Password: Demo@2025</p>
                    </div>

                    {/* Register Link */}
                    <p className="text-center mt-6 text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-blue-600 font-semibold hover:underline">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
