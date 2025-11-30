import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, TrendingUp, Users, Sparkles } from 'lucide-react';

export const LeftSidebar = () => {
  return (
    <div className="space-y-4">
      {/* About Section */}
      <div className="glass-card rounded-2xl p-5 border border-primary/30">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-primary drop-shadow-[0_0_8px_hsl(var(--primary-glow))]" />
          <h3 className="text-lg font-display font-bold text-white">Về FUN Profile</h3>
        </div>
        <div className="text-sm text-white/80 space-y-3">
          <p>✳️ F.U. Profile – Mạng Xã Hội Web3 Kết Hợp AI, Biến Mọi Thứ Thành Tài Sản Số</p>
          <p>F.U. Profile là một mạng xã hội Web3 và còn là một nền tảng sáng tạo, lưu trữ và giao dịch tài sản số phi tập trung, nơi mọi thông tin, tài sản kỹ thuật số và giá trị cá nhân được bảo toàn vĩnh viễn trên blockchain.</p>
          <p>…</p>
          <a 
            href="/about" 
            className="inline-block text-primary hover:text-primary-glow font-semibold text-sm underline underline-offset-2 drop-shadow-[0_0_6px_hsl(var(--primary-glow))]"
          >
            Xem tiếp
          </a>
        </div>
      </div>

      {/* Trending Topics */}
      <div className="glass-card rounded-2xl p-5 border border-primary/30">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary drop-shadow-[0_0_8px_hsl(var(--primary-glow))]" />
          <h3 className="text-lg font-display font-bold text-white">Xu Hướng</h3>
        </div>
        <div className="space-y-2">
          <div className="p-3 rounded-xl bg-black/40 border border-primary/20 hover:border-primary/40 hover:bg-black/60 transition-all cursor-pointer backdrop-blur-sm">
            <p className="text-sm font-semibold text-white">#CryptoCommunity</p>
            <p className="text-xs text-white/60">245 bài viết</p>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-primary/20 hover:border-primary/40 hover:bg-black/60 transition-all cursor-pointer backdrop-blur-sm">
            <p className="text-sm font-semibold text-white">#Blockchain</p>
            <p className="text-xs text-white/60">189 bài viết</p>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-primary/20 hover:border-primary/40 hover:bg-black/60 transition-all cursor-pointer backdrop-blur-sm">
            <p className="text-sm font-semibold text-white">#Web3</p>
            <p className="text-xs text-white/60">156 bài viết</p>
          </div>
        </div>
      </div>

      {/* Suggested Friends */}
      <div className="glass-card rounded-2xl p-5 border border-primary/30">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary drop-shadow-[0_0_8px_hsl(var(--primary-glow))]" />
          <h3 className="text-lg font-display font-bold text-white">Gợi Ý Kết Bạn</h3>
        </div>
        <p className="text-sm text-white/70">Đăng nhập để xem gợi ý kết bạn</p>
      </div>

      {/* Features */}
      <div className="glass-card rounded-2xl p-5 border border-primary/30">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary drop-shadow-[0_0_8px_hsl(var(--primary-glow))]" />
          <h3 className="text-lg font-display font-bold text-white">Tính Năng</h3>
        </div>
        <div className="text-sm text-white/80 space-y-2">
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 drop-shadow-[0_0_4px_hsl(var(--primary-glow))]" />
            <p>Ví crypto tích hợp</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 drop-shadow-[0_0_4px_hsl(var(--primary-glow))]" />
            <p>Kiếm Camly Coin mỗi ngày</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 drop-shadow-[0_0_4px_hsl(var(--primary-glow))]" />
            <p>Kết nối cộng đồng Web3</p>
          </div>
        </div>
      </div>
    </div>
  );
};
