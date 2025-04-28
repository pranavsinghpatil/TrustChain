
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
      "bg-white rounded-lg p-6 shadow-sm border border-gray-100",
      className
    )}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-semibold">{value}</h3>
          
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-xs ${trend.isPositive ? 'text-blockchain-green' : 'text-blockchain-red'}`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500 ml-1">vs. last month</span>
            </div>
          )}
        </div>
        
        <div className="p-3 rounded-full bg-blockchain-lightPurple">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
