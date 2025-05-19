import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Badge, BadgeDollarSign, BadgeIndianRupee, User, Lock, Wallet } from "lucide-react";
import ContractIllustration from "@/components/ui/ContractIllustration";
import TenderPulseAnimation from "@/components/ui/TenderPulseAnimation";
import BlockchainNetwork from "@/components/ui/BlockchainNetwork";
import { useToast } from "@/components/ui/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { login, register, authState } = useAuth();
  const { connectWallet, account, isConnected } = useWeb3();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    // Handle login
    const success = await login(username, password);
    if (success) {
      navigate("/");
    } else {
      // Show error message
      toast({
        title: "Login Failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto pb-20 relative">
      <style>
        {`
          html, body {
            overflow-x: hidden;
            overflow-y: auto;
            width: 100%;
            position: relative;
            margin: 0;
            padding: 0;
            background-color: #000;
            scrollbar-width: thin;
            scrollbar-color: rgba(80, 252, 149, 0.3) #111;
          }
          
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: #111;
          }
          
          ::-webkit-scrollbar-thumb {
            background: rgba(80, 252, 149, 0.3);
            border-radius: 5px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(80, 252, 149, 0.5);
          }

          /* Animation classes */
          @keyframes float {
            0%, 100% { transform: translate3d(0, 0, 0); }
            50% { transform: translate3d(0, -10px, 0); }
          }
          
          .animate-float {
            animation: float 5s ease-in-out infinite;
            backface-visibility: hidden;
            transform-style: preserve-3d;
            perspective: 1000;
            will-change: transform;
          }
          
          /* Fix for shaking */
          .hover-stable {
            transform: translateZ(0);
            backface-visibility: hidden;
            perspective: 1000;
            will-change: transform;
          }
          
          .hover-stable:hover {
            transform: translateZ(0) scale(1.02);
            transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          /* Prevent layout shifts */
          .content-container {
            min-height: 100vh;
            width: 100%;
            position: relative;
          }
          
          /* Prevent illustration shifts */
          .illustration-container {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            contain: layout size paint;
          }
          
          .background-animate {
            background-size: 400%;
            -webkit-animation: AnimationName 3s ease infinite;
            -moz-animation: AnimationName 3s ease infinite;
            animation: AnimationName 3s ease infinite;
          }
          @keyframes AnimationName {
            0%,100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}
      </style>
      
      {/* Background elements - these stay fixed */}
      <div className="fixed-container">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        {/* <BlockchainNetwork /> */}
        
        {/* Floating particles */}
        {Array(20).fill(0).map((_, index) => (
          <div 
            key={`particle-${index}`}
            className="absolute w-1 h-1 rounded-full bg-green-400 opacity-30 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
            }}
          />
        ))}
        
        {/* Floating blocks */}
        {Array(6).fill(0).map((_, index) => (
          <div 
            key={`block-${index}`}
            className="absolute bg-black/40 border border-green-400/20 rounded-md w-16 h-16 rotate-45 opacity-20 animate-float"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${8 + Math.random() * 7}s`,
              transform: `rotate(${Math.random() * 45}deg) scale(${0.5 + Math.random()})`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-blue-500/5"></div>
          </div>
        ))}
      </div>

      {/* Content container - this scrolls */}
      <div className="content-container flex flex-col items-center w-full max-w-7xl mx-auto">
        <div className="illustration-container">
          {/* Contract Illustration */}
          <div className={`absolute top-[5.25rem] left-5 w-[300px] opacity-70 hidden md:block ${activeTab === 'login' ? '' : 'opacity-0 invisible'}`}>
            <ContractIllustration />
          </div>
          
          {/* Tender Pulse Animation - fixed position regardless of tab */}
          <div className={`absolute top-[25rem] right-20 w-[300px] opacity-70 hidden md:block ${activeTab === 'login' ? '' : 'opacity-0 invisible'}`}>
            <TenderPulseAnimation />
          </div>
        </div>

        {/* Login/Register Card */}
        <Card className={`w-full relative z-10 transition-all duration-300 ease-in-out shadow-lg border-0 ${activeTab === 'register' ? 'max-w-[1000px]' : 'max-w-md'} bg-[#1B1B1B]/40 backdrop-blur-xl border border-white/10 hover-stable`}>
          <CardHeader className=" space-y-1 text-center relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-400/50 to-transparent opacity-95"></div>
            
            <div className="flex justify-center mb-4 relative">
              <div className="bg-gradient-to-r from-blue-500 to-green-400 p-3 rounded-lg relative overflow-hidden">
                <BadgeIndianRupee className="h-6 w-6 text-white relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-blue-500/20"></div>
              </div>
              
              {/* Animated rings */}
              {/* <div className="absolute inset-0 border-2 border-green-400/30 rounded-full animate-ping opacity-20"></div>
              <div className="absolute inset-[-5px] border border-green-400/20 rounded-full animate-ping opacity-15" style={{ animationDelay: '0.5s' }}></div> */}
            </div>
            
            <div className="text-2xl font-bold text-white">
              TrustChain
              <div className="h-px w-20 bg-green-400 mx-auto mt-1"></div>
            </div>
            
            <CardDescription className="text-gray-400">
              Blockchain-based tender management system
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
              <TabsList className="grid w-full grid-cols-2 bg-[#1B1B1B]/80 border-b border-green-400/20">
                <TabsTrigger 
                  value="login"
                  className="data-[state=active]:bg-[#1B1B1B] data-[state=active]:text-green-400 data-[state=active]:border-t data-[state=active]:border-x border-green-400/30 rounded-b-none"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="register"
                  className="data-[state=active]:bg-[#1B1B1B] data-[state=active]:text-green-400 data-[state=active]:border-t data-[state=active]:border-x border-green-400/30 rounded-b-none"
                >
                  Register
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="username" className="text-gray-400">Username</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <Input
                          id="username"
                          name="username"
                          placeholder="Enter your username"
                          className="pl-10 bg-transparent backdrop-blur-sm border-gray-700/50 focus:border-green-400 focus:ring-green-400/20"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="password" className="text-gray-400">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="pl-10 pr-10 bg-transparent backdrop-blur-sm border-gray-700/50 focus:border-green-400 focus:ring-green-400/20"
                          required
                        />
                        {showPassword ? (
                          <EyeOff className="absolute right-3 top-3 h-4 w-4 text-gray-500 cursor-pointer" onClick={() => setShowPassword(false)} />
                        ) : (
                          <Eye className="absolute right-3 top-3 h-4 w-4 text-gray-500 cursor-pointer" onClick={() => setShowPassword(true)} />
                        )}
                      </div>
                    </div>
                    
                    {/* Connect Wallet Button */}
                    {!isConnected ? (
                      <Button
                        onClick={connectWallet}
                        variant="outline"
                        size="sm"
                        className="w-full flex items-center justify-center gap-2 border-none text-green-400 bg-transparent hover:bg-gray-700"
                      >
                        <Wallet className="h-4 w-4" />
                        Connect Wallet
                      </Button>
                    ) : (
                      <span className="w-full text-center text-xs font-mono border border-[rgba(80,252,149,0.4)] text-[rgba(80,252,149,0.8)] rounded-full px-3 py-1">
                        {account?.slice(0, 6)}...{account?.slice(-4)}
                      </span>
                    )}
                    
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white hover:from-green-500 hover:to-blue-600"
                      disabled={authState.isLoading}
                    >
                      {authState.isLoading ? "Signing in..." : "Sign in"}
                    </Button>
                    
                    <div className="mt-4 text-center">
                      <span className="text-sm text-gray-400">New bidder? </span>
                      <button 
                        type="button" 
                        onClick={() => setActiveTab("register")} 
                        className="text-sm text-primary hover:underline focus:outline-none"
                      >
                        Register here
                      </button>
                    </div>
                    
                    {/* Default accounts for testing */}
                    <div className="mt-12 pt-6 space-y-2">
                      <div className="text-sm text-center text-gray-400">Default accounts for testing:</div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="border border-gray-700 bg-[#1B1B1B]/80 p-2 rounded-md">
                          <div className="font-semibold mb-1 flex items-center gap-1">
                            <Badge className="h-3 w-3 text-green-400" /> Admin
                          </div>
                          <div>Username: admin</div>
                          <div>Password: admin00</div>
                        </div>
                        <div className="border border-gray-700 bg-[#1B1B1B]/80 p-2 rounded-md">
                          <div className="font-semibold mb-1 flex items-center gap-1">
                            <BadgeDollarSign className="h-3 w-3 text-green-400" /> Officer
                          </div>
                          <div>Username: teno</div>
                          <div>Password: tender00</div>
                        </div>
                        <div className="border border-gray-700 bg-[#1B1B1B]/80 p-2 rounded-md">
                          <div className="font-semibold mb-1 flex items-center gap-1">
                            <User className="h-3 w-3 text-green-400" /> Bidder
                          </div>
                          <div>Username: sam</div>
                          <div>Password: sam00</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* <div className="text-center text-xs text-gray-500 mt-4">
                      All transactions in Indian Rupees (₹)
                    </div> */}
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-white mb-2">Create an Account</h3>
                    <p className="text-sm text-gray-400">Join our platform to start bidding on tenders</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="text-gray-400">Full Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Enter your full name"
                          className="bg-transparent backdrop-blur-sm border-gray-700/50 focus:border-green-400 focus:ring-green-400/20"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-gray-400">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="Enter your email"
                          className="bg-transparent backdrop-blur-sm border-gray-700/50 focus:border-green-400 focus:ring-green-400/20"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="username" className="text-gray-400">Username *</Label>
                        <Input
                          id="username"
                          name="username"
                          placeholder="Choose a username"
                          className="bg-transparent backdrop-blur-sm border-gray-700/50 focus:border-green-400 focus:ring-green-400/20"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="companyName" className="text-gray-400">Company Name *</Label>
                        <Input
                          id="companyName"
                          name="companyName"
                          placeholder="Your company name"
                          className="bg-transparent backdrop-blur-sm border-gray-700/50 focus:border-green-400 focus:ring-green-400/20"
                          required
                        />
                      </div>
                    </div>


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="password" className="text-gray-400">Password *</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a password"
                            className="pl-10 bg-transparent backdrop-blur-sm border-gray-700/50 focus:border-green-400 focus:ring-green-400/20"
                            required
                            minLength={8}
                          />
                          {showPassword ? (
                            <EyeOff 
                              className="absolute right-3 top-3 h-4 w-4 text-gray-500 cursor-pointer" 
                              onClick={() => setShowPassword(false)} 
                            />
                          ) : (
                            <Eye 
                              className="absolute right-3 top-3 h-4 w-4 text-gray-500 cursor-pointer" 
                              onClick={() => setShowPassword(true)} 
                            />
                          )}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword" className="text-gray-400">Confirm Password *</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            className="pl-10 bg-transparent backdrop-blur-sm border-gray-700/50 focus:border-green-400 focus:ring-green-400/20"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Wallet Connection */}
                    <div className="pt-2">
                      {!isConnected ? (
                        <Button
                          type="button"
                          onClick={connectWallet}
                          variant="outline"
                          className="w-full flex items-center justify-center gap-2 border border-green-400/30 text-green-400 bg-transparent hover:bg-gray-700"
                        >
                          <Wallet className="h-4 w-4" />
                          Connect Wallet
                        </Button>
                      ) : (
                        <div className="w-full text-center text-sm font-mono border border-green-400/30 text-green-400 bg-black/20 rounded-md px-3 py-2">
                          Connected: {account?.slice(0, 6)}...{account?.slice(-4)}
                        </div>
                      )}
                    </div>

                    {/* Terms and Conditions */}
                    <div className="flex items-start space-x-2 pt-2">
                      <input
                        type="checkbox"
                        id="terms"
                        className="mt-1 h-4 w-4 rounded border-gray-700/50 bg-transparent text-green-400 focus:ring-green-400/20"
                        required
                      />
                      <label htmlFor="terms" className="text-xs text-gray-400">
                        I agree to the <a href="#" className="text-green-400 hover:underline">Terms of Service</a> and <a href="#" className="text-green-400 hover:underline">Privacy Policy</a>
                      </label>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="button"
                      onClick={async () => {
                        try {
                          // First connect wallet
                          if (!isConnected) {
                            await connectWallet();
                            return;
                          }
                          
                          if (!account) {
                            throw new Error("Wallet connection failed");
                          }

                          // Get form values
                          const form = document.querySelector('form');
                          if (!form) return;
                          
                          const formData = new FormData(form);
                          const password = formData.get('password') as string;
                          const confirmPassword = formData.get('confirmPassword') as string;
                          
                          // Basic validation
                          if (password !== confirmPassword) {
                            toast({
                              title: "Error",
                              description: "Passwords do not match",
                              variant: "destructive",
                            });
                            return;
                          }

                          // Register user
                          const success = await register({
                            name: formData.get('name') as string,
                            email: formData.get('email') as string,
                            username: formData.get('username') as string,
                            password: password,
                            companyName: formData.get('companyName') as string,
                            walletAddress: account,
                            role: 'bidder',
                          });

                          if (success) {
                            toast({
                              title: "Success",
                              description: "Registration successful! You can now log in.",
                            });
                            setActiveTab("login");
                          }
                        } catch (error) {
                          console.error("Registration error:", error);
                          toast({
                            title: "Error",
                            description: error instanceof Error ? error.message : "Registration failed",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white hover:from-green-500 hover:to-blue-600 mt-4"
                      disabled={!isConnected}
                    >
                      Create Account
                    </Button>

                    <div className="text-center text-sm text-gray-400 pt-2">
                      Already have an account?{' '}
                      <button 
                        type="button" 
                        onClick={() => setActiveTab("login")} 
                        className="text-green-400 hover:underline"
                      >
                        Sign in
                      </button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
