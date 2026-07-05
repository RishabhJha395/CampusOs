import { Link } from 'react-router-dom';
import { 
  GraduationCap, Building, BookOpen, Users, 
  AlertTriangle, MessageSquare, ShoppingBag, ArrowRight, CheckCircle2, Bot 
} from 'lucide-react';

export function Landing() {
  const features = [
    {
      title: "Hostel Management",
      description: "Seamlessly allocate rooms, manage attendance, and handle leave requests digitally.",
      icon: Building,
      color: "bg-blue-500",
      lightColor: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
    },
    {
      title: "Academic Hub",
      description: "Track grades, manage course enrollments, and access learning materials in one place.",
      icon: BookOpen,
      color: "bg-indigo-500",
      lightColor: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
    },
    {
      title: "Real-time Chat",
      description: "Connect instantly with faculty, wardens, and peers through secure, encrypted messaging.",
      icon: MessageSquare,
      color: "bg-emerald-500",
      lightColor: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
    },
    {
      title: "Campus Marketplace",
      description: "Buy and sell textbooks, electronics, and supplies safely within the college community.",
      icon: ShoppingBag,
      color: "bg-amber-500",
      lightColor: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
    },
    {
      title: "Emergency SOS",
      description: "Instantly alert campus security and wardens with precise location data when in need.",
      icon: AlertTriangle,
      color: "bg-red-500",
      lightColor: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
    },
    {
      title: "CampusMind AI",
      description: "Ask natural-language questions about college policies and get instant answers from our AI assistant.",
      icon: Bot,
      color: "bg-teal-500",
      lightColor: "bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400"
    },
    {
      title: "Clubs & Events",
      description: "Discover campus communities, join clubs, and never miss an upcoming event.",
      icon: Users,
      color: "bg-purple-500",
      lightColor: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 font-sans selection:bg-primary-500/30">
      {/* Navigation */}
      <nav className="fixed w-full z-50 top-0 transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <div className="bg-primary-600 p-2 rounded-xl text-white shadow-lg shadow-primary-500/30">
                <GraduationCap size={24} strokeWidth={2.5} />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-gray-900 dark:text-white">
                Campus<span className="text-primary-600 dark:text-primary-400">OS</span>
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">Features</a>
              <a href="#about" className="text-sm font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">About</a>
              <Link 
                to="/login"
                className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 rounded-full transition-all active:scale-95 shadow-md"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main id="about" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] max-w-7xl opacity-30 dark:opacity-20 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-semibold mb-8 border border-primary-100 dark:border-primary-800/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
            </span>
            CampusOS 2.0 is now live
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-8 leading-tight">
            The Operating System for <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400">
              Modern Campuses
            </span>
          </h1>
          
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-400 leading-relaxed mb-10">
            A unified, beautiful platform that connects students, faculty, wardens, and parents in one seamless digital ecosystem.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              to="/login"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-full transition-all active:scale-95 shadow-xl shadow-primary-500/20 group"
            >
              Access Portal
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="#features"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 rounded-full transition-all active:scale-95"
            >
              Explore Features
            </a>
          </div>

          <div className="mt-16 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-semibold text-gray-500 dark:text-gray-400">
            <div className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-2 text-emerald-500" /> Real-time Sync</div>
            <div className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-2 text-emerald-500" /> Role-based Access</div>
            <div className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-2 text-emerald-500" /> End-to-end Encrypted Chat</div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Everything you need to run a college</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">Say goodbye to fragmented tools. CampusOS brings every aspect of college life into one beautifully designed interface.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div 
                key={idx} 
                className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300 ${feature.lightColor}`}>
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <GraduationCap size={24} className="text-primary-600" />
            <span className="font-bold text-xl text-gray-900 dark:text-white">CampusOS</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            © {new Date().getFullYear()} CampusOS Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
