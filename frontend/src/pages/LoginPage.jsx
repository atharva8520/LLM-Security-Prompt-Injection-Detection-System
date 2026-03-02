import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (error) {
            setErrorMsg('ACCESS DENIED. INVALID CREDENTIALS.');
        }
    };
    return (
        <div className="flex h-screen items-center justify-center p-4">
            <div className="w-full max-w-md bg-panel border-t-2 border-accent p-8 shadow-glow">
                <h1 className="text-3xl font-display text-accent mb-6 font-bold tracking-widest text-center">LLM SHIELD</h1>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="text-muted font-mono text-sm block mb-1">EMAIL</label>
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-bg2 border border-border p-3 text-white focus:outline-none focus:border-accent font-mono" />
                    </div>
                    <div>
                        <label className="text-muted font-mono text-sm block mb-1">PASSWORD</label>
                        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-bg2 border border-border p-3 text-white focus:outline-none focus:border-accent" />
                    </div>
                    <button type="submit" className="w-full bg-accent/10 border border-accent text-accent py-3 hover:bg-accent/20 transition-colors uppercase font-bold tracking-widest mt-4">
                        INITIALIZE LOGIN
                    </button>
                </form>
                <div className="mt-6 text-center text-muted font-mono text-xs">
                    {errorMsg ? <span className="text-danger">{errorMsg}</span> : "AWAITING CREDENTIALS..."}
                </div>
            </div>
        </div>
    );
};
export default LoginPage;
