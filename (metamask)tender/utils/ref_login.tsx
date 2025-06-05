import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { UserRole } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge, BadgeDollarSign, BadgeIndianRupee, Key, User, Wallet, Loader2, LockKeyhole, Mail, UserCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import ContractIllustration from "../utils/ContractIllustration";
import TenderPulseAnimation from "../utils/TenderPulseAnimation";

const Login = () => {
  const navigate = useNavigate();
  const { login, register, authState } = useAuth();
  const { isConnected, connectWallet, account } = useWeb3();
  const [isConnecting, setIsConnecting] = useState(false);
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
  
  // Animation states
  const [showChain, setShowChain] = useState(false);
  const [particlesActive, setParticlesActive] = useState(false);
  const [headerGlow, setHeaderGlow] = useState(false);
  
  // Floating blocks and particles
  const blocks = Array(6).fill(0);
  const particles = Array(20).fill(0);

  useEffect(() => {
    // Start animations with a slight delay
    setTimeout(() => setShowChain(true), 300);
    setTimeout(() => setParticlesActive(true), 800);
    setTimeout(() => setHeaderGlow(true), 1200);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(loginUsername, loginPassword);
    if (success) {
      navigate("/");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerRole === "bidder" && !isConnected) {
      alert("Bidders must connect a wallet to register. Please connect your wallet first.");
      return;
    }
    setIsConnecting(true);
    
    const success = await register({
      username: registerUsername,
      password: registerPassword,
      confirmPassword: registerPassword,
      role: registerRole,
      email: registerEmail,
      mobileNumber: '',
      bidderType: 'Indian',
      companyName: registerName,
      registrationNumber: '',
      gstNumber: '',
      panNumber: '',
      establishmentYear: '',
      registeredAddress: '',
      city: '',
      state: '',
      pinCode: '',
      additionalInfo: '',
      terms1: true,
      terms2: true
    });
    if (success) {
      navigate("/");
    }
  };

  // Format wallet address for display
  const formatWalletAddress = () => {
    if (!account) return "";
    return `${account.substring(0, 6)}...${account.substring(account.length - 4)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blockchain-darkBg to-black relative overflow-hidden px-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      {/* Blockchain Network Animation */}
      {/* <BlockchainNetwork /> */}
      
      {/* Floating particles */}
      {particles.map((_, index) => (
        <div 
          key={`particle-${index}`}
          className={`absolute w-1 h-1 rounded-full bg-blockchain-accent opacity-30 ${particlesActive ? 'animate-float' : 'opacity-0'}`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 10}s`,
          }}
        />
      ))}
      
      {/* Floating blocks */}
      {blocks.map((_, index) => (
        <div 
          key={`block-${index}`}
          className={`absolute bg-blockchain-panel border border-blockchain-accent/20 rounded-md w-16 h-16 rotate-45 ${showChain ? 'animate-float opacity-20' : 'opacity-0'}`}
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${8 + Math.random() * 7}s`,
            transform: `rotate(${Math.random() * 45}deg) scale(${0.5 + Math.random()})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blockchain-accent/10 to-blockchain-highlight/5"></div>
        </div>
      ))}
      
      {/* Contract Illustration in top left corner */}
      <div className="absolute top-10 left-10 w-[300px] transform -translate-x-1/3 -translate-y-1/3 opacity-70 hidden md:block">
        <ContractIllustration />
      </div>
      
      {/* Tender Pulse Animation in bottom right corner */}
      <div className="absolute bottom-10 right-10 w-[300px] transform translate-x-1/3 translate-y-1/3 opacity-70 hidden md:block">
        <TenderPulseAnimation />
      </div>
      
      {/* Animated blockchain chain visualization */}
      <div className="absolute left-0 right-0 top-[20%] flex items-center justify-center pointer-events-none">
        <div className={`flex space-x-3 transition-all duration-1000 ${showChain ? 'opacity-20 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {[1, 2, 3, 4, 5].map((block) => (
            <div 
              key={`chain-${block}`} 
              className="w-14 h-14 border border-blockchain-accent/30 bg-blockchain-darkCard rounded-md flex items-center justify-center"
              style={{ 
                animationDelay: `${block * 0.2}s`,
                boxShadow: '0 0 15px rgba(74, 222, 128, 0.1)'
              }}
            >
              <div className="text-xs text-blockchain-accent font-mono">#{block}</div>
            </div>
          ))}
        </div>
      </div>
      
      <Card className="w-full max-w-md relative z-10 border-0 shadow-2xl bg-blockchain-darkCard border-blockchain-accent/20 backdrop-blur-sm overflow-hidden">
        {/* Glow effects */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blockchain-accent to-transparent"></div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blockchain-accent/50 to-transparent"></div>
        <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-blockchain-accent/50 to-transparent"></div>
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-blockchain-accent/50 to-transparent"></div>
        
        <CardHeader className="space-y-1 text-center relative">
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blockchain-accent to-transparent transition-opacity duration-1000 ${headerGlow ? 'opacity-100' : 'opacity-0'}`}></div>
          
          <div className="flex justify-center mb-4 relative">
            <div className={`bg-gradient-to-r from-blockchain-blue to-blockchain-purple p-3 rounded-lg relative overflow-hidden ${headerGlow ? 'animate-glow-pulse' : ''}`}>
              <BadgeIndianRupee className="h-6 w-6 text-white relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-blockchain-accent/20 to-blockchain-highlight/20"></div>
            </div>
            
            {/* Animated rings */}
            <div className={`absolute inset-0 border border-blockchain-accent/30 rounded-full animate-ping opacity-0 ${headerGlow ? 'opacity-20' : ''}`} style={{ animationDuration: '3s' }}></div>
            <div className={`absolute inset-[-5px] border border-blockchain-accent/20 rounded-full animate-ping opacity-0 ${headerGlow ? 'opacity-15' : ''}`} style={{ animationDuration: '3s', animationDelay: '0.5s' }}></div>
          </div>
          
          <CardTitle className={`text-2xl font-bold text-white transition-all duration-700 ${headerGlow ? 'text-shadow-sm' : ''}`}>
            TrustChain
            <div className={`h-px w-0 bg-blockchain-accent mx-auto mt-1 transition-all duration-1000 ${headerGlow ? 'w-20' : ''}`}></div>
          </CardTitle>
          
          <CardDescription className="text-gray-400">
            Blockchain-based tender management system
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="mb-4">
            <Button
              onClick={isConnected ? () => {} : connectWallet}
              disabled={isConnecting}
              className={`w-full relative overflow-hidden ${
                isConnected 
                  ? "bg-green-900/30 text-green-400 hover:bg-green-900/30 cursor-default border border-green-500/30" 
                  : "bg-blockchain-blue hover:bg-blockchain-blue/80"
              }`}
              onMouseEnter={() => setIsConnecting(true)}
              onMouseLeave={() => setIsConnecting(false)}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting Wallet...
                </>
              ) : isConnected ? (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connected: {formatWalletAddress()}
                  <div className="absolute bottom-0 left-0 h-0.5 w-full bg-green-500/50"></div>
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                  <div className="absolute inset-0 bg-gradient-to-r from-blockchain-blue via-blockchain-purple to-blockchain-blue -z-10 bg-[length:200%_100%] animate-pulse-slow"></div>
                </>
              )}
            </Button>
          </div>
          
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2 bg-blockchain-panel border-b border-blockchain-accent/20">
              <TabsTrigger 
                value="login"
                className="data-[state=active]:bg-blockchain-darkBg data-[state=active]:text-blockchain-accent data-[state=active]:border-t data-[state=active]:border-x border-blockchain-accent/30 rounded-b-none"
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="register"
                className="data-[state=active]:bg-blockchain-darkBg data-[state=active]:text-blockchain-accent data-[state=active]:border-t data-[state=active]:border-x border-blockchain-accent/30 rounded-b-none"
              >
                Register
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4 relative">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-300">Username</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-hover:text-blockchain-accent transition-colors" />
                    <Input
                      id="username"
                      placeholder="Enter your username"
                      className="pl-10 bg-blockchain-panel border-blockchain-accent/20 focus:border-blockchain-accent/50 transition-all"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      required
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-px scale-x-0 bg-blockchain-accent group-hover:scale-x-100 transition-transform origin-left"></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300">Password</Label>
                  <div className="relative group">
                    <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-hover:text-blockchain-accent transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      className="pl-10 bg-blockchain-panel border-blockchain-accent/20 focus:border-blockchain-accent/50 transition-all"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-px scale-x-0 bg-blockchain-accent group-hover:scale-x-100 transition-transform origin-left"></div>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full relative overflow-hidden group bg-gradient-to-r from-blockchain-blue to-blockchain-purple hover:from-blockchain-blue/90 hover:to-blockchain-purple/90" 
                  disabled={authState.isLoading}
                >
                  {authState.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      Login
                      <div className="absolute inset-0 w-0 bg-white/10 group-hover:w-full transition-all duration-300"></div>
                    </>
                  )}
                </Button>
              </form>
              
              <div className="mt-6 space-y-2">
                <div className="text-sm text-center text-gray-400">Default accounts for testing:</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="border border-blockchain-accent/20 p-2 rounded-md bg-blockchain-panel/50 hover:bg-blockchain-panel transition-colors">
                    <div className="font-semibold mb-1 flex items-center gap-1 text-blockchain-accent">
                      <Badge className="h-3 w-3" />
                      Admin
                    </div>
                    <div className="text-gray-300">admin</div>
                    <div className="text-gray-400">admin00</div>
                  </div>
                  <div className="border border-blockchain-accent/20 p-2 rounded-md bg-blockchain-panel/50 hover:bg-blockchain-panel transition-colors">
                    <div className="font-semibold mb-1 flex items-center gap-1 text-blockchain-accent">
                      <BadgeDollarSign className="h-3 w-3" />
                      Officer
                    </div>
                    <div className="text-gray-300">teno</div>
                    <div className="text-gray-400">tender00</div>
                  </div>
                  <div className="border border-blockchain-accent/20 p-2 rounded-md bg-blockchain-panel/50 hover:bg-blockchain-panel transition-colors">
                    <div className="font-semibold mb-1 flex items-center gap-1 text-blockchain-accent">
                      <User className="h-3 w-3" />
                      Bidder
                    </div>
                    <div className="text-gray-300">sam</div>
                    <div className="text-gray-400">sam00</div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4 mt-4">
                {registerRole === "bidder" && !isConnected && (
                  <Alert className="bg-amber-900/20 border-amber-500/30 text-amber-400 mb-4">
                    <AlertDescription className="text-sm">
                      Bidders must connect a wallet to register. Please connect your wallet at the top of this page.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="register-name" className="text-gray-300">Full Name</Label>
                  <div className="relative group">
                    <UserCircle className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-hover:text-blockchain-accent transition-colors" />
                    <Input
                      id="register-name"
                      placeholder="Enter your full name"
                      className="pl-10 bg-blockchain-panel border-blockchain-accent/20 focus:border-blockchain-accent/50 transition-all"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-username" className="text-gray-300">Username</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-hover:text-blockchain-accent transition-colors" />
                    <Input
                      id="register-username"
                      placeholder="Choose a username"
                      className="pl-10 bg-blockchain-panel border-blockchain-accent/20 focus:border-blockchain-accent/50 transition-all"
                      value={registerUsername}
                      onChange={(e) => setRegisterUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-gray-300">Email (optional)</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-hover:text-blockchain-accent transition-colors" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10 bg-blockchain-panel border-blockchain-accent/20 focus:border-blockchain-accent/50 transition-all"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-gray-300">Password</Label>
                  <div className="relative group">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-hover:text-blockchain-accent transition-colors" />
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Choose a password"
                      className="pl-10 bg-blockchain-panel border-blockchain-accent/20 focus:border-blockchain-accent/50 transition-all"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-gray-300">Account Type</Label>
                  <div className="grid grid-cols-1 gap-2">
                    <Button 
                      type="button" 
                      variant={registerRole === "bidder" ? "default" : "outline"}
                      className={`justify-start ${registerRole === "bidder" ? "bg-blockchain-blue text-white" : "bg-blockchain-panel/50 text-gray-300 hover:bg-blockchain-panel"}`}
                      onClick={() => setRegisterRole("bidder")}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Bidder
                      {registerRole === "bidder" && (
                        <div className="ml-auto bg-white/20 text-xs px-1.5 py-0.5 rounded">Selected</div>
                      )}
                    </Button>
                  </div>
                </div>
                
                {isConnected && (
                  <div className="rounded-md bg-blockchain-panel p-3 border border-blockchain-accent/30 relative overflow-hidden group">
                    <div className="text-sm font-medium mb-1 text-blockchain-accent">Connected Wallet</div>
                    <div className="text-xs text-gray-400 break-all">{account}</div>
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blockchain-blue to-blockchain-purple scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className={`w-full relative overflow-hidden group ${registerRole === "bidder" && !isConnected 
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-700 cursor-not-allowed" 
                    : "bg-gradient-to-r from-blockchain-blue to-blockchain-purple hover:from-blockchain-blue/90 hover:to-blockchain-purple/90"}`}
                  disabled={authState.isLoading || (registerRole === "bidder" && !isConnected)}
                >
                  {authState.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <div className="absolute inset-0 w-0 bg-white/10 group-hover:w-full transition-all duration-300"></div>
                    </>
                  )}
                </Button>
                
                <div className="text-xs text-center text-gray-500 mt-2">
                  Only bidder accounts can be created through registration.
                  <br />
                  Officer and admin accounts are created by administrators.
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex flex-col items-center justify-center space-y-3">
          <div className="text-sm text-gray-500">
            All transactions in Indian Rupees (₹)
          </div>
          
          {/* Blockchain animation */}
          <div className="relative w-full h-6 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-px w-full bg-blockchain-accent/20"></div>
            </div>
            <div className="absolute inset-0 flex items-center">
              <div 
                className="h-2 w-2 rounded-full bg-blockchain-accent animate-pulse-slow" 
                style={{
                  animation: "moveLeftToRight 8s linear infinite"
                }}
              ></div>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;