import React, { FC, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { RegisterData, UserRole } from "@/types/auth";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Eye, EyeOff, Wallet, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RegistrationFormProps {
  onRegister: (data: RegisterData) => Promise<void>;
}

const RegistrationForm: FC<RegistrationFormProps> = ({ onRegister }) => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterData>({ defaultValues: { bidderType: "Indian" } });
  const { connectWallet, account, isConnected } = useWeb3();
  const { toast } = useToast();
  const [connecting, setConnecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const onSubmit: SubmitHandler<RegisterData> = async (data) => {
    if (!isConnected) {
      toast({ title: "Error", description: "Connect your wallet first", variant: "destructive" });
      return;
    }
    data.walletAddress = account!;
    try {
      await onRegister(data);
      toast({ title: "Success", description: "Registration complete" });
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await connectWallet();
    } catch {
      toast({ title: "Error", description: "Wallet connection failed", variant: "destructive" });
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" {...register("name", { required: "Name is required" })} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input id="username" {...register("username", { required: "Username is required" })} />
            {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email", { required: "Email is required" })} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} id="password" {...register("password", { required: "Password required" })} />
              <span className="absolute right-2 top-2 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff /> : <Eye />}
              </span>
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input type={showConfirm ? "text" : "password"} id="confirmPassword" {...register("confirmPassword", { required: true, validate: v => v === watch("password") || "Passwords must match" })} />
              <span className="absolute right-2 top-2 cursor-pointer" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <EyeOff /> : <Eye />}
              </span>
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              className="block w-full"
              {...register("role", { required: true, setValueAs: (v) => v as UserRole })}
            >
              <option value="user">User</option>
              <option value="officer">Officer</option>
              <option value="bidder">Bidder</option>
            </select>
          </div>
          {watch("role") === "bidder" && (
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" {...register("companyName", { required: "Company required" })} />
            </div>
          )}
          <div>
            <Label htmlFor="mobileNumber">Mobile Number</Label>
            <Input id="mobileNumber" {...register("mobileNumber", { pattern: { value: /^[6-9]\d{9}$/, message: "Invalid number" } })} />
            {errors.mobileNumber && <p className="text-xs text-red-500">{errors.mobileNumber.message}</p>}
          </div>
          <div>
            {isConnected ? (
              <div className="flex items-center gap-2">
                <Check className="text-green-500" />
                <span>{account?.slice(0,6)}...{account?.slice(-4)}</span>
              </div>
            ) : (
              <Button type="button" onClick={handleConnect} disabled={connecting}>{connecting ? "Connecting..." : <> <Wallet /> Connect Wallet</>}</Button>
            )}
          </div>
          <div className="flex items-start">
            <Checkbox id="terms1" {...register("terms1", { required: "Accept terms" })} />
            <Label htmlFor="terms1" className="ml-2 text-sm">I agree to the <Link to="/terms" className="text-blue-500">Terms</Link></Label>
          </div>
          {errors.terms1 && <p className="text-xs text-red-500">{errors.terms1.message}</p>}
          <Button type="submit">Register</Button>
        </form>
      </CardContent>
      <CardFooter className="text-center"><p className="text-sm text-gray-500">Powered by TrustChain</p></CardFooter>
    </Card>
  );
};

export default RegistrationForm;
