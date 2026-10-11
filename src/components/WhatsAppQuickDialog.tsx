import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  WhatsAppMessageOptions,
  buildWhatsAppMessage,
  cleanPhoneNumber,
} from "@/lib/whatsapp";
import { MessageCircle, Send, Copy, ExternalLink, Check } from "lucide-react";
import { toast } from "sonner";

interface WhatsAppQuickDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: WhatsAppMessageOptions;
}

export const WhatsAppQuickDialog: React.FC<WhatsAppQuickDialogProps> = ({
  open,
  onOpenChange,
  options,
}) => {
  const [editedText, setEditedText] = useState("");
  const [copied, setCopied] = useState(false);

  // Inicializa o texto ao abrir ou quando as opções mudarem
  React.useEffect(() => {
    if (open) {
      setEditedText(buildWhatsAppMessage(options));
      setCopied(false);
    }
  }, [open, options]);

  const cleanPhone = cleanPhoneNumber(options.phone);

  const handleOpenWhatsApp = () => {
    if (!cleanPhone) {
      toast.error("Número de WhatsApp inválido ou não cadastrado.");
      return;
    }
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(editedText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("Abrindo WhatsApp...");
    onOpenChange(false);
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(editedText);
      setCopied(true);
      toast.success("Mensagem copiada para a área de transferência!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Falha ao copiar texto.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <MessageCircle className="h-5 w-5" />
            Disparo de WhatsApp | {options.studentName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between text-xs bg-muted/60 p-2.5 rounded-lg border">
            <div>
              <span className="text-muted-foreground">Destinatário: </span>
              <strong className="font-semibold text-foreground">{options.studentName}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">Telefone: </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                {options.phone || "Não informado"}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground">
                Mensagem (você pode editar antes de enviar):
              </Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={handleCopyText}
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copiado!" : "Copiar"}
              </Button>
            </div>
            <Textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={7}
              className="font-sans text-sm resize-none leading-relaxed"
              placeholder="Digite sua mensagem..."
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleOpenWhatsApp}
            disabled={!cleanPhone}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium"
          >
            <Send className="h-4 w-4" />
            Enviar via WhatsApp
            <ExternalLink className="h-3 w-3 opacity-70" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
