import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

interface TenderStatusData {
  name: string;
  value: number;
  color: string;
}

interface TenderStatusChartProps {
  data: TenderStatusData[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/90 backdrop-blur-md p-3 shadow-lg rounded-md border border-[rgba(80, 252, 149, 0.8)]">
        <p className="font-medium text-white mb-1">{`${payload[0].payload.name}`}</p>
        <p className="text-sm text-gray-300">{`Count: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const TenderStatusChart = ({ data }: TenderStatusChartProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleMouseEnter = (_, index: number) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  // Define status colors based on style constants
  const statusColors = {
    open: "rgba(80, 252, 149, 0.8)",      // Green 
    closed: "rgba(156, 163, 175, 0.8)",   // Gray
    awarded: "rgba(59, 130, 246, 0.8)",   // Blue
    disputed: "rgba(239, 68, 68, 0.8)"    // Red
  };

  return (
    <div className="bg-gray-900/40 backdrop-blur-md rounded-xl border border-green-800 shadow-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-green-800">
        <h3 className="text-lg font-medium text-[rgba(80, 252, 149, 0.8)]">Tender Status Overview</h3>
      </div>
      
      <div className="px-2 pt-6 pb-2">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 12 }}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
            <Bar 
              dataKey="value" 
              radius={[6, 6, 0, 0]}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                  fillOpacity={activeIndex === index ? 1 : 0.85}
                  stroke={activeIndex === index ? 'rgba(255, 255, 255, 0.5)' : 'transparent'}
                  strokeWidth={1}
                />
              ))}
              <LabelList 
                dataKey="value" 
                position="top" 
                fill="rgba(255, 255, 255, 0.8)"
                offset={10}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex flex-wrap justify-center items-center gap-4 px-6 py-4 border-t border-green-800">
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: color }}
            ></div>
            <span className="text-sm text-gray-300 capitalize">{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TenderStatusChart;