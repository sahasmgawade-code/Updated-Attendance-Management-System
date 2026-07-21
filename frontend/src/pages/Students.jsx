import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSelectedBatch } from '../hooks/useSelectedBatch.js';
const emptyForm = { urn: '', firstName: '', lastName: '', phone: '', email: '', parentPhone: '' };

function StudentForm({ initial, onCancel, onSubmit, submitLabel, error, lockUrn }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  }

  const fields = [
    ['urn', 'URN', true],
    ['firstName', 'First Name', true],
    ['lastName', 'Last Name', true],
    ['phone', 'Phone', false],
    ['email', 'Email', false],
    ['parentPhone', "Parent's Phone", false],
  ];

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-rule rounded-lg p-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map(([key, label, required]) => (
          <div key={key}>
            <label className="block text-xs font-mono uppercase tracking-wide text-ink/60 mb-1.5">
              {label}
            </label>
            <input
              type={key === 'email' ? 'email' : 'text'}
              required={required}
              readOnly={key === 'urn' && lockUrn}
              value={form[key]}
              onChange={update(key)}
              className={`w-full border border-rule rounded px-3 py-2 focus-visible:outline-forest ${
                key === 'urn' && lockUrn ? 'bg-ink/5 text-ink/50 cursor-not-allowed' : 'bg-paper'
              }`}
            />
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-brick font-medium">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-forest text-paper rounded px-5 py-2 font-medium hover:bg-forestDark transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 font-medium rounded border border-rule text-ink/70 hover:bg-ink/5 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function Students() {
  const { isSuperAdmin } = useAuth();

  const [batches, setBatches] = useState([]);
  const [batchId, setBatchId] = useSelectedBatch();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addError, setAddError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editError, setEditError] = useState('');
  const [busyId, setBusyId] = useState(null); // student id currently being deleted/blacklisted

  useEffect(() => {
    api.listBatches()
      .then((data) => {
        setBatches(data.batches);
        const stillValid = data.batches.some((b) => b.id === batchId);
        if (!stillValid) {
          setBatchId(data.batches.length > 0 ? data.batches[0].id : null);
        }
        if (data.batches.length === 0) setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStudents = useCallback(async (id) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.listStudents(id);
      setStudents(data.students);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (batchId) loadStudents(batchId);
  }, [batchId, loadStudents]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      `${s.first_name} ${s.last_name} ${s.urn}`.toLowerCase().includes(q)
    );
  }, [students, search]);

  async function handleAdd(form) {
    setAddError('');
    try {
      await api.createStudent(batchId, form);
      setShowAddForm(false);
      await loadStudents(batchId);
    } catch (err) {
      setAddError(err.message || 'Could not add student.');
    }
  }

  async function handleEdit(studentId, form) {
    setEditError('');
    try {
      await api.updateStudent(studentId, form);
      setEditingId(null);
      await loadStudents(batchId);
    } catch (err) {
      setEditError(err.message || 'Could not update student.');
    }
  }

  async function handleDelete(studentId, name) {
    if (!window.confirm(`Remove ${name} from this batch? This cannot be undone.`)) return;
    setBusyId(studentId);
    try {
      await api.deleteStudent(studentId);
      await loadStudents(batchId);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleBlacklistToggle(studentId, currentlyBlacklisted) {
    setBusyId(studentId);
    try {
      await api.blacklistStudent(studentId, !currentlyBlacklisted);
      await loadStudents(batchId);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  if (batches.length === 0 && !loading) {
    return (
      <div className="text-center py-24">
        <p className="font-display text-2xl text-ink/70 mb-2">No batches yet</p>
        <p className="text-sm text-ink/50">Create a batch before adding students.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-3xl font-600">View Students</h1>
        <select
          value={batchId ?? ''}
          onChange={(e) => {
            setBatchId(Number(e.target.value));
            setShowAddForm(false);
            setEditingId(null);
          }}
          className="border border-rule rounded px-3 py-2 bg-card font-medium"
        >
          {batches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-brick font-medium">{error}</p>}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name or URN…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-rule rounded px-3 py-2 bg-card w-full sm:w-72 focus-visible:outline-forest"
        />
        <button
          onClick={() => {
            setShowAddForm((v) => !v);
            setAddError('');
            setEditingId(null);
          }}
          className="bg-forest text-paper rounded px-5 py-2 font-medium hover:bg-forestDark transition-colors"
        >
          {showAddForm ? 'Close' : '+ Add Student'}
        </button>
      </div>

      {showAddForm && (
        <StudentForm
          initial={emptyForm}
          onCancel={() => setShowAddForm(false)}
          onSubmit={handleAdd}
          submitLabel="Add Student"
          error={addError}
          lockUrn={false}
        />
      )}

      {loading ? (
        <p className="text-ink/50 font-mono text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-rule rounded-lg p-10 text-center">
          <p className="text-sm text-ink/50">
            {students.length === 0 ? 'No students in this batch yet.' : 'No students match your search.'}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-rule rounded-lg divide-y divide-rule overflow-hidden">
          {filtered.map((s) => (
            <div key={s.id}>
              {editingId === s.id ? (
                <div className="p-4">
                  <StudentForm
                    initial={{
                      urn: s.urn,
                      firstName: s.first_name,
                      lastName: s.last_name,
                      phone: s.phone || '',
                      email: s.email || '',
                      parentPhone: s.parent_phone || '',
                    }}
                    onCancel={() => setEditingId(null)}
                    onSubmit={(form) => handleEdit(s.id, form)}
                    submitLabel="Save Changes"
                    error={editError}
                    lockUrn={true}
                  />
                </div>
              ) : (
                <div className="p-4 flex items-center justify-between flex-wrap gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{s.first_name} {s.last_name}</span>
                      <span className="font-mono text-xs text-ink/50">{s.urn}</span>
                      {s.is_blacklisted && (
                        <span className="text-xs font-mono uppercase tracking-wide text-brick border border-brick rounded px-1.5 py-0.5">
                          Blacklisted
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-ink/50 mt-1 space-x-3">
                      {s.phone && <span>{s.phone}</span>}
                      {s.email && <span>{s.email}</span>}
                      {s.parent_phone && <span>Parent: {s.parent_phone}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setEditingId(s.id);
                        setEditError('');
                        setShowAddForm(false);
                      }}
                      className="px-3 py-1.5 text-sm font-medium rounded border border-rule text-ink/70 hover:bg-ink/5 transition-colors"
                    >
                      Edit
                    </button>
                      <button
                        onClick={() => handleBlacklistToggle(s.id, s.is_blacklisted)}
                        disabled={busyId === s.id}
                        className="px-3 py-1.5 text-sm font-medium rounded border border-amber text-amber hover:bg-amber hover:text-paper transition-colors disabled:opacity-60"
                      >
                        {s.is_blacklisted ? 'Unblacklist' : 'Blacklist'}
                      </button>
                    <button
                      onClick={() => handleDelete(s.id, `${s.first_name} ${s.last_name}`)}
                      disabled={busyId === s.id}
                      className="px-3 py-1.5 text-sm font-medium rounded border border-brick text-brick hover:bg-brick hover:text-paper transition-colors disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}