import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, Building2, Shield, Key } from "lucide-react";

const Profile = () => {
  const { authState } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50/0">
      <main className="container pt-20 pb-20">
        <div className="my-8">
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <p className="text-gray-600 mt-1">
            View and manage your account details
          </p>
        </div>

        <div className="grid gap-6 glass-component">
          <Card className="glass-component">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-4">
                <div className="flex items-center gap-4">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">{authState.user.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{authState.user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Building2 className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Account Type</p>
                    <p className="font-medium capitalize">{authState.user.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Shield className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Role</p>
                    <p className="font-medium capitalize">{authState.user.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Key className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Username</p>
                    <p className="font-medium">{authState.user.username}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button variant="outline">Change Password</Button>
                <Button>Edit Profile</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
