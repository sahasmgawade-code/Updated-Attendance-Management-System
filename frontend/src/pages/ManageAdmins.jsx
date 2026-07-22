import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const emptyForm = { name: '', email: '', password: '' };

export default function ManageAdmins() {
  const { admin: currentAdmin, updateOwnName } = useAuth();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accessAdminId, setAccessAdminId] = useState(null);
  const [batchAccess, setBatchAccess] = useState([]);
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessError, setAccessError] = useState('');
  const [togglingBatchId, setTogglingBatchId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [addError, setAddError] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [busyId, setBusyId] = useState(null);

  function loadAdmins() {
    setLoading(true);
    setError('');
    api.listAdmins()
      .then((data) => setAdmins(data.admins))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadAdmins();
  }, []);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setAddError('');

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setAddError('Name, email, and password are required.');
      return;
    }
    if (form.password.length < 8) {
      setAddError('Password must be at least 8 characters.');
      return;
    }

    setCreating(true);
    try {
      await api.createAdmin({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setForm(emptyForm);
      setShowAddForm(false);
      loadAdmins();
    } catch (err) {
      setAddError(err.message || 'Could not create admin.');
    } finally {
      setCreating(false);
    }
  }

  function startEdit(a) {
    setEditingId(a.id);
    setEditName(a.name);
    setEditError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
    setEditError('');
  }

  async function handleSaveEdit(id) {
    setEditError('');
    if (!editName.trim()) {
      setEditError('Name is required.');
      return;
    }
    setSavingEdit(true);
    try {
      await api.updateAdmin(id, editName.trim());
      if (currentAdmin && id === currentAdmin.id) {
        updateOwnName(editName.trim());
      }
      setEditingId(null);
      setEditName('');
      loadAdmins();
    } catch (err) {
      setEditError(err.message || 'Could not update name.');
    } finally {
      setSavingEdit(false);
    }
  }

  function toggleAccessPanel(adminId) {
    if (accessAdminId === adminId) {
      setAccessAdminId(null);
      setBatchAccess([]);
      setAccessError('');
      return;
    }
    setAccessAdminId(adminId);
    setAccessError('');
    setAccessLoading(true);
    api.getAdminBatchAccess(adminId)
      .then((data) => setBatchAccess(data.batches))
      .catch((err) => setAccessError(err.message))
      .finally(() => setAccessLoading(false));
  }

  async function toggleBatchAccess(adminId, batch) {
    setTogglingBatchId(batch.id);
    setAccessError('');
    try {
      if (batch.hasAccess) {
        await api.revokeAdminFromBatch(batch.id, adminId);
      } else {
        await api.assignAdminToBatch(batch.id, adminId);
      }
      setBatchAccess((prev) =>
        prev.map((b) => (b.id === batch.id ? { ...b, hasAccess: !b.hasAccess } : b))
      );
    } catch (err) {
      setAccessError(err.message || 'Could not update batch access.');
    } finally {
      setTogglingBatchId(null);
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Remove admin ${name}? This cannot be undone.`)) return;
    setBusyId(id);
    try {
      await api.deleteAdmin(id);
      loadAdmins();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-3xl font-600">Manage Admins</h1>
        <button
          onClick={() => {
            setShowAddForm((v) => !v);
            setAddError('');
            setForm(emptyForm);
          }}
          className="glass-btn bg-forestGlass text-white rounded px-5 py-2 font-medium hover:bg-forestGlass/70 transition-colors"
        >
          {showAddForm ? 'Close' : '+ Create Admin'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreate} className="bg-card border border-rule rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-ink/60 mb-1.5">
                Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={update('name')}
                className="w-full border border-rule rounded px-3 py-2 bg-paper focus-visible:outline-forest"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-ink/60 mb-1.5">
                Email ID
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={update('email')}
                className="w-full border border-rule rounded px-3 py-2 bg-paper focus-visible:outline-forest"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono uppercase tracking-wide text-ink/60 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={update('password')}
                placeholder="At least 8 characters"
                className="w-full border border-rule rounded px-3 py-2 bg-paper focus-visible:outline-forest"
              />
            </div>
          </div>

          {addError && <p className="text-sm text-brick font-medium">{addError}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={creating}
              className="glass-btn bg-forestGlass text-white rounded px-5 py-2 font-medium hover:bg-forestGlass/70 transition-colors disabled:opacity-60"
            >
              {creating ? 'Creating…' : 'Create Admin'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-5 py-2 font-medium rounded border border-rule text-ink/70 hover:bg-ink/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && <p className="text-brick font-medium">{error}</p>}

      {loading ? (
        <p className="text-ink/50 font-mono text-sm">Loading…</p>
      ) : admins.length === 0 ? (
        <div className="bg-card border border-rule rounded-lg p-10 text-center">
          <p className="text-sm text-ink/50">No admins yet.</p>
        </div>
      ) : (
        <div className="bg-card border border-rule rounded-lg divide-y divide-rule overflow-hidden">
          {admins.map((a) => (
            <div key={a.id} className="p-4">
              {editingId === a.id ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                    className="border border-rule rounded px-3 py-2 bg-paper focus-visible:outline-forest flex-1 min-w-[180px]"
                  />
                  <button
                    onClick={() => handleSaveEdit(a.id)}
                    disabled={savingEdit}
                    className="px-3 py-1.5 text-sm font-medium rounded glass-btn bg-forestGlass text-white hover:bg-forestGlass/70 transition-colors disabled:opacity-60"
                  >
                    {savingEdit ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-3 py-1.5 text-sm font-medium rounded border border-rule text-ink/70 hover:bg-ink/5 transition-colors"
                  >
                    Cancel
                  </button>
                  {editError && <p className="w-full text-sm text-brick font-medium">{editError}</p>}
                </div>
              ) : (
                <>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{a.name}</span>
                      <span className="text-xs font-mono uppercase tracking-wide text-ink/50 border border-rule rounded px-1.5 py-0.5">
                        {a.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </span>
                    </div>
                    <div className="text-xs text-ink/50 mt-1">{a.email}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => startEdit(a)}
                      className="px-3 py-1.5 text-sm font-medium rounded border border-rule text-ink/70 hover:bg-ink/5 transition-colors"
                    >
                      Edit
                    </button>
                    {a.role !== 'super_admin' && (
                      <>
                        <button
                          onClick={() => toggleAccessPanel(a.id)}
                          className="px-3 py-1.5 text-sm font-medium rounded border border-rule text-ink/70 hover:bg-ink/5 transition-colors"
                        >
                          {accessAdminId === a.id ? 'Hide Batches' : 'Batches'}
                        </button>
                        <button
                          onClick={() => handleDelete(a.id, a.name)}
                          disabled={busyId === a.id}
                          className="glass-btn px-3 py-1.5 text-sm font-medium rounded border border-brick text-brick hover:bg-brickGlass hover:text-white transition-colors disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {accessAdminId === a.id && (
                  <div className="mt-4 pt-4 border-t border-rule">
                    {accessLoading ? (
                      <p className="text-ink/50 font-mono text-sm">Loading batches…</p>
                    ) : batchAccess.length === 0 ? (
                      <p className="text-sm text-ink/50">No batches exist yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {batchAccess.map((b) => (
                          <label
                            key={b.id}
                            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded border cursor-pointer transition-colors ${
                              b.hasAccess
                                ? 'glass-btn border-forest bg-forestGlass text-white'
                                : 'border-rule text-ink/70 hover:bg-white/20'
                            } ${togglingBatchId === b.id ? 'opacity-60 pointer-events-none' : ''}`}
                          >
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={b.hasAccess}
                              onChange={() => toggleBatchAccess(a.id, b)}
                            />
                            {b.name}
                          </label>
                        ))}
                      </div>
                    )}
                    {accessError && <p className="text-sm text-brick font-medium mt-2">{accessError}</p>}
                  </div>
                )}
                                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}