import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, Building2, Shield, Key, Wallet } from "lucide-react";
import BlockchainDashboard from "@/components/blockchain/BlockchainDashboard";
import TransactionHistory from "@/components/blockchain/TransactionHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Profile = () => {
  const { authState } = useAuth();

  if (!authState.user) {
    return (
      <div className="min-h-screen bg-gray-50/0 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Not Authenticated</CardTitle>
            <CardDescription>Please login to view your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/login'}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/0">
      <main className="container pt-20 pb-20">
        <div className="my-8">
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <p className="text-gray-400 mt-1">
            View and manage your account details and blockchain wallet
          </p>
        </div>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
            {authState.user.role === "bidder" && (
              <TabsTrigger value="bids">My Bids</TabsTrigger>
            )}
            {authState.user.role === "officer" && (
              <TabsTrigger value="tenders">My Tenders</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="account">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-[#1B1B1B]/40 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Your personal and account details</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                  <div className="grid gap-4">
                    <div className="flex items-center gap-4">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Full Name</p>
                        <p className="font-medium text-white">{authState.user.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-white">{authState.user.email || "Not provided"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Building2 className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Account Type</p>
                        <p className="font-medium capitalize text-white">{authState.user.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Shield className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Account Status</p>
                        <div className="flex items-center">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            authState.user.isApproved 
                              ? "bg-green-500/20 text-green-400" 
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}>
                            {authState.user.isApproved ? "Approved" : "Pending Approval"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {authState.user.walletAddress && (
                      <div className="flex items-center gap-4">
                        <Wallet className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Wallet Address</p>
                          <p className="font-mono text-sm text-green-400">
                            {authState.user.walletAddress.slice(0, 10)}...{authState.user.walletAddress.slice(-8)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button className="bg-gradient-to-r from-green-400 to-blue-500 text-white hover:from-green-500 hover:to-blue-600">
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>

              {authState.user.role === "bidder" && authState.user.profileData && (
                <Card className="bg-[#1B1B1B]/40 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle>Company Information</CardTitle>
                    <CardDescription>Your business details</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Company Name</p>
                      <p className="font-medium text-white">{authState.user.profileData.companyName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Registration Number</p>
                      <p className="font-medium text-white">{authState.user.profileData.registrationNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">GST Number</p>
                      <p className="font-medium text-white">{authState.user.profileData.gstNumber || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">PAN Number</p>
                      <p className="font-medium text-white">{authState.user.profileData.panNumber || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium text-white">{authState.user.profileData.registeredAddress}</p>
                      <p className="text-sm text-white">
                        {authState.user.profileData.city}, {authState.user.profileData.state}, {authState.user.profileData.pinCode}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="blockchain">
            <div className="grid gap-6 md:grid-cols-2">
              <BlockchainDashboard showTransactions={false} />
              <TransactionHistory userId={authState.user.id} limit={10} />
            </div>
          </TabsContent>

          {authState.user.role === "bidder" && (
            <TabsContent value="bids">
              <Card className="bg-[#1B1B1B]/40 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle>My Bids</CardTitle>
                  <CardDescription>Your bidding history and status</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">Your bid history will appear here</p>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {authState.user.role === "officer" && (
            <TabsContent value="tenders">
              <Card className="bg-[#1B1B1B]/40 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle>My Tenders</CardTitle>
                  <CardDescription>Tenders you've created and managed</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">Your tender history will appear here</p>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;
