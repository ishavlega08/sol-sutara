"use client";

import { Plus, Trash2 } from "lucide-react";

export interface MetadataPair {
  id: string;
  key: string;
  value: string;
}

interface MetadataInputProps {
  pairs: MetadataPair[];
  onChange: (pairs: MetadataPair[]) => void;
}

export default function MetadataInput({ pairs, onChange }: MetadataInputProps) {
  function addPair() {
    onChange([...pairs, { id: crypto.randomUUID(), key: "", value: "" }]);
  }

  function removePair(id: string) {
    onChange(pairs.filter((p) => p.id !== id));
  }

  function updatePair(id: string, field: "key" | "value", val: string) {
    onChange(pairs.map((p) => (p.id === id ? { ...p, [field]: val } : p)));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">Metadata</label>
        <button
          type="button"
          onClick={addPair}
          className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
        >
          <Plus className="h-3 w-3" />
          Add field
        </button>
      </div>

      {pairs.length === 0 && (
        <p className="text-xs text-gray-400">
          No metadata fields yet. Click &quot;Add field&quot; to add one.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {pairs.map((pair) => (
          <div key={pair.id} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Key"
              value={pair.key}
              onChange={(e) => updatePair(pair.id, "key", e.target.value)}
              className="w-1/2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
            />
            <input
              type="text"
              placeholder="Value"
              value={pair.value}
              onChange={(e) => updatePair(pair.id, "value", e.target.value)}
              className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
            />
            <button
              type="button"
              onClick={() => removePair(pair.id)}
              className="flex-shrink-0 rounded-md p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
