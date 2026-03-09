"use client";

import { use, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberList } from "@/components/workspace/member-list";
import { AddMemberDialog } from "@/components/workspace/add-member-dialog";
import { useWorkspace, useWorkspaceMembers } from "@/hooks/use-workspaces";
import { useAuthStore } from "@/stores/auth-store";
import { canManageWorkspaceMembers } from "@/constants/roles";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { WorkspaceRole } from "@/types/workspace";

interface MembersPageProps {
  params: Promise<{ workspaceId: string }>;
}

export default function MembersPage({ params }: MembersPageProps) {
  const { workspaceId } = use(params);
  const { user } = useAuthStore();
  const { data: workspace, isLoading: workspaceLoading } = useWorkspace(workspaceId);
  const {
    members,
    isLoading: membersLoading,
    addMemberAsync,
    isAddingMember,
    updateMemberRole,
    isUpdatingRole,
    removeMemberAsync,
    isRemovingMember,
  } = useWorkspaceMembers(workspaceId);

  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const currentMember = members.find((m) => m.userId === user?.id);
  const canManage = currentMember && canManageWorkspaceMembers(currentMember.role);

  const handleAddMember = async (data: { email: string; role: "admin" | "member" | "viewer" }) => {
    await addMemberAsync(data);
    toast.success("Member added successfully");
  };

  const handleUpdateRole = (memberId: string, role: WorkspaceRole) => {
    updateMemberRole({ memberId, role });
    toast.success("Role updated");
  };

  const handleRemoveMember = async (memberId: string) => {
    await removeMemberAsync(memberId);
    toast.success("Member removed");
  };

  if (workspaceLoading || membersLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Members</h1>
          <p className="text-muted-foreground">
            Manage members of {workspace?.name}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspace Members</CardTitle>
          <CardDescription>
            {members.length} member{members.length !== 1 ? "s" : ""} in this workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MemberList
            members={members}
            currentUserId={user?.id}
            ownerId={workspace?.ownerId}
            canManageMembers={canManage || false}
            onUpdateRole={handleUpdateRole}
            onRemoveMember={handleRemoveMember}
            isUpdating={isUpdatingRole}
            isRemoving={isRemovingMember}
          />
        </CardContent>
      </Card>

      <AddMemberDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={handleAddMember}
      />
    </div>
  );
}
