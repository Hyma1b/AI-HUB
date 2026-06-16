import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Calendar, Newspaper, Shield, Plus, LogOut, 
  LogIn, Moon, Sun, ExternalLink, Copy, Check, Info, Award, 
  Layers, Briefcase, HelpCircle, ChevronRight, User, AlertCircle
} from 'lucide-react';
import StatsCard from './components/StatsCard';
import AssistantWidget from './components/AssistantWidget';

// Base API URL
const API_URL = 'http://localhost:5000/api';

export default function App() {
  // Navigation & Theme
  const [activeTab, setActiveTab] = useState('directory');
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Data States
  const [tools, setTools] = useState([]);
  const [news, setNews] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedField, setSelectedField] = useState('All');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedAccess, setSelectedAccess] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Authentication & Views
  const [token, setToken] = useState(localStorage.getItem('ic_token') || '');
  const [user, setUser] = useState(null);
  const [isInternalView, setIsInternalView] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // UI Micro-interactions
  const [selectedTool, setSelectedTool] = useState(null);
  const [copiedPromptKey, setCopiedPromptKey] = useState(''); // track which level prompt was copied

  // Admin Form States
  const [newToolForm, setNewToolForm] = useState({
    name: '', description: '', field: 'Business & Productivity', role: 'Founder',
    use_case: '', tool_type: 'Chatbot', difficulty: 'Beginner', access_type: 'Free',
    external_url: '', business_cta: '',
    beginner_guide: '', beginner_prompt: '',
    intermediate_guide: '', intermediate_prompt: '',
    advanced_guide: '', advanced_prompt: '',
    owner: '', access_method: '', cost: '', approval_status: 'Approved',
    internal_department: 'General', support_contact: '', internal_notes: ''
  });
  const [adminSuccessMsg, setAdminSuccessMsg] = useState('');
  const [adminErrorMsg, setAdminErrorMsg] = useState('');

  // Fetch logged in profile
  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('Session expired');
        return res.json();
      })
      .then(data => {
        setUser(data.user);
        setIsInternalView(true); // default to internal view if logged in
      })
      .catch(() => {
        handleLogout();
      });
    }
  }, [token]);

  // Fetch Tools, News, and Events
  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Fetch Tools
      const toolsRes = await fetch(`${API_URL}/tools`, { headers });
      if (!toolsRes.ok) throw new Error('Failed to load AI directory');
      const toolsData = await toolsRes.json();
      setTools(toolsData);

      // Fetch News
      const newsRes = await fetch(`${API_URL}/news`);
      if (newsRes.ok) {
        const newsData = await newsRes.json();
        setNews(newsData);
      }

      // Fetch Events
      const eventsRes = await fetch(`${API_URL}/events`);
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Theme Toggler
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      document.body.classList.add('dark-mode');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  // Authentication Handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      localStorage.setItem('ic_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setIsInternalView(true);
      setLoginModalOpen(false);
      setLoginUsername('');
      setLoginPassword('');
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ic_token');
    setToken('');
    setUser(null);
    setIsInternalView(false);
    setActiveTab('directory');
  };

  // Toggle View State
  const toggleViewMode = () => {
    if (!token) {
      setLoginModalOpen(true);
    } else {
      setIsInternalView(!isInternalView);
    }
  };

  // Copy prompt helper
  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptKey(key);
    setTimeout(() => setCopiedPromptKey(''), 2000);
  };

  // Admin New Tool submit
  const handleAddTool = async (e) => {
    e.preventDefault();
    setAdminSuccessMsg('');
    setAdminErrorMsg('');

    try {
      const res = await fetch(`${API_URL}/tools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newToolForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit tool');

      setAdminSuccessMsg('Tool cataloged successfully!');
      fetchData(); // reload directory
      
      // Reset form
      setNewToolForm({
        name: '', description: '', field: 'Business & Productivity', role: 'Founder',
        use_case: '', tool_type: 'Chatbot', difficulty: 'Beginner', access_type: 'Free',
        external_url: '', business_cta: '',
        beginner_guide: '', beginner_prompt: '',
        intermediate_guide: '', intermediate_prompt: '',
        advanced_guide: '', advanced_prompt: '',
        owner: '', access_method: '', cost: '', approval_status: 'Approved',
        internal_department: 'General', support_contact: '', internal_notes: ''
      });
    } catch (err) {
      setAdminErrorMsg(err.message);
    }
  };

  // Unique Lists for Dropdown filters
  const fields = ['All', 'Business & Productivity', 'Marketing & Content', 'Software Development', 'Design & Creative', 'Data & Analytics', 'Operations & Automation', 'Customer Support'];
  const roles = ['All', 'Founder', 'Marketer', 'Developer', 'Designer', 'Sales Executive', 'Operations Manager'];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];
  const accessTypes = isInternalView 
    ? ['All', 'Free', 'Freemium', 'Paid', 'Enterprise', 'Open Source', 'Internal-only']
    : ['All', 'Free', 'Freemium', 'Paid', 'Enterprise', 'Open Source'];
  
  const departments = ['All', 'Marketing', 'HR', 'Finance', 'Legal & Compliance', 'Operations', 'General'];

  // Client-Side filtering logic
  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tool.use_case.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesField = selectedField === 'All' || tool.field === selectedField;
    const matchesRole = selectedRole === 'All' || tool.role === selectedRole;
    const matchesDifficulty = selectedDifficulty === 'All' || tool.difficulty === selectedDifficulty;
    const matchesAccess = selectedAccess === 'All' || tool.access_type === selectedAccess;
    const matchesDept = selectedDepartment === 'All' || 
                        (tool.internal_info && tool.internal_info.internal_department === selectedDepartment);

    return matchesSearch && matchesField && matchesRole && matchesDifficulty && matchesAccess && matchesDept;
  });

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300">
      
      {/* 1. Nav Header */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-neutral-medium/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('directory')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-sky to-primary-secondary flex items-center justify-center text-white shadow-md">
              <svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="12" />
                <rect x="20" y="44" width="60" height="12" fill="white" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-widest uppercase text-neutral-light leading-none">INNOVATION CITY</h1>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-primary-secondary dark:text-primary-sky">AI Innovation Hub</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => setActiveTab('directory')}
              className={`text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'directory' 
                  ? 'text-primary-secondary dark:text-primary-sky border-b-2 border-primary-secondary dark:border-primary-sky py-1' 
                  : 'text-neutral-medium hover:text-neutral-dark dark:hover:text-neutral-white'
              }`}
            >
              AI Directory
            </button>
            <button 
              onClick={() => setActiveTab('news')}
              className={`text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'news' 
                  ? 'text-primary-secondary dark:text-primary-sky border-b-2 border-primary-secondary dark:border-primary-sky py-1' 
                  : 'text-neutral-medium hover:text-neutral-dark dark:hover:text-neutral-white'
              }`}
            >
              AI News
            </button>
            <button 
              onClick={() => setActiveTab('events')}
              className={`text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'events' 
                  ? 'text-primary-secondary dark:text-primary-sky border-b-2 border-primary-secondary dark:border-primary-sky py-1' 
                  : 'text-neutral-medium hover:text-neutral-dark dark:hover:text-neutral-white'
              }`}
            >
              Events
            </button>
            {user && (
              <button 
                onClick={() => setActiveTab('admin')}
                className={`text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === 'admin' 
                    ? 'text-primary-secondary dark:text-primary-sky border-b-2 border-primary-secondary dark:border-primary-sky py-1' 
                    : 'text-neutral-medium hover:text-neutral-dark dark:hover:text-neutral-white'
                }`}
              >
                Admin Panel
              </button>
            )}
          </nav>

          {/* Settings & Auth Buttons */}
          <div className="flex items-center gap-4">
            
            {/* Dark Mode Toggle */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl bg-white/5 border border-neutral-medium/10 hover:bg-neutral-medium/5 dark:hover:bg-white/10 transition-all cursor-pointer text-neutral-light"
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Internal / External view toggle */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[11px] font-bold uppercase tracking-wider opacity-70">
                {isInternalView ? 'Internal View' : 'External View'}
              </span>
              <button
                onClick={toggleViewMode}
                className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                  isInternalView ? 'bg-primary-secondary' : 'bg-neutral-medium/40'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${isInternalView ? 'translate-x-6' : ''}`} />
              </button>
            </div>

            {/* Login/Logout Button */}
            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden lg:inline text-xs font-bold text-neutral-medium">
                  {user.username} ({user.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-red-medium/30 text-brand-red-medium hover:bg-brand-red-medium/5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  <LogOut size={13} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setLoginModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary-secondary hover:bg-brand-sec-medium text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                <LogIn size={13} />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        
        {/* Error notification */}
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-brand-red-medium/20 bg-brand-red-light/30 text-brand-red-dark flex gap-3 items-center text-sm">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Directory Tab */}
        {activeTab === 'directory' && (
          <div className="space-y-10">
            
            {/* HERO SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              
              {/* Left Headline */}
              <div className="lg:col-span-2 flex flex-col justify-center space-y-6">
                <div className="space-y-3">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-primary-secondary dark:text-primary-sky">
                    Hub Discovery Node
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-none text-neutral-light">
                    Unlock Business Efficiency <br className="hidden sm:inline"/>
                    With Curated AI Solutions
                  </h2>
                  <p className="text-sm text-neutral-medium max-w-xl leading-relaxed">
                    Explore Innovation City verified AI toolkits. Understand their real-world capabilities, follow usage guides, and discover direct business licensing opportunities.
                  </p>
                </div>
                <div className="flex gap-4">
                  <a 
                    href="#directory-catalog"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-sky to-primary-secondary text-white text-xs font-bold uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all shadow-md"
                  >
                    Browse Directory
                  </a>
                  <button 
                    onClick={() => {
                      // Trigger assistant widget or scrolls down
                      const event = new CustomEvent('open-assistant');
                      window.dispatchEvent(event);
                    }}
                    className="px-5 py-2.5 rounded-xl border border-neutral-medium/20 text-xs font-bold uppercase tracking-wider hover:bg-neutral-medium/5 dark:hover:bg-white/5 transition-all"
                  >
                    Consult AI Support
                  </button>
                </div>
              </div>

              {/* Right Stats Card */}
              <div>
                <StatsCard tools={tools} />
              </div>
            </div>

            {/* DIRECTORY CATALOG */}
            <div id="directory-catalog" className="pt-4 scroll-mt-20">
              
              {/* Search Bar & Filters Wrapper */}
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex gap-3 items-center w-full">
                  <div className="flex-1 relative flex items-center">
                    <Search className="absolute left-4 text-neutral-medium" size={16} />
                    <input
                      type="text"
                      placeholder="Search AI tools by name, utility, or keywords..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white dark:bg-white/5 border border-neutral-medium/15 dark:border-white/10 rounded-xl pl-11 pr-4 py-3 text-xs outline-none focus:border-primary-sky dark:focus:border-primary-sky text-neutral-light shadow-sm transition-all"
                    />
                  </div>
                  <button
                    onClick={() => setShowFiltersMobile(!showFiltersMobile)}
                    className="lg:hidden flex items-center gap-1.5 px-4 py-3 rounded-xl border border-neutral-medium/15 text-xs font-bold text-neutral-medium hover:bg-neutral-medium/5 cursor-pointer"
                  >
                    <Filter size={14} />
                    Filters
                  </button>
                </div>

                {/* Desktop Filters Row */}
                <div className={`lg:flex flex-wrap items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/8 shadow-sm ${showFiltersMobile ? 'flex' : 'hidden'}`}>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:flex items-center gap-4 w-full">
                    
                    {/* Domain Filter */}
                    <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                      <label className="text-[9px] uppercase tracking-widest font-bold opacity-60">Domain</label>
                      <select
                        value={selectedField}
                        onChange={(e) => setSelectedField(e.target.value)}
                        className="bg-dark-bg-light border border-white/10 rounded-xl px-3 py-2 text-xs outline-none text-neutral-light focus:border-primary-sky"
                      >
                        {fields.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>

                    {/* Role Filter */}
                    <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                      <label className="text-[9px] uppercase tracking-widest font-bold opacity-60">Target Role</label>
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="bg-dark-bg-light border border-white/10 rounded-xl px-3 py-2 text-xs outline-none text-neutral-light focus:border-primary-sky"
                      >
                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>

                    {/* Difficulty */}
                    <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                      <label className="text-[9px] uppercase tracking-widest font-bold opacity-60">Comfort Level</label>
                      <select
                        value={selectedDifficulty}
                        onChange={(e) => setSelectedDifficulty(e.target.value)}
                        className="bg-dark-bg-light border border-white/10 rounded-xl px-3 py-2 text-xs outline-none text-neutral-light focus:border-primary-sky"
                      >
                        {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>

                    {/* Access */}
                    <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                      <label className="text-[9px] uppercase tracking-widest font-bold opacity-60">Access License</label>
                      <select
                        value={selectedAccess}
                        onChange={(e) => setSelectedAccess(e.target.value)}
                        className="bg-dark-bg-light border border-white/10 rounded-xl px-3 py-2 text-xs outline-none text-neutral-light focus:border-primary-sky"
                      >
                        {accessTypes.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>

                    {/* Department (Internal View only) */}
                    {isInternalView && (
                      <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                        <label className="text-[9px] uppercase tracking-widest font-bold opacity-60">Internal Department</label>
                        <select
                          value={selectedDepartment}
                          onChange={(e) => setSelectedDepartment(e.target.value)}
                          className="bg-dark-bg-light border border-white/10 rounded-xl px-3 py-2 text-xs outline-none text-neutral-light focus:border-primary-sky"
                        >
                          {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Category Pills (Field/Domain selection shortcut) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none border-b border-neutral-medium/5">
                <button
                  onClick={() => setSelectedField('All')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedField === 'All'
                      ? 'bg-primary-secondary text-white'
                      : 'bg-white/5 border border-white/10 text-neutral-medium hover:text-neutral-light'
                  }`}
                >
                  All Domains
                </button>
                {fields.slice(1).map(field => (
                  <button
                    key={field}
                    onClick={() => setSelectedField(field)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedField === field
                        ? 'bg-primary-secondary text-white'
                        : 'bg-white/5 border border-white/10 text-neutral-medium hover:text-neutral-light'
                    }`}
                  >
                    {field}
                  </button>
                ))}
              </div>

              {/* Tools Grid */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-neutral-medium">
                  <div className="w-10 h-10 border-4 border-primary-sky border-t-primary-secondary rounded-full animate-spin" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Loading AI Inventory...</span>
                </div>
              ) : filteredTools.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-neutral-medium/20 rounded-2xl">
                  <p className="text-sm font-semibold opacity-60">No AI tools matching the active filters were found.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedField('All');
                      setSelectedRole('All');
                      setSelectedDifficulty('All');
                      setSelectedAccess('All');
                      setSelectedDepartment('All');
                    }}
                    className="mt-4 px-4 py-2 bg-white/5 border border-neutral-medium/10 text-xs font-bold uppercase rounded-xl hover:bg-neutral-medium/5"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTools.map(tool => (
                    <div 
                      key={tool.id} 
                      onClick={() => setSelectedTool(tool)}
                      className="glass-panel p-5 rounded-2xl shadow-sm border border-neutral-medium/10 hover-lift flex flex-col justify-between cursor-pointer min-h-[220px]"
                    >
                      <div>
                        {/* Tags */}
                        <div className="flex justify-between items-start gap-2 mb-4">
                  <span className="px-2.5 py-0.5 text-[9px] font-bold rounded-full tag-sky truncate">
                            {tool.field}
                          </span>
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                            tool.difficulty === 'Beginner' 
                              ? 'bg-brand-yellow-light text-brand-yellow-dark dark:bg-brand-yellow-dark/20' 
                              : tool.difficulty === 'Intermediate'
                              ? 'bg-brand-orange-light text-brand-orange-dark dark:bg-brand-orange-dark/20'
                              : 'bg-brand-red-light text-brand-red-dark dark:bg-brand-red-dark/20'
                          }`}>
                            {tool.difficulty}
                          </span>
                        </div>

                        {/* Title */}
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-sm font-extrabold tracking-tight text-neutral-light">{tool.name}</h3>
                          {tool.access_type === 'Internal-only' && (
                            <span className="px-2 py-0.5 text-[8px] font-bold uppercase rounded bg-brand-sec-light text-brand-sec-medium dark:bg-brand-sec-dark/40 dark:text-brand-sec-light">
                              Internal
                            </span>
                          )}
                        </div>
                        
                        {/* Description */}
                        <p className="text-xs text-neutral-medium leading-relaxed mb-4 line-clamp-3">
                          {tool.description}
                        </p>
                      </div>

                      {/* Footer Info */}
                      <div className="pt-4 border-t border-neutral-medium/5 flex items-center justify-between text-[10px] font-semibold opacity-75">
                        <span className="uppercase tracking-wider">Access: {tool.access_type}</span>
                        <span className="flex items-center gap-1 text-primary-secondary dark:text-primary-sky font-bold hover:underline">
                          View details
                          <ChevronRight size={12} />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* News Tab */}
        {activeTab === 'news' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="border-b border-neutral-medium/10 pb-6">
              <h2 className="text-2xl font-bold tracking-tight">AI News & Hub Updates</h2>
              <p className="text-xs text-neutral-medium mt-1">Curated industry market news and Innovation City internal releases.</p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center py-20 gap-3 text-neutral-medium">
                <div className="w-8 h-8 border-4 border-primary-sky border-t-primary-secondary rounded-full animate-spin" />
                <span className="text-xs">Loading news feed...</span>
              </div>
            ) : news.length === 0 ? (
              <div className="text-center py-20 text-neutral-medium">No updates logged currently.</div>
            ) : (
              <div className="space-y-6">
                {news.map(article => (
                  <article key={article.id} className="glass-panel p-6 rounded-2xl border border-neutral-medium/10 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full ${
                        article.category === 'Market News' 
                          ? 'tag-sky' 
                          : 'tag-purple'
                      }`}>
                        {article.category}
                      </span>
                      <span className="text-[10px] font-medium opacity-60 flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(article.date_published).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-neutral-light leading-tight">{article.title}</h3>
                    <p className="text-xs text-neutral-medium leading-relaxed font-semibold">{article.summary}</p>
                    <p className="text-xs text-neutral-medium leading-relaxed pt-2 border-t border-neutral-medium/5">{article.content}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="border-b border-neutral-medium/10 pb-6">
              <h2 className="text-2xl font-bold tracking-tight">Events & Learning Resources</h2>
              <p className="text-xs text-neutral-medium mt-1">AI workshops, meetups, training schedules, and past archive materials.</p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center py-20 gap-3 text-neutral-medium">
                <div className="w-8 h-8 border-4 border-primary-sky border-t-primary-secondary rounded-full animate-spin" />
                <span className="text-xs">Loading training logs...</span>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-20 text-neutral-medium">No events logged.</div>
            ) : (
              <div className="space-y-8">
                {/* Upcoming section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary-secondary dark:text-primary-sky">Scheduled Events</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {events.filter(e => e.type !== 'Archive').map(event => (
                      <div key={event.id} className="glass-panel p-5 rounded-2xl border border-neutral-medium/10 flex flex-col justify-between min-h-[200px]">
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-3">
                            <span className="px-2.5 py-0.5 text-[9px] font-bold rounded-full bg-brand-yellow-light text-brand-yellow-dark dark:bg-brand-yellow-dark/20">
                              {event.type}
                            </span>
                            <span className="text-[10px] font-medium opacity-65 flex items-center gap-1">
                              <Calendar size={11} />
                              {new Date(event.date).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-neutral-light mb-2 leading-tight">{event.title}</h4>
                          <p className="text-[11px] text-neutral-medium leading-relaxed mb-4">{event.description}</p>
                        </div>
                        <div className="pt-3 border-t border-neutral-medium/5 flex items-center justify-between text-[10px] opacity-75">
                          <span className="font-semibold truncate max-w-[150px]">Loc: {event.location}</span>
                          {event.resources_link && (
                            <a 
                              href={event.resources_link} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-primary-secondary dark:text-primary-sky font-bold hover:underline flex items-center gap-0.5"
                            >
                              Details <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Archive Section */}
                <div className="space-y-4 pt-4 border-t border-neutral-medium/10">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-medium">Recorded webinar archive</h3>
                  <div className="space-y-3">
                    {events.filter(e => e.type === 'Archive').map(archive => (
                      <div key={archive.id} className="glass-panel p-4 rounded-xl border border-neutral-medium/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h4 className="text-xs font-bold text-neutral-light leading-tight">{archive.title}</h4>
                          <p className="text-[10px] text-neutral-medium mt-1">{archive.description}</p>
                        </div>
                        <a 
                          href={archive.resources_link} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-white/5 border border-neutral-medium/15 text-[10px] font-bold uppercase rounded-lg text-neutral-medium hover:text-neutral-dark dark:hover:text-neutral-white transition-all text-center whitespace-nowrap"
                        >
                          Access Slides & Video
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Admin Dashboard Tab */}
        {activeTab === 'admin' && user && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="border-b border-neutral-medium/10 pb-6">
              <h2 className="text-2xl font-bold tracking-tight">Admin Console: Catalog New Tool</h2>
              <p className="text-xs text-neutral-medium mt-1">Input new AI tool profiles, usage prompts, and internal department tracking logs.</p>
            </div>

            <form onSubmit={handleAddTool} className="space-y-6 bg-white/5 border border-white/10 p-6 rounded-2xl">
              {adminSuccessMsg && (
                <div className="p-3 bg-brand-sky-light/40 border border-brand-sky-medium/20 text-brand-sky-dark rounded-xl text-xs font-bold">
                  {adminSuccessMsg}
                </div>
              )}
              {adminErrorMsg && (
                <div className="p-3 bg-brand-red-light/40 border border-brand-red-medium/20 text-brand-red-dark rounded-xl text-xs font-bold">
                  {adminErrorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold opacity-75">Tool Name</label>
                  <input
                    type="text"
                    required
                    value={newToolForm.name}
                    onChange={(e) => setNewToolForm({...newToolForm, name: e.target.value})}
                    className="w-full bg-dark-bg-light border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-light outline-none focus:border-primary-sky"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold opacity-75">External Website URL</label>
                  <input
                    type="url"
                    required
                    value={newToolForm.external_url}
                    onChange={(e) => setNewToolForm({...newToolForm, external_url: e.target.value})}
                    className="w-full bg-dark-bg-light border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-light outline-none focus:border-primary-sky"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold opacity-75">Description</label>
                <textarea
                  required
                  rows="3"
                  value={newToolForm.description}
                  onChange={(e) => setNewToolForm({...newToolForm, description: e.target.value})}
                  className="w-full bg-dark-bg-light border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-light outline-none focus:border-primary-sky"
                />
              </div>

              {/* Classification dropdowns */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold opacity-75">Domain Field</label>
                  <select
                    value={newToolForm.field}
                    onChange={(e) => setNewToolForm({...newToolForm, field: e.target.value})}
                    className="w-full bg-dark-bg-light border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-light focus:border-primary-sky"
                  >
                    {fields.slice(1).map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold opacity-75">Target Role</label>
                  <select
                    value={newToolForm.role}
                    onChange={(e) => setNewToolForm({...newToolForm, role: e.target.value})}
                    className="w-full bg-dark-bg-light border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-light focus:border-primary-sky"
                  >
                    {roles.slice(1).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold opacity-75">Difficulty</label>
                  <select
                    value={newToolForm.difficulty}
                    onChange={(e) => setNewToolForm({...newToolForm, difficulty: e.target.value})}
                    className="w-full bg-dark-bg-light border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-light focus:border-primary-sky"
                  >
                    {difficulties.slice(1).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold opacity-75">Access License</label>
                  <select
                    value={newToolForm.access_type}
                    onChange={(e) => setNewToolForm({...newToolForm, access_type: e.target.value})}
                    className="w-full bg-dark-bg-light border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-light focus:border-primary-sky"
                  >
                    {accessTypes.slice(1).map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold opacity-75">Specific Use Case</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Content Creation, Code generation"
                    value={newToolForm.use_case}
                    onChange={(e) => setNewToolForm({...newToolForm, use_case: e.target.value})}
                    className="w-full bg-dark-bg-light border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-light outline-none focus:border-primary-sky"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold opacity-75">Tool Type</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chatbot, Analytics tool"
                    value={newToolForm.tool_type}
                    onChange={(e) => setNewToolForm({...newToolForm, tool_type: e.target.value})}
                    className="w-full bg-dark-bg-light border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-light outline-none focus:border-primary-sky"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold opacity-75">Business License CTA Recommendation</label>
                <input
                  type="text"
                  placeholder="e.g. Explore setting up an AI consulting business at Innovation City."
                  value={newToolForm.business_cta}
                  onChange={(e) => setNewToolForm({...newToolForm, business_cta: e.target.value})}
                  className="w-full bg-dark-bg-light border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-light outline-none focus:border-primary-sky"
                />
              </div>

              {/* Guides */}
              <div className="border-t border-neutral-medium/10 pt-4 space-y-4">
                <h3 className="text-sm font-bold text-primary-secondary dark:text-primary-sky uppercase tracking-wider">Prompt & Usage Guidance</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  {/* Beginner */}
                  <div className="p-4 rounded-xl border border-neutral-medium/10 space-y-3 bg-white/5">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-yellow-dark">1. Beginner Level</span>
                    <input
                      type="text"
                      required
                      placeholder="Basic explanation/guide on how to start..."
                      value={newToolForm.beginner_guide}
                      onChange={(e) => setNewToolForm({...newToolForm, beginner_guide: e.target.value})}
                      className="w-full bg-dark-bg-light border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-light outline-none focus:border-primary-sky"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Copyable beginner prompt..."
                      value={newToolForm.beginner_prompt}
                      onChange={(e) => setNewToolForm({...newToolForm, beginner_prompt: e.target.value})}
                      className="w-full bg-dark-bg-light border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-light outline-none focus:border-primary-sky"
                    />
                  </div>

                  {/* Intermediate */}
                  <div className="p-4 rounded-xl border border-neutral-medium/10 space-y-3 bg-white/5">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-orange-dark">2. Intermediate Level</span>
                    <input
                      type="text"
                      required
                      placeholder="Common workflows, practical tips..."
                      value={newToolForm.intermediate_guide}
                      onChange={(e) => setNewToolForm({...newToolForm, intermediate_guide: e.target.value})}
                      className="w-full bg-dark-bg-light border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-light outline-none focus:border-primary-sky"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Copyable intermediate prompt..."
                      value={newToolForm.intermediate_prompt}
                      onChange={(e) => setNewToolForm({...newToolForm, intermediate_prompt: e.target.value})}
                      className="w-full bg-dark-bg-light border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-light outline-none focus:border-primary-sky"
                    />
                  </div>

                  {/* Advanced */}
                  <div className="p-4 rounded-xl border border-neutral-medium/10 space-y-3 bg-white/5">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-red-dark">3. Advanced Level</span>
                    <input
                      type="text"
                      required
                      placeholder="Deeps configuration, API parameters, or automation details..."
                      value={newToolForm.advanced_guide}
                      onChange={(e) => setNewToolForm({...newToolForm, advanced_guide: e.target.value})}
                      className="w-full bg-dark-bg-light border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-light outline-none focus:border-primary-sky"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Copyable advanced prompt..."
                      value={newToolForm.advanced_prompt}
                      onChange={(e) => setNewToolForm({...newToolForm, advanced_prompt: e.target.value})}
                      className="w-full bg-dark-bg-light border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-light outline-none focus:border-primary-sky"
                    />
                  </div>
                </div>
              </div>

              {/* Internal Metadata */}
              <div className="border-t border-neutral-medium/10 pt-4 space-y-4">
                <h3 className="text-sm font-bold text-primary-secondary dark:text-primary-sky uppercase tracking-wider">Internal Inventory Logs</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold opacity-75">Team Owner</label>
                    <input
                      type="text"
                      value={newToolForm.owner}
                      onChange={(e) => setNewToolForm({...newToolForm, owner: e.target.value})}
                      className="w-full bg-dark-bg-light border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-light outline-none focus:border-primary-sky"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold opacity-75">Access Method</label>
                    <input
                      type="text"
                      value={newToolForm.access_method}
                      onChange={(e) => setNewToolForm({...newToolForm, access_method: e.target.value})}
                      className="w-full bg-dark-bg-light border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-light outline-none focus:border-primary-sky"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold opacity-75">Monthly/Annual Cost</label>
                    <input
                      type="text"
                      value={newToolForm.cost}
                      onChange={(e) => setNewToolForm({...newToolForm, cost: e.target.value})}
                      className="w-full bg-dark-bg-light border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-light outline-none focus:border-primary-sky"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold opacity-75">Internal Dept Mapping</label>
                    <select
                      value={newToolForm.internal_department}
                      onChange={(e) => setNewToolForm({...newToolForm, internal_department: e.target.value})}
                      className="w-full bg-dark-bg-light border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-light focus:border-primary-sky"
                    >
                      {departments.slice(1).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold opacity-75">Approval Status</label>
                    <select
                      value={newToolForm.approval_status}
                      onChange={(e) => setNewToolForm({...newToolForm, approval_status: e.target.value})}
                      className="w-full bg-dark-bg-light border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-light focus:border-primary-sky"
                    >
                      <option value="Approved">Approved</option>
                      <option value="Evaluating">Evaluating</option>
                      <option value="Not Approved">Not Approved</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold opacity-75">Support Email/Contact</label>
                    <input
                      type="email"
                      value={newToolForm.support_contact}
                      onChange={(e) => setNewToolForm({...newToolForm, support_contact: e.target.value})}
                      className="w-full bg-dark-bg-light border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-light outline-none focus:border-primary-sky"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold opacity-75">Internal Notes</label>
                  <textarea
                    rows="2"
                    value={newToolForm.internal_notes}
                    onChange={(e) => setNewToolForm({...newToolForm, internal_notes: e.target.value})}
                    className="w-full bg-dark-bg-light border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-light outline-none focus:border-primary-sky"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary-secondary hover:bg-brand-sec-medium text-white text-xs font-bold uppercase rounded-xl tracking-wider cursor-pointer"
                >
                  Confirm Upload
                </button>
              </div>
            </form>
          </div>
        )}

      </main>

      {/* 3. Footer */}
      <footer className="mt-auto border-t border-white/8 py-6 flex items-center justify-center text-[10px] uppercase font-bold tracking-widest text-neutral-medium">
        <span>© {new Date().getFullYear()} Innovation City | AI Governance Node</span>
      </footer>

      {/* 4. Support assistant widget */}
      <AssistantWidget token={token} />

      {/* 5. Tool Detail Modal Overlay */}
      {selectedTool && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[85vh] bg-dark-bg-medium rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col glass-panel animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-neutral-medium/10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 text-[8px] font-extrabold uppercase rounded-full bg-brand-sky-light text-brand-sky-dark dark:bg-brand-sky-dark/25 dark:text-primary-sky">
                    {selectedTool.field}
                  </span>
                  {selectedTool.access_type === 'Internal-only' && (
                    <span className="px-2 py-0.5 text-[8px] font-extrabold uppercase rounded bg-brand-sec-light text-brand-sec-medium dark:bg-brand-sec-dark/30 dark:text-brand-sec-light">
                      Internal Tool
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-extrabold text-neutral-light">{selectedTool.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedTool(null)}
                className="w-8 h-8 rounded-full border border-neutral-medium/15 flex items-center justify-center text-xs hover:bg-neutral-medium/5 cursor-pointer text-neutral-medium"
              >
                ✕
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Info grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Profile Description */}
                <div className="md:col-span-2 space-y-4">
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider opacity-60">Tool Profile</h4>
                    <p className="text-xs text-neutral-medium leading-relaxed">
                      {selectedTool.description}
                    </p>
                  </div>
                  <div>
                    <a
                      href={selectedTool.external_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-secondary hover:bg-brand-sec-medium text-white text-xs font-bold uppercase rounded-xl tracking-wider transition-all"
                    >
                      Visit Product Website
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>

                {/* Properties list */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 h-fit">
                  <h4 className="text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5">
                    <Info size={13} />
                    Classifications
                  </h4>
                  <div className="space-y-2 text-[11px] font-semibold">
                    <div className="flex justify-between">
                      <span className="opacity-70">Target Role:</span>
                      <span>{selectedTool.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-70">Difficulty:</span>
                      <span>{selectedTool.difficulty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-70">Access Type:</span>
                      <span>{selectedTool.access_type}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Setup CTAs */}
              {selectedTool.business_cta && (
                <div className="p-4 rounded-xl bg-brand-orange-light/20 dark:bg-brand-orange-dark/10 border border-brand-orange-medium/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex gap-3 items-start">
                    <div className="p-2 rounded-lg bg-brand-orange-light text-brand-orange-dark dark:bg-brand-orange-dark/30 dark:text-brand-orange-medium">
                      <Award size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold tracking-tight text-neutral-light">Innovation City Commercial Opportunity</h4>
                      <p className="text-[11px] text-neutral-medium mt-0.5 font-semibold">{selectedTool.business_cta}</p>
                    </div>
                  </div>
                  <a 
                    href="https://commercial.innovationcity.com/licensing" 
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-brand-orange-medium hover:bg-brand-orange-dark text-white text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all text-center self-stretch sm:self-auto"
                  >
                    Setup Business
                  </a>
                </div>
              )}

              {/* Usage Guides and Prompts */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider opacity-60">Usage Guides & Ready-Made Prompts</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Beginner */}
                  <div className="p-4 rounded-xl border border-neutral-medium/10 flex flex-col justify-between bg-white/5 space-y-4">
                    <div className="space-y-2">
                      <span className="px-2.5 py-0.5 text-[8px] font-extrabold rounded-full tag-yellow uppercase">
                        Beginner
                      </span>
                      <p className="text-[11px] text-neutral-medium leading-relaxed">
                        {selectedTool.guides.beginner.guide}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-dark-bg-dark border border-white/10 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-neutral-medium italic truncate max-w-[80%]">
                        "{selectedTool.guides.beginner.prompt}"
                      </span>
                      <button
                        onClick={() => copyToClipboard(selectedTool.guides.beginner.prompt, 'beg')}
                        className="p-1.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-neutral-medium hover:text-neutral-light transition-colors cursor-pointer"
                      >
                        {copiedPromptKey === 'beg' ? <Check size={11} className="text-brand-sky-dark" /> : <Copy size={11} />}
                      </button>
                    </div>
                  </div>

                  {/* Intermediate */}
                  <div className="p-4 rounded-xl border border-neutral-medium/10 flex flex-col justify-between bg-white/5 space-y-4">
                    <div className="space-y-2">
                      <span className="px-2.5 py-0.5 text-[8px] font-extrabold rounded-full tag-orange uppercase">
                        Intermediate
                      </span>
                      <p className="text-[11px] text-neutral-medium leading-relaxed">
                        {selectedTool.guides.intermediate.guide}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-dark-bg-dark border border-white/10 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-neutral-medium italic truncate max-w-[80%]">
                        "{selectedTool.guides.intermediate.prompt}"
                      </span>
                      <button
                        onClick={() => copyToClipboard(selectedTool.guides.intermediate.prompt, 'int')}
                        className="p-1.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-neutral-medium hover:text-neutral-light transition-colors cursor-pointer"
                      >
                        {copiedPromptKey === 'int' ? <Check size={11} className="text-brand-sky-dark" /> : <Copy size={11} />}
                      </button>
                    </div>
                  </div>

                  {/* Advanced */}
                  <div className="p-4 rounded-xl border border-neutral-medium/10 flex flex-col justify-between bg-white/5 space-y-4">
                    <div className="space-y-2">
                      <span className="px-2.5 py-0.5 text-[8px] font-extrabold rounded-full tag-red uppercase">
                        Advanced
                      </span>
                      <p className="text-[11px] text-neutral-medium leading-relaxed">
                        {selectedTool.guides.advanced.guide}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-neutral-light dark:bg-dark-bg-dark border border-neutral-medium/10 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-neutral-medium italic truncate max-w-[80%]">
                        "{selectedTool.guides.advanced.prompt}"
                      </span>
                      <button
                        onClick={() => copyToClipboard(selectedTool.guides.advanced.prompt, 'adv')}
                        className="p-1.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-neutral-medium hover:text-neutral-light transition-colors cursor-pointer"
                      >
                        {copiedPromptKey === 'adv' ? <Check size={11} className="text-brand-sky-dark" /> : <Copy size={11} />}
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Internal Metadata details (Only visible under Authenticated Internal view) */}
              {isInternalView && selectedTool.internal_info && (
                <div className="p-6 rounded-2xl bg-brand-sec-light/25 dark:bg-brand-sec-dark/15 border border-brand-sec-medium/20 space-y-4">
                  <div className="flex items-center gap-2 text-primary-secondary dark:text-primary-sky">
                    <Shield size={16} />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Internal Inventory Logs (Employee View Only)</h4>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="opacity-60 text-[9px] uppercase tracking-wider block font-bold">Tool Owner</span>
                      <span className="font-semibold text-neutral-dark dark:text-neutral-light">{selectedTool.internal_info.owner}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="opacity-60 text-[9px] uppercase tracking-wider block font-bold">Access Node Method</span>
                      <span className="font-semibold text-neutral-dark dark:text-neutral-light">{selectedTool.internal_info.access_method}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="opacity-60 text-[9px] uppercase tracking-wider block font-bold">Budget & Cost</span>
                      <span className="font-semibold text-neutral-dark dark:text-neutral-light">{selectedTool.internal_info.cost}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="opacity-60 text-[9px] uppercase tracking-wider block font-bold">Approval Status</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${
                        selectedTool.internal_info.approval_status === 'Approved' 
                          ? 'bg-brand-sky-light text-brand-sky-dark dark:bg-brand-sky-dark/30' 
                          : 'bg-brand-orange-light text-brand-orange-dark dark:bg-brand-orange-dark/30'
                      }`}>
                        {selectedTool.internal_info.approval_status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-neutral-medium/10">
                    <div className="space-y-1">
                      <span className="opacity-60 text-[9px] uppercase tracking-wider block font-bold">Department Mapped</span>
                      <span className="font-semibold text-neutral-dark dark:text-neutral-light">{selectedTool.internal_info.internal_department}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="opacity-60 text-[9px] uppercase tracking-wider block font-bold">Support Contact</span>
                      <span className="font-semibold text-neutral-dark dark:text-neutral-light">{selectedTool.internal_info.support_contact}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-neutral-medium/10 text-xs">
                    <span className="opacity-60 text-[9px] uppercase tracking-wider block font-bold">Compliance & Support Notes</span>
                    <p className="text-neutral-dark dark:text-neutral-light italic leading-relaxed">
                      "{selectedTool.internal_info.internal_notes || 'No internal notes provided.'}"
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* 6. Employee Login Modal */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-dark-bg-medium rounded-2xl overflow-hidden shadow-2xl border border-white/10 p-6 glass-panel animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold tracking-widest uppercase text-primary-secondary dark:text-primary-sky">Employee SSO Gateway</h3>
              <button 
                onClick={() => setLoginModalOpen(false)}
                className="w-7 h-7 rounded-full border border-neutral-medium/10 flex items-center justify-center text-xs hover:bg-neutral-medium/5 cursor-pointer text-neutral-medium"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="p-3 bg-brand-red-light/40 border border-brand-red-medium/20 text-brand-red-dark rounded-xl text-xs font-bold">
                  {loginError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider opacity-70">Username</label>
                <input
                  type="text"
                  required
                  placeholder="employee"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full bg-white dark:bg-dark-bg-dark border border-neutral-medium/15 rounded-xl px-3 py-2.5 text-xs text-neutral-light outline-none focus:border-primary-sky"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider opacity-70">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Password123"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-white dark:bg-dark-bg-dark border border-neutral-medium/15 rounded-xl px-3 py-2.5 text-xs text-neutral-light outline-none focus:border-primary-sky"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-primary-sky to-primary-secondary text-white text-xs font-bold uppercase rounded-xl tracking-widest shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                >
                  Authenticate Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
