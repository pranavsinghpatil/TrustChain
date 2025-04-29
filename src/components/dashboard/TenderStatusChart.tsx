import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface TenderStatusChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 shadow-md border border-gray-100 rounded-md">
        <p className="font-medium">{`${label}`}</p>
        <p className="text-sm">{`Count: ${payload[0].value}`}</p>
      </div>
    );
  }

  return null;
};

const TenderStatusChart = ({ data }: TenderStatusChartProps) => {
  return (
    <div className="glass-card p-6 rounded-lg shadow-sm border border-gray-100 h-[300px]">
      <h3 className="text-lg font-medium mb-4">Tender Status Overview</h3>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <XAxis dataKey="name" axisLine={false} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TenderStatusChart;
