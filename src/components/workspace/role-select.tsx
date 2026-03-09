"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WORKSPACE_ROLES } from "@/constants/roles";
import type { WorkspaceRole } from "@/types/workspace";

interface RoleSelectProps {
  value: WorkspaceRole;
  onChange: (role: WorkspaceRole) => void;
  disabled?: boolean;
  excludeOwner?: boolean;
}

export function RoleSelect({ value, onChange, disabled, excludeOwner = true }: RoleSelectProps) {
  const roles = excludeOwner
    ? WORKSPACE_ROLES.filter((role) => role.value !== "owner")
    : WORKSPACE_ROLES;

  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as WorkspaceRole)}
      disabled={disabled}
    >
      <SelectTrigger className="w-[130px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => (
          <SelectItem key={role.value} value={role.value}>
            {role.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
