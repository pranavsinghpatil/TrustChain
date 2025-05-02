import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const StatCard = ({ title, value, icon, trend, className }: StatCardProps) => {
  return (
    <div className={cn(
      "dark-card bg-gray-900/40 backdrop-blur-md rounded-xl border-none shadow-xl overflow-hidden",
      className
    )}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <h3 className="text-2xl font-semibold text-white">{value}</h3>
          
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-xs ${trend.isPositive ? 'text-[rgba(80,252,149,0.9)]' : 'text-red-400'}`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500 ml-1">vs. last month</span>
            </div>
          )}
        </div>
        
        <div className="p-3 rounded-full bg-[rgba(80,252,149,0.1)] border border-[rgba(80,252,149,0.2)]">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
