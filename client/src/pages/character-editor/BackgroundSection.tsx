export function BackgroundSection({
  description,
  backstory,
  inputStyle,
  onDescriptionChange,
  onBackstoryChange,
}: {
  description: string;
  backstory: string;
  inputStyle: React.CSSProperties;
  onDescriptionChange: (value: string) => void;
  onBackstoryChange: (value: string) => void;
}) {
  return (
    <>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium" style={{ color: 'var(--color-fg-muted)' }}>Description</span>
        <textarea
          value={description}
          rows={3}
          onChange={(e) => onDescriptionChange(e.target.value)}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium" style={{ color: 'var(--color-fg-muted)' }}>Backstory</span>
        <textarea
          value={backstory}
          rows={5}
          onChange={(e) => onBackstoryChange(e.target.value)}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </label>
    </>
  );
}