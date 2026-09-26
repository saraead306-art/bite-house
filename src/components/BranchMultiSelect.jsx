import { Check, MapPin } from 'lucide-react';

export default function BranchMultiSelect({
  branches = [],
  value = [],
  onChange,
  label = 'الفروع *',
}) {
  const selectedIds = Array.isArray(value)
    ? value.map(String)
    : [];

  function toggleBranch(branchId) {
    const normalizedId = String(branchId);

    onChange(
      selectedIds.includes(normalizedId)
        ? selectedIds.filter((id) => id !== normalizedId)
        : [...selectedIds, normalizedId]
    );
  }

  return (
    <div className="branch-multi-field">
      <div className="branch-multi-head">
        <span>{label}</span>
        <small>اختاري فرعًا أو أكثر</small>
      </div>

      {branches.length ? (
        <div className="branch-multi-grid">
          {branches.map((branch) => {
            const selected = selectedIds.includes(String(branch.id));

            return (
              <button
                key={branch.id}
                type="button"
                className={`branch-multi-card ${selected ? 'selected' : ''}`}
                onClick={() => toggleBranch(branch.id)}
                aria-pressed={selected}
              >
                <span className="branch-multi-check">
                  {selected ? <Check size={13} strokeWidth={2.7} /> : null}
                </span>

                <span className="branch-multi-copy">
                  <strong>{branch.name}</strong>
                  <small>
                    <MapPin size={12} />
                    {branch.address}
                  </small>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="security-note">
          <MapPin size={15} />
          <span>أضيفي أول فرع من تبويب الفروع.</span>
        </div>
      )}
    </div>
  );
}
