import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import '@/App.css';
import Dashboard from './pages/Dashboard';
import Activities from './pages/Activities';
import Analytics from './pages/Analytics';
import Badges from './pages/Badges';
import Settings from './pages/Settings';
import Timeline from './pages/Timeline';
import { Home, Activity, BarChart3, Award, Settings as SettingsIcon, Clock } from 'lucide-react';
import { Toaster } from './components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
});

function App() {
  return (
    <div className="App min-h-screen bg-background">
      <BrowserRouter>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/activities" element={<Activities />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/badges" element={<Badges />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
        <Toaster position="top-right" />
      </BrowserRouter>
    </div>
  );
}

const Sidebar = () => {
  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/activities', icon: Activity, label: 'Activities' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/badges', icon: Award, label: 'Badges' },
    { path: '/settings', icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <aside className="w-20 lg:w-64 bg-white border-r-2 border-black">
      <div className="p-4 lg:p-6">
        <motion.h1
          className="hidden lg:block text-3xl font-secondary font-bold text-primary"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          LevelUp Life
        </motion.h1>
        <div className="lg:hidden text-2xl font-secondary font-bold text-primary text-center">LL</div>
      </div>
      <nav className="mt-8">
        {navItems.map((item, index) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 lg:px-6 py-4 font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-white border-l-4 border-accent'
                  : 'text-foreground hover:bg-muted'
              }`
            }
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 w-full justify-center lg:justify-start"
            >
              <item.icon size={24} />
              <span className="hidden lg:block">{item.label}</span>
            </motion.div>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default App;