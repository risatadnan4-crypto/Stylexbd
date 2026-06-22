import { useState } from 'react';
import { Search, ShoppingCart, User, Gift, Trophy, ClipboardList, LogOut, UserPlus, LogIn, History, X } from 'lucide-react';

interface Customer {
  name: string;
  email: string;
  phone?: string;
}

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  onTrackOrderClick: () => void;
  onHomeClick: () => void;
  onLotteryClick: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  logoUrl?: string;
  onSearchSubmit?: (q: string) => void;
  onSearchFocus?: () => void;
  
  // Premium Customer Authentication System
  customer: Customer | null;
  onCustomerAuthClick: () => void;
  onCustomerLogout: () => void;
  onViewMyOrdersClick?: () => void;
  isCatalogDeactivated?: boolean;
  isLotteryDeactivated?: boolean;
}

export default function Navbar({
  cartCount,
  onCartClick,
  onTrackOrderClick,
  onHomeClick,
  onLotteryClick,
  searchQuery,
  setSearchQuery,
  logoUrl,
  onSearchSubmit,
  onSearchFocus,
  customer,
  onCustomerAuthClick,
  onCustomerLogout,
  onViewMyOrdersClick,
  isCatalogDeactivated,
  isLotteryDeactivated
}: NavbarProps) {
  const [showPortalMenu, setShowPortalMenu] = useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-luxury-black/95 backdrop-blur-md px-4 py-3 md:px-8 shadow-[0_4px_30px_rgba(106,13,173,0.15)] select-none">
      {/* Premium running laser glow top border */}
      <div className="absolute top-0 left-0 right-0 h-[3.5px] luxury-navbar-running-glow-top"></div>
      
      {/* Premium running laser glow bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-[2.5px] luxury-navbar-running-glow-bottom"></div>
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-1">
        
        {/* Brand Logo Group */}
        <div className="flex items-center justify-between">
          <div 
            onClick={onHomeClick}
            className="flex items-center gap-3 cursor-pointer group"
          >
            {/* Logo box with advanced luxury hover gradients and metallic shine sweeps */}
            <div className="w-13 h-13 bg-gradient-to-b from-[#130126] to-[#04000a] border-2 border-luxury-gold/30 rounded-xl flex items-center justify-center p-1 relative overflow-hidden group-hover:border-luxury-gold transition-all duration-500 shadow-lg shadow-luxury-purple/30 group-hover:shadow-[0_0_20px_rgba(212,175,55,0.5)] transform group-hover:rotate-3 group-hover:scale-105">
              {/* Dynamic luxury gradient backing shift on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-luxury-purple/40 via-transparent to-luxury-gold/30 opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Metallic shimmering sheen swipe effect across logo */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none z-20"></div>
              
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="Brand Logo" 
                  className="w-full h-full object-contain rounded-lg z-10 transition-transform duration-700 ease-out group-hover:scale-115 group-hover:rotate-[-3deg]"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="text-center group-hover:scale-115 transition-all duration-500 z-10">
                  <span className="block font-serif text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-luxury-gold via-white to-luxury-gold leading-none tracking-tighter animate-pulse">S X</span>
                  <span className="block text-[5px] text-white/60 tracking-widest font-sans uppercase font-bold">STYLE X</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col">
              <h1 className="font-serif text-xl tracking-widest font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-luxury-gold to-white group-hover:from-luxury-gold group-hover:to-orange-400 transition-all duration-500 relative">
                STYLE X
                {/* Underline pulse indicator */}
                <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-gradient-to-r from-luxury-gold to-luxury-purple-glowing group-hover:w-full transition-all duration-500"></span>
              </h1>
              <p className="text-[9px] text-white/50 font-sans tracking-widest uppercase flex items-center gap-1 mt-0.5">
                <span>LUXURY</span>
                <span className="w-1 h-1 rounded-full bg-luxury-purple animate-ping"></span>
                <span className="text-luxury-gold font-bold">COLLECTIVE</span>
              </p>
            </div>
          </div>

          {/* Mobile Access Buttons */}
          <div className="flex items-center gap-3 md:hidden relative">
            <button
              onClick={customer ? () => setShowPortalMenu(!showPortalMenu) : onCustomerAuthClick}
              className="text-[#d4af37] p-2 relative bg-luxury-charcoal/50 border border-[#d4af37]/20 rounded-lg cursor-pointer hover:border-[#d4af37] transition-all hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] active:scale-95 duration-200"
              title={customer ? "My Profile" : "Log In / Sign Up"}
            >
              <User size={18} className={customer ? "text-emerald-400" : "text-[#d4af37]"} />
            </button>

            {showPortalMenu && customer && (
              <div className="absolute right-0 top-12 w-64 bg-[#0a0512] border-2 border-luxury-gold/40 rounded-2xl p-5 shadow-[0_15px_45px_rgba(0,0,0,0.95)] z-50 animate-fade-in space-y-3 font-display">
                <div className="border-b border-white/[0.06] pb-2.5">
                  <span className="text-[8px] tracking-[0.25em] text-[#d4af37] font-black block uppercase">
                    VIP PRIVILEGED MEMBER
                  </span>
                  <div className="flex items-center justify-between mt-1 gap-1">
                    <p className="text-xs font-black text-white/95 truncate">
                      {customer.name}
                    </p>
                    <button 
                      onClick={() => setShowPortalMenu(false)}
                      className="text-white/40 hover:text-luxury-gold hover:rotate-90 transition-all duration-300 p-1 rounded-full bg-white/5 border border-white/10"
                      title="Close Portal"
                    >
                      <X size={10} />
                    </button>
                  </div>
                  <p className="text-[9.5px] font-mono text-white/40 truncate">
                    {customer.email}
                  </p>
                </div>

                <div className="space-y-1">
                  {onViewMyOrdersClick && (
                    <button 
                      onClick={() => {
                        setShowPortalMenu(false);
                        onViewMyOrdersClick();
                      }}
                      className="w-full flex items-center gap-2.5 text-[10.5px] text-white/80 hover:text-luxury-gold py-2 px-2.5 rounded-xl hover:bg-white/[0.03] transition-all uppercase tracking-[0.12em] font-bold"
                    >
                      <History size={13} className="text-luxury-gold" />
                      My Order History
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setShowPortalMenu(false);
                      onCustomerLogout();
                    }}
                    className="w-full flex items-center gap-2.5 text-[10.5px] text-red-400 hover:text-red-300 py-2 px-2.5 rounded-xl hover:bg-red-500/10 transition-all uppercase tracking-[0.12em] font-bold"
                  >
                    <LogOut size={13} />
                    Log Out
                  </button>
                </div>
              </div>
            )}

            {!isLotteryDeactivated && (
              <button 
                onClick={onLotteryClick}
                className="text-luxury-gold hover:text-white p-2 relative bg-luxury-charcoal/50 rounded-lg border border-luxury-gold/25 hover:border-luxury-gold shadow-[0_0_10px_rgba(212,175,55,0.05)] hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all active:scale-95 duration-200"
                title="Imperial Lottery"
              >
                <Gift size={18} className="animate-pulse" />
              </button>
            )}
            <button 
              onClick={onCartClick}
              className="text-white hover:text-luxury-gold p-2 relative bg-luxury-gold/10 border border-luxury-gold/25 hover:border-luxury-gold shadow-[0_0_10px_rgba(212,175,55,0.05)] hover:shadow-[0_0_15px_rgba(212,175,55,0.25)] rounded-lg transition-all active:scale-95 duration-200"
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-luxury-gold text-luxury-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Navigation Menus */}
        <div className="flex items-center justify-between md:justify-start gap-4 md:gap-6 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button 
            onClick={onHomeClick}
            className="text-xs text-white/80 hover:text-luxury-gold hover:bg-luxury-gold/5 transition-all duration-300 uppercase font-display tracking-widest whitespace-nowrap py-1.5 px-3.5 rounded-full border border-luxury-gold/[0.3] hover:border-luxury-gold hover:shadow-[0_0_10px_rgba(212,175,55,0.15)] cursor-pointer relative group flex items-center justify-center"
          >
            Shop Collective
          </button>
          
          <button 
            onClick={onTrackOrderClick}
            className="text-xs text-white/80 hover:text-luxury-gold hover:bg-luxury-gold/5 transition-all duration-300 uppercase font-display tracking-widest whitespace-nowrap py-1.5 px-3.5 rounded-full border border-luxury-gold/[0.3] hover:border-luxury-gold hover:shadow-[0_0_10px_rgba(212,175,55,0.15)] cursor-pointer relative group flex items-center justify-center"
          >
            Track Order
          </button>
        </div>

        {/* Search, Lottery, Auth & Cart actions */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Instant Search Bar */}
          <div className="relative flex-1 md:w-72 max-w-sm flex items-center gap-2">
            <input 
              type="text" 
              placeholder={isCatalogDeactivated ? "CATALOG OFFLINE" : "SEARCH PRODUCTS..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (onSearchFocus) onSearchFocus();
              }}
              onClick={() => {
                if (onSearchFocus) onSearchFocus();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && onSearchSubmit && !isCatalogDeactivated) {
                  onSearchSubmit(searchQuery);
                }
              }}
              disabled={isCatalogDeactivated}
              className={`w-full text-white font-sans text-xs border rounded-full py-2.5 pl-4 pr-10 focus:outline-none transition-all duration-300 uppercase tracking-wider ${
                isCatalogDeactivated 
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-500 cursor-not-allowed opacity-60 placeholder-zinc-600'
                  : 'bg-luxury-charcoal/80 border-luxury-gold/50 focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/70 focus:shadow-[0_0_20px_rgba(212,175,55,0.45)] placeholder-white/30'
              }`}
            />
            
            {/* Highly Glowing Interactive Search Button */}
            <button
              type="button"
              onClick={() => {
                if (onSearchSubmit && !isCatalogDeactivated) onSearchSubmit(searchQuery);
              }}
              disabled={isCatalogDeactivated}
              id="glowing-search-button"
              className={`elite-search-glowing-button relative p-2.5 rounded-full font-display font-black text-xs uppercase tracking-wider outline-none transition-all outline-none shrink-0 ${
                isCatalogDeactivated 
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50' 
                  : 'bg-luxury-gold text-luxury-black hover:brightness-110 active:scale-95 group cursor-pointer'
              }`}
              title={isCatalogDeactivated ? "Catalog is Temporarily Offline" : "Search Archive"}
            >
              {/* Spinning color gradient for continuous neon halo glow */}
              {!isCatalogDeactivated && (
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220%] h-[220%] bg-[conic-gradient(from_0deg,#d4af37,#9a4dff,#ef4444,#3b82f6,#d4af37)] animate-[spin_1.5s_linear_infinite] blur-[1px] opacity-90 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300" />
                  <div className="absolute inset-[1px] rounded-full bg-luxury-gold" />
                </div>
              )}
              <Search size={14} className={`relative z-10 ${isCatalogDeactivated ? 'text-zinc-600' : 'text-luxury-black group-hover:scale-110 transition-transform duration-300'}`} />
            </button>
          </div>

          {/* Desktop controls */}
          <div className="hidden md:flex items-center gap-4">
            {/* Draw button */}
            {!isLotteryDeactivated && (
              <button 
                onClick={onLotteryClick}
                className="text-luxury-gold hover:text-white p-2.5 relative bg-luxury-charcoal border border-luxury-gold/30 rounded-full hover:border-luxury-gold transition-all"
                title="Imperial Fortune Wheel"
              >
                <Gift size={16} />
              </button>
            )}

            {/* Customer Account Access Portal */}
            <div className="relative">
              {customer ? (
                <>
                  <button 
                    onClick={() => setShowPortalMenu(!showPortalMenu)}
                    className="flex items-center gap-2 bg-gradient-to-r from-luxury-purple-glowing/10 to-luxury-gold/10 border border-luxury-gold/50 hover:border-luxury-gold px-4 py-2 rounded-full transition-all text-xs text-white/90 font-display uppercase tracking-wider relative overflow-hidden luxury-reflection cursor-pointer"
                  >
                    <User size={13} className="text-luxury-gold animate-pulse" />
                    <span>Hi, {customer.name.split(' ')[0]}</span>
                  </button>

                  {showPortalMenu && (
                    <div className="absolute right-0 mt-2.5 w-64 bg-[#0a0512] border-2 border-luxury-gold/30 rounded-2xl p-5 shadow-[0_15px_45px_rgba(0,0,0,0.85)] z-50 animate-fade-in space-y-3 font-display">
                      <div className="border-b border-white/[0.06] pb-2.5">
                        <span className="text-[8px] tracking-[0.25em] text-[#d4af37] font-black block uppercase">
                          VIP PRIVILEGED MEMBER
                        </span>
                        <p className="text-xs font-black text-white/95 mt-0.5 mt-1 truncate">
                          {customer.name}
                        </p>
                        <p className="text-[9.5px] font-mono text-white/40 truncate">
                          {customer.email}
                        </p>
                      </div>

                      <div className="space-y-1">
                        {onViewMyOrdersClick && (
                          <button 
                            onClick={() => {
                              setShowPortalMenu(false);
                              onViewMyOrdersClick();
                            }}
                            className="w-full flex items-center gap-2.5 text-[10.5px] text-white/80 hover:text-luxury-gold py-2 px-2.5 rounded-xl hover:bg-white/[0.03] transition-all uppercase tracking-[0.12em] font-bold"
                          >
                            <History size={13} className="text-luxury-gold" />
                            My Order History
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setShowPortalMenu(false);
                            onCustomerLogout();
                          }}
                          className="w-full flex items-center gap-2.5 text-[10.5px] text-red-400 hover:text-red-300 py-2 px-2.5 rounded-xl hover:bg-red-500/10 transition-all uppercase tracking-[0.12em] font-bold"
                        >
                          <LogOut size={13} />
                          Log Out
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <button 
                  onClick={onCustomerAuthClick}
                  className="flex items-center gap-2 bg-[#090212] border border-[#d4af37]/40 hover:border-[#d4af37] px-5 py-2 rounded-full text-[10px] font-display uppercase tracking-[0.18em] text-white hover:text-[#ffd700] hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] hover:scale-[1.02] active:scale-95 transition-all duration-300 relative overflow-hidden luxury-reflection cursor-pointer font-black"
                >
                  <LogIn size={12} className="text-[#d4af37]" />
                  <span>Log In / Sign Up</span>
                </button>
              )}
            </div>

            {/* Premium Shopping Cart trigger */}
            <button 
              onClick={onCartClick}
              className="flex items-center gap-2.5 bg-gradient-to-r from-luxury-gold/10 to-luxury-gold/5 border border-luxury-gold/30 hover:border-luxury-gold px-4 py-2 rounded-full transition-all text-white font-display text-xs uppercase tracking-widest cursor-pointer shadow-lg"
            >
              <ShoppingCart size={14} className="text-luxury-gold" />
              <span>Cart</span>
              <span className="bg-luxury-gold text-luxury-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                {cartCount}
              </span>
            </button>
          </div>

        </div>

      </div>
    </nav>
  );
}
