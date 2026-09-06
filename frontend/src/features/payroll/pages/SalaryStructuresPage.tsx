import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  useSalaryStructuresList,
  useSalaryStructureDetail,
  useCreateSalaryStructure,
  useCreateSalaryRule,
  type SalaryRuleCategory,
  type ComputationMethod,
  type CreateSalaryStructureInput,
  type CreateSalaryRuleInput,
} from '../queries/useSalaryStructures';

// --- Category badge colour mapping ---
const CATEGORY_STYLES: Record<SalaryRuleCategory | string, string> = {
  basic: 'bg-bg-raised text-ink border-line',
  allowance: 'bg-blue-50 text-blue-700 border-blue-200',
  gross: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  deduction: 'bg-red-50 text-red-700 border-red-200',
  net: 'bg-accent-soft text-accent border-accent/30',
  other: 'bg-bg-raised text-ink-soft border-line',
};

// --- New structure form ---
type NewStructureFormProps = {
  onSave: (data: CreateSalaryStructureInput) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
};

const NewStructureForm: React.FC<NewStructureFormProps> = ({ onSave, onCancel, isSaving }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) return setError('Structure name is required.');
    if (!code.trim()) return setError('Code is required.');
    setError(null);
    await onSave({ name: name.trim(), code: code.trim().toUpperCase(), description: description.trim() || undefined });
  };

  return (
    <div className="space-y-4 p-5 rounded-2xl border border-line bg-bg">
      <h3 className="font-serif text-base font-bold text-ink">New Salary Structure</h3>
      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
      )}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-ink mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Standard Monthly"
            className="w-full px-3 py-2 border border-line rounded-xl bg-bg-raised text-xs text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink mb-1">Code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. STD_MONTHLY"
            className="w-full px-3 py-2 border border-line rounded-xl bg-bg-raised text-xs text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-accent font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink mb-1">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Brief description of this structure…"
            className="w-full px-3 py-2 border border-line rounded-xl bg-bg-raised text-xs text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-accent resize-none"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="px-4 py-1.5 rounded-lg text-xs font-medium border border-line bg-bg text-ink hover:bg-bg-raised transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
        >
          {isSaving ? 'Saving…' : 'Create Structure'}
        </button>
      </div>
    </div>
  );
};

// --- New rule form ---
type NewRuleFormProps = {
  structureId: string;
  existingRules: number;
  onSave: (data: CreateSalaryRuleInput) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
};

const CATEGORIES: { value: SalaryRuleCategory; label: string }[] = [
  { value: 'basic', label: 'Basic' },
  { value: 'allowance', label: 'Allowance' },
  { value: 'gross', label: 'Gross' },
  { value: 'deduction', label: 'Deduction' },
  { value: 'net', label: 'Net' },
  { value: 'other', label: 'Other' },
];

const NewRuleForm: React.FC<NewRuleFormProps> = ({ structureId, existingRules, onSave, onCancel, isSaving }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<SalaryRuleCategory>('allowance');
  const [sequence, setSequence] = useState(String((existingRules + 1) * 10));
  const [method, setMethod] = useState<ComputationMethod>('fixed');
  const [amount, setAmount] = useState('');
  const [percentOfCode, setPercentOfCode] = useState('');
  const [percentage, setPercentage] = useState('');
  const [formula, setFormula] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) return setError('Rule name is required.');
    if (!code.trim()) return setError('Code is required.');
    if (!sequence || isNaN(Number(sequence))) return setError('Valid sequence number required.');
    setError(null);

    const payload: CreateSalaryRuleInput = {
      structureId,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      category,
      sequence: Number(sequence),
      computationMethod: method,
      amount: method === 'fixed' ? Number(amount) : 0,
      percentageOfCode: method === 'percentage' ? percentOfCode.trim().toUpperCase() : undefined,
      percentage: method === 'percentage' ? Number(percentage) : undefined,
      formula: method === 'formula' ? formula.trim() : undefined,
    };

    await onSave(payload);
  };

  return (
    <div className="space-y-3 p-4 rounded-2xl border border-accent/20 bg-accent-soft/20">
      <h4 className="font-serif text-sm font-bold text-ink">Add Salary Rule</h4>
      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">{error}</div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-ink mb-1">Rule Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. HRA Allowance"
            className="w-full px-2.5 py-1.5 border border-line rounded-lg bg-bg text-xs text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-accent" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-ink mb-1">Code</label>
          <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="HRA"
            className="w-full px-2.5 py-1.5 border border-line rounded-lg bg-bg text-xs text-ink font-mono placeholder:text-ink-soft/60 focus:outline-none focus:border-accent" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-ink mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as SalaryRuleCategory)}
            className="w-full px-2.5 py-1.5 border border-line rounded-lg bg-bg text-xs text-ink focus:outline-none focus:border-accent cursor-pointer">
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-ink mb-1">Sequence</label>
          <input type="number" value={sequence} onChange={(e) => setSequence(e.target.value)} min={1}
            className="w-full px-2.5 py-1.5 border border-line rounded-lg bg-bg text-xs text-ink focus:outline-none focus:border-accent" />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-ink mb-1">Computation Method</label>
        <div className="flex gap-2">
          {(['fixed', 'percentage', 'formula'] as ComputationMethod[]).map((m) => (
            <button key={m} onClick={() => setMethod(m)}
              className={`px-3 py-1 rounded-lg text-[11px] font-medium border cursor-pointer transition-colors capitalize ${method === m ? 'bg-accent text-accent-ink border-accent' : 'bg-bg border-line text-ink-soft hover:text-ink'}`}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {method === 'fixed' && (
        <div>
          <label className="block text-[11px] font-semibold text-ink mb-1">Fixed Amount (₹)</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 5000"
            className="w-full px-2.5 py-1.5 border border-line rounded-lg bg-bg text-xs text-ink focus:outline-none focus:border-accent" />
        </div>
      )}

      {method === 'percentage' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-ink mb-1">Based On (code)</label>
            <input type="text" value={percentOfCode} onChange={(e) => setPercentOfCode(e.target.value.toUpperCase())} placeholder="e.g. BASIC"
              className="w-full px-2.5 py-1.5 border border-line rounded-lg bg-bg text-xs text-ink font-mono focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-ink mb-1">Percentage (%)</label>
            <input type="number" value={percentage} onChange={(e) => setPercentage(e.target.value)} placeholder="e.g. 40"
              className="w-full px-2.5 py-1.5 border border-line rounded-lg bg-bg text-xs text-ink focus:outline-none focus:border-accent" />
          </div>
        </div>
      )}

      {method === 'formula' && (
        <div>
          <label className="block text-[11px] font-semibold text-ink mb-1">Formula</label>
          <input type="text" value={formula} onChange={(e) => setFormula(e.target.value)} placeholder="e.g. BASIC * 0.12"
            className="w-full px-2.5 py-1.5 border border-line rounded-lg bg-bg text-xs text-ink font-mono focus:outline-none focus:border-accent" />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-line bg-bg text-ink hover:bg-bg-raised transition-colors cursor-pointer">
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={isSaving}
          className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50">
          {isSaving ? 'Adding…' : 'Add Rule'}
        </button>
      </div>
    </div>
  );
};

// --- Main Page ---

export const SalaryStructuresPage: React.FC = () => {
  const { data: structures = [], isLoading } = useSalaryStructuresList();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: detail, isLoading: detailLoading } = useSalaryStructureDetail(selectedId);

  const createStructureMutation = useCreateSalaryStructure();
  const createRuleMutation = useCreateSalaryRule();

  const [showNewStructure, setShowNewStructure] = useState(false);
  const [showNewRule, setShowNewRule] = useState(false);

  const handleCreateStructure = async (data: CreateSalaryStructureInput) => {
    const created = await createStructureMutation.mutateAsync(data);
    setShowNewStructure(false);
    setSelectedId(created.id);
  };

  const handleCreateRule = async (data: CreateSalaryRuleInput) => {
    await createRuleMutation.mutateAsync(data);
    setShowNewRule(false);
  };

  const sortedRules = [...(detail?.rules ?? [])].sort((a, b) => a.sequence - b.sequence);

  return (
    <AppLayout
      title="Salary Structures"
      actions={
        <button
          onClick={() => { setShowNewStructure(true); setSelectedId(null); }}
          className="px-4 py-1.5 rounded-lg text-xs font-medium bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5"
        >
          <span>+</span> New Structure
        </button>
      }
    >
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-8 font-sans">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-5 mb-6">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink">Salary Structures</h1>
            <p className="text-xs sm:text-sm text-ink-soft mt-1">
              Configure salary computation rules applied during payrun processing.
            </p>
          </div>
          <button
            onClick={() => { setShowNewStructure(true); setSelectedId(null); }}
            className="sm:hidden self-start px-3.5 py-1.5 rounded-lg text-xs font-medium bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer"
          >
            + New Structure
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Structure List */}
          <div className="lg:col-span-1 space-y-3">
            <p className="text-[11px] font-semibold text-ink-soft uppercase tracking-widest px-1">Structures</p>

            {showNewStructure && (
              <NewStructureForm
                onSave={handleCreateStructure}
                onCancel={() => setShowNewStructure(false)}
                isSaving={createStructureMutation.isPending}
              />
            )}

            {isLoading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="text-xs text-ink-soft">Loading structures…</span>
              </div>
            ) : structures.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-line">
                <p className="text-xs text-ink-soft">No salary structures yet.</p>
                <button onClick={() => setShowNewStructure(true)}
                  className="mt-3 text-xs font-semibold text-accent cursor-pointer hover:opacity-80">
                  + Create first structure
                </button>
              </div>
            ) : (
              structures.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedId(s.id); setShowNewStructure(false); setShowNewRule(false); }}
                  className={`w-full text-left p-4 rounded-2xl border transition-colors cursor-pointer ${selectedId === s.id ? 'border-accent bg-accent-soft/30' : 'border-line bg-bg hover:border-ink-soft/40'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-serif text-sm font-bold text-ink truncate">{s.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0 ${s.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-bg-raised text-ink-soft border-line'}`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="text-[11px] text-ink-soft font-mono mt-1">{s.code}</div>
                  {s.description && (
                    <div className="text-[11px] text-ink-soft mt-1.5 line-clamp-2">{s.description}</div>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Right: Structure Detail + Rules */}
          <div className="lg:col-span-2">
            {!selectedId && !showNewStructure ? (
              <div className="h-full min-h-[200px] flex items-center justify-center rounded-2xl border border-dashed border-line text-center p-8">
                <div>
                  <p className="text-sm font-medium text-ink-soft">Select a structure to view its rules</p>
                  <p className="text-xs text-ink-soft/60 mt-1">or create a new structure from the panel on the left</p>
                </div>
              </div>
            ) : selectedId && (
              <div className="space-y-4">
                {/* Detail Header */}
                {detailLoading ? (
                  <div className="p-8 text-center">
                    <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : detail && (
                  <>
                    <div className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-line bg-bg">
                      <div>
                        <h2 className="font-serif text-lg font-bold text-ink">{detail.name}</h2>
                        <div className="text-xs text-ink-soft font-mono mt-0.5">{detail.code}</div>
                        {detail.description && (
                          <p className="text-xs text-ink-soft mt-1.5">{detail.description}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-2xl font-bold font-serif text-ink">{sortedRules.length}</div>
                        <div className="text-[11px] text-ink-soft">rules</div>
                      </div>
                    </div>

                    {/* Rules Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-ink-soft uppercase tracking-widest">Salary Rules (in sequence)</p>
                        {!showNewRule && (
                          <button
                            onClick={() => setShowNewRule(true)}
                            className="text-xs font-semibold text-accent hover:opacity-80 cursor-pointer"
                          >
                            + Add Rule
                          </button>
                        )}
                      </div>

                      {showNewRule && (
                        <NewRuleForm
                          structureId={selectedId}
                          existingRules={sortedRules.length}
                          onSave={handleCreateRule}
                          onCancel={() => setShowNewRule(false)}
                          isSaving={createRuleMutation.isPending}
                        />
                      )}

                      {sortedRules.length === 0 && !showNewRule ? (
                        <div className="p-8 text-center rounded-2xl border border-dashed border-line">
                          <p className="text-xs text-ink-soft">No rules defined yet.</p>
                          <button onClick={() => setShowNewRule(true)}
                            className="mt-2 text-xs font-semibold text-accent cursor-pointer hover:opacity-80">
                            + Add first rule
                          </button>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-line overflow-hidden">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-bg-raised border-b border-line">
                                <th className="text-left px-4 py-2.5 text-ink-soft font-semibold w-10">#</th>
                                <th className="text-left px-4 py-2.5 text-ink-soft font-semibold">Name</th>
                                <th className="text-left px-4 py-2.5 text-ink-soft font-semibold hidden sm:table-cell">Code</th>
                                <th className="text-left px-4 py-2.5 text-ink-soft font-semibold">Category</th>
                                <th className="text-right px-4 py-2.5 text-ink-soft font-semibold">Method / Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sortedRules.map((rule, idx) => (
                                <tr key={rule.id} className={`border-b border-line last:border-0 ${idx % 2 === 0 ? 'bg-bg' : 'bg-bg-raised/40'}`}>
                                  <td className="px-4 py-3 text-ink-soft font-mono">{rule.sequence}</td>
                                  <td className="px-4 py-3 font-medium text-ink">{rule.name}</td>
                                  <td className="px-4 py-3 font-mono text-ink-soft hidden sm:table-cell">{rule.code}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium capitalize ${CATEGORY_STYLES[rule.category] ?? CATEGORY_STYLES.other}`}>
                                      {rule.category}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right text-ink-soft">
                                    {rule.computation_method === 'fixed' && (
                                      <span className="font-medium text-ink">
                                        ₹{Number(rule.amount).toLocaleString('en-IN')}
                                      </span>
                                    )}
                                    {rule.computation_method === 'percentage' && (
                                      <span>
                                        {rule.percentage}% of <span className="font-mono">{rule.percentage_of_code}</span>
                                      </span>
                                    )}
                                    {rule.computation_method === 'formula' && (
                                      <span className="font-mono text-[11px]">{rule.formula}</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
