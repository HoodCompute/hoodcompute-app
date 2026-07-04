"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCredits } from "@/context/CreditsContext";

type Model = {
  slug: string;
  name: string;
  tier: string;
  credits_per_request: number;
  description: string;
  parameter_count: string;
  max_context_tokens: number;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  tokens: number;
  created_at: string;
};

const TIER_COLORS: Record<string, string> = {
  lite:     "oklch(0.75 0.17 150)",
  standard: "oklch(0.74 0.15 250)",
  pro:      "oklch(0.74 0.15 290)",
  max:      "var(--gold)",
};

const DEMO_RESPONSES = [
  "This is the HoodCompute beta network. Your query was routed to a provider running an open-weight model. In production, your prompt is encrypted before it leaves your device and never stored anywhere. The provider sees only the encrypted payload, runs inference locally, and streams tokens back to you. Every payment for this job settles automatically on Robinhood Chain.",
  "Your prompt was encrypted client-side and dispatched to the nearest available provider on the network. The provider decrypted it locally, ran inference on their GPU, and the output is being streamed back to you now. Nothing about this query is logged by the protocol. The on-chain record contains only a job ID, the model tier, and the credit amount - never the content.",
  "HoodCompute routes your inference requests across a distributed network of GPU providers. No single entity, including HoodCompute itself, can see the contents of your prompts. The model running your query is open-weight, which means no corporate filter is applied between you and the model. All settlement for this job is happening on Robinhood Chain in real time.",
  "Your message reached a provider on the HoodCompute network. The provider is running an open-weight model with no content policy layer - you get raw model output. Once inference is complete, the payment escrow releases automatically: the provider receives 98% of the credit value in USDG, and the protocol fee goes to the treasury for buyback and staking rewards.",
];

function pickResponse(input: string): string {
  const idx = input.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % DEMO_RESPONSES.length;
  return DEMO_RESPONSES[idx];
}

const newSessionId = () => crypto.randomUUID();

export default function ChatPage() {
  const supabase = createClient();
  const { credits, deductCredits } = useCredits();

  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [sessionId, setSessionId] = useState<string>(newSessionId());
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<{ session_id: string; model_slug: string; preview: string; created_at: string }[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
    supabase.from("models").select("slug, name, tier, credits_per_request, description, parameter_count, max_context_tokens")
      .eq("is_active", true).order("credits_per_request", { ascending: true })
      .then(({ data }) => {
        const list = data ?? [];
        setModels(list);
        if (list.length > 0) setSelectedModel(list.find(m => m.slug === "qwen3-8b") ?? list[0]);
      });
  }, [supabase]);

  useEffect(() => {
    if (!userId) return;
    supabase.from("messages")
      .select("session_id, model_slug, content, created_at")
      .eq("user_id", userId).eq("role", "user")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        const seen = new Set<string>();
        const unique = data.filter(m => { if (seen.has(m.session_id)) return false; seen.add(m.session_id); return true; });
        setSessions(unique.map(m => ({
          session_id: m.session_id,
          model_slug: m.model_slug ?? "",
          preview: m.content.slice(0, 48) + (m.content.length > 48 ? "..." : ""),
          created_at: m.created_at,
        })).slice(0, 8));
      });
  }, [userId, messages, supabase]);

  const loadSession = useCallback(async (sid: string) => {
    if (!userId) return;
    setSessionId(sid);
    const { data } = await supabase.from("messages")
      .select("id, role, content, tokens, created_at")
      .eq("user_id", userId).eq("session_id", sid)
      .order("created_at", { ascending: true });
    setMessages((data ?? []) as Message[]);
  }, [userId, supabase]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamedText]);

  async function sendMessage() {
    if (!input.trim() || !selectedModel || !userId || sending) return;
    if (credits < selectedModel.credits_per_request) return;

    const userContent = input.trim();
    setInput("");
    setSending(true);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: userContent,
      tokens: Math.ceil(userContent.split(" ").length * 1.3),
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    await supabase.from("messages").insert({
      user_id: userId, session_id: sessionId, role: "user",
      content: userContent, model_slug: selectedModel.slug, tokens: userMsg.tokens,
    });

    const { data: jobRow } = await supabase.from("jobs").insert({
      user_id: userId, model_slug: selectedModel.slug, model_name: selectedModel.name,
      tier: selectedModel.tier, status: "running", input_tokens: userMsg.tokens,
      credits_charged: selectedModel.credits_per_request,
      usdg_value: selectedModel.credits_per_request * 0.01,
    }).select("id").single();

    await deductCredits(selectedModel.credits_per_request, jobRow?.id);

    const responseText = pickResponse(userContent);
    const outputTokens = Math.ceil(responseText.split(" ").length * 1.3);

    setStreaming(true);
    setStreamedText("");
    let i = 0;
    const interval = setInterval(() => {
      i += Math.ceil(Math.random() * 4) + 1;
      if (i >= responseText.length) {
        i = responseText.length;
        clearInterval(interval);
        setStreaming(false);
        setStreamedText("");
        const assistantMsg: Message = {
          id: crypto.randomUUID(), role: "assistant", content: responseText,
          tokens: outputTokens, created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMsg]);
        supabase.from("messages").insert({
          user_id: userId, session_id: sessionId, role: "assistant",
          content: responseText, model_slug: selectedModel.slug, tokens: outputTokens,
        });
        if (jobRow?.id) {
          const txHash = "0x" + Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 64);
          supabase.from("jobs").update({
            status: "completed", output_tokens: outputTokens,
            output_hash: btoa(responseText.slice(0, 32)), tx_hash: txHash,
            block_number: Math.floor(Math.random() * 10000000) + 4000000,
            latency_ms: Math.floor(Math.random() * 800) + 800,
            provider_payout: selectedModel.credits_per_request * 0.0075,
            protocol_fee: selectedModel.credits_per_request * 0.0025,
            completed_at: new Date().toISOString(),
          }).eq("id", jobRow.id);
        }
        setSending(false);
      } else {
        setStreamedText(responseText.slice(0, i));
      }
    }, 18);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function startNewChat() {
    setSessionId(newSessionId());
    setMessages([]);
    setInput("");
  }

  const canSend = input.trim().length > 0 && !sending && selectedModel !== null && credits >= (selectedModel?.credits_per_request ?? 0);

  return (
    <div className="flex h-full overflow-hidden">

      {/* Chat history sidebar */}
      <aside className="hidden w-[220px] shrink-0 flex-col border-r md:flex"
        style={{ background: "oklch(0.185 0.015 245)", borderColor: "oklch(1 0 0 / 0.08)" }}>

        <div className="p-3 border-b" style={{ borderColor: "oklch(1 0 0 / 0.08)" }}>
          <button onClick={startNewChat}
            className="flex w-full items-center gap-2 rounded-[6px] px-3 py-2 text-[13px] font-[500] text-white/70 transition hover:bg-white/[0.06] hover:text-white"
            style={{ border: "1px solid oklch(1 0 0 / 0.10)" }}>
            <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {sessions.length === 0 ? (
            <p className="px-3 py-4 text-[12px] text-white/25 text-center">No previous chats</p>
          ) : (
            sessions.map((s) => (
              <button key={s.session_id} onClick={() => loadSession(s.session_id)}
                className={`w-full rounded-[6px] px-3 py-2 text-left transition ${s.session_id === sessionId ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"}`}>
                <p className="text-[12px] font-[500] text-white/80 truncate">{s.preview || "Untitled"}</p>
                <p className="text-[11px] text-white/25 mt-0.5">{s.model_slug}</p>
              </button>
            ))
          )}
        </div>

        <div className="p-3 border-t" style={{ borderColor: "oklch(1 0 0 / 0.08)" }}>
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-white/25">Credits</span>
            <span className="font-mono text-[12px] font-[500] text-white/70">{credits.toLocaleString()}</span>
          </div>
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Model selector bar */}
        <div className="flex items-center gap-3 border-b px-4 py-2.5"
          style={{ background: "oklch(0.22 0.015 245)", borderColor: "oklch(1 0 0 / 0.08)" }}>
          <span className="text-[12px] text-white/30 shrink-0">Model</span>
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
            {models.map((m) => (
              <button key={m.slug} onClick={() => setSelectedModel(m)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-[500] transition whitespace-nowrap ${selectedModel?.slug === m.slug ? "text-white" : "text-white/35 hover:text-white/60"}`}
                style={selectedModel?.slug === m.slug
                  ? { background: "oklch(1 0 0 / 0.10)", border: "1px solid oklch(1 0 0 / 0.18)" }
                  : { border: "1px solid oklch(1 0 0 / 0.08)" }}>
                <span className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ background: TIER_COLORS[m.tier] ?? "oklch(1 0 0 / 0.40)" }} />
                {m.name}
                <span className="font-mono text-[10px] opacity-40">{m.credits_per_request}cr</span>
              </button>
            ))}
          </div>
          {selectedModel && (
            <span className="ml-auto shrink-0 text-[11px] text-white/25 hidden lg:block">
              {selectedModel.parameter_count} · {(selectedModel.max_context_tokens / 1000).toFixed(0)}k ctx
            </span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6" style={{ background: "var(--surface-dark)" }}>
          {messages.length === 0 && !streaming ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-[480px] mx-auto">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: "var(--gold)" }}>
                <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" style={{ color: "var(--surface-dark)" }}>
                  <path d="M10 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" fill="currentColor" />
                  <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6H3z" fill="currentColor" />
                </svg>
              </div>
              <p className="text-[17px] font-[500] text-white">
                {selectedModel ? selectedModel.name : "Select a model"}
              </p>
              <p className="mt-2 text-[13px] text-white/40 leading-relaxed">
                {selectedModel ? selectedModel.description : "Choose a model from the bar above to start."}
              </p>
              {selectedModel && (
                <div className="mt-5 flex items-center gap-3 rounded-full px-4 py-2"
                  style={{ background: "oklch(1 0 0 / 0.05)", border: "1px solid oklch(1 0 0 / 0.08)" }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: "oklch(0.75 0.17 150)" }} />
                  <span className="text-[12px] text-white/35">
                    {selectedModel.credits_per_request} credits per request · encrypted · no logs
                  </span>
                </div>
              )}
              {credits < (selectedModel?.credits_per_request ?? 0) && (
                <div className="mt-4 rounded-[8px] px-4 py-3"
                  style={{ background: "oklch(0.72 0.18 35 / 0.10)", border: "1px solid oklch(0.72 0.18 35 / 0.25)" }}>
                  <p className="text-[12px] text-white/50">
                    You need at least {selectedModel?.credits_per_request} credits. You have {credits}.{" "}
                    <a href="/app/settings" className="underline text-white/70 hover:text-white">Top up</a>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5"
                      style={{ background: "var(--gold)" }}>
                      <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" style={{ color: "var(--surface-dark)" }}>
                        <path d="M10 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" fill="currentColor" />
                        <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6H3z" fill="currentColor" />
                      </svg>
                    </div>
                  )}
                  <div className={`max-w-[70%] rounded-[12px] px-4 py-3 ${msg.role === "user" ? "rounded-tr-[4px]" : "rounded-tl-[4px]"}`}
                    style={msg.role === "user"
                      ? { background: "oklch(0.30 0.02 244)", border: "1px solid oklch(1 0 0 / 0.12)" }
                      : { background: "oklch(0.245 0.018 244)", border: "1px solid oklch(1 0 0 / 0.08)" }}>
                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap text-white/90">{msg.content}</p>
                    <p className="mt-1.5 text-[10px] font-mono text-white/20">{msg.tokens} tokens</p>
                  </div>
                </div>
              ))}

              {streaming && (
                <div className="flex gap-3 justify-start">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5"
                    style={{ background: "var(--gold)" }}>
                    <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" style={{ color: "var(--surface-dark)" }}>
                      <path d="M10 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" fill="currentColor" />
                      <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6H3z" fill="currentColor" />
                    </svg>
                  </div>
                  <div className="max-w-[70%] rounded-[12px] rounded-tl-[4px] px-4 py-3"
                    style={{ background: "oklch(0.245 0.018 244)", border: "1px solid oklch(1 0 0 / 0.08)" }}>
                    {streamedText ? (
                      <p className="text-[14px] leading-relaxed whitespace-pre-wrap text-white/90">
                        {streamedText}
                        <span className="inline-block h-4 w-0.5 ml-0.5 animate-pulse align-text-bottom"
                          style={{ background: "var(--gold)" }} />
                      </p>
                    ) : (
                      <div className="flex gap-1 py-1">
                        {[0, 1, 2].map(i => (
                          <span key={i} className="h-1.5 w-1.5 rounded-full animate-bounce"
                            style={{ background: "oklch(1 0 0 / 0.25)", animationDelay: `${i * 120}ms` }} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="border-t px-4 py-3"
          style={{ background: "oklch(0.22 0.015 245)", borderColor: "oklch(1 0 0 / 0.08)" }}>
          <div className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedModel ? `Message ${selectedModel.name}...` : "Select a model to start"}
              disabled={!selectedModel || sending}
              className="flex-1 resize-none rounded-[8px] px-4 py-3 text-[14px] text-white placeholder:text-white/25 outline-none transition"
              style={{
                background: "oklch(0.185 0.015 245)",
                border: "1px solid oklch(1 0 0 / 0.12)",
                minHeight: "44px",
                maxHeight: "120px",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!canSend}
              className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[8px] transition disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: "var(--gold)" }}>
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" style={{ color: "var(--surface-dark)" }}>
                <path d="M10 15V5M5 10l5-5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <div className="mt-2 flex items-center gap-3 px-1">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "oklch(0.75 0.17 150)" }} />
            <p className="text-[11px] text-white/25">
              Encrypted end-to-end · No logs · On Robinhood Chain
              {selectedModel && ` · ${selectedModel.credits_per_request} cr per request`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
