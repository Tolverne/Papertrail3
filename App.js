import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, BookOpen, PenTool, Users, Home, LogOut, Eye, EyeOff } from 'lucide-react';

// Mock Supabase client for demonstration
const mockSupabase = {
  auth: {
    signInWithPassword: async ({ email, password }) => {
      // Mock authentication
      if (email === 'student@test.com' && password === 'password') {
        return { data: { user: { id: '1', email } }, error: null };
      }
      if (email === 'teacher@test.com' && password === 'password') {
        return { data: { user: { id: '2', email } }, error: null };
      }
      return { data: null, error: { message: 'Invalid credentials' } };
    },
    signUp: async ({ email, password }) => {
      return { data: { user: { id: Date.now().toString(), email } }, error: null };
    },
    signOut: async () => {
      return { error: null };
    },
    getUser: async () => {
      const user = JSON.parse(localStorage.getItem('mockUser') || 'null');
      return { data: { user }, error: null };
    },
    onAuthStateChange: (callback) => {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  },
  from: (table) => ({
    select: () => ({
      eq: () => ({
        single: async () => {
          if (table === 'users') {
            const user = JSON.parse(localStorage.getItem('mockUser') || 'null');
            return {
              data: {
                id: user?.id || '1',
                username: user?.email?.split('@')[0] || 'testuser',
                role: user?.email?.includes('teacher') ? 'teacher' : 'student',
                email_hash: 'mock_hash'
              },
              error: null
            };
          }
          return { data: [], error: null };
        }
      })
    })
  })
};

// Auth Context
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await mockSupabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profile } = await mockSupabase.from('users').select('*').eq('id', user.id).single();
        setProfile(profile);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    const { data, error } = await mockSupabase.auth.signInWithPassword({ email, password });
    if (data?.user) {
      localStorage.setItem('mockUser', JSON.stringify(data.user));
      setUser(data.user);
      const { data: profile } = await mockSupabase.from('users').select('*').eq('id', data.user.id).single();
      setProfile(profile);
    }
    return { data, error };
  };

  const signUp = async (email, password, userData) => {
    const { data, error } = await mockSupabase.auth.signUp({ email, password });
    if (data?.user) {
      localStorage.setItem('mockUser', JSON.stringify(data.user));
      setUser(data.user);
      setProfile({ 
        id: data.user.id, 
        username: email.split('@')[0], 
        role: 'student', 
        ...userData 
      });
    }
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await mockSupabase.auth.signOut();
    if (!error) {
      localStorage.removeItem('mockUser');
      setUser(null);
      setProfile(null);
    }
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Login Component
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp } = useAuth();

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = isSignUp 
        ? await signUp(email, password, { username: email.split('@')[0] })
        : await signIn(email, password);

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <BookOpen className="mx-auto h-12 w-12 text-blue-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">EduPlatform</h1>
          <p className="text-gray-600 mt-2">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
          >
            {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-2 font-medium">Demo Accounts:</p>
          <div className="text-xs text-gray-500 space-y-1">
            <div>Student: student@test.com / password</div>
            <div>Teacher: teacher@test.com / password</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Header
const Header = ({ profile, onSignOut }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">EduPlatform</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{profile?.username}</p>
              <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
            </div>
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <button
              onClick={onSignOut}
              className="text-gray-400 hover:text-gray-600 p-1"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

// Canvas Component
const CanvasEditor = ({ sectionId, onClose }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [paths, setPaths] = useState([]);
  const [canvasData, setCanvasData] = useState({
    version: '1.0',
    canvas: { width: 800, height: 600, background: '#ffffff' },
    layers: [{ id: 'layer_1', name: 'Drawing', visible: true, objects: [] }]
  });

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentPath(`M ${x} ${y}`);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentPath(prev => `${prev} L ${x} ${y}`);
  };

  const handleMouseUp = () => {
    if (isDrawing && currentPath) {
      const newPath = {
        id: `path_${Date.now()}`,
        type: 'path',
        stroke: '#000000',
        strokeWidth: 2,
        fill: 'none',
        path: currentPath
      };
      
      setPaths(prev => [...prev, newPath]);
      
      // Update canvas data
      const newCanvasData = {
        ...canvasData,
        layers: [{
          ...canvasData.layers[0],
          objects: [...canvasData.layers[0].objects, newPath]
        }]
      };
      setCanvasData(newCanvasData);
    }
    
    setIsDrawing(false);
    setCurrentPath('');
  };

  const clearCanvas = () => {
    setPaths([]);
    setCanvasData({
      ...canvasData,
      layers: [{ ...canvasData.layers[0], objects: [] }]
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-full overflow-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Canvas Editor</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={clearCanvas}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
            >
              Clear
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
        
        <div className="p-4">
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
            <svg
              width={800}
              height={600}
              className="cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Grid background */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Saved paths */}
              {paths.map(path => (
                <path
                  key={path.id}
                  d={path.path}
                  stroke={path.stroke}
                  strokeWidth={path.strokeWidth}
                  fill={path.fill}
                />
              ))}
              
              {/* Current drawing path */}
              {isDrawing && currentPath && (
                <path
                  d={currentPath}
                  stroke="#000000"
                  strokeWidth={2}
                  fill="none"
                />
              )}
            </svg>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>Click and drag to draw on the canvas. Your work is automatically saved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Student Dashboard
const StudentDashboard = () => {
  const { profile } = useAuth();
  const [activeCanvas, setActiveCanvas] = useState(null);

  const mockContent = [
    {
      id: '1',
      subject: 'Mathematics',
      course: 'Algebra I',
      topic: 'Linear Equations',
      lesson: 'Graphing Linear Functions',
      section: 'Practice Problems',
      hasCanvas: true
    },
    {
      id: '2',
      subject: 'Mathematics', 
      course: 'Geometry',
      topic: 'Triangles',
      lesson: 'Triangle Properties',
      section: 'Identifying Triangles',
      hasCanvas: true
    },
    {
      id: '3',
      subject: 'Physics',
      course: 'Mechanics',
      topic: 'Forces',
      lesson: 'Newton\'s Laws',
      section: 'Force Diagrams',
      hasCanvas: true
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {profile?.username}!
        </h2>
        <p className="text-gray-600">Continue your learning journey</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockContent.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="mb-4">
              <h3 className="font-semibold text-lg text-gray-900 mb-1">{item.subject}</h3>
              <p className="text-sm text-gray-600">{item.course}</p>
            </div>
            
            <div className="space-y-1 text-sm text-gray-700 mb-4">
              <p><span className="font-medium">Topic:</span> {item.topic}</p>
              <p><span className="font-medium">Lesson:</span> {item.lesson}</p>
              <p><span className="font-medium">Section:</span> {item.section}</p>
            </div>
            
            {item.hasCanvas && (
              <button
                onClick={() => setActiveCanvas(item.id)}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                <PenTool className="h-4 w-4" />
                <span>Open Canvas</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {activeCanvas && (
        <CanvasEditor
          sectionId={activeCanvas}
          onClose={() => setActiveCanvas(null)}
        />
      )}
    </div>
  );
};

// Teacher Dashboard
const TeacherDashboard = () => {
  const { profile } = useAuth();

  const mockClasses = [
    { id: '1', name: 'Grade 10 Mathematics', students: 28, assignments: 12 },
    { id: '2', name: 'Grade 11 Advanced Math', students: 22, assignments: 8 },
  ];

  const mockStudentWork = [
    { 
      id: '1', 
      studentName: 'Alice Johnson', 
      assignment: 'Linear Functions Canvas',
      submitted: true,
      submittedAt: '2 hours ago'
    },
    { 
      id: '2', 
      studentName: 'Bob Smith', 
      assignment: 'Triangle Properties',
      submitted: false,
      submittedAt: null
    },
    { 
      id: '3', 
      studentName: 'Carol Davis', 
      assignment: 'Force Diagrams',
      submitted: true,
      submittedAt: '1 day ago'
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Teacher Dashboard
        </h2>
        <p className="text-gray-600">Manage your classes and review student work</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Classes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Your Classes</h3>
          </div>
          
          <div className="space-y-4">
            {mockClasses.map((cls) => (
              <div key={cls.id} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{cls.name}</h4>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{cls.students} students</span>
                  <span>{cls.assignments} assignments</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Student Work */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <PenTool className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Recent Submissions</h3>
          </div>
          
          <div className="space-y-4">
            {mockStudentWork.map((work) => (
              <div key={work.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900">{work.studentName}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    work.submitted 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {work.submitted ? 'Submitted' : 'Pending'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{work.assignment}</p>
                {work.submittedAt && (
                  <p className="text-xs text-gray-500">{work.submittedAt}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const EduPlatformApp = () => {
  const { user, profile, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="mx-auto h-12 w-12 text-blue-600 mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header profile={profile} onSignOut={handleSignOut} />
      
      {profile?.role === 'teacher' ? (
        <TeacherDashboard />
      ) : (
        <StudentDashboard />
      )}
    </div>
  );
};

// Root App with Provider
const App = () => {
  return (
    <AuthProvider>
      <EduPlatformApp />
    </AuthProvider>
  );
};

export default App;
