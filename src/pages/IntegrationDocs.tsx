import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TableOfContents } from "@/components/docs/TableOfContents";
import { DocSection, DocSubSection, DocParagraph, DocList, DocTable, DocAlert } from "@/components/docs/DocSection";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DOMAINS, API_BASE_URL } from "@/lib/sso-sdk/constants";

const tocItems = [
  { id: "overview", title: "Tổng quan" },
  { id: "quick-start", title: "Quick Start" },
  { id: "sdk-installation", title: "Cài đặt SDK" },
  { id: "client-config", title: "Cấu hình Client" },
  { id: "auth-flow", title: "Luồng xác thực" },
  { id: "data-sync", title: "Đồng bộ dữ liệu" },
  { id: "api-reference", title: "API Reference" },
  { id: "security", title: "Bảo mật" },
  { id: "troubleshooting", title: "Xử lý lỗi" },
];

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Đã copy!");
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-6 px-2">
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
};

const IntegrationDocs: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    const handleScroll = () => {
      const sections = tocItems.map(item => document.getElementById(item.id));
      const scrollPos = window.scrollY + 150;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPos) {
          setActiveSection(tocItems[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePrint = () => window.print();

  const platformConfigs = [
    {
      name: "Fun Farm",
      clientId: "fun_farm_client",
      domain: DOMAINS.funFarm,
      scopes: ["profile", "email", "wallet", "rewards"],
      color: "bg-green-500"
    },
    {
      name: "Fun Play",
      clientId: "fun_play_client",
      domain: DOMAINS.funPlay,
      scopes: ["profile", "email", "wallet", "gaming"],
      color: "bg-blue-500"
    },
    {
      name: "Fun Planet",
      clientId: "fun_planet_client",
      domain: DOMAINS.funPlanet,
      scopes: ["profile", "email", "wallet", "social"],
      color: "bg-purple-500"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Integration Guide</h1>
              <p className="text-xs text-muted-foreground">Hướng dẫn tích hợp FUN Profile SSO</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/docs/ecosystem')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              SSO Docs
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-8">
          {/* Sidebar TOC */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <TableOfContents items={tocItems} activeId={activeSection} />
            </div>
          </aside>

          {/* Content */}
          <ScrollArea className="flex-1 max-w-4xl">
            <div className="space-y-12 pb-20">
              
              {/* Overview */}
              <DocSection id="overview" title="1. Tổng quan">
                <DocParagraph>
                  FUN Profile SSO cho phép các platform trong hệ sinh thái FUN (Fun Farm, Fun Play, Fun Planet) 
                  xác thực người dùng và đồng bộ dữ liệu thông qua một hệ thống đăng nhập thống nhất.
                </DocParagraph>
                
                <DocSubSection title="Thông tin cấu hình cho mỗi Platform">
                  <div className="grid gap-4 mt-4">
                    {platformConfigs.map((platform) => (
                      <div key={platform.clientId} className="border border-border rounded-lg p-4 bg-card">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-3 h-3 rounded-full ${platform.color}`} />
                          <h4 className="font-semibold">{platform.name}</h4>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Client ID:</span>
                            <div className="flex items-center gap-1">
                              <code className="bg-muted px-2 py-0.5 rounded text-xs">{platform.clientId}</code>
                              <CopyButton text={platform.clientId} />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Redirect URI:</span>
                            <div className="flex items-center gap-1">
                              <code className="bg-muted px-2 py-0.5 rounded text-xs">{platform.domain}/auth/callback</code>
                              <CopyButton text={`${platform.domain}/auth/callback`} />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Scopes:</span>
                            <div className="flex gap-1 flex-wrap">
                              {platform.scopes.map(scope => (
                                <Badge key={scope} variant="secondary" className="text-xs">{scope}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </DocSubSection>

                <DocSubSection title="API Base URL">
                  <div className="flex items-center gap-2 mt-2">
                    <code className="bg-muted px-3 py-1.5 rounded text-sm flex-1 overflow-x-auto">{API_BASE_URL}</code>
                    <CopyButton text={API_BASE_URL} />
                  </div>
                </DocSubSection>
              </DocSection>

              {/* Quick Start */}
              <DocSection id="quick-start" title="2. Quick Start">
                <DocParagraph>
                  Bắt đầu tích hợp FUN Profile SSO trong 5 phút:
                </DocParagraph>

                <CodeBlock language="bash" title="1. Copy SDK vào project" code={`# Copy thư mục sso-sdk vào project của bạn
cp -r fun-profile/src/lib/sso-sdk your-project/src/lib/`} />

                <CodeBlock language="typescript" title="2. Khởi tạo Client" code={`import { FunProfileClient, DOMAINS } from '@/lib/sso-sdk';

export const funProfile = new FunProfileClient({
  clientId: 'fun_farm_client',
  clientSecret: process.env.FUN_PROFILE_CLIENT_SECRET,
  redirectUri: \`\${DOMAINS.funFarm}/auth/callback\`,
  scopes: ['profile', 'email', 'wallet', 'rewards']
});`} />

                <CodeBlock language="typescript" title="3. Implement Login" code={`// Bắt đầu đăng nhập
const handleLogin = async () => {
  const loginUrl = await funProfile.startAuth();
  window.location.href = loginUrl;
};

// Xử lý callback
const handleCallback = async (code: string, state: string) => {
  const result = await funProfile.handleCallback(code, state);
  console.log('User:', result.user);
};`} />
              </DocSection>

              {/* SDK Installation */}
              <DocSection id="sdk-installation" title="3. Cài đặt SDK">
                <DocSubSection title="Files cần copy">
                  <CodeBlock language="text" title="Cấu trúc thư mục SDK" code={`src/lib/sso-sdk/
├── index.ts              # Main export
├── FunProfileClient.ts   # Core SDK class
├── types.ts              # TypeScript interfaces
├── errors.ts             # Custom error classes
├── storage.ts            # Token storage adapters
├── pkce.ts               # PKCE utilities
└── constants.ts          # Domains & API URL`} />
                </DocSubSection>

                <DocSubSection title="Dependencies">
                  <DocParagraph>SDK không yêu cầu dependencies bên ngoài, chỉ sử dụng Web APIs chuẩn.</DocParagraph>
                </DocSubSection>
              </DocSection>

              {/* Client Config */}
              <DocSection id="client-config" title="4. Cấu hình Client">
                <CodeBlock language="typescript" title="Đầy đủ các options" code={`import { FunProfileClient } from '@/lib/sso-sdk';

const funProfile = new FunProfileClient({
  // Bắt buộc
  clientId: 'your_client_id',
  redirectUri: 'https://your-domain.com/auth/callback',
  
  // Tùy chọn
  clientSecret: process.env.CLIENT_SECRET, // Chỉ dùng ở server-side
  scopes: ['profile', 'email', 'wallet'],
  baseUrl: 'https://bhtsnervqiwchluwuxki.supabase.co/functions/v1',
  autoRefresh: true,  // Tự động refresh token
  storage: customStorage // Custom token storage
});`} />

                <DocAlert type="warning">
                  <strong>Bảo mật:</strong> Không bao giờ commit <code>clientSecret</code> vào git. 
                  Luôn sử dụng environment variables.
                </DocAlert>
              </DocSection>

              {/* Auth Flow */}
              <DocSection id="auth-flow" title="5. Luồng xác thực">
                <DocSubSection title="5.1 Bắt đầu đăng nhập">
                  <CodeBlock language="typescript" title="Login Page" code={`// pages/auth/login.tsx
import { funProfile } from '@/lib/fun-profile';

export default function LoginPage() {
  const handleLogin = async () => {
    try {
      const loginUrl = await funProfile.startAuth();
      window.location.href = loginUrl;
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <button onClick={handleLogin}>
      Login with FUN Profile
    </button>
  );
}`} />
                </DocSubSection>

                <DocSubSection title="5.2 Xử lý Callback">
                  <CodeBlock language="typescript" title="Callback Page" code={`// pages/auth/callback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { funProfile } from '@/lib/fun-profile';

export default function CallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');

      if (code && state) {
        try {
          const result = await funProfile.handleCallback(code, state);
          
          // Lưu user info vào app state
          localStorage.setItem('user', JSON.stringify(result.user));
          
          // Redirect về dashboard
          navigate('/dashboard');
        } catch (error) {
          navigate('/auth/login?error=auth_failed');
        }
      }
    };

    handleAuth();
  }, [navigate]);

  return <div>Đang xác thực...</div>;
}`} />
                </DocSubSection>

                <DocSubSection title="5.3 Lấy thông tin User">
                  <CodeBlock language="typescript" title="Get Current User" code={`// Lấy user đã đăng nhập
const user = await funProfile.getUser();

if (user) {
  console.log('FUN ID:', user.funId);
  console.log('Username:', user.username);
  console.log('Wallet:', user.walletAddress);
  console.log('Soul NFT:', user.soul);
}`} />
                </DocSubSection>

                <DocSubSection title="5.4 Đăng xuất">
                  <CodeBlock language="typescript" title="Logout" code={`const handleLogout = async () => {
  await funProfile.logout();
  navigate('/');
};`} />
                </DocSubSection>
              </DocSection>

              {/* Data Sync */}
              <DocSection id="data-sync" title="6. Đồng bộ dữ liệu">
                <DocParagraph>
                  Sync dữ liệu từ platform của bạn lên FUN Profile để người dùng có thể xem 
                  tổng hợp hoạt động trên tất cả các platform.
                </DocParagraph>

                <DocSubSection title="6.1 Sync Modes">
                  <DocTable
                    headers={["Mode", "Hành vi", "Use Case"]}
                    rows={[
                      ["merge", "Deep merge với dữ liệu hiện có", "Cập nhật thường xuyên"],
                      ["replace", "Thay thế hoàn toàn dữ liệu", "Reset hoặc migration"],
                      ["append", "Chỉ thêm keys mới", "Thêm achievements mới"]
                    ]}
                  />
                </DocSubSection>

                <DocSubSection title="6.2 Ví dụ sync">
                  <CodeBlock language="typescript" title="Sync sau khi user hoạt động" code={`// Ví dụ: Sau khi user thu hoạch trong Fun Farm
const handleHarvest = async (cropData) => {
  // ... logic harvest ...

  // Sync lên Fun Profile
  const result = await funProfile.syncData({
    mode: 'merge',
    data: {
      farming_level: user.level,
      total_harvest: user.totalHarvest + cropData.yield,
      last_harvest: new Date().toISOString(),
      crops_unlocked: user.crops,
      achievements: ['first_harvest', 'speed_farmer']
    }
  });

  console.log('Synced at:', result.syncedAt);
  console.log('Data size:', result.dataSize, 'bytes');
};`} />
                </DocSubSection>

                <DocSubSection title="6.3 Rate Limits">
                  <DocTable
                    headers={["Limit", "Giá trị", "Phạm vi"]}
                    rows={[
                      ["Client rate", "60 requests/phút", "Mỗi platform"],
                      ["User rate", "120 requests/phút", "Mỗi user trên tất cả platforms"],
                      ["Max data size", "50KB", "Mỗi request"],
                      ["Max nesting", "5 levels", "Object depth"]
                    ]}
                  />
                </DocSubSection>
              </DocSection>

              {/* API Reference */}
              <DocSection id="api-reference" title="7. API Reference">
                <DocSubSection title="FunProfileClient Methods">
                  <DocTable
                    headers={["Method", "Mô tả", "Return"]}
                    rows={[
                      ["startAuth()", "Bắt đầu OAuth flow", "Promise<string>"],
                      ["handleCallback(code, state)", "Xử lý callback từ Fun Profile", "Promise<AuthResult>"],
                      ["getUser()", "Lấy thông tin user hiện tại", "Promise<FunUser | null>"],
                      ["refreshToken()", "Refresh access token", "Promise<TokenData>"],
                      ["syncData(options)", "Đồng bộ dữ liệu lên Fun Profile", "Promise<SyncResult>"],
                      ["logout()", "Đăng xuất và xóa tokens", "Promise<void>"]
                    ]}
                  />
                </DocSubSection>

                <DocSubSection title="SSO Endpoints">
                  <DocTable
                    headers={["Endpoint", "Method", "Mô tả"]}
                    rows={[
                      ["/sso-authorize", "GET", "Bắt đầu OAuth flow"],
                      ["/sso-token", "POST", "Đổi code lấy tokens"],
                      ["/sso-verify", "GET", "Verify access token"],
                      ["/sso-refresh", "POST", "Refresh tokens"],
                      ["/sso-revoke", "POST", "Revoke tokens"],
                      ["/sso-sync-data", "POST", "Đồng bộ dữ liệu"]
                    ]}
                  />
                </DocSubSection>
              </DocSection>

              {/* Security */}
              <DocSection id="security" title="8. Bảo mật">
                <DocList items={[
                  "Luôn sử dụng HTTPS cho redirect_uri",
                  "Lưu client_secret trong environment variables",
                  "Sử dụng PKCE cho OAuth flow (SDK tự động xử lý)",
                  "Validate state parameter để chống CSRF",
                  "Không log sensitive data (tokens, secrets)",
                  "Refresh token trước khi hết hạn",
                  "Handle token revocation gracefully"
                ]} />

                <DocAlert type="info">
                  SDK đã tích hợp sẵn PKCE (Proof Key for Code Exchange) để bảo vệ OAuth flow. 
                  Bạn không cần implement thêm.
                </DocAlert>
              </DocSection>

              {/* Troubleshooting */}
              <DocSection id="troubleshooting" title="9. Xử lý lỗi">
                <DocSubSection title="Các lỗi thường gặp">
                  <DocTable
                    headers={["Error", "Nguyên nhân", "Giải pháp"]}
                    rows={[
                      ["invalid_client", "Client ID không đúng", "Kiểm tra lại client_id trong config"],
                      ["invalid_redirect_uri", "Redirect URI không match", "Đảm bảo URI khớp với config trong oauth_clients"],
                      ["invalid_grant", "Code đã hết hạn hoặc đã dùng", "Thử lại flow từ đầu"],
                      ["token_expired", "Access token hết hạn", "Gọi refreshToken() hoặc bật autoRefresh"],
                      ["rate_limit_exceeded", "Vượt quá rate limit", "Đợi 1 phút và thử lại"],
                      ["invalid_state", "State không match", "Kiểm tra CSRF protection"]
                    ]}
                  />
                </DocSubSection>

                <DocSubSection title="Debug Mode">
                  <CodeBlock language="typescript" title="Bật debug logging" code={`// Thêm vào đầu file để debug
localStorage.setItem('FUN_PROFILE_DEBUG', 'true');

// Tắt debug
localStorage.removeItem('FUN_PROFILE_DEBUG');`} />
                </DocSubSection>
              </DocSection>

            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default IntegrationDocs;
