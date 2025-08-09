import React from "react";

export type LucideIcon = React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;

type IconProps = React.SVGProps<SVGSVGElement> & { className?: string; title?: string };

function Lni({ name, className = "", title, ...rest }: IconProps & { name: string }) {
  return <i aria-hidden={!title} title={title} className={`lni ${name} inline-block align-middle text-current ${className}`} {...(rest as any)} />;
}

const make = (name: string): LucideIcon => {
  const Comp = ({ className, title, ...rest }: IconProps) => (
    <Lni name={name} className={className} title={title} {...rest} />
  );
  return Comp as unknown as LucideIcon;
};

// Core icons used across the app
export const X = make("lni-close");
export const XCircle = make("lni-close");
export const Check = make("lni-checkmark");
export const CheckCheck = make("lni-checkmark-circle");
export const CheckCircle = make("lni-checkmark-circle");
export const ChevronDown = make("lni-chevron-down");
export const ChevronUp = make("lni-chevron-up");
export const AlertCircle = make("lni-warning");
export const AlertTriangle = make("lni-warning");
export const Send = make("lni-telegram");
export const Paperclip = make("lni-paperclip");
export const FileText = make("lni-file");
export const File = FileText as unknown as LucideIcon;
export const FileImage = make("lni-image");
export const Image = make("lni-image");
export const FileVideo = make("lni-video");
export const Download = make("lni-download");
export const Upload = make("lni-upload");
export const Loader2 = make("lni-spinner");
export const Search = make("lni-search");
export const MessageCircle = make("lni-comments");
export const MessageSquare = make("lni-comments");
export const MoreVertical = make("lni-more");
export const Phone = make("lni-phone");
export const Video = make("lni-video");
export const User = make("lni-user");
export const Users = make("lni-users");
export const Bell = make("lni-alarm");
export const BellRing = make("lni-alarm");
export const Menu = make("lni-menu");
export const LogOut = make("lni-exit");
export const Settings = make("lni-cog");
export const Facebook = make("lni-facebook-filled");
export const Twitter = make("lni-twitter-filled");
export const Instagram = make("lni-instagram-filled");
export const Linkedin = make("lni-linkedin-original");
export const Youtube = make("lni-youtube");
export const Calendar = make("lni-calendar");
export const Clock = make("lni-timer");
export const DollarSign = make("lni-dollar");
export const Eye = make("lni-eye");
export const EyeOff = make("lni-eye-crossed");
export const Lock = make("lni-lock");
export const Filter = make("lni-funnel");
export const RefreshCw = make("lni-reload");
export const ArrowRight = make("lni-arrow-right");
export const ArrowLeft = make("lni-arrow-left");
export const Briefcase = make("lni-briefcase");
export const Star = make("lni-star");
export const TrendingUp = make("lni-stats-up");
export const TrendingDown = make("lni-stats-down");
export const Shield = make("lni-shield");
export const Wifi = make("lni-signal");
export const WifiOff = make("lni-network");
export const Target = make("lni-bullseye");
export const Activity = make("lni-pulse");
export const Award = make("lni-trophy");
export const Building2 = make("lni-apartment");
export const BarChart3 = make("lni-bar-chart");
export const MapPin = make("lni-map-marker");
export const Package = make("lni-package");
export const Home = make("lni-home");
export const Globe = make("lni-world");
export const Zap = make("lni-bolt");
export const Save = make("lni-save");
export const PhoneIcon = Phone;
export const Mail = make("lni-envelope");

export const LineiconsShim = {};
export default LineiconsShim; 