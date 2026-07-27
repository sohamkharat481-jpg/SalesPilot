import React, { useState } from 'react';
import { X, Plus, Trash2, Code, Key, Sliders, Check } from 'lucide-react';
import { WorkflowVariable } from '../../types/workflow-builder';

interface WorkflowVariablesModalProps {
  variables: WorkflowVariable[];
  onSaveVariables: (variables: WorkflowVariable[]) => void;
  onClose: () => void;
}

export function WorkflowVariablesModal({
  variables,
  onSaveVariables,
  onClose
}: WorkflowVariablesModalProps) {
  const [varList, setVarList] = useState<WorkflowVariable[]>(variables);
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<'string' | 'number' | 'boolean' | 'json'>('string');
  const [newDefault, setNewDefault] = useState('');

  const handleAddVariable = () => {
    if (!newKey.trim()) return;

    const formattedKey = newKey.trim().toLowerCase().replace(/\s+/g, '_');
    const newVar: WorkflowVariable = {
      id: `var_${Date.now()}`,
      key: formattedKey,
      label: newLabel || formattedKey,
      type: newType,
      defaultValue: newDefault,
      scope: 'global'
    };

    setVarList([...varList, newVar]);
    setNewKey('');
    setNewLabel('');
    setNewDefault('');
  };

  const handleDeleteVariable = (id: string) => {
    setVarList(varList.filter((v) => v.id !== id));
  };

  const handleSave = () => {
    onSaveVariables(varList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in space-y-4 p-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-500" />
            <h3 className="text-sm font-bold font-mono text-slate-900 dark:text-white uppercase">
              Workflow Variables Engine
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Define reusable context variables available across all workflow nodes via <code className="text-indigo-500 font-mono">{"{{variable_key}}"}</code> tags.
        </p>

        {/* ADD VARIABLE FORM */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Variable Key (e.g. target_budget)"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white font-mono"
            />
            <input
              type="text"
              placeholder="Display Label"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={newType}
              onChange={(e: any) => setNewType(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white font-mono"
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="json">JSON</option>
            </select>
            <input
              type="text"
              placeholder="Default Value"
              value={newDefault}
              onChange={(e) => setNewDefault(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white font-mono"
            />
          </div>

          <button
            onClick={handleAddVariable}
            disabled={!newKey.trim()}
            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-mono text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Variable
          </button>
        </div>

        {/* VARIABLE LIST */}
        <div className="max-h-52 overflow-y-auto space-y-2">
          {varList.map((v) => (
            <div
              key={v.id}
              className="p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono"
            >
              <div>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{`{{${v.key}}}`}</span>
                <span className="text-[10px] text-slate-400 ml-2">[{v.type}]</span>
                <p className="text-[10px] text-slate-500">Default: "{v.defaultValue || 'none'}"</p>
              </div>

              <button
                onClick={() => handleDeleteVariable(v.id)}
                className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-400 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Save Variables
          </button>
        </div>
      </div>
    </div>
  );
}
