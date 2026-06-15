import { useState } from 'react';
import { Search, ShoppingCart, User, Gift, Trophy, ClipboardList, LogOut } from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  onAdminClick: () => void;
  onTrackOrderClick: () => void;
  onHomeClick: () => void;
  onLotteryClick: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isAdmin: boolean;
  onLogout: () => void;
}

export default function Navbar({
  cartCount,
  onCartClick,
  onAdminClick,
  onTrackOrderClick,
  onHomeClick,
  onLotteryClick,
  searchQuery,
  setSearchQuery,
  isAdmin,
  onLogout
}: NavbarProps) {
  const [showPortalMenu, setShowPortalMenu] = useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-luxury-black/90 backdrop-blur-md border-b border-luxury-gold/10 px-4 py-3 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Brand Logo Group */}
        <div className="flex items-center justify-between">
          <div 
            onClick={onHomeClick}
            className="flex items-center gap-3 cursor-pointer group"
          >
            {/* Logo box */}
            <div className="w-12 h-12 bg-luxury-charcoal border border-luxury-gold/30 rounded flex items-center justify-center p-1 relative overflow-hidden group-hover:border-luxury-gold transition-colors duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-luxury-gold/10 to-transparent opacity-50"></div>
              {/* Gold styled SX lettermark */}
              <div className="text-center">
                <span className="block font-serif text-xl font-bold text-luxury-gold leading-none tracking-tighter">S X</span>
                <span className="block text-[6px] text-white/50 tracking-widest font-sans uppercase">STYLE X</span>
              </div>
            </div>
            
            <div className="flex flex-col">
              <h1 className="font-serif text-lg tracking-widest font-semibold text-white group-hover:text-luxury-gold transition-colors duration-300">
                STYLE X
              </h1>
              <p className="text-[9px] text-luxury-gold font-sans tracking-widest uppercase">
                LUXURY COLLECTIVE
              </p>
            </div>
          </div>

          {/* Mobile Access Buttons */}
          <div className="flex items-center gap-3 md:hidden">
            <button 
              onClick={onLotteryClick}
              className="text-luxury-gold hover:text-white p-2 relative bg-luxury-charcoal/50 rounded border border-luxury-gold/20"
              title="Imperial Lottery"
            >
              <Gift size={20} className="animate-pulse" />
            </button>
            <button 
              onClick={onCartClick}
              className="text-white hover:text-luxury-gold p-2 relative bg-luxury-gold/10 border border-luxury-gold/20 rounded"
            >
              <ShoppingCart size={20} />
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

            {/* Access Portal */}
            <div className="relative">
              <button 
                onClick={() => setShowPortalMenu(!showPortalMenu)}
                className="flex items-center gap-2 bg-luxury-charcoal/50 border border-luxury-gold/20 px-3 py-2 rounded-full hover:border-luxury-gold/60 transition-all text-xs text-white/80"
              >
                <User size={14} className="text-luxury-gold" />
                <span className="font-display tracking-widest text-[10px] uppercase font-medium">
                  {isAdmin ? "Admin Portal" : "Access Portal"}
                </span>
              </button>

              {showPortalMenu && (
                <div className="absolute right-0 mt-2 w-56 glass-dropdown rounded p-3 shadow-xl z-50">
                  {isAdmin ? (
                    <div>
                      <p className="text-[10px] text-luxury-gold uppercase font-semibold font-display mb-1.5 border-b border-white/10 pb-1.5">
                        Authenticated Session
                      </p>
                      <button 
                        onClick={() => {
                          setShowPortalMenu(false);
                          onAdminClick();
                        }}
                        className="w-full flex items-center gap-2 text-[11px] text-white/90 hover:text-luxury-gold p-2 rounded hover:bg-white/5 transition-all uppercase tracking-wider"
                      >
                        <ClipboardList size={13} />
                        Admin Dashboard
                      </button>
                      <button 
                        onClick={() => {
                          setShowPortalMenu(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2 text-[11px] text-red-400 hover:text-red-300 p-2 rounded hover:bg-red-500/10 transition-all uppercase tracking-wider mt-1"
                      >
                        <LogOut size={13} />
                        Logout
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[10px] text-white/40 uppercase font-mono mb-2">
                        Style X Members Gate
                      </p>
                      <button 
                        onClick={() => {
                          setShowPortalMenu(false);
                          onAdminClick();
                        }}
                        className="w-full text-center text-[10px] font-display uppercase tracking-widest bg-gradient-to-r from-luxury-gold-dark to-luxury-gold text-luxury-black font-semibold py-2 px-3 rounded hover:brightness-110 transition-all"
                      >
                        SIGN IN / UP [STAFF]
                      </button>
                      <p className="text-[9px] text-white/50 text-center mt-2.5 font-sans italic">
                        Authorized digital concierge entry
                      </p>
                    </div>
                  )}
                </div>
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
