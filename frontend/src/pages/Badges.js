import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../App';
import { Trophy, Star, Award, Crown, Flame, Footprints, Lock } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';

const iconMap = {
  Trophy,
  Star,
  Award,
  Crown,
  Flame,
  Footprints,
};

const Badges = () => {
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const response = await api.get('/badges');
      setBadges(response.data);
    } catch (error) {
      console.error('Error fetching badges:', error);
      toast.error('Failed to load badges');
    }
  };

  const earnedCount = badges.filter((b) => b.is_earned).length;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-5xl lg:text-6xl font-secondary font-black tracking-tighter mb-2">
          Badges
        </h1>
        <p className="text-lg text-muted-foreground">
          {earnedCount} of {badges.length} badges earned
        </p>
      </motion.div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="bg-white p-6 rounded-xl border-2 border-black shadow-brutal">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold">Collection Progress</span>
            <span className="font-bold">
              {earnedCount}/{badges.length}
            </span>
          </div>
          <div className="h-6 bg-muted rounded-full overflow-hidden border-2 border-black">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(earnedCount / badges.length) * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-accent"
            />
          </div>
        </div>
      </motion.div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {badges.map((badge, index) => {
          const Icon = iconMap[badge.icon] || Trophy;
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={badge.is_earned ? { scale: 1.05, rotate: [0, -5, 5, -5, 0] } : {}}
              data-testid={`badge-${index}`}
            >
              <Card
                className={`border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all ${
                  badge.is_earned
                    ? 'bg-gradient-to-br from-accent to-accent/80'
                    : 'bg-white opacity-60'
                }`}
              >
                <CardContent className="p-6 text-center">
                  <div
                    className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center border-2 border-black ${
                      badge.is_earned ? 'bg-white' : 'bg-muted'
                    }`}
                  >
                    {badge.is_earned ? (
                      <Icon size={48} strokeWidth={2.5} className="text-accent" />
                    ) : (
                      <Lock size={48} strokeWidth={2.5} className="text-muted-foreground" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold font-secondary mb-2">{badge.name}</h3>
                  <p className="text-sm text-foreground/80 mb-3">{badge.description}</p>
                  {badge.is_earned && badge.earned_date && (
                    <p className="text-xs text-foreground/60">
                      Earned on {new Date(badge.earned_date).toLocaleDateString()}
                    </p>
                  )}
                  {!badge.is_earned && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white rounded-full text-xs font-bold">
                      <Lock size={12} />
                      Locked
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {earnedCount === badges.length && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-8 bg-gradient-to-r from-accent to-accent/80 rounded-xl border-2 border-black shadow-brutal text-center"
        >
          <Trophy size={64} className="mx-auto mb-4" />
          <h2 className="text-3xl font-black font-secondary mb-2">Congratulations!</h2>
          <p className="text-lg">You've collected all badges! You're a true champion!</p>
        </motion.div>
      )}
    </div>
  );
};

export default Badges;