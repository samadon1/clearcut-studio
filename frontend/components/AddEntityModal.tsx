'use client';

import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Tag, 
  Building2, 
  FileText, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface AddEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEntity: (entity: {
    name: string;
    category: string;
    scene: string;
    desk: string;
    notes: string;
  }) => void;
}

export const AddEntityModal: React.FC<AddEntityModalProps> = ({
  isOpen,
  onClose,
  onAddEntity,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('TRADEMARK');
  const [scene, setScene] = useState('Scene 42');
  const [desk, setDesk] = useState('Props Department');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddEntity({
      name,
      category,
      scene,
      desk,
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-sans">
      <div className="bg-white border border-neutral-200 rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-md bg-black text-white flex items-center justify-center font-bold text-xs">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-neutral-950 uppercase tracking-wider font-poppins">
                Track New Clearance Entity
              </h2>
              <p className="text-[10px] text-neutral-500">
                Log entity into the production clearance roster
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-neutral-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-neutral-700">Entity / Brand / Artwork Name</label>
            <input
              type="text"
              placeholder="e.g. Acme Corporation, Silver Lake Roasters, Street Mural..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full p-2 rounded-md bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 outline-hidden focus:bg-white focus:border-neutral-400 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-neutral-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 rounded-md bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 outline-hidden font-medium"
              >
                <option value="TRADEMARK">TRADEMARK (Brand / Logo)</option>
                <option value="ARTWORK">ARTWORK (Painting / Sculpture)</option>
                <option value="MUSIC">MUSIC (Cue / Performance)</option>
                <option value="LOCATION_SIGN">LOCATION (Street / Signage)</option>
                <option value="PROP">PROP (Custom Fabrication)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-neutral-700">Scene / Location</label>
              <input
                type="text"
                placeholder="e.g. Scene 42 (Pg 61)"
                value={scene}
                onChange={(e) => setScene(e.target.value)}
                className="w-full p-2 rounded-md bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 outline-hidden font-medium"
              >
              </input>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-neutral-700">Department Ownership</label>
            <select
              value={desk}
              onChange={(e) => setDesk(e.target.value)}
              className="w-full p-2 rounded-md bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 outline-hidden font-medium"
            >
              <option value="Props Department">Props Department</option>
              <option value="Art Department">Art Department</option>
              <option value="Set Dressing">Set Dressing</option>
              <option value="Post / VFX">Post / VFX</option>
              <option value="Production Legal">Production Legal</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-neutral-700">Legal Notes & Context</label>
            <textarea
              rows={2}
              placeholder="Initial context, appearance in script, license availability..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 rounded-md bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 outline-hidden font-sans"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium text-xs transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-1.5 rounded-md bg-black hover:bg-neutral-800 text-white font-medium text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
            >
              <span>Add to Pipeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
