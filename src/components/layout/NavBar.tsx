import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Bell, LogOut, Menu, User, Users, Wallet, Shield, Gavel, Briefcase, Check, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWeb3 } from "@/contexts/Web3Context";
import ShinyText from '@/components/ui/ShinyText';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const NavBar = () => {
  const { toast } = useToast();
  const { authState, logout, notifications, markNotificationRead } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { connectWallet, account, isConnected } = useWeb3();
  const [isScrolled, setIsScrolled] = useState(false);

  // Notification filtering
  const userNotifs = notifications?.filter(n => n.recipientId === authState.user?.id) || [];
  const unreadCount = userNotifs.filter(n => !n.isRead).length;

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Get role-specific menu items
  const getMenuItems = () => {
    const commonItems = [
      {
        title: "Dashboard",
        path: "/",
        allowedRoles: ["admin", "officer", "bidder"],
      },
      {
        title: "Tenders",
        path: "/tenders",
        allowedRoles: ["admin", "officer", "bidder"],
      }
    ];

    const roleSpecificItems = [
      {
        title: "Create Tender",
        path: "/create-tender",
        allowedRoles: ["officer"],
      },
      {
        title: "My Bids",
        path: "/my-bids",
        allowedRoles: ["bidder"],
      },
      {
        title: "Manage Officers",
        path: "/manage-officers",
        allowedRoles: ["admin"],
      },
      {
        title: "Approvals",
        path: "/approvals",
        allowedRoles: ["officer"],
      },
      {
        title: "Reports",
        path: "/reports",
        allowedRoles: ["admin"],
      }
    ];

    const allItems = [...commonItems, ...roleSpecificItems];

    // Filter by user role
    if (!authState.user) return commonItems;

    return allItems.filter(item =>
      item.allowedRoles.includes(authState.user.role)
    );
  };

  // If not logged in, show minimal navbar with login link
  if (!authState.user) {
    return (
      <header
        className={`fixed top-3.5 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 rounded-full bg-[#1B1B1B]/40 backdrop-blur-xl border border-white/10 ${isScrolled
          ? "h-14 scale-95 w-[90%] max-w-2xl"
          : "h-14 w-[95%] max-w-3xl"
          }`}
      >
        <div className="mx-auto h-full px-6">
          <nav className="flex items-center justify-between h-full">
            {/* <div className="flex items-center gap-2 text-[linear-gradient(90deg, #4ADE80, #3B82F6)]">
              <Wallet className="w-5 h-5 text-[rgba(80, 252, 149, 0.8)]" />
              <span className="font-bold text-base ">TrustChain</span>
            </div> */}
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-400" />
              <span className="font-bold text-base bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text">TrustChain</span>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-sm font-medium text-white/90 hover:text-white transition-colors">
                <ShinyText 
                  text="Please Login/Register first" 
                  disabled={false} 
                  speed={2} 
                  className='cursor-pointer'
                />
              </Link>
            </div>

            <Link to="/about" className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-none text-green-400 bg-transparent hover:bg-gray-700">
                <User className="h-4 w-4" />
                <span>About Us</span>
              </Button>
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  // Full navbar for logged-in users
  return (
    <header
      className={`fixed top-3.5 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 rounded-full bg-[#1B1B1B]/40 backdrop-blur-xl border border-[rgba(80,252,149,0.15)] ${isScrolled
        ? "h-14 scale-95 w-[90%] max-w-4xl"
        : "h-14 w-[95%] max-w-5xl"
        }`}
    >
      <div className="mx-auto h-full px-6">
        <nav className="flex items-center justify-between h-full">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-400" />
            <span className="font-bold text-base bg-gradient-to-r from-green-400 to-purple-500 text-transparent bg-clip-text">TrustChain</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {getMenuItems().map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm transition-all duration-300 ${location.pathname === item.path
                  ? "text-[rgba(80, 252, 149, 0.8)]"
                  : "text-gray-400 hover:text-white"
                  }`}
              >
                {item.title}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {/* Wallet connect */}
            {!isConnected ? (
              <Button
                onClick={connectWallet}
                variant="default"
                className="hidden md:flex bg-indigo-500 hover:opacity-90 h-8 px-3 py-1 text-white font-medium text-sm rounded-full"
              >
                Connect Wallet
              </Button>
            ) : (
              <span className="hidden md:flex text-xs font-mono border border-[rgba(80,252,149,0.4)] text-[rgba(80,252,149,0.8)] rounded-full px-3 py-1">
                {account?.slice(0, 6)}...{account?.slice(-4)}
              </span>
            )}

            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative h-8 w-8 bg-transparent border-none hover:bg-transparent"
              >
                <Bell className="h-5 w-5 text-gray-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-lg overflow-hidden z-50" style={{
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  backgroundColor: 'rgba(27, 27, 27, 0.75)',
                  border: '1px solid rgba(80,252,149,0.2)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
                }}>
                  <div className="p-2 border-b border-[rgba(80,252,149,0.2)]">
                    <span className="text-[rgba(80, 252, 149, 0.8)] font-medium">Notifications</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {userNotifs.length === 0 ? (
                      <p className="p-2 text-sm text-gray-400">No notifications</p>
                    ) : (
                      userNotifs.map(n => (
                        <div key={n.id} className="p-2 border-b border-gray-800 flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-gray-200">{n.message}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(n.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {!n.isRead && (
                            <Button size="icon" variant="ghost" onClick={() => markNotificationRead(n.id)}>
                              <Check className="h-4 w-4 text-[rgba(80, 252, 149, 0.8)]" />
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0 bg-transparent border-none hover:bg-transparent hover:ring-0 hover:shadow-none">
                    <div className={`flex items-center gap-2 px-3 py-0.5 rounded-full text-white text-xs font-medium
                      ${authState.user.role === "admin"
                        ? "bg-gradient-to-r from-[#FF671F] to-[#FF9933]"
                        : authState.user.role === "officer"
                          ? "bg-gradient-to-r from-[#CA0DAD] to-[#DA70D6]"
                          : "bg-gradient-to-r from-[#0077BE] to-[#00CED1]"}
                    `}>
                      <span className="flex flex-col items-center">
                        {authState.user.role === "admin" ? (
                          <>
                            <Shield className="w-6 h-6" />
                            <span className="text-lg"></span>
                          </>
                        ) : authState.user.role === "officer" ? (
                          <>
                            <Gavel className="w-6 h-6" />
                            <span className="text-lg"></span>
                          </>
                        ) : (
                          <>
                            <Briefcase className="w-6 h-6" />
                            <span className="text-lg"></span>
                          </>
                        )}
                      </span>
                      <span className="flex flex-col text-center text-xs">
                        <span>{authState.user.role === "admin" ? "Administrator" : authState.user.role === "officer" ? "Officer" : "Bidder"}</span>
                        <span className="text-[11px]">
                          <div className="hidden md:block text-right">
                            <div className="text-xs text-gray-50">{authState.user.username}</div>
                          </div>
                        </span>
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-36"
                  style={{
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    backgroundColor: 'rgba(27, 27, 27, 0.75)',
                    border: '1px solid rgba(80,252,149,0.2)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <DropdownMenuItem
                    className="cursor-pointer text-white hover:bg-[rgba(80, 252, 149, 0.15)] hover:text-[rgba(80, 252, 149, 0.8)]"
                    onClick={() => navigate('/profile')}
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer text-white hover:bg-[rgba(80, 252, 149, 0.15)] hover:text-[rgba(80, 252, 149, 0.8)]"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Menu Trigger */}
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="border border-[rgba(80,252,149,0.3)] text-[rgba(80,252,149,0.8)] bg-transparent">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="bg-[#1B1B1B] border-l border-[rgba(80,252,149,0.2)]">
                  <div className="flex flex-col gap-4 mt-8">
                    {getMenuItems().map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="text-lg text-gray-400 hover:text-[rgba(80, 252, 149, 0.8)] transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.title}
                      </Link>
                    ))}

                    {!isConnected ? (
                      <Button
                        onClick={() => {
                          connectWallet();
                          setIsMobileMenuOpen(false);
                        }}
                        className="bg-gradient-to-r from-[rgba(80,252,149,0.8)] to-[rgba(0,255,144,0.6)] hover:opacity-90 text-black mt-4"
                      >
                        Connect Wallet
                      </Button>
                    ) : (
                      <div className="mt-4 text-sm font-mono border border-[rgba(80,252,149,0.4)] text-[rgba(80,252,149,0.8)] rounded-full px-3 py-2 text-center">
                        {account?.slice(0, 6)}...{account?.slice(-4)}
                      </div>
                    )}

                    <Button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="mt-2 bg-transparent border border-[rgba(80,252,149,0.3)] text-[rgba(80,252,149,0.8)] hover:bg-[rgba(80,252,149,0.15)]"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default NavBar;