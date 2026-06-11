import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { ArrowLeft, Megaphone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listNews } from "@/lib/monvex.functions";

export const Route = createFileRoute("/news")({
  head: () => ({ meta: [{ title: "News — Monvex" }, { name: "description", content: "Latest Monvex company news and activities." }] }),
  component: NewsPage,
});

function NewsPage() {
  const fn = useServerFn(listNews);
  const { data, isLoading } = useQuery({ queryKey: ["news"], queryFn: () => fn() });
  const posts = data?.posts ?? [];
  return (
    <Shell bg="bg-slate-50">
      <div className="relative px-5 pt-10 pb-24 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-blue-700 to-sky-700" />
        <div className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <Link to="/" className="h-10 w-10 rounded-xl bg-white/15 ring-1 ring-white/20 flex items-center justify-center backdrop-blur-md">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-xs text-white/70">Updates & activities</p>
            <h1 className="text-lg font-bold">Company News</h1>
          </div>
        </div>
      </div>
      <div className="px-4 -mt-12 relative z-10 space-y-3">
        {isLoading && <div className="bg-white rounded-3xl p-6 text-center text-sm text-slate-400">Loading…</div>}
        {!isLoading && posts.length === 0 && (
          <div className="bg-white rounded-3xl p-6 text-center space-y-3 shadow-md">
            <Megaphone className="h-10 w-10 text-indigo-500 mx-auto" />
            <p className="text-sm text-slate-500">No news posts yet. Check back soon.</p>
          </div>
        )}
        {posts.map((p) => (
          <article key={p.id} className="bg-white rounded-3xl p-5 shadow-md ring-1 ring-black/5">
            {p.cover_url && (
              <img src={p.cover_url} alt="" className="w-full h-40 object-cover rounded-2xl mb-3" />
            )}
            <p className="text-[10px] uppercase tracking-widest text-indigo-600 font-semibold">
              {new Date(p.created_at).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-slate-900">{p.title}</h2>
            <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{p.body}</p>
          </article>
        ))}
      </div>
    </Shell>
  );
}