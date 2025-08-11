import React from "react";

export type LucideIcon = React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;

type IconProps = React.SVGProps<SVGSVGElement> & { className?: string; title?: string };

function IconFont({ className = "", title, lni, ri, ...rest }: IconProps & { lni?: string; ri?: string }) {
  const hasLni = !!lni;
  const classNames = `${hasLni ? `lni ${lni}` : `ri ${ri}`} inline-block align-middle text-current ${className}`.trim();
  return <i aria-hidden={!title} title={title} className={classNames} {...(rest as any)} />;
}

const make = (lniName: string, riName?: string): LucideIcon => {
  const Comp = ({ className, title, ...rest }: IconProps) => (
    <IconFont lni={lniName} ri={riName} className={className} title={title} {...rest} />
  );
  return Comp as unknown as LucideIcon;
};

// Core icons used across the app (Lineicons first, Remix Icon fallback)
export const X = make("lni-close", "ri-close-line");
export const XCircle = make("lni-close", "ri-close-circle-line");
export const Check = make("lni-checkmark", "ri-check-line");
export const CheckCheck = make("lni-checkmark-circle", "ri-check-double-line");
export const CheckCircle = make("lni-checkmark-circle", "ri-check-circle-line");
export const ChevronDown = make("lni-chevron-down", "ri-arrow-down-s-line");
export const ChevronUp = make("lni-chevron-up", "ri-arrow-up-s-line");
export const AlertCircle = make("lni-warning", "ri-error-warning-line");
export const AlertTriangle = make("lni-warning", "ri-alert-line");
export const Send = make("lni-telegram", "ri-send-plane-2-line");
export const Paperclip = make("lni-paperclip", "ri-attachment-2");
export const FileText = make("lni-file", "ri-file-3-line");
export const File = FileText as unknown as LucideIcon;
export const FileImage = make("lni-image", "ri-image-line");
export const Image = make("lni-image", "ri-image-line");
export const FileVideo = make("lni-video", "ri-video-line");
export const Download = make("lni-download", "ri-download-2-line");
export const Upload = make("lni-upload", "ri-upload-2-line");
export const Loader2 = make("lni-spinner", "ri-loader-4-line");
export const Search = make("lni-search", "ri-search-line");
export const MessageCircle = make("lni-comments", "ri-message-3-line");
export const MessageSquare = make("lni-comments", "ri-chat-3-line");
export const MoreVertical = make("lni-more", "ri-more-2-fill");
export const Phone = make("lni-phone", "ri-phone-line");
export const Video = make("lni-video", "ri-video-line");
export const User = make("lni-user", "ri-user-3-line");
export const Users = make("lni-users", "ri-user-2-line");
export const Bell = make("lni-alarm", "ri-notification-3-line");
export const BellRing = make("lni-alarm", "ri-notification-badge-line");
export const Menu = make("lni-menu", "ri-menu-line");
export const LogOut = make("lni-exit", "ri-logout-box-r-line");
export const Settings = make("lni-cog", "ri-settings-3-line");
export const Facebook = make("lni-facebook-filled", "ri-facebook-fill");
export const Twitter = make("lni-twitter-filled", "ri-twitter-x-line");
export const Instagram = make("lni-instagram-filled", "ri-instagram-line");
export const Linkedin = make("lni-linkedin-original", "ri-linkedin-box-line");
export const Youtube = make("lni-youtube", "ri-youtube-line");
export const Calendar = make("lni-calendar", "ri-calendar-2-line");
export const Clock = make("lni-timer", "ri-time-line");
export const DollarSign = make("lni-dollar", "ri-coin-line");
export const Eye = make("lni-eye", "ri-eye-line");
export const EyeOff = make("lni-eye-crossed", "ri-eye-off-line");
export const Lock = make("lni-lock", "ri-lock-2-line");
export const Filter = make("lni-funnel", "ri-filter-3-line");
export const RefreshCw = make("lni-reload", "ri-refresh-line");
export const ArrowRight = make("lni-arrow-right", "ri-arrow-right-line");
export const ArrowLeft = make("lni-arrow-left", "ri-arrow-left-line");
export const Briefcase = make("lni-briefcase", "ri-briefcase-2-line");
export const Star = make("lni-star", "ri-star-line");
export const TrendingUp = make("lni-stats-up", "ri-line-chart-line");
export const TrendingDown = make("lni-stats-down", "ri-stock-line");
export const Shield = make("lni-shield", "ri-shield-check-line");
export const Wifi = make("lni-signal", "ri-wifi-line");
export const WifiOff = make("lni-network", "ri-wifi-off-line");
export const Target = make("lni-bullseye", "ri-bullseye-line");
export const Activity = make("lni-pulse", "ri-activity-line");
export const Award = make("lni-trophy", "ri-award-line");
export const Building2 = make("lni-apartment", "ri-building-2-line");
export const BarChart3 = make("lni-bar-chart", "ri-bar-chart-2-line");
export const MapPin = make("lni-map-marker", "ri-map-pin-2-line");
export const Package = make("lni-package", "ri-shopping-bag-3-line");
export const Home = make("lni-home", "ri-home-5-line");
export const Globe = make("lni-world", "ri-global-line");
export const Zap = make("lni-bolt", "ri-flashlight-line");
export const Save = make("lni-save", "ri-save-3-line");
export const PhoneIcon = Phone;
export const Mail = make("lni-envelope", "ri-mail-line");

export const LineiconsShim = {};
export default LineiconsShim; 