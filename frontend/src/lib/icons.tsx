import React from "react";
import * as Hero from "@heroicons/react/24/outline";
import { HiHandRaised } from "react-icons/hi2";

export type LucideIcon = React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;

type IconProps = React.SVGProps<SVGSVGElement> & { className?: string; title?: string };

// Use a generic React component type for icons
type AnyIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

function IconFont({ className = "", title, lni, ri, bx, ...rest }: IconProps & { lni?: string; ri?: string; bx?: string }) {
	const cls = bx ? `bx ${bx}` : ri ? `ri ${ri}` : lni ? `lni ${lni}` : '';
	const classNames = `${cls} inline-block align-middle text-current ${className}`.trim();
	return <i aria-hidden={!title} title={title} className={classNames} {...(rest as any)} />;
}

const make = (heroName: keyof typeof Hero | null, lniName?: string, riName?: string, bxName?: string): LucideIcon => {
	const Comp = ({ className, title, ...rest }: IconProps) => {
		if (heroName && Hero[heroName]) {
			const H = Hero[heroName] as AnyIcon;
			return <H className={className} aria-hidden={!title} {...(rest as any)} />;
		}
		return <IconFont lni={lniName} ri={riName} bx={bxName} className={className} title={title} {...rest} />;
	};
	return Comp as unknown as LucideIcon;
};

// Prefer Heroicons → Boxicons, keep lni/ri for backwards compatibility
export const X = make("XMarkIcon", "lni-close", "ri-close-line", "bx-x");
export const XCircle = make("XCircleIcon", "lni-close", "ri-close-circle-line", "bx-x-circle");
export const Check = make("CheckIcon", "lni-checkmark", "ri-check-line", "bx-check");
export const CheckCheck = make(null, "lni-checkmark-circle", "ri-check-double-line", "bx-check-double");
export const CheckCircle = make("CheckCircleIcon", "lni-checkmark-circle", "ri-check-circle-line", "bx-check-circle");
export const ChevronDown = make("ChevronDownIcon", "lni-chevron-down", "ri-arrow-down-s-line", "bx-chevron-down");
export const ChevronUp = make("ChevronUpIcon", "lni-chevron-up", "ri-arrow-up-s-line", "bx-chevron-up");
export const AlertCircle = make("ExclamationCircleIcon", "lni-warning", "ri-error-warning-line", "bx-error-circle");
export const AlertTriangle = make("ExclamationTriangleIcon", "lni-warning", "ri-alert-line", "bx-error");
export const Send = make("PaperAirplaneIcon", "lni-telegram", "ri-send-plane-2-line", "bx-send");
export const Paperclip = make("PaperClipIcon", "lni-paperclip", "ri-attachment-2", "bx-paperclip");
export const FileText = make("DocumentTextIcon", "lni-file", "ri-file-3-line", "bx-file");
export const File = FileText as unknown as LucideIcon;
export const FileImage = make("PhotoIcon", "lni-image", "ri-image-line", "bx-image");
export const Image = FileImage;
export const FileVideo = make("VideoCameraIcon", "lni-video", "ri-video-line", "bx-video");
export const Download = make("ArrowDownTrayIcon", "lni-download", "ri-download-2-line", "bx-download");
export const Upload = make("ArrowUpTrayIcon", "lni-upload", "ri-upload-2-line", "bx-upload");
export const Loader2 = make("ArrowPathIcon", "lni-spinner", "ri-loader-4-line", "bx-loader");
export const Search = make("MagnifyingGlassIcon", "lni-search", "ri-search-line", "bx-search");
export const MessageCircle = make("ChatBubbleLeftRightIcon", "lni-comments", "ri-message-3-line", "bx-message-rounded");
export const MessageSquare = make("ChatBubbleLeftIcon", "lni-comments", "ri-chat-3-line", "bx-chat");
export const MoreVertical = make("EllipsisVerticalIcon", "lni-more", "ri-more-2-fill", "bx-dots-vertical-rounded");
export const Phone = make("PhoneIcon", "lni-phone", "ri-phone-line", "bx-phone");
export const Video = make("VideoCameraIcon", "lni-video", "ri-video-line", "bx-video");
export const User = make("UserIcon", "lni-user", "ri-user-3-line", "bx-user");
export const Users = make("UsersIcon", "lni-users", "ri-user-2-line", "bx-group");
export const Bell = make("BellIcon", "lni-alarm", "ri-notification-3-line", "bx-bell");
export const BellRing = make("BellAlertIcon", "lni-alarm", "ri-notification-badge-line", "bx-bell-ring");
export const Menu = make("Bars3Icon", "lni-menu", "ri-menu-line", "bx-menu");
export const LogOut = make("ArrowRightOnRectangleIcon", "lni-exit", "ri-logout-box-r-line", "bx-log-out");
export const Settings = make("Cog6ToothIcon", "lni-cog", "ri-settings-3-line", "bx-cog");
export const Facebook = make(null, "lni-facebook-filled", "ri-facebook-fill", "bxl-facebook");
export const Twitter = make(null, "lni-twitter-filled", "ri-twitter-x-line", "bxl-twitter");
export const Instagram = make(null, "lni-instagram-filled", "ri-instagram-line", "bxl-instagram");
export const Linkedin = make(null, "lni-linkedin-original", "ri-linkedin-box-line", "bxl-linkedin");
export const Youtube = make(null, "lni-youtube", "ri-youtube-line", "bxl-youtube");
export const Calendar = make("CalendarDaysIcon", "lni-calendar", "ri-calendar-2-line", "bx-calendar");
export const Clock = make("ClockIcon", "lni-timer", "ri-time-line", "bx-time");
export const DollarSign = make(null, "lni-dollar", "ri-coin-line", "bx-dollar");
export const Eye = make("EyeIcon", "lni-eye", "ri-eye-line", "bx-show");
export const EyeOff = make("EyeSlashIcon", "lni-eye-crossed", "ri-eye-off-line", "bx-hide");
export const Lock = make("LockClosedIcon", "lni-lock", "ri-lock-2-line", "bx-lock");
export const Filter = make("FunnelIcon", "lni-funnel", "ri-filter-3-line", "bx-filter-alt");
export const RefreshCw = make("ArrowPathIcon", "lni-reload", "ri-refresh-line", "bx-refresh");
export const ArrowRight = make("ArrowRightIcon", "lni-arrow-right", "ri-arrow-right-line", "bx-right-arrow-alt");
export const ArrowLeft = make("ArrowLeftIcon", "lni-arrow-left", "ri-arrow-left-line", "bx-left-arrow-alt");
export const Briefcase = make("BriefcaseIcon", "lni-briefcase", "ri-briefcase-2-line", "bx-briefcase");
export const Star = make("StarIcon", "lni-star", "ri-star-line", "bx-star");
export const TrendingUp = make("ArrowTrendingUpIcon", "lni-stats-up", "ri-line-chart-line", "bx-trending-up");
export const TrendingDown = make("ArrowTrendingDownIcon", "lni-stats-down", "ri-stock-line", "bx-trending-down");
export const Shield = make("ShieldCheckIcon", "lni-shield", "ri-shield-check-line", "bx-shield");
export const Wifi = make(null, "lni-signal", "ri-wifi-line", "bx-wifi");
export const WifiOff = make(null, "lni-network", "ri-wifi-off-line", "bx-wifi-off");
export const Target = make(null, "lni-bullseye", "ri-bullseye-line", "bx-bullseye");
export const Activity = make(null, "lni-pulse", "ri-activity-line", "bx-pulse");
export const Award = make(null, "lni-trophy", "ri-award-line", "bx-award");
export const Building2 = make(null, "lni-apartment", "ri-building-2-line", "bx-buildings");
export const BarChart3 = make("ChartBarIcon", "lni-bar-chart", "ri-bar-chart-2-line", "bx-bar-chart");
export const MapPin = make("MapPinIcon", "lni-map-marker", "ri-map-pin-2-line", "bx-map");
export const Package = make(null, "lni-package", "ri-shopping-bag-3-line", "bx-package");
export const Home = make("HomeIcon", "lni-home", "ri-home-5-line", "bx-home");
export const Globe = make("GlobeAltIcon", "lni-world", "ri-global-line", "bx-globe");
export const Zap = make("BoltIcon", "lni-bolt", "ri-flashlight-line", "bx-bolt");
export const Save = make("BookmarkSquareIcon", "lni-save", "ri-save-3-line", "bx-save");
export const PhoneIcon = Phone;
export const Mail = make("EnvelopeIcon", "lni-envelope", "ri-mail-line", "bx-envelope");
export const Play = make("PlayIcon", "lni-play", "ri-play-line", "bx-play");
export const Camera = make("CameraIcon", "lni-camera", "ri-camera-line", "bx-camera");

// Export the HiHandRaised icon directly
export { HiHandRaised };

export const LineiconsShim = {};
export default LineiconsShim; 