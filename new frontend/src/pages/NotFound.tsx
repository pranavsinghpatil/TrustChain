
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-6 max-w-lg">
        <div className="bg-gradient-to-r from-blockchain-blue to-blockchain-purple rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
          <span className="text-white text-3xl font-bold">404</span>
        </div>
        
        <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
        
        <p className="text-gray-600 mb-6">
          The page you're looking for doesn't exist or has been moved.
          Please check the URL or navigate back to the dashboard.
        </p>
        
        <Button className="bg-blockchain-purple hover:bg-blockchain-blue transition-colors" asChild>
          <Link to="/">Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
