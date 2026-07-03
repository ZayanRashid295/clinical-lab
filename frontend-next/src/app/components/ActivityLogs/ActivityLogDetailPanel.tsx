"use client";

import React, { useState } from "react";
import {
  Calendar,
  FileSearch,
  Globe,
  Hash,
  Monitor,
  Tag,
  User,
  Users,
} from "lucide-react";
import Modal from "../../../shared/components/Modal/Modal";
import { Button } from "@/shared/ui/button";
import { ActivityLog } from "../../types/activity-log";
import {
  buildActivityNarrative,
  buildActivitySubtext,
  formatFullDateTime,
  formatIpAddress,
  getComponentMeta,
  getInitials,
  parseUserAgent,
} from "./activity-log.utils";
import ActivityLogFullDetailModal from "./ActivityLogFullDetailModal";

interface ActivityLogDetailPanelProps {
  log: ActivityLog | null;
  isOpen: boolean;
  onClose: () => void;
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  if (value == null || value === "" || value === "—") return null;
  return (
    <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="mt-0.5 text-gray-400">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </p>
        <div className="mt-1 text-sm text-gray-900 break-words">{value}</div>
      </div>
    </div>
  );
}

export default function ActivityLogDetailPanel({
  log,
  isOpen,
  onClose,
}: ActivityLogDetailPanelProps) {
  const [fullDetailOpen, setFullDetailOpen] = useState(false);

  if (!log) return null;

  const meta = getComponentMeta(log.component);
  const ComponentIcon = meta.icon;
  const origin = parseUserAgent(log.userAgent);
  const subtext = buildActivitySubtext(log);
  const ipDisplay = formatIpAddress(
    log.ipAddress,
    log.ipAddressRaw,
    log.ipForwardedFor,
  );

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Event details"
      size="lg"
    >
      <div className="space-y-6">
        <div className="rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-base font-semibold text-primary shadow-sm">
              {getInitials(log.userFullName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-gray-900 leading-snug">
                {buildActivityNarrative(log)}
              </p>
              {subtext && (
                <p className="mt-2 text-sm text-gray-600">{subtext}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${meta.badgeClass}`}
                >
                  <ComponentIcon className="h-3.5 w-3.5" />
                  {meta.label}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-xs text-gray-600">
                  {log.eventLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            className="gap-2"
            onClick={() => setFullDetailOpen(true)}
          >
            <FileSearch className="h-4 w-4" />
            View complete log
          </Button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <DetailRow icon={Calendar} label="Time" value={formatFullDateTime(log.time)} />
          <DetailRow icon={User} label="Performed by" value={
            log.userFullName ? (
              <span>
                {log.userFullName}
                {log.userEmail && (
                  <span className="block text-gray-500 text-xs mt-0.5">{log.userEmail}</span>
                )}
              </span>
            ) : "System"
          } />
          <DetailRow icon={Users} label="Affected user" value={
            log.affectedUserFullName ? (
              <span>
                {log.affectedUserFullName}
                {log.affectedUserEmail && (
                  <span className="block text-gray-500 text-xs mt-0.5">{log.affectedUserEmail}</span>
                )}
              </span>
            ) : null
          } />
          <DetailRow icon={Tag} label="Context" value={log.contextLabel ?? log.contextId} />
          <DetailRow icon={Hash} label="Context type" value={log.contextType} />
          <DetailRow icon={Globe} label="IP address" value={ipDisplay} />
          <DetailRow icon={Monitor} label="Device" value={origin.summary} />
          {log.userAgent && (
            <DetailRow icon={Monitor} label="Full user agent" value={
              <span className="text-xs text-gray-600 font-mono break-all">{log.userAgent}</span>
            } />
          )}
        </div>

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>

    <ActivityLogFullDetailModal
      log={log}
      isOpen={fullDetailOpen}
      onClose={() => setFullDetailOpen(false)}
    />
    </>
  );
}
