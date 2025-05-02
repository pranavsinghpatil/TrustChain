import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { RegisterData } from "@/types/auth";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Eye, EyeOff, Wallet } from "lucide-react";

const RegistrationForm: React.FC = () => {
  const { register: ctxRegister, authState } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<RegisterData>({
    defaultValues: {
      bidderType: "Indian"
    }
  });
  const bidderType = watch('bidderType');

  useEffect(() => {
    if (bidderType === 'Foreign') {
      setValue('panNumber', undefined);
      setValue('gstNumber', undefined);
    }
  }, [bidderType, setValue]);

  const onSubmit: SubmitHandler<RegisterData> = async data => {
    const success = await ctxRegister(data);
    if (success) navigate("/");
  };

  return (
    <Card className="w-full max-w-[1000px] mx-auto border-0 shadow-lg overflow-hidden bg-[#1B1B1B]/40 backdrop-blur-xl border border-white/10">
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Column 1: Basic Information */}
          <div className="space-y-4 bg-[#1B1B1B]/60 p-4 rounded-lg border border-gray-800">
            <h3 className="font-semibold text-lg mb-2 text-green-400">Login Credentials</h3>
            <div>
              <Label htmlFor="bidderType">Bidder Type*</Label>
              <select
                id="bidderType"
                className="w-full p-2 rounded-md border border-gray-700/50 bg-transparent backdrop-blur-sm focus:border-green-400"
                {...register("bidderType", { required: "Bidder type is required" })}
              >
                <option value="">Select type</option>
                <option value="Indian">Indian</option>
                <option value="Foreign">Foreign</option>
              </select>
              {errors.bidderType && <p className="text-xs text-red-500">{errors.bidderType.message}</p>}
            </div>
            <div>
              <Label htmlFor="username">Username*</Label>
              <Input
                id="username"
                placeholder="Choose a unique username"
                className="bg-transparent backdrop-blur-sm border-gray-700/50 focus:border-green-400 focus:ring-green-400/20"
                {...register("username", {
                  required: "Username is required",
                  minLength: { value: 6, message: "Username must be at least 6 characters" },
                  pattern: { value: /^[a-zA-Z0-9_-]+$/, message: "Only letters, numbers, underscore and hyphen allowed" }
                })}
              />
              {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email Address*</Label>
              <Input
                type="email"
                id="email"
                placeholder="Enter your email address"
                className="bg-transparent backdrop-blur-sm border-gray-700/50 focus:border-green-400 focus:ring-green-400/20"
                {...register("email", {
                  required: "Email is required",
                  pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email format" }
                })}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="mobileNumber">Mobile Number* {bidderType === 'Foreign' && '(include country code)'}</Label>
              <Input
                id="mobileNumber"
                placeholder={bidderType === 'Foreign' ? 'e.g. +1-234-567-8900' : 'Enter 10 digit mobile number'}
                className="bg-transparent backdrop-blur-sm border-gray-700/50 focus:border-green-400 focus:ring-green-400/20"
                {...register("mobileNumber", {
                  required: "Mobile number is required",
                  pattern: bidderType === 'Foreign'
                    ? { value: /^\+?[1-9]\d{1,14}$/, message: "Invalid international phone number" }
                    : { value: /^[6-9]\d{9}$/, message: "Invalid Indian mobile number" }
                })}
              />
              {errors.mobileNumber && <p className="text-xs text-red-500">{errors.mobileNumber.message}</p>}
            </div>
            <div>
              <Label htmlFor="password">Password*</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Enter a strong password"
                  className="pl-3 pr-10 bg-transparent backdrop-blur-sm border-gray-700/50 focus:border-green-400 focus:ring-green-400/20"
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 8, message: "Password must be at least 8 characters" },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                      message: "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"
                    }
                  })}
                />
                {showPassword ? (
                  <EyeOff className="absolute right-3 top-3 h-4 w-4 cursor-pointer text-gray-500" onClick={() => setShowPassword(false)} />
                ) : (
                  <Eye className="absolute right-3 top-3 h-4 w-4 cursor-pointer text-gray-500" onClick={() => setShowPassword(true)} />
                )}
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password*</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  id="confirmPassword"
                  placeholder="Confirm your password"
                  className="pl-3 pr-10 bg-transparent backdrop-blur-sm border-gray-700/50 focus:border-green-400 focus:ring-green-400/20"
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (val: string) => {
                      if (watch('password') !== val) return "Passwords do not match";
                    }
                  })}
                />
                {showConfirm ? (
                  <EyeOff className="absolute right-3 top-3 h-4 w-4 cursor-pointer text-gray-500" onClick={() => setShowConfirm(false)} />
                ) : (
                  <Eye className="absolute right-3 top-3 h-4 w-4 cursor-pointer text-gray-500" onClick={() => setShowConfirm(true)} />
                )}
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          {/* Column 2: Company Details */}
          <div className="space-y-4 bg-[#1B1B1B]/60 p-4 rounded-lg border border-gray-800">
            <h3 className="font-semibold text-lg mb-2 text-green-400">Company Details</h3>
            <div>
              <Label htmlFor="companyName">Company Name*</Label>
              <Input
                id="companyName"
                placeholder="Enter your company name"
                className="bg-transparent backdrop-blur-sm border-gray-700/50 focus:border-green-400 focus:ring-green-400/20"
                {...register("companyName", {
                  required: "Company name is required"
                })}
              />
              {errors.companyName && <p className="text-xs text-red-500">{errors.companyName.message}</p>}
            </div>
            <div>
              <Label htmlFor="registrationNumber">Registration Number*</Label>
              <Input
                id="registrationNumber"
                placeholder="Company registration number"
                className="bg-transparent backdrop-blur-sm border-gray-700/50 focus:border-green-400 focus:ring-green-400/20"
                {...register("registrationNumber", {
                  required: "Registration number is required"
                })}
              />
              {errors.registrationNumber && <p className="text-xs text-red-500">{errors.registrationNumber.message}</p>}
            </div>
            {bidderType === 'Indian' && (
              <>
                <div>
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <Input
                    id="gstNumber"
                    placeholder="Enter GST number"
                    className="bg-transparent backdrop-blur-sm border-gray-700/50 focus:border-green-400 focus:ring-green-400/20"
                    {...register("gstNumber", {
                      pattern: { value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, message: "Invalid GST format" }
                    })}
                  />
                  {errors.gstNumber && <p className="text-xs text-red-500">{errors.gstNumber.message}</p>}
                </div>
                <div>
                  <Label htmlFor="panNumber">PAN Number*</Label>
                  <Input
                    id="panNumber"
                    placeholder="Enter PAN number"
                    className="bg-transparent backdrop-blur-sm border-gray-700/50 focus:border-green-400 focus:ring-green-400/20"
                    {...register("panNumber", {
                      required: "PAN number is required",
                      pattern: { value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, message: "Invalid PAN format" }
                    })}
                  />
                  {errors.panNumber && <p className="text-xs text-red-500">{errors.panNumber.message}</p>}
                </div>
              </>
            )}
            <div>
              <Label htmlFor="establishmentYear">Establishment Year*</Label>
              <Input
                type="number"
                id="establishmentYear"
                placeholder="YYYY"
                className="bg-transparent backdrop-blur-sm border-gray-700/50 focus:border-green-400 focus:ring-green-400/20"
                {...register("establishmentYear", {
                  required: "Year is required",
                  min: { value: 1800, message: "Invalid year" },
                  max: { value: new Date().getFullYear(), message: "Year cannot be in future" }
                })}
              />
              {errors.establishmentYear && <p className="text-xs text-red-500">{errors.establishmentYear.message}</p>}
            </div>
          </div>

          {/* Column 3: Additional Details */}
          <div className="space-y-4 bg-[#1B1B1B]/60 p-4 rounded-lg border border-gray-800">
            <h3 className="font-semibold text-lg mb-2 text-green-400">Additional Details</h3>
            <div>
              <Label htmlFor="registeredAddress">Registered Office Address*</Label>
              <Input
                id="registeredAddress"
                placeholder="Enter complete registered address"
                className="bg-transparent backdrop-blur-sm border-gray-700/50 focus:border-green-400 focus:ring-green-400/20"
                {...register("registeredAddress", { required: "Address is required" })}
              />
              {errors.registeredAddress && <p className="text-xs text-red-500">{errors.registeredAddress.message}</p>}
            </div>
            <div>
              <Label htmlFor="state">State*</Label>
              <Input
                id="state"
                placeholder="Enter state name"
                className="bg-transparent backdrop-blur-sm border-gray-700/50 focus:border-green-400 focus:ring-green-400/20"
                {...register("state", { required: "State is required" })}
              />
              {errors.state && <p className="text-xs text-red-500">{errors.state.message}</p>}
            </div>
            <div>
              <Label htmlFor="city">City*</Label>
              <Input
                id="city"
                placeholder="Enter city name"
                className="bg-transparent backdrop-blur-sm border-gray-700/50 focus:border-green-400 focus:ring-green-400/20"
                {...register("city", { required: "City is required" })}
              />
              {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
            </div>
            <div>
              <Label htmlFor="pinCode">PIN Code*</Label>
              <Input
                id="pinCode"
                placeholder={bidderType === 'Foreign' ? 'Enter postal/ZIP code' : 'Enter 6-digit PIN code'}
                className="bg-transparent backdrop-blur-sm border-gray-700/50 focus:border-green-400 focus:ring-green-400/20"
                {...register("pinCode", {
                  required: "PIN code is required",
                  pattern: bidderType === 'Foreign'
                    ? undefined
                    : { value: /^[1-9][0-9]{5}$/, message: "Invalid PIN code" }
                })}
              />
              {errors.pinCode && <p className="text-xs text-red-500">{errors.pinCode.message}</p>}
            </div>
            <div>
              <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
              <Textarea
                id="additionalInfo"
                placeholder="Any additional details you would like to provide"
                className="bg-transparent backdrop-blur-sm border-gray-700/50 focus:border-green-400 focus:ring-green-400/20"
                {...register("additionalInfo")}
              />
            </div>
          </div>
          {/* Connect Wallet Button */}
          <div className="mt-6">
            <Button
              type="button"
              onClick={() => setIsConnecting(!isConnecting)}
              disabled={isConnecting}
              className="w-full relative overflow-hidden bg-blue-500 hover:bg-blue-600"
            >
              {isConnecting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Connecting Wallet...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-green-400 to-blue-500 -z-10 bg-[length:200%_100%] animate-pulse"></div>
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 mt-2 text-center">Connect your wallet for blockchain verification</p>
          </div>
          <div className="col-span-full mt-6">
            <div className="flex flex-col items-start mb-4">
              {/* Line 1 */}
              <div className="flex items-start mb-2">
                <Checkbox
                  id="terms1"
                  {...register("terms1", {
                    required: "You must accept the terms and conditions"
                  })}
                />
                <label htmlFor="terms1" className="ml-2 text-sm">
                  I hereby declare that all the information given above is true and correct to the best of my knowledge.
                </label>
              </div>

              {/* Line 2 */}
              <div className="flex items-start">
                <Checkbox
                  id="terms2"
                  {...register("terms2", {
                    required: "You must accept the terms and conditions"
                  })}
                />
                <label htmlFor="terms2" className="ml-2 text-sm">
                  <span>
                    I agree to the <Link to="/terms" className="text-green-400 hover:text-green-500 transition-colors">Terms & Conditions</Link> and our <Link to="/privacy" className="text-green-400 hover:text-green-500 transition-colors">Privacy Policy.</Link>
                  </span>
                </label>
              </div>
            </div>

            {/* Error Handling */}
            {errors.terms1 && <p className="text-xs text-red-500 mb-2">{errors.terms1.message}</p>}
            {errors.terms2 && <p className="text-xs text-red-500 mb-4">{errors.terms2.message}</p>}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white hover:from-green-500 hover:to-blue-600 mt-4"
              disabled={authState.isLoading}
            >
              {authState.isLoading ? "Creating account..." : "Submit Registration"}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="text-center">
        <p className="text-sm text-gray-500">
          All fields marked with * are required. Your application will be reviewed by an officer before activation.
        </p>
        <p className="text-sm text-gray-500">
          Powered by TrustChain
        </p>
      </CardFooter>
    </Card>
  );
};

export default RegistrationForm;
