import React, { useState } from "react";
import NavBar from "@/components/layout/NavBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { FileText } from "lucide-react";

// Mock data for charts
const tenderStatusData = [
  { name: 'Active', value: 12, color: '#8B5CF6' },
  { name: 'Closed', value: 8, color: '#6B7280' },
  { name: 'Draft', value: 5, color: '#10B981' },
  { name: 'Under Review', value: 3, color: '#F59E0B' },
];

const bidAmountsData = [
  { title: 'Road Construction', avgBid: 4500000, highestBid: 6200000, lowestBid: 3800000 },
  { title: 'Hospital Equipment', avgBid: 3500000, highestBid: 4800000, lowestBid: 2900000 },
  { title: 'IT Infrastructure', avgBid: 2800000, highestBid: 3500000, lowestBid: 1900000 },
  { title: 'School Supplies', avgBid: 1200000, highestBid: 1800000, lowestBid: 900000 },
  { title: 'Police Vehicles', avgBid: 5200000, highestBid: 7100000, lowestBid: 4500000 },
];

const Reports = () => {
  const [activeTab, setActiveTab] = useState("overview");

  // Format currency in Indian Rupees
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Custom tooltip for bid amounts chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded shadow-md">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-blockchain-blue">
            Highest Bid: {formatCurrency(payload[0].value)}
          </p>
          <p className="text-sm text-blockchain-yellow">
            Average Bid: {formatCurrency(payload[1].value)}
          </p>
          <p className="text-sm text-blockchain-green">
            Lowest Bid: {formatCurrency(payload[2].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/0">
      {/* <NavBar /> */}
      
      <main className="flex-1 pt-20 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="mt-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Reports Dashboard
          </h1>
          <p className="text-gray-500 mt-2">
            Analytics and insights for the SmartTender platform
          </p>
        </div>

        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="mt-8"
        >
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tenders">Tenders</TabsTrigger>
            <TabsTrigger value="bids">Bids</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass-component">
                <CardHeader>
                  <CardTitle>Tender Status Distribution</CardTitle>
                  <CardDescription>Current status of all tenders</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center pt-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={tenderStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {tenderStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card className="glass-component">
                <CardHeader>
                  <CardTitle>Bid Amounts by Tender</CardTitle>
                  <CardDescription>Average and range of bid amounts (₹)</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={bidAmountsData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="title" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={70} />
                      <YAxis 
                        tickFormatter={(value) => `₹${(value/1000000).toFixed(1)}M`} 
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="highestBid" name="Highest Bid" fill="#8B5CF6" />
                      <Bar dataKey="avgBid" name="Average Bid" fill="#F59E0B" />
                      <Bar dataKey="lowestBid" name="Lowest Bid" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card className="glass-component md:col-span-2">
                <CardHeader>
                  <CardTitle>Monthly Tender Activity</CardTitle>
                  <CardDescription>Tenders published and awarded by month</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center py-12 text-gray-500">
                    Interactive chart showing monthly tender activity will be displayed here.
                    <br />
                    This is a placeholder for future implementation.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="tenders">
            <Card className="glass-component">
              <CardHeader>
                <CardTitle>Tender Analytics</CardTitle>
                <CardDescription>Detailed breakdown of tender data</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-12 text-gray-500">
                  Detailed tender analytics will be displayed here.
                  <br />
                  This is a placeholder for future implementation.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="bids">
            <Card className="glass-component">
              <CardHeader>
                <CardTitle>Bid Analytics</CardTitle>
                <CardDescription>Detailed breakdown of bid data</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-12 text-gray-500">
                  Detailed bid analytics will be displayed here.
                  <br />
                  This is a placeholder for future implementation.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Reports;
