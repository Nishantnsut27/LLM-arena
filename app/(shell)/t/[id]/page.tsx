export default async function ThreadPlaceholder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="p-8 max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
        Placeholder
      </div>
      <h1 className="font-serif text-4xl mb-4">Saved Thread</h1>
      <p className="text-muted-foreground mb-4">
        Viewing Thread ID: <span className="font-mono bg-secondary px-2 py-0.5 rounded">{id}</span>
      </p>
      <p className="text-muted-foreground mb-8">
        This frame will be replaced by the real Thread View (Feature 8) which handles public visibility and sharing.
      </p>
      {/* Feature 8 will kill this placeholder */}
    </div>
  );
}
