import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Bell, LogOut, Menu, User, Users, Wallet, Shield, Gavel, Briefcase, Check } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWeb3 } from "@/contexts/Web3Context";

const NavBar = () => {
  const { toast } = useToast();
  const { authState, logout, notifications, markNotificationRead } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { connectWallet, account, isConnected } = useWeb3();

  // Notification filtering
  const userNotifs = notifications.filter(n => n.recipientId === authState.user?.id);
  const unreadCount = userNotifs.filter(n => !n.isRead).length;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Get initials for avatar fallback
  const getInitials = () => {
    if (!authState.user) return "?";
    return authState.user.name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
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
        allowedRoles: [ "officer"],
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
      item.allowedRoles.includes(authState.user!.role)
    );
  };

  // If not logged in, show minimal navbar with login link
  if (!authState.user) {
    return (
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[99vw] max-w-7xl z-50 glass-navbar py-1.5 px-4 flex items-center justify-between min-h-[52px]">
        <div className="px-3 py-3 lg:px-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <div className="bg-gradient-to-r from-blockchain-blue to-blockchain-purple p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
              <span className="text-xl font-semibold whitespace-nowrap">TrustChain</span>
            </Link>

            <Link to="/login">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Login</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  // Full navbar for logged-in users
  return (
    <nav className="fixed top-3 left-1/2 -translate-x-1/2 w-[99vw] max-w-7xl z-50 glass-navbar py-1.5 px-4 flex items-center justify-between min-h-[52px]">
      <div className="px-3 py-3 lg:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="bg-gradient-to-r from-blockchain-blue to-blockchain-purple p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
              <span className="text-xl font-semibold whitespace-nowrap">TrustChain</span>
            </Link>
            <div className={`ml-4 px-2 py-1 rounded-full text-white text-xs font-medium
              ${authState.user.role === "admin"
                ? "bg-gradient-to-r from-[#FF671F] to-[#FF9933]"
                : authState.user.role === "officer"
                  ? "bg-gradient-to-r from-[#000080] to-[#0000FF]"
                  : "bg-gradient-to-r from-[#046A38] to-[#138808]"}
            `}>
              <span className="flex items-center gap-1">
                {authState.user.role === "admin" ? (
                  <>
                    <Shield className="w-3 h-3" />
                    TrustChain Administrator
                  </>
                ) : authState.user.role === "officer" ? (
                  <>
                    <Gavel className="w-3 h-3" />
                    TrustChain Officer
                  </>
                ) : (
                  <>
                    <Briefcase className="w-3 h-3" />
                    TrustChain Bidder
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            {getMenuItems().map(item => (
              <Link
                key={item.path}
                to={item.path}
                className="text-gray-600 hover:text-blockchain-purple transition-colors"
              >
                {item.title}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {/* Wallet connect */}
            {!isConnected ? (
              <Button onClick={connectWallet} className="bg-blockchain-blue text-white hover:bg-blockchain-purple">
                Connect Wallet
              </Button>
            ) : (
              <span className="text-sm font-mono border border-gray-300 rounded px-2 py-1">
                {account?.slice(0, 6)}...{account?.slice(-4)}
              </span>
            )}

            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative bg-gray-100 hover:bg-gray-200"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center h-4 w-4 text-xs bg-red-500 text-white rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden z-50">
                  <div className="p-2 border-b bg-gray-50">
                    <span className="text-sm font-medium">Notifications</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {userNotifs.length === 0 ? (
                      <p className="p-2 text-sm text-gray-500">No notifications</p>
                    ) : (
                      userNotifs.map(n => (
                        <div key={n.id} className="p-2 border-b flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm">{n.message}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(n.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {!n.isRead && (
                            <Button size="icon" variant="ghost" onClick={() => markNotificationRead(n.id)}>
                              <Check className="h-4 w-4 text-green-500" />
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <div className="text-sm font-medium">{authState.user.name}</div>
                <div className="text-xs text-gray-500">{authState.user.username}</div>
              </div>

              <Avatar>
                <AvatarImage src="" />
                <AvatarFallback className={`
                text-white
                ${authState.user.role === "admin" ? "bg-blockchain-purple" :
                    authState.user.role === "officer" ? "bg-blockchain-blue" :
                      "bg-blockchain-green"}
              `}>
                  {getInitials()}
                </AvatarFallback>
              </Avatar>

              <Button
                variant="outline"
                size="icon"
                onClick={handleLogout}
                className="hidden md:flex bg-gray-100 hover:bg-gray-200"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="md:hidden bg-gray-100 hover:bg-gray-200"
              onClick={toggleMobileMenu}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 animate-slide-in">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {getMenuItems().map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="block px-3 py-2 text-gray-600 hover:bg-blockchain-lightPurple hover:text-blockchain-purple rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.title}
                </Link>
              ))}

              <button
                className="w-full flex items-center px-3 py-2 text-gray-600 hover:bg-blockchain-lightPurple hover:text-blockchain-purple rounded-md"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
