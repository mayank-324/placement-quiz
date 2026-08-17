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

export default function RegisterForm() {
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
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

    const validateFiles = () => {
        if (resumeFile) {
            if (resumeFile.size > 2 * 1024 * 1024) {
                setError("Resume size must be less than 2MB.")
                return false
            }
            if (resumeFile.type !== "application/pdf") {
                setError("Resume must be a PDF file.")
                return false
            }
        }
        if (certificateFile && certificateFile.size > 2 * 1024 * 1024) {
            setError("Certificate size must be less than 2MB.")
            return false
        }
        return true
    }

    const nextStep = () => {
        if (step === 1) {
            if (!basic.fullName || !basic.personalEmail || !basic.mobile || !basic.dob || !basic.currentCity || !basic.permanentAddress || !password) {
                setError("Please fill all mandatory fields.")
                return
            }
            if (password !== confirmPassword) {
                setError("Passwords do not match.")
                return
            }
        }
        if (step === 2) {
            if (!academic.college || !academic.university || !academic.degree || !academic.branch || !academic.yearOfPassing || !academic.cgpa || !academic.tenthPercentage || !academic.twelfthPercentage) {
                setError("Please fill all mandatory fields.")
                return
            }
            if (academic.cgpa < 7.0) {
                setError("Sorry, your CGPA must be 7.0 or above to register.")
                return
            }
            if (academic.backlogs === "Yes" && (academic.backlogCount || 0) > 1) {
                setError("Sorry, you must have no active backlogs to register.")
                return
            }
        }
        if (step === 3) {
            if (!technical.primaryLanguage) {
                setError("Please fill all mandatory fields.")
                return
            }
        }
        if (step === 4) {
            if (!validateFiles()) return
        }

        setError(null)
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

        if (!declaration.confirmTestIdentity || !declaration.noUnfairMeans || !declaration.webcamPermission || !declaration.screenMonitoringConsent) {
            setError("Please agree to all declarations and permissions to proceed.")
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
                        mobile: basic.mobile,
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
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    {step === 1 && "Basic Information"}
                    {step === 2 && "Academic Information"}
                    {step === 3 && "Technical Information"}
                    {step === 4 && "Availability & Documents"}
                    {step === 5 && "Declaration & Consent"}
                </CardTitle>
                <CardDescription>
                    Step {step} of 5
                </CardDescription>
            </CardHeader>
            <CardContent>
                {error && (
                    <div className="mb-4 p-3 rounded-md bg-destructive/15 text-destructive text-sm flex items-center gap-2 border border-destructive/20 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {step === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input
                                    placeholder="John Doe"
                                    value={basic.fullName}
                                    onChange={(e) => setBasic({ ...basic, fullName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Personal Email</Label>
                                <Input
                                    type="email"
                                    placeholder="john@example.com"
                                    value={basic.personalEmail}
                                    onChange={(e) => setBasic({ ...basic, personalEmail: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Mobile (with country code)</Label>
                                <Input
                                    placeholder="+91 9876543210"
                                    value={basic.mobile}
                                    onChange={(e) => setBasic({ ...basic, mobile: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Date of Birth</Label>
                                <Input
                                    type="date"
                                    value={basic.dob}
                                    onChange={(e) => setBasic({ ...basic, dob: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Current City</Label>
                                <Input
                                    placeholder="New York"
                                    value={basic.currentCity}
                                    onChange={(e) => setBasic({ ...basic, currentCity: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Gender (Optional)</Label>
                                <Select value={basic.gender} onValueChange={(val) => setBasic({ ...basic, gender: val })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Permanent Address</Label>
                                <Input
                                    placeholder="Full Address"
                                    value={basic.permanentAddress}
                                    onChange={(e) => setBasic({ ...basic, permanentAddress: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Password</Label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Confirm Password</Label>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>College</Label>
                                <Input
                                    placeholder="College Name"
                                    value={academic.college}
                                    onChange={(e) => setAcademic({ ...academic, college: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>University</Label>
                                <Input
                                    placeholder="University Name"
                                    value={academic.university}
                                    onChange={(e) => setAcademic({ ...academic, university: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Degree</Label>
                                <Input
                                    placeholder="B.Tech, MCA, etc."
                                    value={academic.degree}
                                    onChange={(e) => setAcademic({ ...academic, degree: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Branch</Label>
                                <Input
                                    placeholder="CSE, ECE, etc."
                                    value={academic.branch}
                                    onChange={(e) => setAcademic({ ...academic, branch: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Year of Passing</Label>
                                <Input
                                    type="number"
                                    placeholder="2025"
                                    value={academic.yearOfPassing}
                                    onChange={(e) => setAcademic({ ...academic, yearOfPassing: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>CGPA</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="8.5"
                                    value={academic.cgpa || ""}
                                    onChange={(e) => setAcademic({ ...academic, cgpa: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>10th %</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="90"
                                    value={academic.tenthPercentage || ""}
                                    onChange={(e) => setAcademic({ ...academic, tenthPercentage: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>12th %</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="90"
                                    value={academic.twelfthPercentage || ""}
                                    onChange={(e) => setAcademic({ ...academic, twelfthPercentage: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Active Backlogs?</Label>
                                <Select value={academic.backlogs} onValueChange={(val: "Yes" | "No") => setAcademic({ ...academic, backlogs: val })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Yes">Yes</SelectItem>
                                        <SelectItem value="No">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {academic.backlogs === "Yes" && (
                                <div className="space-y-2">
                                    <Label>Backlog Count</Label>
                                    <Input
                                        type="number"
                                        value={academic.backlogCount || ""}
                                        onChange={(e) => setAcademic({ ...academic, backlogCount: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Primary Language</Label>
                                <Input
                                    placeholder="Java, Python, etc."
                                    value={technical.primaryLanguage}
                                    onChange={(e) => setTechnical({ ...technical, primaryLanguage: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Secondary Language</Label>
                                <Input
                                    placeholder="C++, JavaScript, etc."
                                    value={technical.secondaryLanguage}
                                    onChange={(e) => setTechnical({ ...technical, secondaryLanguage: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Database Knowledge</Label>
                                <Input
                                    placeholder="SQL, MongoDB, etc."
                                    value={technical.databaseKnowledge}
                                    onChange={(e) => setTechnical({ ...technical, databaseKnowledge: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Framework Experience</Label>
                                <Input
                                    placeholder="React, Spring Boot, etc."
                                    value={technical.frameworkExperience}
                                    onChange={(e) => setTechnical({ ...technical, frameworkExperience: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>GitHub URL</Label>
                                <Input
                                    placeholder="https://github.com/..."
                                    value={technical.githubUrl}
                                    onChange={(e) => setTechnical({ ...technical, githubUrl: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>LinkedIn URL</Label>
                                <Input
                                    placeholder="https://linkedin.com/in/..."
                                    value={technical.linkedinUrl}
                                    onChange={(e) => setTechnical({ ...technical, linkedinUrl: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Git Knowledge?</Label>
                                <Select value={technical.git} onValueChange={(val: "Yes" | "No") => setTechnical({ ...technical, git: val })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Yes">Yes</SelectItem>
                                        <SelectItem value="No">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Internship Done?</Label>
                                <Select value={technical.internship} onValueChange={(val: "Yes" | "No") => setTechnical({ ...technical, internship: val })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Yes">Yes</SelectItem>
                                        <SelectItem value="No">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {technical.internship === "Yes" && (
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Internship Details</Label>
                                    <Input
                                        placeholder="Company, Role, Duration"
                                        value={technical.internshipDetails}
                                        onChange={(e) => setTechnical({ ...technical, internshipDetails: e.target.value })}
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label>Live Projects?</Label>
                                <Select value={technical.liveProjects} onValueChange={(val: "Yes" | "No") => setTechnical({ ...technical, liveProjects: val })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Yes">Yes</SelectItem>
                                        <SelectItem value="No">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {technical.liveProjects === "Yes" && (
                                <div className="space-y-2">
                                    <Label>GitHub Project Link</Label>
                                    <Input
                                        placeholder="Project Repository Link"
                                        value={technical.githubLink}
                                        onChange={(e) => setTechnical({ ...technical, githubLink: e.target.value })}
                                    />
                                </div>
                            )}
                            <div className="space-y-2 md:col-span-2">
                                <Label>Portfolio (Optional)</Label>
                                <Input
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
                                <div className="space-y-2">
                                    <Label>Full-time onsite availability?</Label>
                                    <Select value={availability.fullTimeOnsite} onValueChange={(val: "Yes" | "No") => setAvailability({ ...availability, fullTimeOnsite: val })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Yes">Yes</SelectItem>
                                            <SelectItem value="No">No</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Open to Relocate?</Label>
                                    <Select value={availability.relocate} onValueChange={(val: "Yes" | "No") => setAvailability({ ...availability, relocate: val })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Yes">Yes</SelectItem>
                                            <SelectItem value="No">No</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 pt-4 border-t">
                                <div className="space-y-3">
                                    <Label className="text-base font-semibold">Resume (PDF, max 2MB) *</Label>
                                    <Label
                                        htmlFor="resume-upload"
                                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 border-muted-foreground/20 transition-all"
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
                                                    <p className="text-xs text-muted-foreground/60">PDF only (MAX. 2MB)</p>
                                                </>
                                            )}
                                        </div>
                                        <input
                                            id="resume-upload"
                                            type="file"
                                            className="hidden"
                                            accept=".pdf"
                                            onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                                        />
                                    </Label>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-base font-semibold text-muted-foreground italic">Internship Certificates (Optional)</Label>
                                    <Label
                                        htmlFor="cert-upload"
                                        className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-muted/10 hover:bg-muted/20 border-muted-foreground/10 transition-all text-muted-foreground/50"
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
                                                    <span className="text-sm">Optional Certificates</span>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            id="cert-upload"
                                            type="file"
                                            className="hidden"
                                            accept=".pdf"
                                            onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                                        />
                                    </Label>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="space-y-6">
                            <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
                                <Label className="text-lg font-bold">Registration Declaration</Label>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            id="confirmTestIdentity"
                                            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            checked={declaration.confirmTestIdentity}
                                            onChange={(e) => setDeclaration({ ...declaration, confirmTestIdentity: e.target.checked })}
                                        />
                                        <Label htmlFor="confirmTestIdentity" className="text-sm font-medium leading-relaxed cursor-pointer">
                                            I confirm this test is taken by me and all information provided is accurate.
                                        </Label>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            id="noUnfairMeans"
                                            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            checked={declaration.noUnfairMeans}
                                            onChange={(e) => setDeclaration({ ...declaration, noUnfairMeans: e.target.checked })}
                                        />
                                        <Label htmlFor="noUnfairMeans" className="text-sm font-medium leading-relaxed cursor-pointer">
                                            I agree not to use any unfair means or external help during the assessment.
                                        </Label>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            id="webcamPermission"
                                            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            checked={declaration.webcamPermission}
                                            onChange={(e) => setDeclaration({ ...declaration, webcamPermission: e.target.checked })}
                                        />
                                        <Label htmlFor="webcamPermission" className="text-sm font-medium leading-relaxed cursor-pointer">
                                            I give permission for webcam access for proctoring purposes.
                                        </Label>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            id="screenMonitoringConsent"
                                            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            checked={declaration.screenMonitoringConsent}
                                            onChange={(e) => setDeclaration({ ...declaration, screenMonitoringConsent: e.target.checked })}
                                        />
                                        <Label htmlFor="screenMonitoringConsent" className="text-sm font-medium leading-relaxed cursor-pointer">
                                            I consent to screen monitoring and recording during the assessment.
                                        </Label>
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
