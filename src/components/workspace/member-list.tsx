"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { RoleSelect } from "./role-select";
import { MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { WorkspaceMember, WorkspaceRole } from "@/types/workspace";

interface MemberListProps {
  members: WorkspaceMember[];
  currentUserId?: string;
  ownerId?: string;
  canManageMembers: boolean;
  onUpdateRole: (memberId: string, role: WorkspaceRole) => void;
  onRemoveMember: (memberId: string) => void;
  isUpdating?: boolean;
  isRemoving?: boolean;
}

export function MemberList({
  members,
  currentUserId,
  ownerId,
  canManageMembers,
  onUpdateRole,
  onRemoveMember,
  isUpdating,
  isRemoving,
}: MemberListProps) {
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMember | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            {canManageMembers && <TableHead className="w-[50px]" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const isOwner = member.userId === ownerId;
            const isSelf = member.userId === currentUserId;

            return (
              <TableRow key={member.userId}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      name={member.user?.name}
                      email={member.user?.email}
                      avatarUrl={member.user?.avatarUrl}
                    />
                    <div>
                      <p className="font-medium">{member.user?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.user?.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {canManageMembers && !isOwner ? (
                    <RoleSelect
                      value={member.role}
                      onChange={(role) => onUpdateRole(member.userId, role)}
                      disabled={isUpdating}
                    />
                  ) : (
                    <Badge variant={isOwner ? "default" : "secondary"}>
                      {member.role}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(member.joinedAt).toLocaleDateString()}
                </TableCell>
                {canManageMembers && (
                  <TableCell>
                    {!isOwner && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setMemberToRemove(member)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {isSelf ? "Leave workspace" : "Remove member"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
        title={memberToRemove?.userId === currentUserId ? "Leave workspace?" : "Remove member?"}
        description={
          memberToRemove?.userId === currentUserId
            ? "Are you sure you want to leave this workspace? You'll need to be invited again to rejoin."
            : `Are you sure you want to remove ${memberToRemove?.user?.name} from this workspace?`
        }
        confirmText={memberToRemove?.userId === currentUserId ? "Leave" : "Remove"}
        variant="destructive"
        onConfirm={() => {
          if (memberToRemove) {
            onRemoveMember(memberToRemove.userId);
            setMemberToRemove(null);
          }
        }}
        isLoading={isRemoving}
      />
    </>
  );
}
