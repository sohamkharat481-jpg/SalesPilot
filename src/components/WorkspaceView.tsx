import React from 'react';
import { TeamCollaborationHub } from './team/TeamCollaborationHub';

interface WorkspaceViewProps {
  user: any;
  leads?: any[];
  deals?: any[];
  onRefreshUser?: () => void;
}

export default function WorkspaceView({ user, leads = [], deals = [], onRefreshUser }: WorkspaceViewProps) {
  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
      <TeamCollaborationHub
        user={user}
        leads={leads}
        deals={deals}
        onRefreshData={onRefreshUser}
      />
    </div>
  );
}
