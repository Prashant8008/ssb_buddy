import React from 'react';
import { Card } from '../components/ui/Card';
import { 
  Activity, 
  Flame, 
  TrendingUp, 
  Map as MapIcon,
  Users,
  ChevronRight
} from 'lucide-react';

const Fitness = () => {
  return (
    <div className="max-w-7xl mx-auto pt-20 pb-10 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-navy-900">Defence Fitness</h1>
        <p className="text-navy-500">Track your physical standards for the services.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Activity className="text-blue-500" />} label="2.4km Run" value="09:45" unit="min" trend="+12s" />
        <StatCard icon={<Flame className="text-orange-500" />} label="Pushups" value="45" unit="reps" trend="+5" />
        <StatCard icon={<TrendingUp className="text-green-500" />} label="Pullups" value="12" unit="reps" trend="0" />
        <StatCard icon={<Activity className="text-purple-500" />} label="BMI" value="22.4" unit="index" trend="Normal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-navy-900">Your Activity</h3>
              <select className="bg-navy-50 border-none rounded text-xs font-bold p-1">
                <option>This Week</option>
                <option>This Month</option>
              </select>
            </div>
            <div className="h-64 flex items-end justify-between gap-2">
              {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-army-500 rounded-t-sm transition-all hover:bg-army-600 cursor-pointer" 
                    style={{ height: `${h}%` }} 
                  />
                  <span className="text-[10px] font-bold text-navy-400">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 flex items-center gap-4 cursor-pointer hover:bg-navy-50 transition-colors">
              <div className="w-12 h-12 bg-navy-100 rounded-full flex items-center justify-center text-navy-900">
                <MapIcon />
              </div>
              <div>
                <h4 className="font-bold text-sm">Nearby Running Groups</h4>
                <p className="text-xs text-navy-500">3 groups active within 5km</p>
              </div>
              <ChevronRight className="ml-auto text-navy-300" />
            </Card>
            <Card className="p-4 flex items-center gap-4 cursor-pointer hover:bg-navy-50 transition-colors">
              <div className="w-12 h-12 bg-army-100 rounded-full flex items-center justify-center text-army-900">
                <Users />
              </div>
              <div>
                <h4 className="font-bold text-sm">Physical Challenges</h4>
                <p className="text-xs text-navy-500">Join the 100 Pushup Challenge</p>
              </div>
              <ChevronRight className="ml-auto text-navy-300" />
            </Card>
          </div>
        </div>

        <div>
          <Card className="p-6">
            <h3 className="font-bold text-navy-900 mb-6">City Leaderboard</h3>
            <div className="space-y-6">
              {[1, 2, 3, 4, 5].map((rank) => (
                <div key={rank} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 text-sm font-bold ${rank <= 3 ? 'text-gold-500' : 'text-navy-300'}`}>
                      #{rank}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-navy-100" />
                    <div>
                      <p className="text-sm font-bold text-navy-900">Aspirant_{rank}</p>
                      <p className="text-[10px] text-navy-500">NDA 2025</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-navy-900">
                    {1200 - rank * 50} pts
                  </span>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 text-navy-900 text-sm font-bold hover:underline">
              View National Rankings
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, unit, trend }: any) => (
  <Card className="p-4">
    <div className="flex items-center justify-between mb-2">
      <div className="p-2 bg-navy-50 rounded-lg">{icon}</div>
      <span className={`text-[10px] font-bold ${trend.startsWith('+') ? 'text-green-600' : 'text-navy-400'}`}>
        {trend}
      </span>
    </div>
    <p className="text-xs text-navy-500 font-medium">{label}</p>
    <div className="flex items-baseline gap-1 mt-1">
      <span className="text-xl font-bold text-navy-900">{value}</span>
      <span className="text-[10px] font-bold text-navy-400 uppercase">{unit}</span>
    </div>
  </Card>
);

export default Fitness;
