"use client";

import {useEffect, useState} from "react";
import {Card} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Textarea} from "@/components/ui/textarea";
import {HiCog6Tooth, HiDocumentText, HiEye, HiPencil, HiShieldCheck, HiTrash, HiUserPlus} from "react-icons/hi2";
import {api} from "@/lib/api";
import {toast} from "@/lib/toast";
import {LogoUpload} from "@/components/ui/logo-upload";
import {ProfileImageUpload} from "@/components/ui/profile-image-upload";
import {useLocationData} from "@/hooks/use-location-data";
import {useIndustries} from "@/hooks/use-industries";
import {getMediaUrl} from "@/lib/utils";
import {OptimizedAvatar} from "@/components/ui";

interface TeamMember {
    id: number;
    user: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
        profile_image?: string;
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
        profile_image?: string;
    };
    action: string;
    action_display: string;
    description: string;
    created_at: string;
}

interface Brand {
    id: number;
    name: string;
    domain: string;
    logo?: string;
    description: string;
    website: string;
    industry: string;
    contact_email: string;
    is_verified: boolean;
    rating: number;
    total_campaigns: number;
    created_at: string;
    updated_at: string;
}

interface UserPermissions {
    can_manage_users: boolean;
    can_create_campaigns: boolean;
    can_approve_content: boolean;
    can_view_analytics: boolean;
    role: string;
}

export default function BrandSettingsPage() {
    const {cities, states, loading: locationLoading, error: locationError, lookupPincode} = useLocationData();
    const {industries, loading: industriesLoading} = useIndustries();
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [brand, setBrand] = useState<Brand | null>(null);
    const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [showRoleDialog, setShowRoleDialog] = useState(false);
    const [showDomainUsersDialog, setShowDomainUsersDialog] = useState(false);
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [domainUsers, setDomainUsers] = useState<any[]>([]);
    const [isLoadingDomainUsers, setIsLoadingDomainUsers] = useState(false);

    // Form edit states
    const [isEditingBrand, setIsEditingBrand] = useState(false);

    // Invite form state
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteFirstName, setInviteFirstName] = useState("");
    const [inviteLastName, setInviteLastName] = useState("");
    const [inviteRole, setInviteRole] = useState("viewer");

    // Brand form state
    const [brandName, setBrandName] = useState("");
    const [brandIndustry, setBrandIndustry] = useState("");
    const [brandDescription, setBrandDescription] = useState("");
    const [brandWebsite, setBrandWebsite] = useState("");
    const [brandContactEmail, setBrandContactEmail] = useState("");

    // Role update state
    const [newRole, setNewRole] = useState("");

    // Logo upload state
    const [logoFile, setLogoFile] = useState<File | null>(null);

    // Profile image upload state
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);

    // User profile state
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [userFirstName, setUserFirstName] = useState("");
    const [userLastName, setUserLastName] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [userPhoneNumber, setUserPhoneNumber] = useState("");
    const [userCountryCode, setUserCountryCode] = useState("+91");
    const [userGender, setUserGender] = useState("");
    const [userCountry, setUserCountry] = useState("");
    const [userState, setUserState] = useState("");
    const [userCity, setUserCity] = useState("");
    const [userZipcode, setUserZipcode] = useState("");
    const [userAddressLine1, setUserAddressLine1] = useState("");
    const [userAddressLine2, setUserAddressLine2] = useState("");
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    useEffect(() => {
        fetchBrandSettings();
        fetchCurrentUser();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const response = await api.get('/auth/profile/');
            console.log('Current user response:', response.data);
            if (response.data.success !==false) {
                console.log('Current user data:', response.data.user);
                setCurrentUser(response.data.user);
                setUserFirstName(response.data.user.first_name || '');
                setUserLastName(response.data.user.last_name || '');
                setUserEmail(response.data.user.email || '');
                setUserPhoneNumber(response.data.user.phone_number || '');
                setUserCountryCode(response.data.user.country_code || '+91');
                setUserGender(response.data.user.gender || '');
                setUserCountry(response.data.user.country || '');
                setUserState(response.data.user.state || '');
                setUserCity(response.data.user.city || '');
                setUserZipcode(response.data.user.zipcode || '');
                setUserAddressLine1(response.data.user.address_line1 || '');
                setUserAddressLine2(response.data.user.address_line2 || '');
            }
        } catch (error) {
            console.error('Error fetching current user:', error);
            toast.error('Failed to load user profile');
        }
    };

    const fetchBrandSettings = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/brands/settings/');

            if (response.data.status === 'success') {
                setBrand(response.data.brand);
                setTeamMembers(response.data.team_members);
                setAuditLogs(response.data.audit_logs);
                setUserPermissions(response.data.user_permissions);

                // Set form values
                setBrandName(response.data.brand.name);
                setBrandIndustry(response.data.brand.industry);
                setBrandDescription(response.data.brand.description);
                setBrandWebsite(response.data.brand.website);
                setBrandContactEmail(response.data.brand.contact_email);
            }
        } catch (error) {
            console.error('Error fetching brand settings:', error);
            toast.error('Failed to load brand settings');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDomainUsers = async () => {
        setIsLoadingDomainUsers(true);
        try {
            const response = await api.get('/brands/team/users-by-domain/');

            if (response.data.status === 'success') {
                setDomainUsers(response.data.users);
            }
        } catch (error) {
            console.error('Error fetching domain users:', error);
            toast.error('Failed to load domain users');
        } finally {
            setIsLoadingDomainUsers(false);
        }
    };

    const handleInviteExistingUser = async (user: any, role: string) => {
        try {
            const response = await api.post('/brands/team/invite/', {
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: role
            });

            if (response.data.status === 'success') {
                toast.success('User invited successfully');
                setShowDomainUsersDialog(false);
                // Refresh team members and domain users
                fetchBrandSettings();
                fetchDomainUsers();
            }
        } catch (error: any) {
            console.error('Error inviting user:', error);
            toast.error(error.response?.data?.message || 'Failed to invite user');
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'owner':
                return 'bg-purple-100 text-purple-800';
            case 'admin':
                return 'bg-red-100 text-red-800';
            case 'manager':
                return 'bg-blue-100 text-blue-800';
            case 'editor':
                return 'bg-green-100 text-green-800';
            case 'viewer':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'owner':
                return <HiShieldCheck className="w-4 h-4"/>;
            case 'admin':
                return <HiCog6Tooth className="w-4 h-4"/>;
            case 'manager':
                return <HiDocumentText className="w-4 h-4"/>;
            default:
                return <HiEye className="w-4 h-4"/>;
        }
    };

    const handleInviteUser = async () => {
        if (!inviteEmail || !inviteRole) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            const response = await api.post('/brands/team/invite/', {
                email: inviteEmail,
                first_name: inviteFirstName,
                last_name: inviteLastName,
                role: inviteRole
            });

            if (response.data.status === 'success') {
                toast.success('User invited successfully');
                setShowInviteDialog(false);
                setInviteEmail("");
                setInviteFirstName("");
                setInviteLastName("");
                setInviteRole("viewer");
                // Refresh team members data since we need the full team member object
                fetchBrandSettings();
            }
        } catch (error: any) {
            console.error('Error inviting user:', error);
            toast.error(error.response?.data?.message || 'Failed to invite user');
        }
    };

    const handleUpdateRole = async () => {
        if (!selectedMember || !newRole) {
            toast.error('Please select a role');
            return;
        }

        try {
            const response = await api.put(`/brands/team/${selectedMember.id}/role/`, {
                role: newRole
            });

            if (response.data.status === 'success') {
                toast.success('Role updated successfully');
                setShowRoleDialog(false);
                setSelectedMember(null);
                setNewRole("");
                // Update local state instead of refetching
                setTeamMembers(prevMembers =>
                    prevMembers.map(member =>
                        member.id === selectedMember.id
                            ? {...member, role: newRole}
                            : member
                    )
                );
            }
        } catch (error: any) {
            console.error('Error updating role:', error);
            toast.error(error.response?.data?.message || 'Failed to update role');
        }
    };

    const handleRemoveMember = async (member: TeamMember) => {
        if (!confirm(`Are you sure you want to remove ${member.user.first_name} ${member.user.last_name} from the team?`)) {
            return;
        }

        try {
            const response = await api.delete(`/brands/team/${member.id}/remove/`);

            if (response.data.status === 'success') {
                toast.success('Team member removed successfully');
                // Update local state instead of refetching
                setTeamMembers(prevMembers =>
                    prevMembers.filter(m => m.id !== member.id)
                );
            }
        } catch (error: any) {
            console.error('Error removing team member:', error);
            toast.error(error.response?.data?.message || 'Failed to remove team member');
        }
    };

    const handleSaveBrandInfo = async () => {
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('name', brandName);
            formData.append('industry', brandIndustry);
            formData.append('description', brandDescription);
            formData.append('website', brandWebsite);
            formData.append('contact_email', brandContactEmail);

            if (logoFile) {
                formData.append('logo', logoFile);
            }

            const response = await api.put('/brands/profile/update/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.status === 'success') {
                toast.success('Brand information updated successfully');

                // Update local state directly instead of refetching
                if (brand) {
                    const updatedBrand = {
                        ...brand,
                        name: brandName,
                        industry: brandIndustry,
                        description: brandDescription,
                        website: brandWebsite,
                        contact_email: brandContactEmail,
                        // Update logo if it was uploaded
                        ...(response.data.brand.logo && {logo: response.data.brand.logo})
                    };
                    setBrand(updatedBrand);
                }

                setLogoFile(null);
                setIsEditingBrand(false);
            }
        } catch (error: any) {
            console.error('Error updating brand info:', error);
            toast.error(error.response?.data?.message || 'Failed to update brand information');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        // Reset form values to original brand data
        if (brand) {
            setBrandName(brand.name);
            setBrandIndustry(brand.industry);
            setBrandDescription(brand.description);
            setBrandWebsite(brand.website);
            setBrandContactEmail(brand.contact_email);
        }
        setLogoFile(null);
        setIsEditingBrand(false);
    };

    const handleLogoSelect = (file: File) => {
        setLogoFile(file);
    };

    const handleLogoRemove = () => {
        setLogoFile(null);
    };

    const handleProfileImageSelect = (file: File) => {
        setProfileImageFile(file);
    };

    const handleProfileImageRemove = () => {
        setProfileImageFile(null);
    };

    const handleSaveProfile = async () => {
        setIsSavingProfile(true);
        try {
            const formData = new FormData();
            formData.append('first_name', userFirstName);
            formData.append('last_name', userLastName);
            formData.append('phone_number', userPhoneNumber);
            formData.append('country_code', userCountryCode);
            formData.append('gender', userGender);
            formData.append('country', userCountry);
            formData.append('state', userState);
            formData.append('city', userCity);
            formData.append('zipcode', userZipcode);
            formData.append('address_line1', userAddressLine1);
            formData.append('address_line2', userAddressLine2);

            if (profileImageFile) {
                formData.append('profile_image', profileImageFile);
            }

            const response = await api.put('/users/profile/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.status === 'success') {
                toast.success('Profile updated successfully');
                setCurrentUser(response.data.user);
                setIsEditingProfile(false);
                setProfileImageFile(null);
                fetchCurrentUser(); // Refresh user data
            }
        } catch (error: any) {
            console.error('Error updating profile:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleCancelProfileEdit = () => {
        if (currentUser) {
            setUserFirstName(currentUser.first_name || '');
            setUserLastName(currentUser.last_name || '');
            setUserEmail(currentUser.email || '');
            setUserPhoneNumber(currentUser.phone_number || '');
            setUserCountryCode(currentUser.country_code || '+91');
            setUserGender(currentUser.gender || '');
            setUserCountry(currentUser.country || '');
            setUserState(currentUser.state || '');
            setUserCity(currentUser.city || '');
            setUserZipcode(currentUser.zipcode || '');
            setUserAddressLine1(currentUser.address_line1 || '');
            setUserAddressLine2(currentUser.address_line2 || '');
        }
        setProfileImageFile(null);
        setIsEditingProfile(false);
    };

    const handlePincodeLookup = async (pincode: string) => {
        console.log('Pincode lookup called with:', pincode);
        if (pincode.length === 6) {
            console.log('Pincode length is 6, calling lookupPincode...');
            const locationData = await lookupPincode(pincode);
            console.log('Location data received:', locationData);
            if (locationData) {
                console.log('Setting address fields:', {
                    country: locationData.country,
                    state: locationData.state,
                    city: locationData.city
                });
                setUserCountry(locationData.country);
                setUserState(locationData.state);
                setUserCity(locationData.city);
                toast.success('Address details auto-filled from pincode');
            } else {
                console.log('No location data found for pincode:', pincode);
                toast.error('Could not find address details for this pincode');
            }
        }
    };

    const getIndustryDisplayName = (industry: string) => {
        const industryObj = industries.find(i => i.key === industry);
        return industryObj ? industryObj.name : industry;
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
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="team">Team Management</TabsTrigger>
                    <TabsTrigger value="audit">Audit Logs</TabsTrigger>
                    <TabsTrigger value="settings">Brand Settings</TabsTrigger>
                    <TabsTrigger value="profile">My Profile</TabsTrigger>
                </TabsList>

                {/* Team Management Tab */}
                <TabsContent value="team" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
                        {userPermissions?.can_manage_users && (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowDomainUsersDialog(true);
                                        fetchDomainUsers();
                                    }}
                                >
                                    <HiUserPlus className="w-4 h-4 mr-2"/>
                                    Add from Domain
                                </Button>
                                <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <HiUserPlus className="w-4 h-4 mr-2"/>
                                            Invite New User
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Invite New Team Member</DialogTitle>
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
                                                    Email Address *
                                                </label>
                                                <Input
                                                    type="email"
                                                    value={inviteEmail}
                                                    onChange={(e) => setInviteEmail(e.target.value)}
                                                    placeholder="email@company.com"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Role *
                                                </label>
                                                <Select value={inviteRole} onValueChange={setInviteRole}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select role"/>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="viewer">Viewer</SelectItem>
                                                        <SelectItem value="editor">Editor</SelectItem>
                                                        <SelectItem value="manager">Campaign Manager</SelectItem>
                                                        {userPermissions?.role === 'owner' && (
                                                            <SelectItem value="admin">Administrator</SelectItem>
                                                        )}
                                                    </SelectContent>
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
                        )}
                    </div>

                    {/* Team Members List */}
                    <div className="space-y-4">
                        {teamMembers.length > 0 ? (
                            teamMembers.map((member) => (
                                <Card key={member.id} className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <OptimizedAvatar
                                                src={getMediaUrl(member.user.profile_image)}
                                                alt={`${member.user.first_name} ${member.user.last_name}`}
                                                size="md"
                                                fallback={`${member.user.first_name.charAt(0)}${member.user.last_name.charAt(0)}`}
                                            />
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

                                            {userPermissions?.can_manage_users && member.role !== 'owner' && (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedMember(member);
                                                            setNewRole(member.role);
                                                            setShowRoleDialog(true);
                                                        }}
                                                    >
                                                        <HiPencil className="w-4 h-4"/>
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700"
                                                        onClick={() => handleRemoveMember(member)}
                                                    >
                                                        <HiTrash className="w-4 h-4"/>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <Card className="p-8 text-center">
                                <div
                                    className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <HiUserPlus className="w-8 h-8 text-gray-400"/>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
                                <p className="text-gray-600 mb-4">
                                    Start building your team by inviting colleagues or adding users from your domain.
                                </p>
                                {userPermissions?.can_manage_users && (
                                    <div className="flex gap-2 justify-center">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setShowDomainUsersDialog(true);
                                                fetchDomainUsers();
                                            }}
                                        >
                                            <HiUserPlus className="w-4 h-4 mr-2"/>
                                            Add from Domain
                                        </Button>
                                        <Button onClick={() => setShowInviteDialog(true)}>
                                            <HiUserPlus className="w-4 h-4 mr-2"/>
                                            Invite New User
                                        </Button>
                                    </div>
                                )}
                            </Card>
                        )}
                    </div>
                </TabsContent>

                {/* Audit Logs Tab */}
                <TabsContent value="audit" className="space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Activity Log</h2>
                        <p className="text-gray-600">Track all actions performed by team members</p>
                    </div>

                    <div className="space-y-4">
                        {auditLogs.length > 0 ? (
                            auditLogs.map((log) => (
                                <Card key={log.id} className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <OptimizedAvatar
                                                src={getMediaUrl(log.user.profile_image)}
                                                alt={`${log.user.first_name} ${log.user.last_name}`}
                                                size="sm"
                                                fallback={`${log.user.first_name.charAt(0)}${log.user.last_name.charAt(0)}`}
                                            />
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
                            ))
                        ) : (
                            <Card className="p-8 text-center">
                                <div
                                    className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <HiDocumentText className="w-8 h-8 text-gray-400"/>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
                                <p className="text-gray-600">
                                    Activity logs will appear here as team members perform actions.
                                </p>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                {/* Brand Settings Tab */}
                <TabsContent value="settings" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Brand Information</h2>
                            {brand && (
                                <div className="flex items-center gap-2 mb-4">
                                    <Badge variant={brand.is_verified ? "default" : "secondary"}>
                                        {brand.is_verified ? "Verified" : "Unverified"}
                                    </Badge>
                                    <span className="text-sm text-gray-500">
                    Rating: {brand.rating}/5 • {brand.total_campaigns} campaigns
                  </span>
                                </div>
                            )}
                        </div>
                        {!isEditingBrand && (
                            <Button
                                variant="outline"
                                onClick={() => setIsEditingBrand(true)}
                            >
                                <HiPencil className="w-4 h-4 mr-2"/>
                                Edit Brand Info
                            </Button>
                        )}
                    </div>

                    <Card className="p-6">
                        <div className="space-y-6">
                            {/* Brand Logo */}
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <div
                                        className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                        {brand?.logo ? (
                                            <img
                                                src={brand.logo}
                                                alt="Brand logo"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    console.error('Logo image failed to load:', brand.logo);
                                                    // If image fails to load, show placeholder
                                                    e.currentTarget.style.display = 'none';
                                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                }}
                                                onLoad={() => {
                                                    console.log('Logo image loaded successfully:', brand.logo);
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className={`w-full h-full flex items-center justify-center text-gray-400 ${brand?.logo ? 'hidden' : ''}`}>
                                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd"
                                                      d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                                                      clipRule="evenodd"/>
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900">Brand Logo</h3>
                                        <p className="text-sm text-gray-500">
                                            {brand?.logo ? 'Your brand\'s visual identity' : 'No logo uploaded yet'}
                                        </p>

                                        {/* Logo Upload in Edit Mode - Inline */}
                                        {isEditingBrand && (
                                            <div className="mt-3">
                                                <LogoUpload
                                                    currentImage={brand?.logo}
                                                    onImageSelect={handleLogoSelect}
                                                    onImageRemove={handleLogoRemove}
                                                    maxSize={5 * 1024 * 1024} // 5MB
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Brand Information Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Brand Name
                                    </label>
                                    {isEditingBrand ? (
                                        <Input
                                            value={brandName}
                                            onChange={(e) => setBrandName(e.target.value)}
                                            placeholder="Your Brand Name"
                                        />
                                    ) : (
                                        <div className="p-3 bg-gray-50 rounded-md border">
                                            <span className="text-gray-900">{brand?.name || 'Not set'}</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Industry
                                    </label>
                                    {isEditingBrand ? (
                                        <Select value={brandIndustry} onValueChange={setBrandIndustry}
                                                disabled={industriesLoading}>
                                            <SelectTrigger>
                                                <SelectValue
                                                    placeholder={industriesLoading ? "Loading industries..." : "Select Industry"}/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {industriesLoading ? (
                                                    <SelectItem value="loading" disabled>Loading
                                                        industries...</SelectItem>
                                                ) : (
                                                    industries.map((industry) => (
                                                        <SelectItem key={industry.key} value={industry.key}>
                                                            {industry.name}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="p-3 bg-gray-50 rounded-md border">
                      <span className="text-gray-900">
                        {brand?.industry ? getIndustryDisplayName(brand.industry) : 'Not set'}
                      </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                {isEditingBrand ? (
                                    <Textarea
                                        placeholder="Brief description of your brand..."
                                        value={brandDescription}
                                        onChange={(e) => setBrandDescription(e.target.value)}
                                        rows={3}
                                    />
                                ) : (
                                    <div className="p-3 bg-gray-50 rounded-md border min-h-[80px]">
                    <span className="text-gray-900 whitespace-pre-wrap">
                      {brand?.description || 'No description provided'}
                    </span>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Website
                                    </label>
                                    {isEditingBrand ? (
                                        <Input
                                            value={brandWebsite}
                                            onChange={(e) => setBrandWebsite(e.target.value)}
                                            placeholder="https://yourbrand.com"
                                        />
                                    ) : (
                                        <div className="p-3 bg-gray-50 rounded-md border">
                                            {brand?.website ? (
                                                <a
                                                    href={brand.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 underline"
                                                >
                                                    {brand.website}
                                                </a>
                                            ) : (
                                                <span className="text-gray-500">Not set</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Contact Email
                                    </label>
                                    {isEditingBrand ? (
                                        <Input
                                            value={brandContactEmail}
                                            onChange={(e) => setBrandContactEmail(e.target.value)}
                                            placeholder="contact@yourbrand.com"
                                        />
                                    ) : (
                                        <div className="p-3 bg-gray-50 rounded-md border">
                                            {brand?.contact_email ? (
                                                <a
                                                    href={`mailto:${brand.contact_email}`}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    {brand.contact_email}
                                                </a>
                                            ) : (
                                                <span className="text-gray-500">Not set</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Read-only sensitive fields */}
                            {brand && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Company Domain (Read-only)
                                        </label>
                                        <div className="p-3 bg-gray-50 rounded-md border">
                                            <span className="text-gray-900">{brand.domain}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Domain cannot be changed for security reasons
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Edit Actions */}
                            {isEditingBrand && (
                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button variant="outline" onClick={handleCancelEdit}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleSaveBrandInfo} disabled={isSaving}>
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>
                </TabsContent>

                {/* My Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">My Profile</h2>
                            <p className="text-gray-600">Manage your personal information and account settings</p>
                        </div>
                        {!isEditingProfile && (
                            <Button
                                variant="outline"
                                onClick={() => setIsEditingProfile(true)}
                            >
                                <HiPencil className="w-4 h-4 mr-2"/>
                                Edit Profile
                            </Button>
                        )}
                    </div>

                    <Card className="p-6">
                        <div className="space-y-6">
                            {/* Profile Avatar */}
                            <div className="flex items-center space-x-4">
                                <div
                                    className="w-20 h-20 bg-gradient-to-br from-red-500 via-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                                    {currentUser?.profile_image ? (
                                        <img
                                            src={currentUser.profile_image}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                            }}
                                        />
                                    ) : null}
                                    <span
                                        className={`text-2xl font-bold text-white ${currentUser?.profile_image ? 'hidden' : ''}`}>
                      {currentUser ? `${currentUser.first_name?.charAt(0) || ''}${currentUser.last_name?.charAt(0) || ''}` : 'U'}
                    </span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {currentUser ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}` : 'User Profile'}
                                    </h3>
                                    <p className="text-gray-600">{currentUser?.email || 'Loading...'}</p>
                                    <p className="text-sm text-gray-500">
                                        Member
                                        since {currentUser?.date_joined ? new Date(currentUser.date_joined).toLocaleDateString() : 'N/A'}
                                    </p>

                                    {/* Profile Image Upload in Edit Mode */}
                                    {isEditingProfile && (
                                        <div className="mt-3">
                                            <ProfileImageUpload
                                                currentImage={currentUser?.profile_image}
                                                onImageSelect={handleProfileImageSelect}
                                                onImageRemove={handleProfileImageRemove}
                                                maxSize={5 * 1024 * 1024} // 5MB
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Profile Information Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        First Name
                                    </label>
                                    {isEditingProfile ? (
                                        <Input
                                            value={userFirstName}
                                            onChange={(e) => setUserFirstName(e.target.value)}
                                            placeholder="First name"
                                        />
                                    ) : (
                                        <div className="p-3 bg-gray-50 rounded-md border">
                                            <span
                                                className="text-gray-900">{currentUser?.first_name || 'Not set'}</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Last Name
                                    </label>
                                    {isEditingProfile ? (
                                        <Input
                                            value={userLastName}
                                            onChange={(e) => setUserLastName(e.target.value)}
                                            placeholder="Last name"
                                        />
                                    ) : (
                                        <div className="p-3 bg-gray-50 rounded-md border">
                                            <span className="text-gray-900">{currentUser?.last_name || 'Not set'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address (Read-only)
                                </label>
                                <div className="p-3 bg-gray-50 rounded-md border">
                                    <span className="text-gray-900">{currentUser?.email || 'Not set'}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Email address cannot be changed for security reasons
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number
                                    </label>
                                    {isEditingProfile ? (
                                        <div className="flex gap-2">
                                            <Select value={userCountryCode} onValueChange={setUserCountryCode}>
                                                <SelectTrigger className="w-24">
                                                    <SelectValue/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="+1">+1</SelectItem>
                                                    <SelectItem value="+44">+44</SelectItem>
                                                    <SelectItem value="+91">+91</SelectItem>
                                                    <SelectItem value="+61">+61</SelectItem>
                                                    <SelectItem value="+86">+86</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Input
                                                value={userPhoneNumber}
                                                onChange={(e) => setUserPhoneNumber(e.target.value)}
                                                placeholder="Phone number"
                                            />
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-gray-50 rounded-md border">
                        <span className="text-gray-900">
                          {currentUser?.phone_number ? `${currentUser.country_code} ${currentUser.phone_number}` : 'Not set'}
                        </span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Gender
                                    </label>
                                    {isEditingProfile ? (
                                        <Select value={userGender} onValueChange={setUserGender}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select gender"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male">Male</SelectItem>
                                                <SelectItem value="female">Female</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="p-3 bg-gray-50 rounded-md border">
                        <span className="text-gray-900">
                          {currentUser?.gender ? currentUser.gender.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Not set'}
                        </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Address Information */}
                            <div className="border-t pt-6">
                                <h4 className="text-lg font-medium text-gray-900 mb-4">Address Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Country
                                        </label>
                                        {isEditingProfile ? (
                                            <Select value={userCountry} onValueChange={setUserCountry}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select country"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="India">India</SelectItem>
                                                    <SelectItem value="United States">United States</SelectItem>
                                                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                                                    <SelectItem value="Canada">Canada</SelectItem>
                                                    <SelectItem value="Australia">Australia</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="p-3 bg-gray-50 rounded-md border">
                                                <span
                                                    className="text-gray-900">{currentUser?.country || 'Not set'}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            State/Province
                                        </label>
                                        {isEditingProfile ? (
                                            <Select value={userState} onValueChange={setUserState}
                                                    disabled={locationLoading}>
                                                <SelectTrigger>
                                                    <SelectValue
                                                        placeholder={locationLoading ? "Loading states..." : "Select state"}/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {states.map((state) => (
                                                        <SelectItem key={state} value={state}>
                                                            {state}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="p-3 bg-gray-50 rounded-md border">
                                                <span className="text-gray-900">{currentUser?.state || 'Not set'}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            City
                                        </label>
                                        {isEditingProfile ? (
                                            <Select value={userCity} onValueChange={setUserCity}
                                                    disabled={locationLoading}>
                                                <SelectTrigger>
                                                    <SelectValue
                                                        placeholder={locationLoading ? "Loading cities..." : "Select city"}/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {cities.map((city) => (
                                                        <SelectItem key={`${city.name}-${city.state}`}
                                                                    value={city.name}>
                                                            {city.name}, {city.state}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="p-3 bg-gray-50 rounded-md border">
                                                <span className="text-gray-900">{currentUser?.city || 'Not set'}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            ZIP/Postal Code
                                        </label>
                                        {isEditingProfile ? (
                                            <div className="space-y-2">
                                                <Input
                                                    value={userZipcode}
                                                    onChange={(e) => {
                                                        setUserZipcode(e.target.value);
                                                        handlePincodeLookup(e.target.value);
                                                    }}
                                                    placeholder="ZIP/Postal Code"
                                                    maxLength={6}
                                                />
                                                <p className="text-xs text-gray-500">
                                                    Enter a 6-digit pincode to auto-fill address details
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="p-3 bg-gray-50 rounded-md border">
                                                <span
                                                    className="text-gray-900">{currentUser?.zipcode || 'Not set'}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Address Line 1
                                    </label>
                                    {isEditingProfile ? (
                                        <Input
                                            value={userAddressLine1}
                                            onChange={(e) => setUserAddressLine1(e.target.value)}
                                            placeholder="Street address, P.O. box, company name"
                                        />
                                    ) : (
                                        <div className="p-3 bg-gray-50 rounded-md border">
                                            <span
                                                className="text-gray-900">{currentUser?.address_line1 || 'Not set'}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Address Line 2
                                    </label>
                                    {isEditingProfile ? (
                                        <Input
                                            value={userAddressLine2}
                                            onChange={(e) => setUserAddressLine2(e.target.value)}
                                            placeholder="Apartment, suite, unit, building, floor, etc."
                                        />
                                    ) : (
                                        <div className="p-3 bg-gray-50 rounded-md border">
                                            <span
                                                className="text-gray-900">{currentUser?.address_line2 || 'Not set'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Account Information */}
                            <div className="border-t pt-6">
                                <h4 className="text-lg font-medium text-gray-900 mb-4">Account Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Username
                                        </label>
                                        <div className="p-3 bg-gray-50 rounded-md border">
                                            <span className="text-gray-900">{currentUser?.username || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Account Status
                                        </label>
                                        <div className="p-3 bg-gray-50 rounded-md border">
                                            <Badge variant={currentUser?.is_active ? "default" : "secondary"}>
                                                {currentUser?.is_active ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Edit Actions */}
                            {isEditingProfile && (
                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button variant="outline" onClick={handleCancelProfileEdit}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                                        {isSavingProfile ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Role Update Dialog */}
            <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Team Member Role</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {selectedMember && (
                            <div>
                                <p className="text-sm text-gray-600 mb-4">
                                    Update role
                                    for <strong>{selectedMember.user.first_name} {selectedMember.user.last_name}</strong>
                                </p>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    New Role
                                </label>
                                <Select value={newRole} onValueChange={setNewRole}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="viewer">Viewer</SelectItem>
                                        <SelectItem value="editor">Editor</SelectItem>
                                        <SelectItem value="manager">Campaign Manager</SelectItem>
                                        {userPermissions?.role === 'owner' && (
                                            <SelectItem value="admin">Administrator</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleUpdateRole}>
                                Update Role
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Domain Users Dialog */}
            <Dialog open={showDomainUsersDialog} onOpenChange={setShowDomainUsersDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add Users from {brand?.domain}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {isLoadingDomainUsers ? (
                            <div className="text-center py-8">
                                <div
                                    className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-2 text-gray-600">Loading users...</p>
                            </div>
                        ) : domainUsers.length > 0 ? (
                            <div className="space-y-3">
                                <p className="text-sm text-gray-600">
                                    Found {domainUsers.length} user(s) with the same domain who are not yet team
                                    members.
                                </p>
                                {domainUsers.map((user) => (
                                    <Card key={user.id} className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div
                                                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-gray-600">
                            {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                          </span>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900">
                                                        {user.first_name} {user.last_name}
                                                    </h4>
                                                    <p className="text-sm text-gray-600">{user.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Select onValueChange={(role) => handleInviteExistingUser(user, role)}>
                                                    <SelectTrigger className="w-32">
                                                        <SelectValue placeholder="Role"/>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="viewer">Viewer</SelectItem>
                                                        <SelectItem value="editor">Editor</SelectItem>
                                                        <SelectItem value="manager">Manager</SelectItem>
                                                        {userPermissions?.role === 'owner' && (
                                                            <SelectItem value="admin">Admin</SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-600">No users found with the same domain.</p>
                            </div>
                        )}
                        <div className="flex justify-end">
                            <Button variant="outline" onClick={() => setShowDomainUsersDialog(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
} 