import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Sparkles, Heart, Star, Sunrise, Bird, Sun, Moon, Globe2 } from 'lucide-react';

const LawOfLight = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [checklist, setChecklist] = useState([false, false, false, false, false]);
  const [loading, setLoading] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Check if this is read-only mode (accessed from sidebar)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setIsReadOnly(params.get('view') === 'true');
    
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
      }
    };
    checkAuth();
  }, [location]);

  const allChecked = checklist.every(Boolean);

  const handleCheckboxChange = (index: number) => {
    const newChecklist = [...checklist];
    newChecklist[index] = !newChecklist[index];
    setChecklist(newChecklist);
  };

  const handleAccept = async () => {
    if (!allChecked || !userId) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          law_of_light_accepted: true,
          law_of_light_accepted_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      
      toast.success('🌟 Chào mừng Con bước vào Ánh Sáng!');
      navigate('/');
    } catch (error: any) {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const checklistItems = [
    'Con sống chân thật với chính mình.',
    'Con chịu trách nhiệm với năng lượng con phát ra.',
    'Con sẵn sàng học – sửa – nâng cấp.',
    'Con chọn yêu thương thay vì phán xét.',
    'Con chọn ánh sáng thay vì cái tôi.'
  ];

  const divineMantras = [
    { icon: Sun, text: 'ÁNH SÁNG LÀ NỀN TẢNG CỦA MỌI SỰ SỐNG' },
    { icon: Heart, text: 'YÊU THƯƠNG LÀ TẦN SỐ CAO NHẤT' },
    { icon: Star, text: 'CHÂN THẬT LÀ CON ĐƯỜNG DUY NHẤT' },
    { icon: Bird, text: 'TỰ DO ĐẾN TỪ SỰ BUÔNG BỎ' },
    { icon: Sparkles, text: 'MỌI LINH HỒN ĐỀU XỨNG ĐÁNG ĐƯỢC CHỮA LÀNH' },
    { icon: Globe2, text: 'CHÚNG TA LÀ MỘT VỚI VŨ TRỤ' },
    { icon: Sunrise, text: 'MỖI NGÀY MỚI LÀ MỘT CƠ HỘI TIẾN HÓA' },
    { icon: Moon, text: 'TRONG TĨNH LẶNG, TA TÌM THẤY CHÍNH MÌNH' }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Deep Space Background */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse at center, #0f172a 0%, #020617 40%, #000000 100%)'
        }}
      />
      
      {/* Stars Background */}
      <div className="fixed inset-0 z-0 opacity-60">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animation: `twinkle ${Math.random() * 3 + 2}s infinite ${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Divine Light Rays from Top */}
      <div 
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[200%] h-[80vh] z-0 pointer-events-none"
        style={{
          background: 'conic-gradient(from 180deg at 50% 0%, transparent 30%, rgba(250,204,21,0.1) 35%, rgba(255,255,255,0.15) 40%, rgba(250,204,21,0.1) 45%, transparent 50%, transparent 80%, rgba(250,204,21,0.08) 85%, rgba(255,255,255,0.12) 90%, rgba(250,204,21,0.08) 95%, transparent 100%)',
          filter: 'blur(2px)'
        }}
      />

      {/* Central Halo Effect */}
      <div 
        className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-96 z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(250,204,21,0.4) 0%, rgba(250,204,21,0.2) 30%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'pulse 4s ease-in-out infinite'
        }}
      />

      {/* Floating Light Particles */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 6 + 4 + 'px',
              height: Math.random() * 6 + 4 + 'px',
              left: Math.random() * 100 + '%',
              background: i % 2 === 0 
                ? 'radial-gradient(circle, rgba(250,204,21,0.8), transparent)' 
                : 'radial-gradient(circle, rgba(255,255,255,0.8), transparent)',
              animation: `float ${Math.random() * 10 + 15}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header with Dove Icon */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6"
                 style={{
                   background: 'radial-gradient(circle, rgba(250,204,21,0.3) 0%, transparent 70%)',
                   boxShadow: '0 0 60px rgba(250,204,21,0.5)'
                 }}>
              <Bird className="w-12 h-12 text-yellow-400" 
                    style={{ filter: 'drop-shadow(0 0 10px rgba(250,204,21,0.8))' }} />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4"
                style={{
                  fontFamily: 'Space Grotesk, Inter, sans-serif',
                  background: 'linear-gradient(135deg, #fcd34d 0%, #ffffff 50%, #fcd34d 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 40px rgba(250,204,21,0.5)'
                }}>
              LUẬT ÁNH SÁNG
            </h1>
            <p className="text-xl text-yellow-200/80 font-light tracking-wide"
               style={{ fontFamily: 'Space Grotesk, Inter, sans-serif' }}>
              THE LAW OF LIGHT
            </p>
            <div className="w-32 h-1 mx-auto mt-6 rounded-full"
                 style={{
                   background: 'linear-gradient(90deg, transparent, #fcd34d, transparent)'
                 }} />
          </div>

          {/* Main Content Card */}
          <div className="relative rounded-3xl p-8 md:p-12 mb-8"
               style={{
                 background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,41,59,0.8) 100%)',
                 border: '2px solid rgba(250,204,21,0.3)',
                 boxShadow: '0 0 40px rgba(250,204,21,0.1), inset 0 0 60px rgba(250,204,21,0.05)'
               }}>
            
            {/* Introduction */}
            <div className="mb-10 text-center">
              <p className="text-lg text-slate-300 leading-relaxed"
                 style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', lineHeight: '2' }}>
                Đây không phải là luật pháp của thế gian – đây là Luật Vũ Trụ, là nguyên lý vận hành của 
                Nguồn Sáng vô điều kiện. Mỗi linh hồn bước vào hệ sinh thái FUN đều tự nguyện đồng điệu 
                với tần số này.
              </p>
            </div>

            {/* 8 Divine Mantras */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-center mb-8"
                  style={{
                    color: '#fcd34d',
                    textShadow: '0 0 20px rgba(250,204,21,0.5)'
                  }}>
                ✦ 8 DIVINE MANTRAS ✦
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {divineMantras.map((mantra, index) => (
                  <div 
                    key={index}
                    className="relative p-4 rounded-xl transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, rgba(250,204,21,0.1) 0%, rgba(250,204,21,0.05) 100%)',
                      border: '1px solid rgba(250,204,21,0.4)',
                      boxShadow: '0 0 20px rgba(250,204,21,0.1), inset 0 0 20px rgba(250,204,21,0.05)'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                           style={{
                             background: 'radial-gradient(circle, rgba(250,204,21,0.3), transparent)',
                           }}>
                        <mantra.icon className="w-5 h-5 text-yellow-400" />
                      </div>
                      <p className="text-sm font-semibold text-yellow-100/90 tracking-wide"
                         style={{ fontFamily: 'Space Grotesk, Inter, sans-serif' }}>
                        {mantra.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Core Principles */}
            <div className="mb-12 space-y-6">
              <h2 className="text-2xl font-bold text-center mb-8"
                  style={{
                    color: '#fcd34d',
                    textShadow: '0 0 20px rgba(250,204,21,0.5)'
                  }}>
                ✦ NGUYÊN LÝ CỐT LÕI ✦
              </h2>

              <div className="space-y-4 text-slate-300"
                   style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', lineHeight: '1.8' }}>
                <div className="flex gap-3">
                  <Heart className="w-5 h-5 text-pink-400 flex-shrink-0 mt-1" />
                  <p><strong className="text-yellow-400">CHÂN THẬT:</strong> Mọi lời nói, hành động và ý định đều xuất phát từ sự thật. Không giả dối, không thao túng.</p>
                </div>
                <div className="flex gap-3">
                  <Sparkles className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
                  <p><strong className="text-yellow-400">YÊU THƯƠNG:</strong> Tôn trọng mọi linh hồn. Không phán xét, không đổ lỗi, không tấn công.</p>
                </div>
                <div className="flex gap-3">
                  <Sun className="w-5 h-5 text-orange-400 flex-shrink-0 mt-1" />
                  <p><strong className="text-yellow-400">TRÁCH NHIỆM:</strong> Mỗi người tự chịu trách nhiệm với năng lượng mình phát ra và nhận lại.</p>
                </div>
                <div className="flex gap-3">
                  <Star className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                  <p><strong className="text-yellow-400">TIẾN HÓA:</strong> Luôn sẵn sàng học hỏi, thay đổi và nâng cấp bản thân.</p>
                </div>
                <div className="flex gap-3">
                  <Globe2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-1" />
                  <p><strong className="text-yellow-400">CỘNG ĐỒNG:</strong> Cùng nhau xây dựng, không cạnh tranh tiêu cực, không gây chia rẽ.</p>
                </div>
              </div>
            </div>

            {/* Closing Statement */}
            <div className="text-center p-6 rounded-2xl mb-8"
                 style={{
                   background: 'radial-gradient(ellipse at center, rgba(250,204,21,0.1) 0%, transparent 70%)'
                 }}>
              <p className="text-lg text-yellow-100/90 italic"
                 style={{ fontFamily: 'Space Grotesk, Inter, sans-serif' }}>
                "Ánh sáng không loại trừ ai – nhưng chỉ những ai sẵn sàng mới có thể bước vào."
              </p>
              <p className="text-yellow-400 mt-4 font-semibold">— CHA VŨ TRỤ —</p>
            </div>

            {/* Checklist Section (only show if not read-only) */}
            {!isReadOnly && (
              <div className="border-t border-yellow-400/20 pt-8">
                <h3 className="text-xl font-bold text-center mb-6 text-yellow-400">
                  ✦ CAM KẾT CỦA CON ✦
                </h3>
                
                <div className="space-y-4 max-w-xl mx-auto">
                  {checklistItems.map((item, index) => (
                    <label 
                      key={index}
                      className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 hover:bg-yellow-400/10"
                      style={{
                        border: checklist[index] 
                          ? '2px solid rgba(250,204,21,0.6)' 
                          : '2px solid rgba(250,204,21,0.2)',
                        background: checklist[index] 
                          ? 'rgba(250,204,21,0.1)' 
                          : 'transparent'
                      }}
                    >
                      <Checkbox
                        checked={checklist[index]}
                        onCheckedChange={() => handleCheckboxChange(index)}
                        className="w-6 h-6 border-2 border-yellow-400 data-[state=checked]:bg-yellow-400 data-[state=checked]:text-slate-900"
                      />
                      <span className="text-slate-200 font-medium"
                            style={{ fontFamily: 'Space Grotesk, Inter, sans-serif' }}>
                        {item}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Accept Button */}
                <div className="mt-10 text-center">
                  <Button
                    onClick={handleAccept}
                    disabled={!allChecked || loading}
                    className="relative px-12 py-6 text-lg font-bold rounded-2xl transition-all duration-500 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: allChecked 
                        ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #fcd34d 100%)'
                        : 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                      boxShadow: allChecked 
                        ? '0 0 40px rgba(250,204,21,0.6), 0 0 80px rgba(250,204,21,0.3)'
                        : 'none',
                      color: allChecked ? '#0f172a' : '#94a3b8'
                    }}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                        Đang xử lý...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        CON ĐỒNG Ý & BƯỚC VÀO ÁNH SÁNG
                        <Sparkles className="w-5 h-5" />
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Back button for read-only mode */}
            {isReadOnly && (
              <div className="text-center pt-8 border-t border-yellow-400/20">
                <Button
                  onClick={() => navigate(-1)}
                  variant="outline"
                  className="px-8 py-3 border-2 border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10 hover:border-yellow-400"
                >
                  ← Quay lại
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes float {
          0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-20vh) rotate(360deg); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.4; }
          50% { transform: translateX(-50%) scale(1.2); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

export default LawOfLight;