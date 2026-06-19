import { useState } from 'react';
import { Search, ShoppingCart, User, Gift, Trophy, ClipboardList, LogOut, UserPlus, LogIn, History } from 'lucide-react';

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
  
  // Premium Customer Authentication System
  customer: Customer | null;
  onCustomerAuthClick: () => void;
  onCustomerLogout: () => void;
  onViewMyOrdersClick?: () => void;
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
  customer,
  onCustomerAuthClick,
  onCustomerLogout,
  onViewMyOrdersClick
}: NavbarProps) {
  const [showPortalMenu, setShowPortalMenu] = useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-luxury-black/95 backdrop-blur-md border-b-2 border-gradient-to-r from-luxury-purple via-luxury-gold/50 to-luxury-purple px-4 py-3 md:px-8 shadow-[0_4px_30px_rgba(106,13,173,0.15)] select-none">
      {/* Premium glowing top highlight bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-luxury-purple via-luxury-gold to-luxury-purple animate-shimmer"></div>
      
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
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={customer ? () => setShowPortalMenu(!showPortalMenu) : onCustomerAuthClick}
              className="text-[#d4af37] p-2 relative bg-luxury-charcoal/50 border border-[#d4af37]/20 rounded-lg cursor-pointer"
              title={customer ? "My Profile" : "Log In / Sign Up"}
            >
              <User size={18} className={customer ? "text-emerald-400" : "text-[#d4af37]"} />
            </button>
            <button 
              onClick={onLotteryClick}
              className="text-luxury-gold hover:text-white p-2 relative bg-luxury-charcoal/50 rounded-lg border border-luxury-gold/20"
              title="Imperial Lottery"
            >
              <Gift size={18} className="animate-pulse" />
            </button>
            <button 
              onClick={onCartClick}
              className="text-white hover:text-luxury-gold p-2 relative bg-luxury-gold/10 border border-luxury-gold/20 rounded-lg"
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
        <div className="flex items-center justify-between md:justify-start gap-4 md:gap-8 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button 
            onClick={onHomeClick}
            className="text-xs text-white/70 hover:text-luxury-gold transition-colors uppercase font-display tracking-widest whitespace-nowrap py-1 relative group"
          >
            Shop Collective
            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-luxury-gold transition-all duration-300 group-hover:w-full"></span>
          </button>
          
          <button 
            onClick={onTrackOrderClick}
            className="text-xs text-white/70 hover:text-luxury-gold transition-colors uppercase font-display tracking-widest whitespace-nowrap py-1 relative group"
          >
            Track Order
            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-luxury-gold transition-all duration-300 group-hover:w-full"></span>
          </button>

          <button 
            onClick={onLotteryClick}
            className="text-xs text-white/70 hover:text-luxury-gold transition-colors uppercase font-display tracking-widest whitespace-nowrap py-1 relative group flex items-center gap-1.5"
          >
            <Trophy size={12} className="text-luxury-gold" />
            Imperial Draw
            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-luxury-gold transition-all duration-300 group-hover:w-full"></span>
          </button>
        </div>

        {/* Search, Lottery, Auth & Cart actions */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Instant Search Bar */}
          <div className="relative flex-1 md:w-64 max-w-sm">
            <input 
              type="text" 
              placeholder="SEARCH PRODUCTS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-luxury-charcoal/80 text-white font-sans text-xs border border-luxury-gold/20 rounded-full py-2.5 pl-4 pr-10 focus:outline-none focus:ring-1 focus:ring-luxury-gold transition-all duration-300 uppercase tracking-wider placeholder-white/30"
            />
            <Search size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-luxury-gold" />
          </div>

          {/* Desktop controls */}
          <div className="hidden md:flex items-center gap-4">
            {/* Draw button */}
            <button 
              onClick={onLotteryClick}
              className="text-luxury-gold hover:text-white p-2.5 relative bg-luxury-charcoal border border-luxury-gold/30 rounded-full hover:border-luxury-gold transition-all"
              title="Imperial Fortune Wheel"
            >
              <Gift size={16} />
            </button>

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
                    <div className="absolute right-0 mt-2.5 w-64 bg-[#0a0512] border-2 border-luxury-gold/30 rounded-2xl p-4.5 shadow-[0_15px_45px_rgba(0,0,0,0.85)] z-50 animate-fade-in space-y-3 font-display">
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
                  className="flex items-center gap-2 bg-[#090212] border border-[#d4af37]/40 hover:border-[#d4af37] px-4.5 py-2 rounded-full text-[10px] font-display uppercase tracking-[0.18em] text-white hover:text-[#ffd700] hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] hover:scale-[1.02] active:scale-95 transition-all duration-300 relative overflow-hidden luxury-reflection cursor-pointer font-black"
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
