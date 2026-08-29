"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Upload, FileText } from "lucide-react"
import { BasicInfo, AcademicInfo, TechnicalInfo, AvailabilityInfo, DeclarationInfo } from "@/lib/types"
import { hashSync } from "bcryptjs"
import { cn } from "@/lib/utils"

const initialBasic: BasicInfo = {
    fullName: "",
    personalEmail: "",
    mobile: "",
    dob: "",
    currentCity: "",
    permanentAddress: "",
    gender: "",
}

const initialAcademic: AcademicInfo = {
    college: "",
    university: "",
    degree: "",
    branch: "",
    yearOfPassing: "",
    cgpa: 0,
    tenthPercentage: 0,
    twelfthPercentage: 0,
    backlogs: "No",
    backlogCount: 0,
}

const initialTechnical: TechnicalInfo = {
    primaryLanguage: "",
    secondaryLanguage: "",
    databaseKnowledge: "",
    frameworkExperience: "",
    git: "No",
    internship: "No",
    internshipDetails: "",
    liveProjects: "No",
    githubLink: "",
    githubUrl: "",
    linkedinUrl: "",
    portfolio: "",
}

const initialAvailability: AvailabilityInfo = {
    fullTimeOnsite: "No",
    relocate: "No",
}

const initialDeclaration: DeclarationInfo = {
    confirmTestIdentity: false,
    noUnfairMeans: false,
    webcamPermission: false,
    screenMonitoringConsent: false,
}

function MandatoryAsterisk() {
    return <span className="text-destructive font-bold ml-1 text-sm" title="Mandatory Field">*</span>
}

function OptionalBadge() {
    return <span className="text-muted-foreground font-normal text-xs ml-1.5">(Optional)</span>
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null
    return (
        <p className="text-xs text-destructive flex items-center gap-1 font-medium mt-1 animate-in fade-in slide-in-from-top-0.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 inline" />
            <span>{message}</span>
        </p>
    )
}

export default function RegisterForm() {
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [basic, setBasic] = useState<BasicInfo>(initialBasic)
    const [academic, setAcademic] = useState<AcademicInfo>(initialAcademic)
    const [technical, setTechnical] = useState<TechnicalInfo>(initialTechnical)
    const [availability, setAvailability] = useState<AvailabilityInfo>(initialAvailability)
    const [declaration, setDeclaration] = useState<DeclarationInfo>(initialDeclaration)

    const [resumeFile, setResumeFile] = useState<File | null>(null)
    const [certificateFile, setCertificateFile] = useState<File | null>(null)

    const router = useRouter()

    const clearFieldError = (field: string) => {
        if (fieldErrors[field]) {
            setFieldErrors(prev => {
                const next = { ...prev }
                delete next[field]
                return next
            })
        }
        if (error) setError(null)
    }

    const validateStep = (currentStep: number): boolean => {
        const errors: Record<string, string> = {}

        if (currentStep === 1) {
            if (!basic.fullName.trim()) errors.fullName = "Full name is required."
            if (!basic.personalEmail.trim()) {
                errors.personalEmail = "Personal email is required."
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(basic.personalEmail)) {
                errors.personalEmail = "Please enter a valid email address."
            }
            if (!basic.mobile.trim()) {
                errors.mobile = "Mobile number is required."
            } else if (basic.mobile.trim().length !== 10) {
                errors.mobile = "Please enter a valid 10-digit mobile number."
            }
            if (!basic.dob) errors.dob = "Date of birth is required."
            if (!basic.currentCity.trim()) errors.currentCity = "Current city is required."
            if (!basic.permanentAddress.trim()) errors.permanentAddress = "Permanent address is required."
            if (!password) {
                errors.password = "Password is required."
            } else if (password.length < 6) {
                errors.password = "Password must be at least 6 characters."
            }
            if (!confirmPassword) {
                errors.confirmPassword = "Confirm password is required."
            } else if (password !== confirmPassword) {
                errors.confirmPassword = "Passwords do not match."
            }
        }

        if (currentStep === 2) {
            if (!academic.college.trim()) errors.college = "College name is required."
            if (!academic.university.trim()) errors.university = "University name is required."
            if (!academic.degree.trim()) errors.degree = "Degree is required."
            if (!academic.branch.trim()) errors.branch = "Branch is required."
            if (!academic.yearOfPassing.trim()) errors.yearOfPassing = "Year of passing is required."
            if (!academic.cgpa) {
                errors.cgpa = "CGPA is required."
            } else if (academic.cgpa < 7.0) {
                errors.cgpa = "CGPA must be 7.0 or above to register."
            }
            if (!academic.tenthPercentage) errors.tenthPercentage = "10th percentage is required."
            if (!academic.twelfthPercentage) errors.twelfthPercentage = "12th percentage is required."
            if (academic.backlogs === "Yes" && (academic.backlogCount || 0) > 1) {
                errors.backlogs = "Sorry, you must have no active backlogs to register."
            }
        }

        if (currentStep === 3) {
            if (!technical.primaryLanguage.trim()) errors.primaryLanguage = "Primary programming language is required."
            if (technical.internship === "Yes" && !technical.internshipDetails?.trim()) {
                errors.internshipDetails = "Please provide internship details."
            }
            if (technical.liveProjects === "Yes" && !technical.githubLink?.trim()) {
                errors.githubLink = "Please provide GitHub project link."
            }
        }

        if (currentStep === 4) {
            if (resumeFile) {
                if (resumeFile.type !== "application/pdf") errors.resume = "Resume must be a PDF file."
                else if (resumeFile.size > 2 * 1024 * 1024) errors.resume = "Resume size must be less than 2MB."
            }
            if (certificateFile) {
                if (certificateFile.size > 2 * 1024 * 1024) errors.certificate = "Certificate size must be less than 2MB."
            }
        }

        if (currentStep === 5) {
            if (!declaration.confirmTestIdentity) errors.confirmTestIdentity = "Required"
            if (!declaration.noUnfairMeans) errors.noUnfairMeans = "Required"
            if (!declaration.webcamPermission) errors.webcamPermission = "Required"
            if (!declaration.screenMonitoringConsent) errors.screenMonitoringConsent = "Required"
        }

        setFieldErrors(errors)

        if (Object.keys(errors).length > 0) {
            setError(errors.cgpa || errors.confirmPassword || errors.backlogs || errors.resume || errors.certificate || "Please fill in all mandatory fields highlighted in red.")
            return false
        }

        setError(null)
        return true
    }

    const nextStep = () => {
        if (!validateStep(step)) return
        setStep(step + 1)
    }

    const prevStep = () => {
        setError(null)
        setStep(step - 1)
    }

    const uploadFile = async (file: File, userId: string, type: 'resume' | 'certificate') => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${userId}_${type}_${Math.random()}.${fileExt}`
        const filePath = `${userId}/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('resumes')
            .upload(filePath, file)

        if (uploadError) {
            console.error(`Error uploading ${type}:`, uploadError);
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('resumes')
            .getPublicUrl(filePath)

        return publicUrl
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateStep(5)) {
            setError("Please accept all declarations and consent to proceed.")
            return
        }

        setLoading(true)
        setError(null)

        try {
            // Check if email already exists
            const { data: existingUser } = await supabase
                .from('users')
                .select('email')
                .eq('email', basic.personalEmail)
                .maybeSingle()

            if (existingUser) {
                setError("This email is already registered. Please login instead.")
                setLoading(false)
                return
            }

            // 1. Create User with Hashed Password
            const hashedPassword = hashSync(password, 10)
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert([{ email: basic.personalEmail, password: hashedPassword, role: 'student' }])
                .select()
                .maybeSingle()

            if (createError) {
                console.error("Supabase Insert Error:", createError);
                throw createError
            }

            if (newUser) {
                // 2. Upload Files
                let resumeUrl = ""
                let certUrl = ""

                try {
                    if (resumeFile) resumeUrl = await uploadFile(resumeFile, newUser.id, 'resume')
                    if (certificateFile) certUrl = await uploadFile(certificateFile, newUser.id, 'certificate')
                } catch (storeError: unknown) {
                    console.warn("Storage upload failed, bucket might not be configured.", storeError)
                }

                // 3. Store profile data
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([{
                        user_id: newUser.id,
                        full_name: basic.fullName,
                        personal_email: basic.personalEmail,
                        mobile: basic.mobile.startsWith("+91") ? basic.mobile : `+91 ${basic.mobile}`,
                        dob: basic.dob,
                        current_city: basic.currentCity,
                        permanent_address: basic.permanentAddress,
                        gender: basic.gender,
                        college: academic.college,
                        university: academic.university,
                        degree: academic.degree,
                        branch: academic.branch,
                        year_of_passing: academic.yearOfPassing,
                        cgpa: academic.cgpa,
                        tenth_percentage: academic.tenthPercentage,
                        twelfth_percentage: academic.twelfthPercentage,
                        backlogs: academic.backlogs,
                        backlog_count: academic.backlogCount,
                        primary_language: technical.primaryLanguage,
                        secondary_language: technical.secondaryLanguage,
                        database_knowledge: technical.databaseKnowledge,
                        framework_experience: technical.frameworkExperience,
                        git: technical.git,
                        internship: technical.internship,
                        internship_details: technical.internshipDetails,
                        live_projects: technical.liveProjects,
                        github_link: technical.githubLink,
                        github_url: technical.githubUrl,
                        linkedin_url: technical.linkedinUrl,
                        portfolio: technical.portfolio,
                        resume_url: resumeUrl,
                        certificates_url: certUrl,
                        full_time_onsite: availability.fullTimeOnsite,
                        relocate: availability.relocate,
                        confirm_test_identity: declaration.confirmTestIdentity,
                        no_unfair_means: declaration.noUnfairMeans,
                        webcam_permission: declaration.webcamPermission,
                        screen_monitoring_consent: declaration.screenMonitoringConsent
                    }])

                if (profileError && profileError.code !== 'PGRST116') {
                    throw profileError
                }

                // Automatically log the user in
                const loginRes = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: basic.personalEmail, password: password })
                });

                if (loginRes.ok) {
                    const data = await loginRes.json();
                    router.push(data.redirectTo || '/quiz');
                } else {
                    router.push('/'); // Fallback to login
                }
            }
        } catch (err: unknown) {
            console.error(err)
            const errorMessage = err instanceof Error ? err.message : "Registration failed. Please try again."
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-2xl border-border bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="h-1.5 w-full bg-muted">
                <div
                    className="h-full bg-primary transition-all duration-500 ease-in-out"
                    style={{ width: `${(step / 5) * 100}%` }}
                />
            </div>
            <CardHeader className="space-y-1">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        {step === 1 && "Basic Information"}
                        {step === 2 && "Academic Information"}
                        {step === 3 && "Technical Information"}
                        {step === 4 && "Availability & Documents"}
                        {step === 5 && "Declaration & Consent"}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">
                        <span className="text-destructive font-bold">*</span> Mandatory
                    </span>
                </div>
                <CardDescription>
                    Step {step} of 5 — Please ensure all mandatory fields (<span className="text-destructive font-semibold">*</span>) are filled accurately.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {error && (
                    <div className="mb-4 p-3 rounded-md bg-destructive/15 text-destructive text-sm flex items-center gap-2 border border-destructive/20 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="space-y-4">
                    {step === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="fullName">Full Name <MandatoryAsterisk /></Label>
                                <Input
                                    id="fullName"
                                    placeholder="John Doe"
                                    value={basic.fullName}
                                    onChange={(e) => {
                                        setBasic({ ...basic, fullName: e.target.value })
                                        clearFieldError("fullName")
                                    }}
                                    className={cn(fieldErrors.fullName && "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive bg-destructive/5")}
                                />
                                <FieldError message={fieldErrors.fullName} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="personalEmail">Personal Email <MandatoryAsterisk /></Label>
                                <Input
                                    id="personalEmail"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={basic.personalEmail}
                                    onChange={(e) => {
                                        setBasic({ ...basic, personalEmail: e.target.value })
                                        clearFieldError("personalEmail")
                                    }}
                                    className={cn(fieldErrors.personalEmail && "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive bg-destructive/5")}
                                />
                                <FieldError message={fieldErrors.personalEmail} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="mobile">Mobile Number <MandatoryAsterisk /></Label>
                                <div className="flex items-center">
                                    <span className="inline-flex items-center px-3.5 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm font-semibold h-10 select-none cursor-default">
                                        +91
                                    </span>
                                    <Input
                                        id="mobile"
                                        type="tel"
                                        inputMode="numeric"
                                        maxLength={10}
                                        placeholder="9876543210"
                                        value={basic.mobile}
                                        onChange={(e) => {
                                            const digits = e.target.value.replace(/\D/g, "").slice(0, 10)
                                            setBasic({ ...basic, mobile: digits })
                                            clearFieldError("mobile")
                                        }}
                                        className={cn(
                                            "rounded-l-none",
                                            fieldErrors.mobile && "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive bg-destructive/5"
                                        )}
                                    />
                                </div>
                                <FieldError message={fieldErrors.mobile} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="dob">Date of Birth <MandatoryAsterisk /></Label>
                                <Input
                                    id="dob"
                                    type="date"
                                    value={basic.dob}
                                    onChange={(e) => {
                                        setBasic({ ...basic, dob: e.target.value })
                                        clearFieldError("dob")
                                    }}
                                    className={cn(fieldErrors.dob && "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive bg-destructive/5")}
                                />
                                <FieldError message={fieldErrors.dob} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="currentCity">Current City <MandatoryAsterisk /></Label>
                                <Input
                                    id="currentCity"
                                    placeholder="New York"
                                    value={basic.currentCity}
                                    onChange={(e) => {
                                        setBasic({ ...basic, currentCity: e.target.value })
                                        clearFieldError("currentCity")
                                    }}
                                    className={cn(fieldErrors.currentCity && "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive bg-destructive/5")}
                                />
                                <FieldError message={fieldErrors.currentCity} />
                            </div>

                            <div className="space-y-1.5">
                                <Label>Gender <OptionalBadge /></Label>
                                <Select value={basic.gender} onValueChange={(val) => setBasic({ ...basic, gender: val })}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Gender (Optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                                <Label htmlFor="permanentAddress">Permanent Address <MandatoryAsterisk /></Label>
                                <Input
                                    id="permanentAddress"
                                    placeholder="Full Street Address, City, State, ZIP"
                                    value={basic.permanentAddress}
                                    onChange={(e) => {
                                        setBasic({ ...basic, permanentAddress: e.target.value })
                                        clearFieldError("permanentAddress")
                                    }}
                                    className={cn(fieldErrors.permanentAddress && "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive bg-destructive/5")}
                                />
                                <FieldError message={fieldErrors.permanentAddress} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password">Password <MandatoryAsterisk /></Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value)
                                        clearFieldError("password")
                                    }}
                                    className={cn(fieldErrors.password && "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive bg-destructive/5")}
                                />
                                <FieldError message={fieldErrors.password} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="confirmPassword">Confirm Password <MandatoryAsterisk /></Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value)
                                        clearFieldError("confirmPassword")
                                    }}
                                    className={cn(fieldErrors.confirmPassword && "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive bg-destructive/5")}
                                />
                                <FieldError message={fieldErrors.confirmPassword} />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="college">College <MandatoryAsterisk /></Label>
                                <Input
                                    id="college"
                                    placeholder="College Name"
                                    value={academic.college}
                                    onChange={(e) => {
                                        setAcademic({ ...academic, college: e.target.value })
                                        clearFieldError("college")
                                    }}
                                    className={cn(fieldErrors.college && "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive bg-destructive/5")}
                                />
                                <FieldError message={fieldErrors.college} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="university">University <MandatoryAsterisk /></Label>
                                <Input
                                    id="university"
                                    placeholder="University Name"
                                    value={academic.university}
                                    onChange={(e) => {
                                        setAcademic({ ...academic, university: e.target.value })
                                        clearFieldError("university")
                                    }}
                                    className={cn(fieldErrors.university && "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive bg-destructive/5")}
                                />
                                <FieldError message={fieldErrors.university} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="degree">Degree <MandatoryAsterisk /></Label>
                                <Input
                                    id="degree"
                                    placeholder="B.Tech, MCA, B.Sc, etc."
                                    value={academic.degree}
                                    onChange={(e) => {
                                        setAcademic({ ...academic, degree: e.target.value })
                                        clearFieldError("degree")
                                    }}
                                    className={cn(fieldErrors.degree && "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive bg-destructive/5")}
                                />
                                <FieldError message={fieldErrors.degree} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="branch">Branch <MandatoryAsterisk /></Label>
                                <Input
                                    id="branch"
                                    placeholder="CSE, ECE, IT, etc."
                                    value={academic.branch}
                                    onChange={(e) => {
                                        setAcademic({ ...academic, branch: e.target.value })
                                        clearFieldError("branch")
                                    }}
                                    className={cn(fieldErrors.branch && "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive bg-destructive/5")}
                                />
                                <FieldError message={fieldErrors.branch} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="yearOfPassing">Year of Passing <MandatoryAsterisk /></Label>
                                <Input
                                    id="yearOfPassing"
                                    type="number"
                                    placeholder="2025"
                                    value={academic.yearOfPassing}
                                    onChange={(e) => {
                                        setAcademic({ ...academic, yearOfPassing: e.target.value })
                                        clearFieldError("yearOfPassing")
                                    }}
                                    className={cn(fieldErrors.yearOfPassing && "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive bg-destructive/5")}
                                />
                                <FieldError message={fieldErrors.yearOfPassing} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="cgpa">CGPA (Min 7.0) <MandatoryAsterisk /></Label>
                                <Input
                                    id="cgpa"
                                    type="number"
                                    step="0.01"
                                    placeholder="8.5"
                                    value={academic.cgpa || ""}
                                    onChange={(e) => {
                                        setAcademic({ ...academic, cgpa: parseFloat(e.target.value) || 0 })
                                        clearFieldError("cgpa")
                                    }}
                                    className={cn(fieldErrors.cgpa && "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive bg-destructive/5")}
                                />
                                <FieldError message={fieldErrors.cgpa} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="tenthPercentage">10th % <MandatoryAsterisk /></Label>
                                <Input
                                    id="tenthPercentage"
                                    type="number"
                                    step="0.01"
                                    placeholder="90"
                                    value={academic.tenthPercentage || ""}
                                    onChange={(e) => {
                                        setAcademic({ ...academic, tenthPercentage: parseFloat(e.target.value) || 0 })
                                        clearFieldError("tenthPercentage")
                                    }}
                                    className={cn(fieldErrors.tenthPercentage && "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive bg-destructive/5")}
                                />
                                <FieldError message={fieldErrors.tenthPercentage} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="twelfthPercentage">12th % <MandatoryAsterisk /></Label>
                                <Input
                                    id="twelfthPercentage"
                                    type="number"
                                    step="0.01"
                                    placeholder="90"
                                    value={academic.twelfthPercentage || ""}
                                    onChange={(e) => {
                                        setAcademic({ ...academic, twelfthPercentage: parseFloat(e.target.value) || 0 })
                                        clearFieldError("twelfthPercentage")
                                    }}
                                    className={cn(fieldErrors.twelfthPercentage && "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive bg-destructive/5")}
                                />
                                <FieldError message={fieldErrors.twelfthPercentage} />
                            </div>

                            <div className="space-y-1.5">
                                <Label>Active Backlogs? <OptionalBadge /></Label>
                                <Select
                                    value={academic.backlogs}
                                    onValueChange={(val: "Yes" | "No") => {
                                        setAcademic({ ...academic, backlogs: val })
                                        clearFieldError("backlogs")
                                    }}
                                >
                                    <SelectTrigger className={cn("w-full", fieldErrors.backlogs && "border-destructive ring-1 ring-destructive/40")}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="No">No</SelectItem>
                                        <SelectItem value="Yes">Yes</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FieldError message={fieldErrors.backlogs} />
                            </div>

                            {academic.backlogs === "Yes" && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="backlogCount">Backlog Count <MandatoryAsterisk /></Label>
                                    <Input
                                        id="backlogCount"
                                        type="number"
                                        placeholder="1"
                                        value={academic.backlogCount || ""}
                                        onChange={(e) => {
                                            setAcademic({ ...academic, backlogCount: parseInt(e.target.value) || 0 })
                                            clearFieldError("backlogCount")
                                        }}
                                        className={cn(fieldErrors.backlogCount && "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive bg-destructive/5")}
                                    />
                                    <FieldError message={fieldErrors.backlogCount} />
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="primaryLanguage">Primary Language <MandatoryAsterisk /></Label>
                                <Input
                                    id="primaryLanguage"
                                    placeholder="Java, Python, C++, JavaScript, etc."
                                    value={technical.primaryLanguage}
                                    onChange={(e) => {
                                        setTechnical({ ...technical, primaryLanguage: e.target.value })
                                        clearFieldError("primaryLanguage")
                                    }}
                                    className={cn(fieldErrors.primaryLanguage && "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive bg-destructive/5")}
                                />
                                <FieldError message={fieldErrors.primaryLanguage} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="secondaryLanguage">Secondary Language <OptionalBadge /></Label>
                                <Input
                                    id="secondaryLanguage"
                                    placeholder="C++, JavaScript, etc."
                                    value={technical.secondaryLanguage}
                                    onChange={(e) => setTechnical({ ...technical, secondaryLanguage: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="databaseKnowledge">Database Knowledge <OptionalBadge /></Label>
                                <Input
                                    id="databaseKnowledge"
                                    placeholder="SQL, MongoDB, PostgreSQL, etc."
                                    value={technical.databaseKnowledge}
                                    onChange={(e) => setTechnical({ ...technical, databaseKnowledge: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="frameworkExperience">Framework Experience <OptionalBadge /></Label>
                                <Input
                                    id="frameworkExperience"
                                    placeholder="React, Next.js, Spring Boot, etc."
                                    value={technical.frameworkExperience}
                                    onChange={(e) => setTechnical({ ...technical, frameworkExperience: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="githubUrl">GitHub URL <OptionalBadge /></Label>
                                <Input
                                    id="githubUrl"
                                    placeholder="https://github.com/username"
                                    value={technical.githubUrl}
                                    onChange={(e) => setTechnical({ ...technical, githubUrl: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="linkedinUrl">LinkedIn URL <OptionalBadge /></Label>
                                <Input
                                    id="linkedinUrl"
                                    placeholder="https://linkedin.com/in/username"
                                    value={technical.linkedinUrl}
                                    onChange={(e) => setTechnical({ ...technical, linkedinUrl: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label>Git Knowledge? <OptionalBadge /></Label>
                                <Select value={technical.git} onValueChange={(val: "Yes" | "No") => setTechnical({ ...technical, git: val })}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Yes">Yes</SelectItem>
                                        <SelectItem value="No">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Internship Done? <OptionalBadge /></Label>
                                <Select
                                    value={technical.internship}
                                    onValueChange={(val: "Yes" | "No") => {
                                        setTechnical({ ...technical, internship: val })
                                        clearFieldError("internshipDetails")
                                    }}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Yes">Yes</SelectItem>
                                        <SelectItem value="No">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {technical.internship === "Yes" && (
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label htmlFor="internshipDetails">Internship Details <MandatoryAsterisk /></Label>
                                    <Input
                                        id="internshipDetails"
                                        placeholder="Company, Role, Duration"
                                        value={technical.internshipDetails}
                                        onChange={(e) => {
                                            setTechnical({ ...technical, internshipDetails: e.target.value })
                                            clearFieldError("internshipDetails")
                                        }}
                                        className={cn(fieldErrors.internshipDetails && "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive bg-destructive/5")}
                                    />
                                    <FieldError message={fieldErrors.internshipDetails} />
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label>Live Projects? <OptionalBadge /></Label>
                                <Select
                                    value={technical.liveProjects}
                                    onValueChange={(val: "Yes" | "No") => {
                                        setTechnical({ ...technical, liveProjects: val })
                                        clearFieldError("githubLink")
                                    }}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Yes">Yes</SelectItem>
                                        <SelectItem value="No">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {technical.liveProjects === "Yes" && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="githubLink">GitHub Project Link <MandatoryAsterisk /></Label>
                                    <Input
                                        id="githubLink"
                                        placeholder="Project Repository Link"
                                        value={technical.githubLink}
                                        onChange={(e) => {
                                            setTechnical({ ...technical, githubLink: e.target.value })
                                            clearFieldError("githubLink")
                                        }}
                                        className={cn(fieldErrors.githubLink && "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive bg-destructive/5")}
                                    />
                                    <FieldError message={fieldErrors.githubLink} />
                                </div>
                            )}

                            <div className="space-y-1.5 md:col-span-2">
                                <Label htmlFor="portfolio">Portfolio Website <OptionalBadge /></Label>
                                <Input
                                    id="portfolio"
                                    placeholder="https://yourportfolio.com"
                                    value={technical.portfolio}
                                    onChange={(e) => setTechnical({ ...technical, portfolio: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Full-time onsite availability? <OptionalBadge /></Label>
                                    <Select value={availability.fullTimeOnsite} onValueChange={(val: "Yes" | "No") => setAvailability({ ...availability, fullTimeOnsite: val })}>
                                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Yes">Yes</SelectItem>
                                            <SelectItem value="No">No</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Open to Relocate? <OptionalBadge /></Label>
                                    <Select value={availability.relocate} onValueChange={(val: "Yes" | "No") => setAvailability({ ...availability, relocate: val })}>
                                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Yes">Yes</SelectItem>
                                            <SelectItem value="No">No</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 pt-4 border-t">
                                <div className="space-y-2">
                                    <Label className="text-base font-semibold text-muted-foreground flex items-center">
                                        Resume <OptionalBadge />
                                    </Label>
                                    <Label
                                        htmlFor="resume-upload"
                                        className={cn(
                                            "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 border-muted-foreground/20 transition-all",
                                            fieldErrors.resume && "border-destructive bg-destructive/5 ring-1 ring-destructive/30"
                                        )}
                                    >
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            {resumeFile ? (
                                                <div className="flex items-center gap-2 text-primary font-medium">
                                                    <FileText className="h-6 w-6" />
                                                    {resumeFile.name}
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                                                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                    <p className="text-xs text-muted-foreground/60">PDF only (MAX. 2MB) — Optional</p>
                                                </>
                                            )}
                                        </div>
                                        <input
                                            id="resume-upload"
                                            type="file"
                                            className="hidden"
                                            accept=".pdf"
                                            onChange={(e) => {
                                                setResumeFile(e.target.files?.[0] || null)
                                                clearFieldError("resume")
                                            }}
                                        />
                                    </Label>
                                    <FieldError message={fieldErrors.resume} />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-base font-semibold text-muted-foreground">
                                        Internship Certificates <OptionalBadge />
                                    </Label>
                                    <Label
                                        htmlFor="cert-upload"
                                        className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-muted/10 hover:bg-muted/20 border-muted-foreground/10 transition-all text-muted-foreground/60"
                                    >
                                        <div className="flex flex-col items-center justify-center">
                                            {certificateFile ? (
                                                <div className="flex items-center gap-2 text-primary font-medium">
                                                    <FileText className="h-5 w-5" />
                                                    {certificateFile.name}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <Upload className="w-5 h-5" />
                                                    <span className="text-sm">Optional Certificates (PDF, max 2MB)</span>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            id="cert-upload"
                                            type="file"
                                            className="hidden"
                                            accept=".pdf"
                                            onChange={(e) => {
                                                setCertificateFile(e.target.files?.[0] || null)
                                                clearFieldError("certificate")
                                            }}
                                        />
                                    </Label>
                                    <FieldError message={fieldErrors.certificate} />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="space-y-6">
                            <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-lg font-bold">Registration Declaration</Label>
                                    <span className="text-xs text-destructive font-medium">* All declarations are mandatory</span>
                                </div>

                                <div className="space-y-3">
                                    <div className={cn(
                                        "flex items-start gap-3 p-2.5 rounded-lg border transition-all",
                                        fieldErrors.confirmTestIdentity ? "border-destructive/50 bg-destructive/10 ring-1 ring-destructive/30" : "border-transparent bg-background/50 hover:bg-background/80"
                                    )}>
                                        <input
                                            type="checkbox"
                                            id="confirmTestIdentity"
                                            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                                            checked={declaration.confirmTestIdentity}
                                            onChange={(e) => {
                                                setDeclaration({ ...declaration, confirmTestIdentity: e.target.checked })
                                                clearFieldError("confirmTestIdentity")
                                            }}
                                        />
                                        <div className="space-y-0.5">
                                            <Label htmlFor="confirmTestIdentity" className="text-sm font-medium leading-relaxed cursor-pointer block">
                                                I confirm this test is taken by me and all information provided is accurate. <MandatoryAsterisk />
                                            </Label>
                                            <FieldError message={fieldErrors.confirmTestIdentity} />
                                        </div>
                                    </div>

                                    <div className={cn(
                                        "flex items-start gap-3 p-2.5 rounded-lg border transition-all",
                                        fieldErrors.noUnfairMeans ? "border-destructive/50 bg-destructive/10 ring-1 ring-destructive/30" : "border-transparent bg-background/50 hover:bg-background/80"
                                    )}>
                                        <input
                                            type="checkbox"
                                            id="noUnfairMeans"
                                            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                                            checked={declaration.noUnfairMeans}
                                            onChange={(e) => {
                                                setDeclaration({ ...declaration, noUnfairMeans: e.target.checked })
                                                clearFieldError("noUnfairMeans")
                                            }}
                                        />
                                        <div className="space-y-0.5">
                                            <Label htmlFor="noUnfairMeans" className="text-sm font-medium leading-relaxed cursor-pointer block">
                                                I agree not to use any unfair means or external help during the assessment. <MandatoryAsterisk />
                                            </Label>
                                            <FieldError message={fieldErrors.noUnfairMeans} />
                                        </div>
                                    </div>

                                    <div className={cn(
                                        "flex items-start gap-3 p-2.5 rounded-lg border transition-all",
                                        fieldErrors.webcamPermission ? "border-destructive/50 bg-destructive/10 ring-1 ring-destructive/30" : "border-transparent bg-background/50 hover:bg-background/80"
                                    )}>
                                        <input
                                            type="checkbox"
                                            id="webcamPermission"
                                            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                                            checked={declaration.webcamPermission}
                                            onChange={(e) => {
                                                setDeclaration({ ...declaration, webcamPermission: e.target.checked })
                                                clearFieldError("webcamPermission")
                                            }}
                                        />
                                        <div className="space-y-0.5">
                                            <Label htmlFor="webcamPermission" className="text-sm font-medium leading-relaxed cursor-pointer block">
                                                I give permission for webcam access for proctoring purposes. <MandatoryAsterisk />
                                            </Label>
                                            <FieldError message={fieldErrors.webcamPermission} />
                                        </div>
                                    </div>

                                    <div className={cn(
                                        "flex items-start gap-3 p-2.5 rounded-lg border transition-all",
                                        fieldErrors.screenMonitoringConsent ? "border-destructive/50 bg-destructive/10 ring-1 ring-destructive/30" : "border-transparent bg-background/50 hover:bg-background/80"
                                    )}>
                                        <input
                                            type="checkbox"
                                            id="screenMonitoringConsent"
                                            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                                            checked={declaration.screenMonitoringConsent}
                                            onChange={(e) => {
                                                setDeclaration({ ...declaration, screenMonitoringConsent: e.target.checked })
                                                clearFieldError("screenMonitoringConsent")
                                            }}
                                        />
                                        <div className="space-y-0.5">
                                            <Label htmlFor="screenMonitoringConsent" className="text-sm font-medium leading-relaxed cursor-pointer block">
                                                I consent to screen monitoring and recording during the assessment. <MandatoryAsterisk />
                                            </Label>
                                            <FieldError message={fieldErrors.screenMonitoringConsent} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-primary/5 rounded-lg border border-primary/20 p-4 flex items-center gap-3">
                                <AlertCircle className="h-5 w-5 text-primary shrink-0" />
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    By clicking &apos;Complete Registration&apos;, you understand that any violation of the above rules may lead to immediate disqualification.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-6 bg-muted/5">
                <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={step === 1 || loading}
                    className="gap-2"
                >
                    <ArrowLeft className="h-4 w-4" /> Previous
                </Button>

                {step < 5 ? (
                    <Button onClick={nextStep} className="gap-2">
                        Next Step <ArrowRight className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button onClick={handleSubmit} disabled={loading} className="gap-2 bg-primary">
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" /> Registering...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-4 w-4" /> Complete Registration
                            </>
                        )}
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
