import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminListNews, adminUpsertNews, adminDeleteNews } from "@/lib/admin.functions";
import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/news")({ component: NewsAdmin });

function NewsAdmin() {
  const list = useServerFn(adminListNews);
  const upsert = useServerFn(adminUpsertNews);
  const del = useServerFn(adminDeleteNews);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-news"], queryFn: () => list() });

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [cover, setCover] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const createMut = useMutation({
    mutationFn: () => upsert({ data: { title, body, cover_url: cover || undefined, published: true } }),
    onSuccess: () => { setTitle(""); setBody(""); setCover(""); setErr(null); qc.invalidateQueries({ queryKey: ["admin-news"] }); },
    onError: (e: any) => setErr(e.message || "Failed"),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-news"] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">News Posts</h1>

      <form
        onSubmit={(e) => { e.preventDefault(); createMut.mutate(); }}
        className="rounded-xl bg-slate-900 ring-1 ring-slate-800 p-4 space-y-3"
      >
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full bg-slate-800 rounded-md px-3 py-2 text-sm" />
        <input value={cover} onChange={(e) => setCover(e.target.value)} placeholder="Cover image URL (optional)" className="w-full bg-slate-800 rounded-md px-3 py-2 text-sm" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write the news body…" rows={5} className="w-full bg-slate-800 rounded-md px-3 py-2 text-sm" />
        {err && <p className="text-xs text-rose-400">{err}</p>}
        <button disabled={createMut.isPending || !title || !body} className="rounded-md bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-semibold flex items-center gap-1 disabled:opacity-50">
          {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Publish
        </button>
      </form>

      <div className="space-y-3">
        {isLoading && <div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>}
        {(data?.posts ?? []).map((p: any) => (
          <div key={p.id} className="rounded-xl bg-slate-900 ring-1 ring-slate-800 p-4">
            <div className="flex justify-between items-start gap-3">
              <div>
                <p className="text-xs text-slate-400">{new Date(p.created_at).toLocaleString()}</p>
                <h3 className="font-bold text-lg">{p.title}</h3>
                <p className="text-sm text-slate-300 mt-2 whitespace-pre-wrap">{p.body}</p>
              </div>
              <button onClick={() => delMut.mutate(p.id)} className="shrink-0 inline-flex items-center gap-1 rounded-md bg-rose-600/80 hover:bg-rose-500 px-2.5 py-1.5 text-xs font-semibold">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
        {!isLoading && !data?.posts?.length && <p className="text-sm text-slate-500 text-center py-6">No news posts yet</p>}
      </div>
    </div>
  );
}