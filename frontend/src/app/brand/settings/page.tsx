"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  HiUserPlus, 
  HiPencil, 
  HiTrash,
  HiEye,
  HiShieldCheck,
  HiCog6Tooth,
  HiDocumentText
} from "react-icons/hi2";

interface TeamMember {
  id: number;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
  role: string;
  is_active: boolean;
  joined_at: string;
  last_activity: string;
  can_create_campaigns: boolean;
  can_manage_users: boolean;
  can_approve_content: boolean;
  can_view_analytics: boolean;
}

interface AuditLog {
  id: number;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
  action: string;
  action_display: string;
  description: string;
  created_at: string;
}

export default function BrandSettingsPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  
  // Invite form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");

  useEffect(() => {
    // TODO: Replace with actual API calls
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Simulate API calls
        setTimeout(() => {
          setTeamMembers([
            {
              id: 1,
              user: {
                first_name: "John",
                last_name: "Doe",
                email: "john@company.com"
              },
              role: "owner",
              is_active: true,
              joined_at: "2024-01-01T00:00:00Z",
              last_activity: "2024-02-15T10:30:00Z",
              can_create_campaigns: true,
              can_manage_users: true,
              can_approve_content: true,
              can_view_analytics: true
            },
            {
              id: 2,
              user: {
                first_name: "Sarah",
                last_name: "Smith",
                email: "sarah@company.com"
              },
              role: "manager",
              is_active: true,
              joined_at: "2024-01-15T00:00:00Z",
              last_activity: "2024-02-14T15:45:00Z",
              can_create_campaigns: true,
              can_manage_users: false,
              can_approve_content: true,
              can_view_analytics: true
            }
          ]);

          setAuditLogs([
            {
              id: 1,
              user: {
                first_name: "John",
                last_name: "Doe",
                email: "john@company.com"
              },
              action: "campaign_created",
              action_display: "Campaign Created",
              description: "Created campaign 'Summer Fashion 2024'",
              created_at: "2024-02-15T10:00:00Z"
            },
            {
              id: 2,
              user: {
                first_name: "Sarah",
                last_name: "Smith",
                email: "sarah@company.com"
              },
              action: "content_approved",
              action_display: "Content Approved",
              description: "Approved content for deal #123",
              created_at: "2024-02-14T16:30:00Z"
            }
          ]);

          setIsLoading(false);
        }, 1000);
      } catch (error) {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'editor': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <HiShieldCheck className="w-4 h-4" />;
      case 'admin': return <HiCog6Tooth className="w-4 h-4" />;
      case 'manager': return <HiDocumentText className="w-4 h-4" />;
      default: return <HiEye className="w-4 h-4" />;
    }
  };

  const handleInviteUser = async () => {
    // TODO: Implement actual API call
    console.log("Inviting user:", { inviteEmail, inviteFirstName, inviteLastName, inviteRole });
    setShowInviteDialog(false);
    setInviteEmail("");
    setInviteFirstName("");
    setInviteLastName("");
    setInviteRole("viewer");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Team & Settings</h1>
        <p className="text-gray-600">Manage your team members and brand settings</p>
      </div>

      <Tabs defaultValue="team" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="team">Team Management</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="settings">Brand Settings</TabsTrigger>
        </TabsList>

        {/* Team Management Tab */}
        <TabsContent value="team" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button>
                  <HiUserPlus className="w-4 h-4 mr-2" />
                  Invite Team Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <Input
                        value={inviteFirstName}
                        onChange={(e) => setInviteFirstName(e.target.value)}
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <Input
                        value={inviteLastName}
                        onChange={(e) => setInviteLastName(e.target.value)}
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="email@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="manager">Campaign Manager</option>
                      <option value="admin">Administrator</option>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleInviteUser}>
                      Send Invitation
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {teamMembers.map((member) => (
              <Card key={member.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-blue-600">
                        {member.user.first_name.charAt(0)}{member.user.last_name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {member.user.first_name} {member.user.last_name}
                      </h3>
                      <p className="text-gray-600">{member.user.email}</p>
                      <p className="text-sm text-gray-500">
                        Joined {new Date(member.joined_at).toLocaleDateString()} • 
                        Last active {new Date(member.last_activity).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <Badge className={getRoleColor(member.role)}>
                        {getRoleIcon(member.role)}
                        <span className="ml-1 capitalize">{member.role}</span>
                      </Badge>
                      <div className="flex gap-1 mt-2">
                        {member.can_create_campaigns && (
                          <Badge variant="outline" className="text-xs">Create</Badge>
                        )}
                        {member.can_manage_users && (
                          <Badge variant="outline" className="text-xs">Manage</Badge>
                        )}
                        {member.can_approve_content && (
                          <Badge variant="outline" className="text-xs">Approve</Badge>
                        )}
                        {member.can_view_analytics && (
                          <Badge variant="outline" className="text-xs">Analytics</Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <HiPencil className="w-4 h-4" />
                      </Button>
                      {member.role !== 'owner' && (
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <HiTrash className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Activity Log</h2>
            <p className="text-gray-600">Track all actions performed by team members</p>
          </div>

          <div className="space-y-4">
            {auditLogs.map((log) => (
              <Card key={log.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-gray-600">
                        {log.user.first_name.charAt(0)}{log.user.last_name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {log.user.first_name} {log.user.last_name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {log.action_display}
                        </Badge>
                      </div>
                      <p className="text-gray-600">{log.description}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Brand Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Brand Information</h2>
          </div>

          <Card className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand Name
                  </label>
                  <Input placeholder="Your Brand Name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <Select>
                    <option value="fashion_beauty">Fashion & Beauty</option>
                    <option value="tech_gaming">Tech & Gaming</option>
                    <option value="fitness_health">Fitness & Health</option>
                    <option value="food_lifestyle">Food & Lifestyle</option>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Brief description of your brand..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <Input placeholder="https://yourbrand.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email
                  </label>
                  <Input placeholder="contact@yourbrand.com" />
                </div>
              </div>

              <div className="flex justify-end">
                <Button>Save Changes</Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 