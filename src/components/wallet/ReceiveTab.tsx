import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

export const ReceiveTab = () => {
  const { address } = useAccount();

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success('Đã copy địa chỉ ví!');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nhận tiền</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-4">
          <div className="bg-muted p-6 rounded-lg">
            <div className="bg-white p-4 inline-block rounded">
              {/* QR Code placeholder */}
              <div className="w-48 h-48 bg-gradient-to-br from-primary to-primary-glow opacity-20 rounded" />
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Địa chỉ ví của bạn</p>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-xs break-all">{address}</code>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleCopy}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Quét mã QR hoặc copy địa chỉ để nhận tiền
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
