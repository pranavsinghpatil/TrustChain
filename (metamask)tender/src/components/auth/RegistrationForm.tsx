import React, { FC, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { RegisterData, UserRole } from "@/types/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Eye, EyeOff, Wallet, Check, ChevronDown, Upload, FileText, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

interface RegistrationFormProps {
  onRegister: (data: RegisterData) => Promise<void>;
}

type LegalStatus = 'private' | 'public' | 'llp' | 'opc' | 'other' | '';
type CompanyCategory = 'startup' | 'sme' | 'msme' | 'large' | 'mnc' | 'other' | '';

// Extend RegisterData but make some fields optional for the form
interface FormData extends Omit<RegisterData, 'legalStatus' | 'companyCategory' | 'isApproved' | 'approverId' | 'approvedAt' | 'rejectionReason'> {
  legalStatus: LegalStatus;
  companyCategory: CompanyCategory;
  terms1: boolean;
  terms2: boolean;
}

const RegistrationForm: FC<RegistrationFormProps> = ({ onRegister }) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid },
  } = useForm<FormData>({
    defaultValues: {
      bidderType: "Indian",
      role: "bidder",
      terms1: false,
      terms2: false,
      legalStatus: '',
      companyCategory: '',
      taxId: ''
    },
    mode: "onChange"
  });
  
  const { connectWallet, account, isConnected } = useWeb3();
  const { toast } = useToast();
  const [connecting, setConnecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [supportingDocs, setSupportingDocs] = useState<Array<{
    file: File;
    name: string;
    type: string;
    size: number;
    preview?: string;
  }>>([]);
  const [references, setReferences] = useState<Array<{
    name: string;
    contact: string;
    email: string;
    relation: string;
  }>>([{ name: '', contact: '', email: '', relation: '' }]);
  
  // Watch form values
  const bidderType = watch("bidderType");

  const handleFileUpload = async (file: File) => {
    // In a real app, you would upload the file to a storage service
    // For now, we'll just simulate an upload
    return new Promise<{url: string}>((resolve) => {
      setTimeout(() => {
        resolve({
          url: URL.createObjectURL(file)
        });
      }, 1000);
    });
  };

  const handleAddReference = () => {
    setReferences([...references, { name: '', contact: '', email: '', relation: '' }]);
  };

  const handleRemoveReference = (index: number) => {
    const newReferences = [...references];
    newReferences.splice(index, 1);
    setReferences(newReferences);
  };

  const handleReferenceChange = (index: number, field: keyof typeof references[0], value: string) => {
    const newReferences = [...references];
    newReferences[index] = { ...newReferences[index], [field]: value };
    setReferences(newReferences);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        name: file.name,
        type: file.type,
        size: file.size,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      }));
      setSupportingDocs([...supportingDocs, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...supportingDocs];
    if (newFiles[index].preview) {
      URL.revokeObjectURL(newFiles[index].preview!);
    }
    newFiles.splice(index, 1);
    setSupportingDocs(newFiles);
  };

  const onSubmit: SubmitHandler<FormData> = async (formData) => {
    try {
      setIsLoading(true);
      
      // Validate wallet connection
      if (!isConnected || !account) {
        throw new Error("Please connect your wallet first");
      }

      // Trigger form validation for all fields
      const isValid = await trigger([
        'username', 'password', 'name', 'email', 'mobileNumber',
        'companyName', 'registrationNumber', 'taxId', 'establishmentYear',
        'legalStatus', 'companyCategory', 'registeredAddress', 'city', 'state', 'pinCode'
      ]);

      if (!isValid) {
        throw new Error("Please fill in all required fields correctly");
      }

      // Check terms and conditions
      if (!formData.terms1 || !formData.terms2) {
        throw new Error("Please accept all terms and conditions");
      }

      // Format mobile number for foreign bidders
      const bidderType = watch("bidderType") as 'Indian' | 'Foreign';
      const mobileNumber = bidderType === "Foreign" 
        ? formData.mobileNumber.startsWith('+') 
          ? formData.mobileNumber 
          : `+${formData.mobileNumber.replace(/^\+/, '')}`
        : formData.mobileNumber;
      
      // Helper function to safely trim strings
      const safeTrim = (str: string | undefined): string => (str || '').trim();
      
      // Upload supporting documents if any
      const uploadedDocs = [];
      for (const doc of supportingDocs) {
        setUploading(true);
        setUploadProgress(0);
        
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const newProgress = prev + Math.random() * 30;
            return newProgress > 90 ? 90 : newProgress;
          });
        }, 200);
        
        try {
          const result = await handleFileUpload(doc.file);
          clearInterval(progressInterval);
          setUploadProgress(100);
          
          uploadedDocs.push({
            name: doc.name,
            url: result.url,
            type: doc.type,
            size: doc.size,
            uploadedAt: new Date()
          });
        } catch (error) {
          console.error('Error uploading file:', error);
          toast({
            title: "Upload Error",
            description: `Failed to upload ${doc.name}. Please try again.`,
            variant: "destructive"
          });
          return;
        } finally {
          clearInterval(progressInterval);
          setUploading(false);
          setUploadProgress(0);
        }
      }
      
      // Filter out empty references
      const validReferences = references.filter(ref => 
        ref.name && ref.contact && ref.email && ref.relation
      );
      
      // Prepare registration data
      const registrationData: RegisterData = {
        // Account Information
        username: safeTrim(formData.username),
        password: formData.password,
        name: safeTrim(formData.name),
        role: 'bidder' as const,
        email: safeTrim(formData.email).toLowerCase(),
        mobileNumber: safeTrim(mobileNumber),
        walletAddress: account,
        countryCode: formData.countryCode ? safeTrim(formData.countryCode) : undefined,
        
        // Company Details
        bidderType,
        companyName: safeTrim(formData.companyName),
        registrationNumber: safeTrim(formData.registrationNumber),
        taxId: formData.taxId ? safeTrim(formData.taxId).toUpperCase() : undefined,
        establishmentYear: formData.establishmentYear,
        legalStatus: formData.legalStatus as 'private' | 'public' | 'llp' | 'opc' | 'other',
        companyCategory: formData.companyCategory as 'startup' | 'sme' | 'msme' | 'large' | 'mnc' | 'other',
        
        // Address
        registeredAddress: safeTrim(formData.registeredAddress),
        city: safeTrim(formData.city),
        state: safeTrim(formData.state),
        pinCode: safeTrim(formData.pinCode),
        
        // Additional Info
        additionalInfo: formData.additionalInfo ? safeTrim(formData.additionalInfo) : undefined,
        
        // System fields
        isApproved: false,
        status: 'pending',
        supportingDocuments: uploadedDocs,
        references: validReferences.length > 0 ? validReferences : undefined,
        lastUpdatedAt: new Date()
      };
      
      console.log("Submitting registration data:", registrationData);
      
      try {
        await onRegister(registrationData);
        
        // Clear form
        // reset();
        setSupportingDocs([]);
        setReferences([{ name: '', contact: '', email: '', relation: '' }]);
        
        toast({
          title: "Registration Submitted",
          description: "Your registration has been received for review. You'll be notified once approved.",
          variant: "default"
        });
        
      } catch (error) {
        console.error('Registration error:', error);
        toast({
          title: "Registration Failed",
          description: error instanceof Error ? error.message : 'An error occurred during registration',
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : 'An error occurred during registration',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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
  
  const handleSelectChange = (
    name: 'bidderType' | 'legalStatus' | 'companyCategory' | 'state',
    value: string
  ) => {
    if (name === 'bidderType' && (value === 'Indian' || value === 'Foreign')) {
      setValue('bidderType', value as 'Indian' | 'Foreign', { shouldValidate: true });
    } else if (name === 'legalStatus') {
      if (value === '' || value === 'private' || value === 'public' || value === 'llp' || value === 'opc' || value === 'other') {
        setValue('legalStatus', value as LegalStatus, { shouldValidate: true });
      }
    } else if (name === 'companyCategory') {
      if (value === '' || value === 'startup' || value === 'sme' || value === 'msme' || value === 'large' || value === 'mnc' || value === 'other') {
        setValue('companyCategory', value as CompanyCategory, { shouldValidate: true });
      }
    } else if (name === 'state') {
      setValue('state', value, { shouldValidate: true });
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto shadow-xl overflow-hidden border-0">
      <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-green-600 text-white py-6">
        <CardTitle className="text-3xl font-bold tracking-tight">TrustChain</CardTitle>
        <CardDescription className="text-blue-100 text-base">
          Secure Blockchain-based Tender Management System
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* File Upload Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="supporting-docs" className="text-sm font-medium text-gray-700">
                Supporting Documents (Optional)
              </Label>
              <p className="text-xs text-gray-500 mb-2">
                Upload any supporting documents like business licenses, certifications, or other relevant files
              </p>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-md">
                <div className="space-y-1 text-center">
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="supporting-docs"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                    >
                      <span>Upload files</span>
                      <input
                        id="supporting-docs"
                        name="supporting-docs"
                        type="file"
                        className="sr-only"
                        multiple
                        onChange={handleFileChange}
                        disabled={uploading}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, JPG, PNG up to 10MB
                  </p>
                </div>
              </div>
              
              {/* Upload progress */}
              {uploading && (
                <div className="mt-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-right text-gray-500 mt-1">
                    {Math.round(uploadProgress)}% uploaded
                  </p>
                </div>
              )}
              
              {/* Uploaded files preview */}
              {supportingDocs.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Files to upload:</h4>
                  <ul className="space-y-2">
                    {supportingDocs.map((file, index) => (
                      <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                          disabled={uploading}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          {/* Three-column layout for the form sections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Login Credentials Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-primary text-center pb-2 border-b">Login Credentials</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bidderType">Bidder Type*</Label>
                  <Select
                    value={watch("bidderType") as 'Indian' | 'Foreign'}
                    onValueChange={(value: 'Indian' | 'Foreign') => 
                      handleSelectChange("bidderType", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select bidder type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Indian">Indian</SelectItem>
                      <SelectItem value="Foreign">Foreign</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.bidderType && <p className="text-xs text-red-500">{errors.bidderType.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">Username*</Label>
                  <Input 
                    id="username" 
                    placeholder="Choose a unique username"
                    {...register("username", { required: "Username is required" })} 
                  />
                  {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email*</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Enter your email address"
                    {...register("email", { required: "Email is required" })} 
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mobileNumber">Mobile Number*</Label>
                  <Input 
                    id="mobileNumber" 
                    placeholder={
                      bidderType === "Indian" 
                        ? "Enter 10-digit mobile number (e.g., 9876543210)" 
                        : "Enter mobile number with country code (e.g., +441234567890)"
                    }
                    {...register("mobileNumber", { 
                      required: "Mobile number is required",
                      pattern: bidderType === "Indian" 
                        ? { 
                            value: /^[6-9][0-9]{9}$/, 
                            message: "Please enter a valid 10-digit Indian mobile number" 
                          }
                        : { 
                            value: /^\+?[1-9]\d{7,14}$/, 
                            message: "Please enter a valid international number with country code" 
                          }
                    })} 
                    className={errors.mobileNumber ? 'border-red-500' : ''}
                  />
                  {errors.mobileNumber && (
                    <p className="text-sm text-red-500">{errors.mobileNumber.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password*</Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Enter a strong password"
                      {...register("password", { required: "Password is required" })} 
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password*</Label>
                  <div className="relative">
                    <Input 
                      id="confirmPassword" 
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="Confirm your password"
                      {...register("confirmPassword", { 
                        required: "Please confirm your password", 
                        validate: v => v === watch("password") || "Passwords must match" 
                      })} 
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
                </div>
              </div>
            </div>
            
            {/* Company Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-primary text-center pb-2 border-b">Company Details</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name*</Label>
                  <Input 
                    id="companyName" 
                    placeholder="Enter your company name"
                    {...register("companyName", { required: "Company name is required" })} 
                  />
                  {errors.companyName && <p className="text-xs text-red-500">{errors.companyName.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number*</Label>
                  <Input 
                    id="registrationNumber" 
                    placeholder="Company registration number"
                    {...register("registrationNumber", { required: "Registration number is required" })} 
                  />
                  {errors.registrationNumber && <p className="text-xs text-red-500">{errors.registrationNumber.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="legalStatus">Legal Status*</Label>
                  <Select
                    onValueChange={(value: LegalStatus) => 
                      handleSelectChange("legalStatus", value)
                    }
                    value={watch("legalStatus") as LegalStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select legal status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private Limited</SelectItem>
                      <SelectItem value="public">Public Limited</SelectItem>
                      <SelectItem value="llp">LLP (Limited Liability Partnership)</SelectItem>
                      <SelectItem value="opc">OPC (One Person Company)</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.legalStatus && <p className="text-xs text-red-500">{errors.legalStatus.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="companyCategory">Company Category*</Label>
                  <Select
                    onValueChange={(value: CompanyCategory) => 
                      handleSelectChange("companyCategory", value)
                    }
                    value={watch("companyCategory") as CompanyCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="startup">Startup</SelectItem>
                      <SelectItem value="sme">SME (Small & Medium Enterprise)</SelectItem>
                      <SelectItem value="msme">MSME (Micro, Small & Medium Enterprise)</SelectItem>
                      <SelectItem value="large">Large Enterprise</SelectItem>
                      <SelectItem value="mnc">MNC (Multinational Corporation)</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.companyCategory && <p className="text-xs text-red-500">{errors.companyCategory.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="taxId">
                    {watch("bidderType") === "Indian" ? "GST / PAN Number" : "Tax Identification Number"}
                  </Label>
                  <Input 
                    id="taxId" 
                    placeholder={
                      watch("bidderType") === "Indian" 
                        ? "Enter GST or PAN number (optional)" 
                        : "Enter Tax Identification Number (optional)"
                    }
                    {...register("taxId")} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="establishmentYear">Establishment Year*</Label>
                  <Input 
                    id="establishmentYear" 
                    placeholder="YYYY"
                    {...register("establishmentYear", { required: "Establishment year is required" })} 
                  />
                  {errors.establishmentYear && <p className="text-xs text-red-500">{errors.establishmentYear.message}</p>}
                </div>
              </div>
            </div>
            
            {/* Additional Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-primary text-center pb-2 border-b">Additional Details</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="registeredAddress">Registered Office Address*</Label>
                  <Textarea
                    id="registeredAddress"
                    placeholder="Enter complete registered address"
                    {...register("registeredAddress", { required: "Registered address is required" })}
                  />
                  {errors.registeredAddress && <p className="text-xs text-red-500">{errors.registeredAddress.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">{watch("bidderType") === "Indian" ? "State*" : "Province/State*"}</Label>
                  {watch("bidderType") === "Indian" ? (
                    <Select
                      value={watch("state") || ""}
                      onValueChange={(value) => handleSelectChange("state", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Andhra Pradesh">Andhra Pradesh</SelectItem>
                        <SelectItem value="Arunachal Pradesh">Arunachal Pradesh</SelectItem>
                        <SelectItem value="Assam">Assam</SelectItem>
                        <SelectItem value="Bihar">Bihar</SelectItem>
                        <SelectItem value="Chhattisgarh">Chhattisgarh</SelectItem>
                        <SelectItem value="Goa">Goa</SelectItem>
                        <SelectItem value="Gujarat">Gujarat</SelectItem>
                        <SelectItem value="Haryana">Haryana</SelectItem>
                        <SelectItem value="Himachal Pradesh">Himachal Pradesh</SelectItem>
                        <SelectItem value="Jharkhand">Jharkhand</SelectItem>
                        <SelectItem value="Karnataka">Karnataka</SelectItem>
                        <SelectItem value="Kerala">Kerala</SelectItem>
                        <SelectItem value="Madhya Pradesh">Madhya Pradesh</SelectItem>
                        <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                        <SelectItem value="Manipur">Manipur</SelectItem>
                        <SelectItem value="Meghalaya">Meghalaya</SelectItem>
                        <SelectItem value="Mizoram">Mizoram</SelectItem>
                        <SelectItem value="Nagaland">Nagaland</SelectItem>
                        <SelectItem value="Odisha">Odisha</SelectItem>
                        <SelectItem value="Punjab">Punjab</SelectItem>
                        <SelectItem value="Rajasthan">Rajasthan</SelectItem>
                        <SelectItem value="Sikkim">Sikkim</SelectItem>
                        <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                        <SelectItem value="Telangana">Telangana</SelectItem>
                        <SelectItem value="Tripura">Tripura</SelectItem>
                        <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                        <SelectItem value="Uttarakhand">Uttarakhand</SelectItem>
                        <SelectItem value="West Bengal">West Bengal</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="state"
                      placeholder="Enter province/state"
                      {...register("state", { required: "Province/State is required" })}
                    />
                  )}
                  {errors.state && <p className="text-xs text-red-500">{errors.state.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">City*</Label>
                  <Input 
                    id="city" 
                    placeholder="Enter city name"
                    {...register("city", { required: "City is required" })} 
                  />
                  {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pinCode">{watch("bidderType") === "Indian" ? "PIN Code*" : "Postal Code*"}</Label>
                  <Input 
                    id="pinCode" 
                    placeholder={watch("bidderType") === "Indian" ? "Enter 6-digit PIN code" : "Enter postal code"}
                    {...register("pinCode", { 
                      required: "Postal code is required",
                      pattern: watch("bidderType") === "Indian" 
                        ? { value: /^[0-9]{6}$/, message: "PIN code must be 6 digits" }
                        : undefined
                    })} 
                  />
                  {errors.pinCode && <p className="text-xs text-red-500">{errors.pinCode.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
                  <Textarea
                    id="additionalInfo"
                    placeholder="Any additional details you would like to provide"
                    {...register("additionalInfo")}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Business Profile */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Business Profile</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="annualTurnover" className="block text-sm font-medium text-gray-700">
                  Annual Turnover (in USD)
                </Label>
                <Input
                  id="annualTurnover"
                  type="number"
                  {...register('annualTurnover', { valueAsNumber: true })}
                  placeholder="e.g. 1000000"
                />
              </div>
              
              <div>
                <Label htmlFor="employeeCount" className="block text-sm font-medium text-gray-700">
                  Number of Employees
                </Label>
                <Input
                  id="employeeCount"
                  type="number"
                  {...register('employeeCount', { valueAsNumber: true })}
                  placeholder="e.g. 50"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="website" className="block text-sm font-medium text-gray-700">
                  Company Website (Optional)
                </Label>
                <Input
                  id="website"
                  type="url"
                  {...register('website')}
                  placeholder="https://example.com"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="businessDescription" className="block text-sm font-medium text-gray-700">
                  Business Description
                </Label>
                <Textarea
                  id="businessDescription"
                  {...register('businessDescription')}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Briefly describe your business, products, and services..."
                />
              </div>
            </div>
          </div>
          
          {/* Business References */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Business References</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddReference}
                className="text-sm"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Reference
              </Button>
            </div>
            
            <div className="space-y-4">
              {references.map((ref, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium text-gray-700">Reference #{index + 1}</h4>
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveReference(index)}
                        className="text-red-500 hover:bg-red-50 h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove reference</span>
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`ref-name-${index}`} className="text-xs font-medium text-gray-500">
                        Name
                      </Label>
                      <Input
                        id={`ref-name-${index}`}
                        value={ref.name}
                        onChange={(e) => handleReferenceChange(index, 'name', e.target.value)}
                        placeholder="John Doe"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`ref-relation-${index}`} className="text-xs font-medium text-gray-500">
                        Relationship
                      </Label>
                      <Input
                        id={`ref-relation-${index}`}
                        value={ref.relation}
                        onChange={(e) => handleReferenceChange(index, 'relation', e.target.value)}
                        placeholder="e.g., Client, Vendor"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`ref-email-${index}`} className="text-xs font-medium text-gray-500">
                        Email
                      </Label>
                      <Input
                        id={`ref-email-${index}`}
                        type="email"
                        value={ref.email}
                        onChange={(e) => handleReferenceChange(index, 'email', e.target.value)}
                        placeholder="john@example.com"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`ref-contact-${index}`} className="text-xs font-medium text-gray-500">
                        Contact Number
                      </Label>
                      <Input
                        id={`ref-contact-${index}`}
                        value={ref.contact}
                        onChange={(e) => handleReferenceChange(index, 'contact', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Additional Information */}
          <div>
            <Label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700">
              Additional Information (Optional)
            </Label>
            <p className="text-xs text-gray-500 mb-2">
              Any other information that might help in evaluating your application
            </p>
            <Textarea
              id="additionalInfo"
              {...register('additionalInfo')}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Please provide any additional information that might be relevant to your application..."
            />
          </div>
          
          {/* Wallet Connection Section */}
          <div className="mt-8 mb-6">
            <div className={cn(
              "flex flex-col md:flex-row items-start md:items-center p-5 rounded-xl transition-all duration-300 shadow-sm",
              isConnected 
                ? "bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200"
                : "bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 hover:shadow-md"
            )}>
              <div className="flex-1 mb-4 md:mb-0">
                <div className="flex items-center mb-1">
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full mr-3",
                    isConnected ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                  )}>
                    {isConnected ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Wallet className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {isConnected ? "Wallet Connected" : "Connect Your Wallet"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {isConnected 
                        ? `Connected with ${account?.slice(0,6)}...${account?.slice(-4)}`
                        : "Connect your wallet to complete registration"}
                    </p>
                  </div>
                </div>
                
                {isConnected && (
                  <div className="mt-3 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-md inline-flex items-center">
                    <Check className="h-3 w-3 mr-1.5" />
                    <span>Your wallet is ready for secure transactions</span>
                  </div>
                )}
              </div>
              
              <div className="w-full md:w-auto">
                {isConnected ? (
                  <div className="flex items-center justify-between md:justify-end w-full">
                    <div className="md:hidden">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        className="text-green-700 border-green-200 bg-green-50 hover:bg-green-100"
                        onClick={() => navigator.clipboard.writeText(account || '')}
                      >
                        Copy Address
                      </Button>
                    </div>
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full">
                      <Check className="h-4 w-4" />
                      <span className="text-sm font-medium">Connected</span>
                    </div>
                  </div>
                ) : (
                  <Button 
                    type="button" 
                    onClick={handleConnect} 
                    disabled={connecting}
                    className={cn(
                      "w-full md:w-auto",
                      "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
                      "text-white font-medium shadow-md hover:shadow-lg transition-all"
                    )}
                  >
                    {connecting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Connecting...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Wallet className="w-4 h-4 mr-2" />
                        Connect Wallet
                      </span>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {/* Agreements Section */}
          <div className="space-y-4 mb-6 mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="terms1" 
                checked={watch("terms1")} 
                onCheckedChange={async (checked) => {
                  setValue("terms1", checked as boolean, { shouldValidate: true });
                  await trigger("terms1");
                }}
                className="mt-1"
              />
              <div>
                <label
                  htmlFor="terms1"
                  className={cn(
                    "text-sm font-medium leading-snug cursor-pointer",
                    errors.terms1 ? "text-red-600" : "text-gray-700"
                  )}
                >
                  I hereby declare that all the information given above is true and correct to the best of my knowledge.
                </label>
                {errors.terms1 && <p className="mt-1 text-xs text-red-500">{errors.terms1.message}</p>}
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="terms2" 
                checked={watch("terms2")} 
                onCheckedChange={async (checked) => {
                  setValue("terms2", checked as boolean, { shouldValidate: true });
                  await trigger("terms2");
                }}
                className="mt-1"
              />
              <div>
                <label
                  htmlFor="terms2"
                  className={cn(
                    "text-sm font-medium leading-snug cursor-pointer",
                    errors.terms2 ? "text-red-600" : "text-gray-700"
                  )}
                >
                  I agree to the <Link to="/terms" className="text-blue-600 hover:underline font-semibold">Terms & Conditions</Link> and our <Link to="/privacy" className="text-blue-600 hover:underline font-semibold">Privacy Policy</Link>.
                </label>
                {errors.terms2 && <p className="mt-1 text-xs text-red-500">{errors.terms2.message}</p>}
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="relative group">
            <Button 
              type="submit" 
              disabled={!isValid || !watch("terms1") || !watch("terms2") || !isConnected}
              className={cn(
                "w-full py-6 text-base font-semibold transition-all duration-300 relative overflow-hidden",
                isValid && watch("terms1") && watch("terms2") && isConnected
                  ? "bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 shadow-lg hover:shadow-xl"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              )}
            >
              <span className="relative z-10 flex items-center justify-center">
                {isValid && watch("terms1") && watch("terms2") && isConnected ? (
                  <>
                    <span className="mr-2">Submit Registration</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                ) : (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Complete all fields to continue
                  </span>
                )}
              </span>
              {isValid && watch("terms1") && watch("terms2") && isConnected && (
                <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
              )}
            </Button>
            
            {!(isValid && watch("terms1") && watch("terms2") && isConnected) && (
              <div className="mt-2 text-sm text-center text-gray-500">
                {!isConnected ? (
                  <span>Connect your wallet to continue</span>
                ) : !watch("terms1") || !watch("terms2") ? (
                  <span>Please accept all terms and conditions</span>
                ) : (
                  <span>Please fill in all required fields</span>
                )}
              </div>
            )}
          </div>
          
          <p className="text-xs text-center mt-4 text-gray-500">
            All fields marked with * are required. Your application will be reviewed by an officer before activation.
            <br />
            Powered by TrustChain
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default RegistrationForm;
