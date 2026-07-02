import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Copy, Check, Share2, Plus, Loader2 } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { useNavigate } from "react-router-dom";
import WaveformLoader from "@/components/WaveformLoader";
import { createInviteCode, getExistingInviteCode } from "@/hooks/useInviteCode";
import { useCountUp } from "@/hooks/useCountUp";

type Student = {
  id: string;
  full_name: string | null;
  last_practice: string | null;
  exercise_count: number;
};

const daysSince = (iso: string | null): number =>
  iso === null ? Number.MAX_SAFE_INTEGER : Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

const getInitials = (name: string | null): string =>
  (name ?? "?")
    .split(" ")
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

const TeacherDashboard = () => {
  const { session } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);

  const handleGenerateCode = async () => {
    if (!session) return;
    setCodeLoading(true);
    try {
      const code = await createInviteCode(session.user.id);
      setInviteCode(code);
    } finally {
      setCodeLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteCode) return;
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const closeAddStudentModal = () => {
    setAddStudentOpen(false);
    setInviteEmail("");
    setInviteError("");
    setInviteSuccess(false);
  };

  const handleInviteStudent = async () => {
    if (!session || !inviteEmail.trim()) return;
    setInviteLoading(true);
    setInviteError("");
    try {
      const { error } = await (supabase as any)
        .from("student_invites")
        .insert({ teacher_id: session.user.id, email: inviteEmail.trim(), status: "pending" });
      if (error) throw error;
      setInviteSuccess(true);
      setTimeout(() => closeAddStudentModal(), 2000);
    } catch (err: any) {
      setInviteError(err.message || "Something went wrong. Please try again.");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleShare = async () => {
    if (!inviteCode) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my FretGym class",
          text: `Use code ${inviteCode} to join my class on FretGym.`,
        });
      } catch {
        // user cancelled — do nothing
      }
    } else {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    const fetchStudents = async () => {
      if (!session) return;

      const existing = await getExistingInviteCode(session.user.id);
      if (existing) setInviteCode(existing);

      const { data: teacherProfile } = await (supabase as any)
        .from("profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .single();
      const fullName: string | null = teacherProfile?.full_name ?? null;
      setFirstName(fullName ? fullName.split(" ")[0] : null);

      const { data: profiles } = await (supabase as any)
        .from("profiles")
        .select("id, full_name")
        .eq("teacher_id", session.user.id);

      if (!profiles) { setLoading(false); return; }

      const enriched = await Promise.all(
        profiles.map(async (student: { id: string; full_name: string | null }) => {
          const [{ data: sessions }, { data: exercises }] = await Promise.all([
            supabase
              .from("sessions")
              .select("created_at")
              .eq("user_id", student.id)
              .order("created_at", { ascending: false })
              .limit(1),
            supabase
              .from("exercises")
              .select("id")
              .eq("user_id", student.id),
          ]);

          return {
            id: student.id,
            full_name: student.full_name,
            last_practice: sessions?.[0]?.created_at ?? null,
            exercise_count: exercises?.length ?? 0,
          };
        })
      );

      setStudents(enriched);
      setLoading(false);
    };

    fetchStudents();
  }, [session]);

  const formatDate = (date: string | null) => {
    if (!date) return "No activity yet";
    return new Date(date).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
  };

  // Attention grouping — on-track practiced within 7 days, the rest need a nudge
  const onTrack = students
    .filter(s => daysSince(s.last_practice) <= 7)
    .sort((a, b) => daysSince(a.last_practice) - daysSince(b.last_practice));
  const needsNudge = students
    .filter(s => daysSince(s.last_practice) > 7)
    .sort((a, b) => daysSince(b.last_practice) - daysSince(a.last_practice));

  const activeThisWeek = useCountUp(onTrack.length, !loading);

  const renderStudentCard = (student: Student, idx: number) => {
    const d = daysSince(student.last_practice);
    const isHovered = hoveredId === student.id;
    const gradient =
      d <= 2
        ? `radial-gradient(circle at top right, rgba(34,197,94,${isHovered ? 0.3 : 0.2}) 0%, rgba(0,0,0,0.55) 60%)`
        : d <= 7
        ? `radial-gradient(circle at top right, rgba(234,179,8,${isHovered ? 0.28 : 0.18}) 0%, rgba(0,0,0,0.55) 60%)`
        : `radial-gradient(circle at top right, rgba(255,255,255,${isHovered ? 0.1 : 0.05}) 0%, rgba(0,0,0,0.55) 60%)`;

    return (
      <div
        key={student.id}
        onClick={() => navigate(`/teacher/student/${student.id}`)}
        onMouseEnter={() => setHoveredId(student.id)}
        onMouseLeave={() => setHoveredId(null)}
        className="rounded-2xl p-5 flex items-center justify-between cursor-pointer relative overflow-hidden"
        style={{
          background: gradient,
          border: isHovered ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(255,255,255,0.08)",
          transform: isHovered ? "translateY(-2px)" : "translateY(0)",
          boxShadow: isHovered ? "0 8px 24px rgba(0,0,0,0.4)" : "none",
          transition: "all 200ms ease",
          animation: "fadeUp 400ms ease-out backwards",
          animationDelay: `${280 + idx * 60}ms`,
        }}
      >
        {/* Ghost initials */}
        <span
          className="absolute font-black text-white select-none pointer-events-none leading-none"
          style={{ fontSize: "56px", opacity: 0.05, top: "-6px", right: "-2px" }}
        >
          {getInitials(student.full_name)}
        </span>

        <div className="min-w-0 relative">
          <div className="flex items-center gap-2">
            <p className="text-base font-semibold text-foreground truncate">
              {student.full_name ?? "Unnamed Student"}
            </p>
            {d <= 2 && (
              <span
                className="w-2 h-2 rounded-full bg-primary shrink-0"
                style={{ animation: "pulseDot 2s ease-in-out infinite" }}
              />
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
              Last active: {formatDate(student.last_practice)}
            </p>
            {d > 2 && d <= 7 && (
              <span className="text-[10px] font-semibold tracking-widest uppercase text-amber-500 shrink-0">Going quiet</span>
            )}
            {d > 7 && (
              <span className="text-[10px] font-semibold tracking-widest uppercase text-amber-500 shrink-0">Check in</span>
            )}
          </div>
        </div>
        <div className="text-right relative">
          <p className="text-xl font-bold text-foreground">{student.exercise_count}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Exercises</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <WaveformLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-10">
      <AppHeader />

      <main className="container mx-auto px-4 py-6 space-y-6">

        {firstName && (
          <p className="text-2xl font-bold mb-4" style={{ animation: "fadeUp 400ms ease-out both" }}>
            {(() => {
              const hour = new Date().getHours();
              return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
            })()}, {firstName}.
          </p>
        )}

        {/* Class pulse hero */}
        <section
          className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
          style={{
            background: "hsl(var(--card))",
            border: "1px solid rgba(255,255,255,0.05)",
            animation: "fadeUp 400ms ease-out both",
            animationDelay: "70ms",
          }}
        >
          {/* Ambient drifting glow */}
          <div
            className="absolute pointer-events-none"
            style={{
              inset: "-40%",
              background: "radial-gradient(circle at 70% 25%, rgba(34,197,94,0.22) 0%, transparent 55%)",
              animation: "heroDrift 9s ease-in-out infinite alternate",
            }}
          />
          <div className="relative">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-3">This Week</p>
            <div className="flex items-end gap-3">
              <span
                className="text-6xl sm:text-8xl font-black text-primary leading-none"
                style={{ textShadow: "0 0 40px hsl(var(--primary) / 0.4)" }}
              >
                {activeThisWeek}
              </span>
              <span className="text-2xl font-semibold text-muted-foreground mb-3 whitespace-nowrap">
                of {students.length} practiced
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {students.length === 0
                ? "Invite your first student to get started."
                : needsNudge.length === 0
                ? "Your whole class practiced this week — on fire."
                : `${needsNudge.length} student${needsNudge.length === 1 ? " is" : "s are"} going quiet — check in.`}
            </p>
          </div>
        </section>

        {/* Title row */}
        <div
          className="flex items-center justify-between gap-4"
          style={{ animation: "fadeUp 400ms ease-out both", animationDelay: "140ms" }}
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">My Students</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {students.length} {students.length === 1 ? "student" : "students"}
            </p>
          </div>
          <button
            onClick={() => setAddStudentOpen(true)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={12} /> Add Student
          </button>
        </div>

        {/* Invite code card */}
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{
            background: "radial-gradient(circle at top right, rgba(34,197,94,0.08) 0%, transparent 60%), hsl(var(--card))",
            border: "1px solid rgba(255,255,255,0.05)",
            animation: "fadeUp 400ms ease-out both",
            animationDelay: "210ms",
          }}
        >
          <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
            Student Invite Code
          </p>
          {inviteCode ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div
                  className="flex-1 flex items-center justify-center rounded-xl py-4"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <span className="text-2xl font-mono font-semibold tracking-[0.3em] text-foreground">
                    {inviteCode.split("").map((ch, i) => (
                      <span
                        key={`${inviteCode}-${i}`}
                        className="inline-block"
                        style={{ animation: "fadeUp 300ms ease-out both", animationDelay: `${i * 60}ms` }}
                      >
                        {ch}
                      </span>
                    ))}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleCopy}
                    className="p-3 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-3 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
              <button
                onClick={handleGenerateCode}
                disabled={codeLoading}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
              >
                {codeLoading ? "Generating…" : "Regenerate"}
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerateCode}
              disabled={codeLoading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-opacity disabled:opacity-50"
            >
              {codeLoading ? "Generating…" : "Generate Invite Code"}
            </button>
          )}
          <p className="text-xs text-muted-foreground">
            Share this code with your students to link them to your account.
          </p>
        </div>

        {/* Student list */}
        {students.length === 0 ? (
          <div className="rounded-2xl p-10 text-center text-sm text-muted-foreground"
            style={{
              border: "1px solid rgba(255,255,255,0.05)",
              background: "hsl(var(--card))",
              animation: "fadeUp 400ms ease-out both",
              animationDelay: "280ms",
            }}>
            No students yet. Add a student to get started.
          </div>
        ) : (
          <div className="space-y-6">
            {onTrack.length > 0 && (
              <div className="space-y-3">
                {onTrack.map((student, i) => renderStudentCard(student, i))}
              </div>
            )}
            {needsNudge.length > 0 && (
              <div>
                <p
                  className="text-xs font-semibold tracking-widest uppercase text-amber-500 mb-3"
                  style={{ animation: "fadeUp 400ms ease-out backwards", animationDelay: `${280 + onTrack.length * 60}ms` }}
                >
                  Needs a nudge
                </p>
                <div className="space-y-3">
                  {needsNudge.map((student, i) => renderStudentCard(student, onTrack.length + i))}
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Add Student modal */}
      {addStudentOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={closeAddStudentModal}
        >
          <div
            className="w-full max-w-sm mx-4 rounded-2xl p-6 space-y-4"
            style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.08)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-base font-semibold text-foreground">Add Student</p>

            {inviteSuccess ? (
              <p className="text-sm text-primary py-4 text-center">
                Invite saved — ask them to sign up and enter your teacher code to connect.
              </p>
            ) : (
              <>
                <input
                  type="email"
                  placeholder="student@email.com"
                  value={inviteEmail}
                  onChange={(e) => { setInviteEmail(e.target.value); setInviteError(""); }}
                  className="w-full rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground bg-transparent focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                  autoFocus
                />
                {inviteError && (
                  <p className="text-xs text-destructive">{inviteError}</p>
                )}
                <button
                  onClick={handleInviteStudent}
                  disabled={inviteLoading || !inviteEmail.trim()}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {inviteLoading ? <Loader2 size={16} className="animate-spin" /> : "Send Invite"}
                </button>
                <button
                  onClick={closeAddStudentModal}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes heroDrift { from { transform: translate(0, 0); } to { transform: translate(-6%, 5%); } }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
        }
        @media (prefers-reduced-motion: reduce) {
          main *, main { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
        }
      `}</style>
    </div>
  );
};

export default TeacherDashboard;
