"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, Download, ExternalLink, Mail, GraduationCap, Code2, FileText, CheckCircle2 } from "lucide-react"

interface ProfileRecord {
    id?: string;
    user_id?: string;
    full_name: string;
    personal_email: string;
    mobile: string;
    dob: string;
    current_city: string;
    permanent_address: string;
    gender?: string;
    college: string;
    university: string;
    degree: string;
    branch: string;
    year_of_passing: string;
    cgpa: number;
    tenth_percentage: number;
    twelfth_percentage: number;
    backlogs: string;
    backlog_count?: number;
    primary_language: string;
    secondary_language: string;
    database_knowledge: string;
    framework_experience: string;
    git: string;
    internship: string;
    internship_details?: string;
    live_projects: string;
    github_link?: string;
    github_url?: string;
    linkedin_url?: string;
    portfolio?: string;
    resume_url?: string;
    certificates_url?: string;
    full_time_onsite: string;
    notice_period?: string;
    expected_salary?: string;
    relocate: string;
    confirm_test_identity: boolean;
    no_unfair_means: boolean;
    webcam_permission: boolean;
    screen_monitoring_consent: boolean;
}

export default function StudentProfilePage() {
    const { id } = useParams()
    const router = useRouter()
    const [profile, setProfile] = useState<ProfileRecord | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/auth/me')
                if (!res.ok) {
                    router.push('/')
                    return
                }
                const { user } = await res.json()
                if (user?.role !== 'admin') {
                    router.push('/')
                    return
                }

                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('user_id', id)
                    .single()

                if (error) throw error
                setProfile(data)
            } catch (err) {
                console.error("Error fetching profile:", err)
            } finally {
                setLoading(false)
            }
        }

        if (id) fetchProfile()
    }, [id, router])

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <h2 className="text-2xl font-bold">Profile not found</h2>
                <Button onClick={() => router.push('/admin')}>Back to Dashboard</Button>
            </div>
        )
    }

    return (
        <main className="min-h-screen p-4 md:p-8 bg-zinc-950 text-zinc-100">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="outline" size="icon" onClick={() => router.push('/admin')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{profile.full_name}</h1>
                        <p className="text-zinc-500">Student Profile Details</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Basic Info */}
                    <Card className="md:col-span-1 bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Mail className="h-4 w-4 text-blue-400" /> Basic Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="space-y-1">
                                <p className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider">Email</p>
                                <p>{profile.personal_email}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider">Mobile</p>
                                <p>{profile.mobile}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider">DOB</p>
                                <p>{profile.dob}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider">Current City</p>
                                <p>{profile.current_city}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider">Gender</p>
                                <p>{profile.gender || "Not specified"}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider">Permanent Address</p>
                                <p className="line-clamp-3">{profile.permanent_address}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Academic Info */}
                    <Card className="md:col-span-2 bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <GraduationCap className="h-4 w-4 text-purple-400" /> Academic Background
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                                <div className="space-y-1 md:col-span-2">
                                    <p className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider">College</p>
                                    <p className="font-semibold">{profile.college}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider">Passout Year</p>
                                    <p>{profile.year_of_passing}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider">Degree</p>
                                    <p>{profile.degree}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider">Branch</p>
                                    <p>{profile.branch}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider">CGPA</p>
                                    <p className="text-primary font-bold">{profile.cgpa}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider">10th %</p>
                                    <p>{profile.tenth_percentage}%</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider">12th %</p>
                                    <p>{profile.twelfth_percentage}%</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider">Backlogs</p>
                                    <p className={profile.backlogs === "Yes" ? "text-red-400" : "text-green-400"}>
                                        {profile.backlogs} {profile.backlogs === "Yes" && `(${profile.backlog_count})`}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Technical Info */}
                    <Card className="md:col-span-2 bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Code2 className="h-4 w-4 text-green-400" /> Technical Skills & Projects
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider">Primary Language</p>
                                        <p>{profile.primary_language}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider">Secondary Language</p>
                                        <p>{profile.secondary_language}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider">Framework Experience</p>
                                        <p>{profile.framework_experience}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider">Database Knowledge</p>
                                        <p>{profile.database_knowledge}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider">Links</p>
                                        <div className="space-y-2 pt-1">
                                            <a href={profile.github_url} target="_blank" className="flex items-center gap-2 text-blue-400 hover:underline">
                                                <ExternalLink className="h-3 w-3" /> GitHub
                                            </a>
                                            <a href={profile.linkedin_url} target="_blank" className="flex items-center gap-2 text-blue-400 hover:underline">
                                                <ExternalLink className="h-3 w-3" /> LinkedIn
                                            </a>
                                            {profile.portfolio && (
                                                <a href={profile.portfolio} target="_blank" className="flex items-center gap-2 text-blue-400 hover:underline">
                                                    <ExternalLink className="h-3 w-3" /> Portfolio
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider">Git Knowledge</p>
                                        <p>{profile.git}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider">Live Projects</p>
                                        <p>{profile.live_projects === "Yes" ? (
                                            <a href={profile.github_link} target="_blank" className="text-blue-400 hover:underline">
                                                View Project
                                            </a>
                                        ) : "No"}</p>
                                    </div>
                                </div>
                                <div className="space-y-1 md:col-span-2 pt-2 border-t border-zinc-800">
                                    <p className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider">Internship Details</p>
                                    <p>{profile.internship === "Yes" ? profile.internship_details : "No internship reported"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Documents & Availability */}
                    <Card className="md:col-span-1 bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="h-4 w-4 text-orange-400" /> Documents & Availability
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 text-sm">
                            <div className="space-y-3">
                                <p className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider">Files</p>
                                {profile.resume_url ? (
                                    <a
                                        href={profile.resume_url}
                                        target="_blank"
                                        className="flex items-center justify-between p-2 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors"
                                    >
                                        <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Resume.pdf</span>
                                        <Download className="h-3 w-3" />
                                    </a>
                                ) : (
                                    <p className="text-red-400">Resume Missing</p>
                                )}
                                {profile.certificates_url && (
                                    <a
                                        href={profile.certificates_url}
                                        target="_blank"
                                        className="flex items-center justify-between p-2 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors"
                                    >
                                        <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Certificates.pdf</span>
                                        <Download className="h-3 w-3" />
                                    </a>
                                )}
                            </div>

                            <div className="space-y-3 pt-4 border-t border-zinc-800">
                                <p className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider">Availability</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] text-zinc-500">Onsite</p>
                                        <p>{profile.full_time_onsite}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-zinc-500">Notice</p>
                                        <p>{profile.notice_period}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-zinc-500">Salary</p>
                                        <p>{profile.expected_salary || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-zinc-500">Relocate</p>
                                        <p>{profile.relocate}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Declaration Status */}
                    <Card className="md:col-span-3 bg-zinc-900/50 border-zinc-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" /> Consent & Declaration Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                                <div className={`p-2 rounded border flex items-center gap-2 ${profile.confirm_test_identity ? "border-green-500/20 bg-green-500/5 text-green-400" : "border-red-500/20 bg-red-500/5 text-red-400"}`}>
                                    <CheckCircle2 className="h-3 w-3" /> Identity Confirmed
                                </div>
                                <div className={`p-2 rounded border flex items-center gap-2 ${profile.no_unfair_means ? "border-green-500/20 bg-green-500/5 text-green-400" : "border-red-500/20 bg-red-500/5 text-red-400"}`}>
                                    <CheckCircle2 className="h-3 w-3" /> No Unfair Means
                                </div>
                                <div className={`p-2 rounded border flex items-center gap-2 ${profile.webcam_permission ? "border-green-500/20 bg-green-500/5 text-green-400" : "border-red-500/20 bg-red-500/5 text-red-400"}`}>
                                    <CheckCircle2 className="h-3 w-3" /> Webcam Allowed
                                </div>
                                <div className={`p-2 rounded border flex items-center gap-2 ${profile.screen_monitoring_consent ? "border-green-500/20 bg-green-500/5 text-green-400" : "border-red-500/20 bg-red-500/5 text-red-400"}`}>
                                    <CheckCircle2 className="h-3 w-3" /> Screen Monitored
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    )
}
