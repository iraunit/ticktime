import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin } from "@/lib/icons";

export function Footer() {
	return (
		<footer className="bg-gray-900 text-white">
			<div className="container mx-auto px-4 py-6">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
					{/* Company Info */}
					<div className="col-span-1 md:col-span-2">
						<div className="flex items-center space-x-2 mb-3">
							<div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center">
								<span className="text-white font-bold text-xs">TT</span>
							</div>
							<span className="text-lg font-bold">TickTime</span>
						</div>
						<p className="text-gray-400 mb-3 max-w-md text-sm">
							The ultimate platform for influencers to connect with brands, manage collaborations, and grow their business.
						</p>
						<div className="flex space-x-3">
							<Link href="#" className="text-gray-400 hover:text-white transition-colors">
								<Facebook className="w-4 h-4" />
							</Link>
							<Link href="#" className="text-gray-400 hover:text-white transition-colors">
								<Twitter className="w-4 h-4" />
							</Link>
							<Link href="#" className="text-gray-400 hover:text-white transition-colors">
								<Instagram className="w-4 h-4" />
							</Link>
							<Link href="#" className="text-gray-400 hover:text-white transition-colors">
								<Linkedin className="w-4 h-4" />
							</Link>
						</div>
					</div>

					{/* Quick Links */}
					<div>
						<h3 className="text-base font-semibold mb-3">Quick Links</h3>
						<ul className="space-y-1.5 text-sm">
							<li>
								<Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
									Dashboard
								</Link>
							</li>
							<li>
								<Link href="/deals" className="text-gray-400 hover:text-white transition-colors">
									Deals
								</Link>
							</li>
							<li>
								<Link href="/profile" className="text-gray-400 hover:text-white transition-colors">
									Profile
								</Link>
							</li>
							<li>
								<Link href="/messages" className="text-gray-400 hover:text-white transition-colors">
									Messages
								</Link>
							</li>
							<li>
								<Link href="/analytics" className="text-gray-400 hover:text-white transition-colors">
									Analytics
								</Link>
							</li>
						</ul>
					</div>

					{/* Support */}
					<div>
						<h3 className="text-base font-semibold mb-3">Support</h3>
						<ul className="space-y-1.5 text-sm">
							<li>
								<Link href="/help" className="text-gray-400 hover:text-white transition-colors">
									Help Center
								</Link>
							</li>
							<li>
								<Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
									Contact Us
								</Link>
							</li>
							<li>
								<Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
									Privacy Policy
								</Link>
							</li>
							<li>
								<Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
									Terms of Service
								</Link>
							</li>
						</ul>
					</div>
				</div>

				<div className="border-t border-gray-800 mt-6 pt-4 text-center">
					<p className="text-gray-400 text-sm">
						© 2024 TickTime Media Pvt Ltd. All rights reserved.
					</p>
				</div>
			</div>
		</footer>
	);
}