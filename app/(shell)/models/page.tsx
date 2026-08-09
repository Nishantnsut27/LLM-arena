export default function ModelsPlaceholder() {
  return (
    <div className="p-8 max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
        Placeholder
      </div>
      <h1 className="font-serif text-4xl mb-4">Model Catalog</h1>
      <p className="text-muted-foreground mb-8">
        This frame will be replaced by the real Model Catalog (Feature 5) which pulls live model availability from OpenRouter.
      </p>
      {/* Feature 5 will kill this placeholder */}
    </div>
  );
}
