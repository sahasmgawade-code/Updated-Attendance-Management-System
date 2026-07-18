import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client.js';
import { useSelectedBatch } from '../hooks/useSelectedBatch.js';
import AttendancePie from '../components/AttendancePie.jsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function StudentRow({ s, batchName, expandedId, onToggle, detail, loadingDetail }) {
  const isOpen = expandedId === s.studentId;
  const absentDates = detail ? detail.history.filter((h) => h.status === 'absent').map((h) => h.date) : [];

  function downloadStudentPdf() {
    if (!detail) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Attendance Report — ${detail.student.firstName} ${detail.student.lastName}`, 14, 18);
    doc.setFontSize(10);
    doc.text(`URN: ${detail.student.urn}`, 14, 26);
    doc.text(`Batch: ${batchName}`, 14, 32);
    doc.text(
      `Present: ${detail.presentCount} / ${detail.totalWorkingDays}  (${detail.percentage}%)`,
      14,
      38
    );

    autoTable(doc, {
      startY: 44,
      head: [['Date', 'Status', 'Method']],
      body: detail.history.map((h) => [h.date, h.status, h.method || '-']),
    });

    doc.save(`${detail.student.urn}-attendance.pdf`);
  }

  return (
    <div>
      <div className="p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{s.firstName} {s.lastName}</span>
            <span className="font-mono text-xs text-ink/50">{s.urn}</span>
          </div>
          <div className="text-xs text-ink/50 mt-1">
            {s.presentCount} / {s.totalWorkingDays} days present
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`font-mono text-sm font-semibold ${s.percentage < 75 ? 'text-brick' : 'text-forest'}`}>
            {s.percentage}%
          </span>
          <button
            onClick={() => onToggle(s.studentId)}
            className="px-3 py-1.5 text-sm font-medium rounded border border-rule text-ink/70 hover:bg-ink/5 transition-colors"
          >
            {isOpen ? 'Hide' : 'View'}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="px-4 pb-4">
          {loadingDetail ? (
            <p className="text-sm text-ink/50 font-mono">Loading…</p>
          ) : detail ? (
            <div className="bg-paper border border-rule rounded p-4 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <AttendancePie percentage={detail.percentage} size={100} />
                  <div className="text-sm text-ink/60">
                    <p>{detail.student.email || 'No email'}</p>
                    <p>{detail.student.phone || 'No phone'}</p>
                  </div>
                </div>
                <button
                  onClick={downloadStudentPdf}
                  className="px-3 py-1.5 text-sm font-medium rounded bg-forest text-paper hover:bg-forestDark transition-colors"
                >
                  Download PDF
                </button>
              </div>

              <div>
                <p className="text-xs font-mono uppercase tracking-wide text-ink/50 mb-2">
                  Absent Dates ({absentDates.length})
                </p>
                {absentDates.length === 0 ? (
                  <p className="text-xs text-ink/40">No absences recorded.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {absentDates.map((d) => (
                      <span key={d} className="font-mono text-xs bg-brick/10 text-brick rounded px-2 py-0.5">
                        {d}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-brick">Could not load details.</p>
          )}
        </div>
      )}
    </div>
  );
}

function CollapsibleSection({ title, colorClass, count, children, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between mb-2"
      >
        <h2 className={`font-display text-xl ${colorClass}`}>{title} ({count})</h2>
        <span className="text-ink/40 text-sm font-mono">{open ? '▲ Hide' : '▼ Show'}</span>
      </button>
      {open && children}
    </div>
  );
}

export default function Reports() {
  const [batches, setBatches] = useState([]);
  const [batchId, setBatchId] = useSelectedBatch();
  const [report, setReport] = useState(null);
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [expandedId, setExpandedId] = useState(null);
  const [detailCache, setDetailCache] = useState({});
  const [loadingDetailId, setLoadingDetailId] = useState(null);

  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [rangeDownloading, setRangeDownloading] = useState(false);
  const [rangeError, setRangeError] = useState('');

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

  const loadReport = useCallback(async (id) => {
    setLoading(true);
    setError('');
    setExpandedId(null);
    setDetailCache({});
    try {
      const [reportData, todayData] = await Promise.all([
        api.getBatchReport(id),
        api.getAttendanceForDate(id, todayStr()),
      ]);
      setReport(reportData);
      setToday(todayData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (batchId) loadReport(batchId);
  }, [batchId, loadReport]);

  async function handleToggle(studentId) {
    if (expandedId === studentId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(studentId);
    if (!detailCache[studentId]) {
      setLoadingDetailId(studentId);
      try {
        const data = await api.getStudentReport(studentId);
        setDetailCache((prev) => ({ ...prev, [studentId]: data }));
      } catch (err) {
        setDetailCache((prev) => ({ ...prev, [studentId]: null }));
      } finally {
        setLoadingDetailId(null);
      }
    }
  }

  function buildPdf(reportData, batchName, subtitle) {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Attendance Report — ${batchName}`, 14, 18);
    doc.setFontSize(10);
    doc.text(subtitle, 14, 26);
    doc.text(`Total working days: ${reportData.totalWorkingDays}`, 14, 32);

    doc.setFontSize(12);
    doc.text(`Defaulters (below 75%)`, 14, 42);
    autoTable(doc, {
      startY: 46,
      head: [['URN', 'Name', 'Present', 'Total', '%']],
      body: reportData.defaulters.map((s) => [
        s.urn, `${s.firstName} ${s.lastName}`, s.presentCount, s.totalWorkingDays, `${s.percentage}%`,
      ]),
      headStyles: { fillColor: [166, 67, 47] },
    });

    const afterDefaulters = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Good Standing (75% and above)`, 14, afterDefaulters);
    autoTable(doc, {
      startY: afterDefaulters + 4,
      head: [['URN', 'Name', 'Present', 'Total', '%']],
      body: reportData.goodStanding.map((s) => [
        s.urn, `${s.firstName} ${s.lastName}`, s.presentCount, s.totalWorkingDays, `${s.percentage}%`,
      ]),
      headStyles: { fillColor: [47, 111, 79] },
    });

    return doc;
  }

  function downloadBatchPdf() {
    if (!report) return;
    const batchName = batches.find((b) => b.id === batchId)?.name || 'Batch';
    const doc = buildPdf(report, batchName, 'Full record (all time)');
    doc.save(`${batchName}-attendance-report-full.pdf`);
  }

  async function downloadRangePdf() {
    if (!rangeStart || !rangeEnd) {
      setRangeError('Pick both a start and end date.');
      return;
    }
    if (rangeStart > rangeEnd) {
      setRangeError('Start date must be before end date.');
      return;
    }
    setRangeError('');
    setRangeDownloading(true);
    try {
      const batchName = batches.find((b) => b.id === batchId)?.name || 'Batch';
      const rangeData = await api.getBatchReport(batchId, { startDate: rangeStart, endDate: rangeEnd });
      const doc = buildPdf(rangeData, batchName, `Custom range: ${rangeStart} to ${rangeEnd}`);
      doc.save(`${batchName}-attendance-report-${rangeStart}-to-${rangeEnd}.pdf`);
    } catch (err) {
      setRangeError(err.message || 'Could not generate report.');
    } finally {
      setRangeDownloading(false);
    }
  }

  const absentToday = today?.students.filter((s) => s.status === 'absent') ?? [];
  const overallStats = report ? [...report.goodStanding, ...report.defaulters] : [];
  const overallAvg =
    overallStats.length > 0
      ? Math.round((overallStats.reduce((sum, s) => sum + s.percentage, 0) / overallStats.length) * 10) / 10
      : null;

  if (batches.length === 0 && !loading) {
    return (
      <div className="text-center py-24">
        <p className="font-display text-2xl text-ink/70 mb-2">No batches yet</p>
        <p className="text-sm text-ink/50">Create a batch to see reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-3xl font-600">Reports</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={batchId ?? ''}
            onChange={(e) => setBatchId(Number(e.target.value))}
            className="border border-rule rounded px-3 py-2 bg-card font-medium"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <button
            onClick={downloadBatchPdf}
            disabled={!report}
            className="bg-forest text-paper rounded px-5 py-2 font-medium hover:bg-forestDark transition-colors disabled:opacity-60"
          >
            Download Whole Batch PDF
          </button>
        </div>
      </div>

      {error && <p className="text-brick font-medium">{error}</p>}

      {loading ? (
        <p className="text-ink/50 font-mono text-sm">Loading…</p>
      ) : report ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-rule rounded-lg p-5">
              <p className="text-xs font-mono uppercase tracking-wide text-ink/50 mb-1">Overall Attendance</p>
              <p className="font-display text-4xl font-600 text-ink">
                {overallAvg !== null ? `${overallAvg}%` : '—'}
              </p>
            </div>
            <div className="bg-card border border-rule rounded-lg p-5">
              <p className="text-xs font-mono uppercase tracking-wide text-ink/50 mb-1">Working Days Recorded</p>
              <p className="font-display text-4xl font-600 text-ink">{report.totalWorkingDays}</p>
            </div>
            <div className="bg-card border border-rule rounded-lg p-5">
              <p className="text-xs font-mono uppercase tracking-wide text-ink/50 mb-1">Absent Today (Count) </p>
              <p className="font-display text-4xl font-600 text-brick">{absentToday.length}</p>
            </div>
          </div>

          <div className="bg-card border border-rule rounded-lg p-5">
            <p className="text-xs font-mono uppercase tracking-wide text-ink/50 mb-3">Absent Students Today</p>
            {absentToday.length === 0 ? (
              <p className="text-sm text-ink/50">Nobody absent today — full house.</p>
            ) : (
              <ul className="divide-y divide-rule">
                {absentToday.map((s) => (
                  <li key={s.student_id} className="py-2 flex items-center justify-between">
                    <span className="font-medium">{s.first_name} {s.last_name}</span>
                    <span className="font-mono text-xs text-ink/50">{s.urn}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-card border border-rule rounded-lg p-5 space-y-3">
            <p className="text-xs font-mono uppercase tracking-wide text-ink/50">Download Custom Date Range</p>
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="date"
                value={rangeStart}
                max={todayStr()}
                onChange={(e) => setRangeStart(e.target.value)}
                className="border border-rule rounded px-3 py-2 bg-paper font-medium"
              />
              <span className="text-ink/40 text-sm">to</span>
              <input
                type="date"
                value={rangeEnd}
                max={todayStr()}
                onChange={(e) => setRangeEnd(e.target.value)}
                className="border border-rule rounded px-3 py-2 bg-paper font-medium"
              />
              <button
                onClick={downloadRangePdf}
                disabled={rangeDownloading}
                className="px-4 py-2 text-sm font-medium rounded border border-forest text-forestDark hover:bg-forest hover:text-paper transition-colors disabled:opacity-60"
              >
                {rangeDownloading ? 'Generating…' : 'Download Range PDF'}
              </button>
            </div>
            {rangeError && <p className="text-sm text-brick font-medium">{rangeError}</p>}
          </div>

          <CollapsibleSection
            title="Defaulters (below 75%)"
            colorClass="text-brick"
            count={report.defaulters.length}
            defaultOpen={true}
          >
            {report.defaulters.length === 0 ? (
              <div className="bg-card border border-rule rounded-lg p-6 text-center text-sm text-ink/50">
                No defaulters — everyone is above 75%.
              </div>
            ) : (
              <div className="bg-card border border-rule rounded-lg divide-y divide-rule overflow-hidden">
                {report.defaulters.map((s) => (
                  <StudentRow
                    key={s.studentId}
                    s={s}
                    batchName={batches.find((b) => b.id === batchId)?.name}
                    expandedId={expandedId}
                    onToggle={handleToggle}
                    detail={detailCache[s.studentId]}
                    loadingDetail={loadingDetailId === s.studentId}
                  />
                ))}
              </div>
            )}
          </CollapsibleSection>

          <CollapsibleSection
            title="Good Standing (75% and above)"
            colorClass="text-forest"
            count={report.goodStanding.length}
            defaultOpen={false}
          >
            {report.goodStanding.length === 0 ? (
              <div className="bg-card border border-rule rounded-lg p-6 text-center text-sm text-ink/50">
                No students in good standing yet.
              </div>
            ) : (
              <div className="bg-card border border-rule rounded-lg divide-y divide-rule overflow-hidden">
                {report.goodStanding.map((s) => (
                  <StudentRow
                    key={s.studentId}
                    s={s}
                    batchName={batches.find((b) => b.id === batchId)?.name}
                    expandedId={expandedId}
                    onToggle={handleToggle}
                    detail={detailCache[s.studentId]}
                    loadingDetail={loadingDetailId === s.studentId}
                  />
                ))}
              </div>
            )}
          </CollapsibleSection>
        </>
      ) : null}
    </div>
  );
}