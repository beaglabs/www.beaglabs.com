import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Delete Account — Gardens",
  description:
    "How to permanently delete your Gardens account and what data is removed.",
}

const deletedData = [
  "Your user row and authentication artifacts (sessions, key packages, auth challenges)",
  "Group memberships, MLS membership records, bans, blocks, and invites created by your account",
  "Notifications addressed to you and notifications authored by your username",
  "All direct-message threads that include your account, plus DM messages in those threads",
  "All group messages authored by your account",
  "Any groups created by your account (full group cascade)",
  "Best-effort deletion of your avatar and avatars for groups you created in object storage",
]

export default function DeleteAccountPage() {
  return (
    <main className="bg-[#141414] min-h-screen">
      <div className="border-b border-[#F5E6C8]/10">
        <div className="max-w-4xl mx-auto px-8 py-6 flex items-center justify-between">
          <Link
            href="/"
            className="font-mono text-sm text-[#F5E6C8]/60 hover:text-[#F5E6C8] transition-colors"
          >
            ← GARDENS
          </Link>
          <span className="font-mono text-xs text-[#F5E6C8]/30">
            ACCOUNT DELETION
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-20">
        <div className="mb-16">
          <div className="font-mono text-xs text-[#F5E6C8]/40 mb-4 tracking-widest">
            LEGAL / ACCOUNT
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-[#F5E6C8] tracking-tight mb-6">
            Delete Your Account
          </h1>
          <div className="flex items-center gap-6 font-mono text-xs text-[#F5E6C8]/40">
            <span>EFFECTIVE: MARCH 31, 2026</span>
            <span className="text-[#F5E6C8]/20">|</span>
            <span>LAST UPDATED: MARCH 31, 2026</span>
          </div>
        </div>

        <div className="border border-[#F5E6C8]/20 bg-[#1a1a1a] p-8 mb-12 relative">
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#F5E6C8]/40" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#F5E6C8]/40" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#F5E6C8]/40" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#F5E6C8]/40" />
          <p className="font-mono text-sm text-[#F5E6C8]/80 leading-relaxed">
            Account deletion is permanent and cannot be undone. If you are signed in
            to Gardens, use in-app account deletion from Settings.
          </p>
        </div>

        <div className="space-y-12">
          <section id="in-app">
            <h2 className="font-mono text-lg font-semibold text-[#F5E6C8] tracking-wide uppercase mb-4">
              Delete In App
            </h2>
            <div className="pl-8 border-l border-[#F5E6C8]/10 space-y-3">
              <p className="font-mono text-sm text-[#F5E6C8]/60">
                1. Open Gardens and sign in to your account.
              </p>
              <p className="font-mono text-sm text-[#F5E6C8]/60">
                2. Go to Settings, then Account.
              </p>
              <p className="font-mono text-sm text-[#F5E6C8]/60">
                3. Select Delete Account and confirm.
              </p>
            </div>
          </section>

          <section id="api">
            <h2 className="font-mono text-lg font-semibold text-[#F5E6C8] tracking-wide uppercase mb-4">
              API Route
            </h2>
            <div className="pl-8 border-l border-[#F5E6C8]/10 space-y-4">
              <p className="font-mono text-sm text-[#F5E6C8]/60 leading-relaxed">
                Authenticated clients can delete the current account with:
                <span className="text-[#F5E6C8]"> DELETE /users/:userId</span>.
                The bearer token user ID must match the path user ID exactly.
              </p>
              <div className="bg-[#111111] border border-[#F5E6C8]/10 p-4 overflow-x-auto">
                <code className="font-mono text-xs text-[#F5E6C8]/70 whitespace-pre">
                  {`curl -X DELETE "https://<worker-host>/users/<userId>" \\
  -H "Authorization: Bearer <jwt>"`}
                </code>
              </div>
            </div>
          </section>

          <section id="deletion-scope">
            <h2 className="font-mono text-lg font-semibold text-[#F5E6C8] tracking-wide uppercase mb-4">
              What Gets Deleted
            </h2>
            <div className="pl-8 border-l border-[#F5E6C8]/10">
              <ul className="space-y-3">
                {deletedData.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="font-mono text-xs text-[#F5E6C8]/30 mt-0.5">—</span>
                    <span className="font-mono text-sm text-[#F5E6C8]/60">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section id="media-note">
            <h2 className="font-mono text-lg font-semibold text-[#F5E6C8] tracking-wide uppercase mb-4">
              Attachment Note
            </h2>
            <div className="pl-8 border-l border-[#F5E6C8]/10 space-y-4">
              <p className="font-mono text-sm text-[#F5E6C8]/60 leading-relaxed">
                Message deletion removes attachment references. Historical attachment
                objects are not fully indexable for hard-delete today.
              </p>
              <p className="font-mono text-sm text-[#F5E6C8]/60 leading-relaxed">
                Full media eradication requires attachment object keys to be stored
                server-side and purged during account deletion.
              </p>
            </div>
          </section>

          <section id="support">
            <h2 className="font-mono text-lg font-semibold text-[#F5E6C8] tracking-wide uppercase mb-4">
              Need Help
            </h2>
            <div className="pl-8 border-l border-[#F5E6C8]/10">
              <p className="font-mono text-sm text-[#F5E6C8]/60 leading-relaxed">
                If you cannot access the app, contact{" "}
                <a
                  href="mailto:privacy@usegardens.com"
                  className="text-[#F5E6C8] hover:text-[#F5E6C8]/80 transition-colors"
                >
                  privacy@usegardens.com
                </a>{" "}
                and include your account UUID.
              </p>
            </div>
          </section>
        </div>

        <div className="mt-24 pt-8 border-t border-[#F5E6C8]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-[#F5E6C8]/30">[ SECURE ]</span>
            <span className="font-mono text-xs text-[#F5E6C8]/30">[ PRIVATE ]</span>
          </div>
          <p className="font-mono text-xs text-[#F5E6C8]/30">
            &copy; Gardens Software, 2026
          </p>
        </div>
      </div>
    </main>
  )
}
