import React, { useState, useEffect } from 'react';
import { 
  Phone, CheckCircle2, ShieldAlert, Plus, Trash2, Edit3, Star, 
  AlertCircle, RefreshCw, X, Smartphone, Globe, Check, AlertTriangle
} from 'lucide-react';
import { CallingNumber } from '../../types/voice';
import { CountrySelector } from './CountrySelector';
import { validateAndFormatPhoneNumber } from '../../utils/phoneUtils';
import { Country } from '../../utils/countries';

export function MyCallingNumbers() {
  const [callingNumbers, setCallingNumbers] = useState<CallingNumber[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState<string>('+91');
  const [phoneNumberInput, setPhoneNumberInput] = useState<string>('');
  const [isDefault, setIsDefault] = useState<boolean>(false);
  const [userConfirmed, setUserConfirmed] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Confirmation Delete Modal
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchCallingNumbers = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('salespilot_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/calling-numbers', { headers });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load calling numbers');
      }

      setCallingNumbers(data.callingNumbers || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error loading calling numbers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCallingNumbers();
  }, []);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setCountryCode('+91');
    setPhoneNumberInput('');
    setIsDefault(callingNumbers.length === 0);
    setUserConfirmed(false);
    setErrorMessage(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (cn: CallingNumber) => {
    setEditingId(cn.id);
    setCountryCode(cn.countryCode || '+91');
    // Extract local number portion if starts with country code
    let rawLocal = cn.phoneNumber;
    if (cn.countryCode && rawLocal.startsWith(cn.countryCode)) {
      rawLocal = rawLocal.slice(cn.countryCode.length).trim();
    }
    setPhoneNumberInput(rawLocal);
    setIsDefault(cn.isDefault);
    setUserConfirmed(true);
    setErrorMessage(null);
    setShowModal(true);
  };

  const handleSaveNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validation = validateAndFormatPhoneNumber(phoneNumberInput, countryCode);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Please enter a valid phone number.');
      return;
    }

    if (!userConfirmed) {
      setErrorMessage('Please check the confirmation box before saving.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('salespilot_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const fullNumber = validation.e164!;

      const url = editingId ? `/api/v1/calling-numbers/${editingId}` : '/api/v1/calling-numbers';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          phoneNumber: fullNumber,
          countryCode,
          isDefault,
          isVerified: true
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save calling number');
      }

      setSuccessMessage(editingId ? 'Calling number updated successfully.' : 'Calling number added successfully.');
      setShowModal(false);
      fetchCallingNumbers();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving calling number');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setErrorMessage(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('salespilot_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/calling-numbers/${id}/default`, {
        method: 'POST',
        headers
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update default number');
      }

      setSuccessMessage('Default calling number updated.');
      fetchCallingNumbers();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error setting default number');
    }
  };

  const handleDeleteNumber = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    setErrorMessage(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('salespilot_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/calling-numbers/${deleteId}`, {
        method: 'DELETE',
        headers
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete calling number');
      }

      setSuccessMessage('Calling number removed.');
      setDeleteId(null);
      fetchCallingNumbers();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error removing calling number');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              My Calling Numbers
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage phone numbers and device identities you use when making manual calls to leads.
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Calling Number</span>
          </button>
        </div>

        {/* Global Notice Box */}
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start space-x-3 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-amber-900 dark:text-amber-200 block">Device Calling Identity Notice</span>
            <p className="text-amber-700 dark:text-amber-400 leading-relaxed">
              This number is strictly used to identify which phone/device you intend to use when placing manual calls.
              SalesPilot <strong>does NOT</strong> spoof caller ID, place automated calls from this number, or send credentials to 3rd party AI dialers.
            </p>
          </div>
        </div>

        {/* Success/Error Alerts */}
        {successMessage && (
          <div className="mt-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center justify-between text-xs text-rose-800 dark:text-rose-300">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Numbers List */}
        <div className="mt-6 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Loading calling numbers...</span>
            </div>
          ) : callingNumbers.length === 0 ? (
            <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-3">
              <Phone className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Calling Numbers Configured</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Add your primary mobile or desk phone number to select it when launching manual lead calls.
                </p>
              </div>
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                + Add Calling Number
              </button>
            </div>
          ) : (
            callingNumbers.map((cn) => (
              <div
                key={cn.id}
                className={`p-4 rounded-xl border transition flex items-center justify-between ${
                  cn.isDefault
                    ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    cn.isDefault ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    <Phone className="w-4 h-4" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                        {cn.phoneNumber}
                      </span>

                      {cn.isDefault && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px] rounded-full flex items-center space-x-1">
                          <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                          <span>Default</span>
                        </span>
                      )}

                      {cn.isVerified && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-semibold text-[10px] rounded-full">
                          Verified
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 font-mono">
                      Added on {new Date(cn.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!cn.isDefault && (
                    <button
                      onClick={() => handleSetDefault(cn.id)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 hover:text-blue-600 text-xs font-semibold rounded-lg transition"
                    >
                      Make Default
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenEditModal(cn)}
                    className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Edit number"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeleteId(cn.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Remove number"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-600" />
                {editingId ? 'Edit Calling Number' : 'Add New Calling Number'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNumber} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Country Code & Phone Number
                </label>
                <div className="flex space-x-2">
                  <CountrySelector
                    selectedDialCode={countryCode}
                    onSelect={(c: Country) => setCountryCode(c.dialCode)}
                  />

                  <input
                    type="tel"
                    value={phoneNumberInput}
                    onChange={(e) => setPhoneNumberInput(e.target.value)}
                    placeholder="9876543210"
                    required
                    className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  E.164 preview: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{countryCode}{phoneNumberInput.replace(/\D/g, '') || 'XXXXXXXXXX'}</span>
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="chkDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <label htmlFor="chkDefault" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Set as my Default calling number
                </label>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="chkConfirm"
                  checked={userConfirmed}
                  onChange={(e) => setUserConfirmed(e.target.checked)}
                  required
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 shrink-0"
                />
                <label htmlFor="chkConfirm" className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight cursor-pointer">
                  I confirm this is my legitimate phone number/device intended for manual sales calls.
                </label>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-2"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingId ? 'Update Number' : 'Save Calling Number'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Remove Calling Number?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to remove this calling number? Historical call activity logs will NOT be deleted.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteNumber}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1.5"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
