const fs = require('fs');
const path = require('path');

const contextPath = path.join('src', 'context', 'AppContext.tsx');
let content = fs.readFileSync(contextPath, 'utf8');

// Replace the auth states
content = content.replace(/const \[authUser, setAuthUser\] = useState<any \| null>\(null\);/g, "const [authUser, setAuthUser] = useState<any | null>(null);\n  const [userProfile, setUserProfile] = useState<any | null>(null);");

// Replace the userRole memo
content = content.replace(/const userRole = useMemo\(\(\) => authUser\?\.user_metadata\?\.rol \|\| 'admin', \[authUser\]\);/g, "const userRole = useMemo(() => userProfile?.rol || authUser?.user_metadata?.rol || 'admin', [userProfile, authUser]);");

// Inject useEffect for auth
const authEffect = `
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      handleAuthChange(session);
      setAuthLoading(false);
    };

    const handleAuthChange = async (session: any) => {
      if (session?.user) {
        setAuthUser(session.user);
        // Fetch profile
        const { data: profile } = await supabase.from('perfiles').select('*').eq('id', session.user.id).single();
        if (profile) {
          setUserProfile(profile);
          if (profile.rol === 'admin') setCurrentRoleViewInternal('admin');
          if (profile.rol === 'cliente_corporativo') setCurrentRoleViewInternal('cliente_b2b');
          if (profile.rol === 'conductor') setCurrentRoleViewInternal('app_conductor');
          if (profile.cliente_corporativo_id) setActiveClienteB2BId(profile.cliente_corporativo_id);
        }
      } else {
        setAuthUser(null);
        setUserProfile(null);
      }
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthChange(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);
`;

content = content.replace(/const \[activeClienteB2BId, setActiveClienteB2BId\] = useState<string \| null>\('cl-b2b-04'\);/, `const [activeClienteB2BId, setActiveClienteB2BId] = useState<string | null>('cl-b2b-04');\n\n${authEffect}`);

// Update logout
content = content.replace(/const logoutAuth = async \(\) => \{\n    setAuthUser\(null\);\n  \};/, "const logoutAuth = async () => {\n    await supabase.auth.signOut();\n    setAuthUser(null);\n    setUserProfile(null);\n  };");

// In LoginView, remove bypass and add real login
const loginPath = path.join('src', 'components', 'auth', 'LoginView.tsx');
let loginContent = fs.readFileSync(loginPath, 'utf8');

// I'll manually rewrite LoginView instead of regexing it because it requires a lot of changes (captcha, forgot password, sign in).

fs.writeFileSync(contextPath, content);
console.log('Context updated');
