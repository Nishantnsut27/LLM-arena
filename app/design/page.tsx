import { Check, AlertTriangle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground p-8 md:p-16 lg:p-24 font-sans max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex justify-between items-start mb-12">
        <div className="max-w-2xl">
          <div className="inline-block bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-4">
            Design Proof
          </div>
          <h1 className="font-serif text-5xl md:text-6xl mb-6 tracking-tight">LLM Arena</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Prose is set in serif. Every number a machine measured is set in mono, at
            whatever size the number deserves. Rust marks the things you can
            operate and nothing else.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <hr className="border-border my-16" />

      {/* Colour Section */}
      <section className="mb-16">
        <div className="mb-8">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Colour</h2>
          <h3 className="font-serif text-3xl md:text-4xl">One warm family, one accent</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ColorSwatch name="background" desc="page" bgColor="bg-background" />
          <ColorSwatch name="card" desc="a response, a row" bgColor="bg-card" />
          <ColorSwatch name="popover" desc="the model picker" bgColor="bg-popover" />
          <ColorSwatch name="border" desc="a divider" bgColor="bg-border" />
          <ColorSwatch name="input" desc="an edge you can operate" bgColor="bg-input" />
          <ColorSwatch name="primary" desc="rust, interactive only" bgColor="bg-primary" textColor="text-primary-foreground" />
        </div>
        <p className="text-muted-foreground mt-6 text-sm">
          Rust sits 0.45 lighter than the page and carries eleven times the chroma of any surface, which is what stops a button from sinking into the brown behind it.
        </p>
      </section>

      <hr className="border-border my-16" />

      {/* Arena Section */}
      <section className="mb-16">
        <div className="mb-8">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Arena</h2>
          <h3 className="font-serif text-3xl md:text-4xl">A response, mid-stream</h3>
        </div>

        <div className="border border-border rounded-xl bg-card overflow-hidden">
          <div className="p-4 flex justify-between items-center border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-sm font-medium text-muted-foreground">
                N
              </div>
              <span className="font-serif text-xl">NVIDIA: Nemotron 3 Ultra</span>
            </div>
            <div className="bg-[#e6f4ea] text-[#1e8e3e] dark:bg-[#1e8e3e]/20 dark:text-[#81c995] flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium">
              <Check size={14} />
              Winner
            </div>
          </div>
          <div className="p-4 pt-6 pb-8">
            <p className="text-foreground leading-relaxed">
              A streamed answer lands here. There is no shimmer over the top of it, because the text arriving is already the thing worth watching.
            </p>
          </div>
          <div className="px-4 py-3 border-t border-border bg-card/50 flex gap-6 text-xs font-mono text-muted-foreground">
            <div>first token <span className="text-foreground font-medium">982 ms</span></div>
            <div>speed <span className="text-foreground font-medium">-</span></div>
            <div>tokens <span className="text-foreground font-medium">-</span></div>
            <div>cost <span className="text-foreground font-medium">-</span></div>
          </div>
        </div>
        <p className="text-muted-foreground mt-6 text-sm">
          Cost reads $0.0000 because every model here is free, and that is the measured number, not a placeholder. It stays on screen for the same reason the rest do.
        </p>
      </section>

      <hr className="border-border my-16" />

      {/* Leaderboard Section */}
      <section className="mb-16">
        <div className="mb-8">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Leaderboard</h2>
          <h3 className="font-serif text-3xl md:text-4xl">The record, written as a record</h3>
        </div>

        <div className="border border-border rounded-xl bg-card overflow-hidden">
          <div className="grid grid-cols-[3rem_1fr_12rem] items-center px-6 py-3 border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <div>#</div>
            <div>Model</div>
            <div className="text-right">Win Rate</div>
          </div>
          
          <div className="grid grid-cols-[3rem_1fr_12rem] items-center px-6 py-4 border-b border-border hover:bg-secondary/50 transition-all-150">
            <div className="font-serif text-xl text-muted-foreground">1</div>
            <div className="font-serif text-xl">NVIDIA: Nemotron 3 Ultra</div>
            <div className="text-right flex flex-col items-end gap-1.5">
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl text-primary">71%</span>
                <span className="text-xs text-muted-foreground">won 507 of 700</span>
              </div>
              <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "71%" }}></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[3rem_1fr_12rem] items-center px-6 py-4 hover:bg-secondary/50 transition-all-150">
            <div className="font-serif text-xl text-muted-foreground">2</div>
            <div className="font-serif text-xl">Meta: Llama 4 Scout</div>
            <div className="text-right flex flex-col items-end gap-1.5">
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl text-primary">54%</span>
                <span className="text-xs text-muted-foreground">won 302 of 559</span>
              </div>
              <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "54%" }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="border-border my-16" />

      {/* Failure Section */}
      <section className="mb-24">
        <div className="mb-8">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Failure</h2>
          <h3 className="font-serif text-3xl md:text-4xl">A plain sentence and a way out</h3>
        </div>

        <div className="border border-[#e5c5c0] dark:border-[#522923] bg-[#fdf2f1] dark:bg-[#3d1916] rounded-xl p-5">
          <div className="flex items-center gap-2 text-[#b03021] dark:text-[#f8a39a] font-medium mb-2">
            <AlertTriangle size={18} />
            This model did not answer
          </div>
          <p className="text-[#8c261a] dark:text-[#e48b81] text-sm mb-4">
            The other two are still going. Try this one again, or vote on what you have.
          </p>
          <button className="border border-[#b03021]/30 dark:border-[#f8a39a]/30 text-[#b03021] dark:text-[#f8a39a] hover:bg-[#b03021]/5 dark:hover:bg-[#f8a39a]/10 transition-all-150 px-4 py-1.5 rounded-full text-sm font-medium">
            Try again
          </button>
        </div>
        
        <p className="text-muted-foreground mt-6 text-sm leading-relaxed">
          Rust and this red measure 1.14:1 against each other, so they are told apart by hue alone. That is why the error carries an icon and a sentence, and the winner above carries the word "Winner". Colour is never the only signal here.
        </p>
      </section>

    </main>
  );
}

function ColorSwatch({ name, desc, bgColor, textColor = "text-foreground" }: { name: string, desc: string, bgColor: string, textColor?: string }) {
  return (
    <div className="border border-border rounded-xl overflow-hidden flex flex-col">
      <div className={`h-24 ${bgColor} ${textColor} flex items-center justify-center`}>
        {/* Fill area */}
      </div>
      <div className="p-3 bg-card border-t border-border text-xs">
        <div className="font-mono font-medium mb-0.5">{name}</div>
        <div className="text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}