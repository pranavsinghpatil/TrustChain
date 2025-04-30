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
      item.allowedRoles.includes(authState.user!.role)
    );
  };

  // If not logged in, show minimal navbar with login link
  if (!authState.user) {
    return (
      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 w-[99vw] max-w-7xl z-50 glass-navbar py-1 px-2 flex items-center justify-center min-h-[40px]">
        <div className="px-2 py-1">
          <div className="flex items-center justify-center">
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
    <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 w-[99vw] max-w-7xl z-50 glass-navbar py-1 px-2 flex items-center justify-center min-h-[40px]">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          <div className={`flex items-center gap-2 ml-2 px-3 py-0.5 rounded-full text-white text-xs font-medium
            ${authState.user.role === "admin"
              ? "bg-gradient-to-r from-[#FF671F] to-[#FF9933]"
              : authState.user.role === "officer"
                ? "bg-gradient-to-r from-[#CA0DAD] to-[#DA70D6]"
                : "bg-gradient-to-r from-[#0077BE] to-[#00CED1]"}
          `} style={{ borderRadius: '99px' }}>
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
              <span>TrustChain</span>
              <span className="text-[10px]">
                {authState.user.role === "admin" ? "Administrator" : authState.user.role === "officer" ? "Officer" : "Bidder"}
              </span>
            </span>
          </div>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-4">
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

        <div className="flex items-center gap-2 md:gap-4">
          {/* Wallet connect */}
          {!isConnected ? (
              <Button onClick={connectWallet} className="bg-blockchain-blue text-white hover:bg-blockchain-purple h-8 px-3 py-1">
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
              className="relative bg-gray-100 hover:bg-gray-200 h-8 w-8"
            >
              <Bell className="h-4 w-4" />
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

          <div className="flex items-center gap-2">
            <div className="hidden md:block text-right">
              <div className="text-sm font-medium">{authState.user.name}</div>
              <div className="text-xs text-gray-500">{authState.user.username}</div>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleLogout}
              className="hidden md:flex bg-gray-100 hover:bg-gray-200 h-8 w-8"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="md:hidden bg-gray-100 hover:bg-gray-200 h-8 w-8"
            onClick={toggleMobileMenu}
          >
            <Menu className="h-5 w-5" />
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
    </nav>
  );
};

export default NavBar;
