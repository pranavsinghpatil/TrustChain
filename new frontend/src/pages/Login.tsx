
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge, BadgeDollarSign, BadgeIndianRupee, Key, User } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { login, register, authState } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form state
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerRole, setRegisterRole] = useState<UserRole>("bidder");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(loginUsername, loginPassword);
    if (success) {
      navigate("/");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await register(
      registerUsername,
      registerPassword,
      registerRole,
      registerName,
      registerEmail
    );
    if (success) {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 px-4">
      <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=1500&q=80')" }}></div>
      <Card className="w-full max-w-md relative z-10 border-0 shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-blockchain-blue to-blockchain-purple p-3 rounded-lg">
              <BadgeIndianRupee className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">TrustChain</CardTitle>
          <CardDescription>
            Blockchain-based tender management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="username"
                      placeholder="Enter your username"
                      className="pl-10"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      className="pl-10"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full bg-blockchain-blue hover:bg-blockchain-purple" disabled={authState.isLoading}>
                  {authState.isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
              
              <div className="mt-6 space-y-2">
                <div className="text-sm text-center text-gray-500">Default accounts for testing:</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="border p-2 rounded-md">
                    <div className="font-semibold mb-1 flex items-center gap-1">
                      <Badge className="h-3 w-3" />
                      Admin
                    </div>
                    <div>admin</div>
                    <div>admin00</div>
                  </div>
                  <div className="border p-2 rounded-md">
                    <div className="font-semibold mb-1 flex items-center gap-1">
                      <BadgeDollarSign className="h-3 w-3" />
                      Officer
                    </div>
                    <div>teno</div>
                    <div>tender00</div>
                  </div>
                  <div className="border p-2 rounded-md">
                    <div className="font-semibold mb-1 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Bidder
                    </div>
                    <div>sam</div>
                    <div>sam00</div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Full Name</Label>
                  <Input
                    id="register-name"
                    placeholder="Enter your full name"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-username">Username</Label>
                  <Input
                    id="register-username"
                    placeholder="Choose a username"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email (optional)</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="Enter your email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Choose a password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <div className="grid grid-cols-1 gap-2">
                    <Button 
                      type="button" 
                      variant={registerRole === "bidder" ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => setRegisterRole("bidder")}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Bidder
                    </Button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-blockchain-blue hover:bg-blockchain-purple" 
                  disabled={authState.isLoading}
                >
                  {authState.isLoading ? "Creating Account..." : "Create Account"}
                </Button>
                
                <div className="text-xs text-center text-muted-foreground mt-2">
                  Only bidder accounts can be created through registration.
                  <br />
                  Officer and admin accounts are created by administrators.
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            All transactions in Indian Rupees (₹)
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
