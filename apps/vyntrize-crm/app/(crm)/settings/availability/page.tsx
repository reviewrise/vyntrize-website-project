"use client";

import { useState, useEffect } from "react";
import { Switch } from "@headlessui/react";

type AvailabilityRule = {
  dayOfWeek: number;
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
  isActive: boolean;
};

type BookingSettings = {
  title: string;
  description: string;
  durationMinutes: number;
  bufferMinutes: number;
  generateMeet: boolean;
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DURATIONS = [15, 30, 45, 60];
const BUFFERS = [0, 5, 10, 15, 30];

function formatTime(hour: number, min: number) {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  const m = min.toString().padStart(2, '0');
  return `${h}:${m} ${ampm}`;
}

export default function AvailabilitySettings() {
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings/availability");
        if (res.ok) {
          const data = await res.json();
          setRules(data.rules || []);
          setSettings(data.settings || null);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/settings/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules, settings })
      });
      if (res.ok) {
        setMessage("Settings saved successfully.");
      } else {
        setMessage("Failed to save settings.");
      }
    } catch (err) {
      setMessage("Error saving settings.");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const updateRule = (day: number, field: keyof AvailabilityRule, value: any) => {
    setRules(rules.map(r => r.dayOfWeek === day ? { ...r, [field]: value } : r));
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-4xl space-y-10 pb-20">
      <div>
        <h3 className="text-lg font-semibold leading-6 text-slate-900">Working Hours</h3>
        <p className="mt-1 text-sm text-slate-500">
          Configure the times you are available for meetings. All times are in your configured timezone.
        </p>

        <div className="mt-6 border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
          {rules.map(rule => (
            <div key={rule.dayOfWeek} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
              <div className="flex items-center w-40">
                <Switch
                  checked={rule.isActive}
                  onChange={(val) => updateRule(rule.dayOfWeek, "isActive", val)}
                  className={`${
                    rule.isActive ? 'bg-blue-600' : 'bg-slate-200'
                  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                >
                  <span
                    className={`${
                      rule.isActive ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </Switch>
                <span className={`ml-4 text-sm font-medium ${rule.isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                  {DAYS[rule.dayOfWeek]}
                </span>
              </div>

              {rule.isActive ? (
                <div className="flex items-center space-x-3 text-sm">
                  <select 
                    value={rule.startHour}
                    onChange={e => updateRule(rule.dayOfWeek, "startHour", parseInt(e.target.value))}
                    className="rounded-lg border-slate-200 py-1.5 pl-3 pr-8 text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Array.from({ length: 24 }).map((_, i) => (
                      <option key={i} value={i}>{formatTime(i, 0)}</option>
                    ))}
                  </select>
                  <span className="text-slate-400">-</span>
                  <select 
                    value={rule.endHour}
                    onChange={e => updateRule(rule.dayOfWeek, "endHour", parseInt(e.target.value))}
                    className="rounded-lg border-slate-200 py-1.5 pl-3 pr-8 text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Array.from({ length: 24 }).map((_, i) => (
                      <option key={i} value={i}>{formatTime(i, 0)}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="text-sm text-slate-400 italic">Unavailable</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {settings && (
        <>
          <div className="border-t border-slate-200 pt-10">
            <h3 className="text-lg font-semibold leading-6 text-slate-900">Booking Page Settings</h3>
            <p className="mt-1 text-sm text-slate-500">
              Customize how your public booking page looks and behaves.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="col-span-full">
                <label className="block text-sm font-medium text-slate-900">Page Title</label>
                <input
                  type="text"
                  value={settings.title}
                  onChange={e => setSettings({ ...settings, title: e.target.value })}
                  className="mt-2 block w-full rounded-xl border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                />
              </div>

              <div className="col-span-full">
                <label className="block text-sm font-medium text-slate-900">Description</label>
                <textarea
                  rows={3}
                  value={settings.description || ""}
                  onChange={e => setSettings({ ...settings, description: e.target.value })}
                  placeholder="Tell people what this meeting is about..."
                  className="mt-2 block w-full rounded-xl border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 resize-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-slate-900">Meeting Duration</label>
                <select
                  value={settings.durationMinutes}
                  onChange={e => setSettings({ ...settings, durationMinutes: parseInt(e.target.value) })}
                  className="mt-2 block w-full rounded-xl border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                >
                  {DURATIONS.map(d => <option key={d} value={d}>{d} minutes</option>)}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-slate-900">Buffer Time (Padding)</label>
                <select
                  value={settings.bufferMinutes}
                  onChange={e => setSettings({ ...settings, bufferMinutes: parseInt(e.target.value) })}
                  className="mt-2 block w-full rounded-xl border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                >
                  {BUFFERS.map(d => <option key={d} value={d}>{d} minutes</option>)}
                </select>
              </div>

              <div className="col-span-full pt-4">
                <Switch.Group as="div" className="flex items-center justify-between">
                  <span className="flex flex-grow flex-col">
                    <Switch.Label as="span" className="text-sm font-medium leading-6 text-slate-900" passive>
                      Auto-generate Google Meet Link
                    </Switch.Label>
                    <Switch.Description as="span" className="text-sm text-slate-500">
                      When someone books, automatically create a Google Meet room and send it to them.
                    </Switch.Description>
                  </span>
                  <Switch
                    checked={settings.generateMeet}
                    onChange={(val) => setSettings({ ...settings, generateMeet: val })}
                    className={`${
                      settings.generateMeet ? 'bg-blue-600' : 'bg-slate-200'
                    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                  >
                    <span
                      className={`${
                        settings.generateMeet ? 'translate-x-5' : 'translate-x-0'
                      } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </Switch>
                </Switch.Group>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="pt-6 flex items-center justify-between">
        <span className="text-sm text-green-600">{message}</span>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Availability"}
        </button>
      </div>
    </div>
  );
}
