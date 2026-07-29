import Link from 'next/link';

export const dynamic = "force-dynamic";

export default async function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      {/* Navigation */}
      <nav className="px-6 py-4 flex justify-between items-center bg-black/20 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-xl">
            🌊
          </div>
          <span className="text-xl font-bold">FloodGuard AI</span>
        </div>
        <div className="flex space-x-4">
          <Link href="/login" className="px-4 py-2 rounded-lg hover:bg-white/10 transition">
            Login
          </Link>
          <Link href="/register" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition font-semibold">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            FloodGuard AI
          </h1>
          <p className="text-2xl md:text-3xl mb-4 text-blue-100">
            Autonomous Early Warning & Community Evacuation System
          </p>
          <p className="text-lg text-blue-200 mb-8 max-w-2xl mx-auto">
            AI-powered flash flood prediction, real-time monitoring, intelligent evacuation routing, and multilingual emergency alerts
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/dashboard" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg font-bold text-lg transition shadow-lg shadow-blue-500/50">
              Launch Dashboard
            </Link>
            <Link href="/register" className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-lg font-bold text-lg transition backdrop-blur-sm border border-white/20">
              Learn More
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold mb-2">AI Prediction</h3>
            <p className="text-blue-200">
              Multi-agent AI system monitors rainfall, river levels, and predicts floods with high accuracy using XGBoost & LSTM models
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition">
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="text-xl font-bold mb-2">Live Flood Mapping</h3>
            <p className="text-blue-200">
              Real-time street-level inundation simulation identifies flooded roads and affected areas instantly
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition">
            <div className="text-4xl mb-4">🛣️</div>
            <h3 className="text-xl font-bold mb-2">Smart Evacuation</h3>
            <p className="text-blue-200">
              AI-powered routing finds safest evacuation paths avoiding flooded areas and recommends nearest shelters
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition">
            <div className="text-4xl mb-4">📢</div>
            <h3 className="text-xl font-bold mb-2">Multilingual Alerts</h3>
            <p className="text-blue-200">
              Emergency alerts in 6 languages (English, Tamil, Hindi, Kannada, Telugu, Malayalam) via SMS, push & voice
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition">
            <div className="text-4xl mb-4">🏥</div>
            <h3 className="text-xl font-bold mb-2">Shelter Network</h3>
            <p className="text-blue-200">
              Real-time shelter availability tracking with capacity management and contact information
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold mb-2">AI Chatbot</h3>
            <p className="text-blue-200">
              Groq-powered assistant answers questions, explains predictions, and guides evacuation procedures
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
          <div className="text-center">
            <div className="text-4xl font-bold text-cyan-400">5</div>
            <div className="text-blue-200 mt-2">AI Agents</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-cyan-400">6</div>
            <div className="text-blue-200 mt-2">Languages</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-cyan-400">24/7</div>
            <div className="text-blue-200 mt-2">Monitoring</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-cyan-400">Real-time</div>
            <div className="text-blue-200 mt-2">Alerts</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black/30 backdrop-blur-sm mt-20 py-8 text-center text-blue-200">
        <p>© 2024 FloodGuard AI. Supporting SDG 11 (Sustainable Cities) & SDG 13 (Climate Action)</p>
      </footer>
    </div>
  );
}
