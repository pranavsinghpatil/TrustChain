import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import NavBar from "@/components/layout/NavBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserRole } from "@/types/auth";
import { Badge, BadgeDollarSign, Shield, User } from "lucide-react";

// Mock data for officers
const mockOfficers = [
  { id: "o1", name: "Rajesh Kumar", role: "officer" as UserRole, username: "rajesh_k", active: true },
  { id: "o2", name: "Priya Shah", role: "officer" as UserRole, username: "priya_s", active: true },
  { id: "o3", name: "Vikram Singh", role: "officer" as UserRole, username: "vikram_s", active: false },
];

const ManageOfficers = () => {
  const { authState } = useAuth();
  
  // Function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/0">
      <NavBar />
      
      <main className="flex-1 pt-20 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="mt-8">
          <h1 className="text-3xl font-bold">Manage Tender Officers</h1>
          <p className="text-gray-500 mt-2">Add, remove, or update tender officer accounts</p>
        </div>

        <div className="mt-8 flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-2/3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <BadgeDollarSign className="h-5 w-5" />
                  <span>Current Officers</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockOfficers.map(officer => (
                    <div key={officer.id} className="flex items-center justify-between p-3 border rounded-md bg-white">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-blockchain-blue text-white">
                            {getInitials(officer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{officer.name}</div>
                          <div className="text-sm text-gray-500">@{officer.username}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          officer.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {officer.active ? 'Active' : 'Inactive'}
                        </span>
                        
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="w-full md:w-1/3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <span>Add New Officer</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Create a new tender officer account with relevant permissions.
                  </p>
                  <Button className="w-full">
                    <User className="mr-2 h-4 w-4" />
                    Add New Officer
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <span>Your Admin Role</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-blockchain-lightPurple rounded-md">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge className="h-5 w-5 text-blockchain-purple" />
                    <div className="font-semibold text-blockchain-purple">Administrator</div>
                  </div>
                  <p className="text-sm text-gray-600">
                    As an administrator, you can manage tender officers, view reports, and oversee the entire tender management process.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManageOfficers;
