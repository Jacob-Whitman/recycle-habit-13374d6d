import { useState } from "react";
import { useItemTypes, useUserItemRules, useProfile } from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { X, Plus, Minus, CheckCircle, AlertTriangle, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  itemId: string;
  onClose: () => void;
  onAddToBatch: (itemId: string) => void;
  onMarkRecycled?: (itemId: string, quantity: number) => Promise<void>;
  isLogging?: boolean;
}

const MAX_QUANTITY = 999;

export default function ItemGuidanceDrawer({ itemId, onClose, onAddToBatch, onMarkRecycled, isLogging }: Props) {
  const { data: itemTypes } = useItemTypes();
  const { rules, upsertRule } = useUserItemRules();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const item = itemTypes?.find((i) => i.id === itemId);
  const userRule = rules.find((r) => r.item_type_id === itemId);
  const rule = userRule?.rule ?? "not_sure";

  if (!item) return null;

  const binLabel =
    profile?.stream_mode === "double"
      ? item.default_bin_double_stream === "paper"
        ? "📰 Paper bin"
        : item.default_bin_double_stream === "containers"
        ? "📦 Containers bin"
        : "⚠️ Special handling"
      : "♻️ Recycling bin (single-stream)";

  const handleAdd = () => {
    if (rule === "not_accepted") {
      if (!window.confirm("This item is marked as NOT accepted in your local program. Log anyway?")) {
        return;
      }
    }
    onAddToBatch(itemId);
  };

  const handleMarkRecycled = () => {
    if (rule === "not_accepted") {
      if (!window.confirm("This item is marked as NOT accepted in your local program. Mark as recycled anyway?")) {
        return;
      }
    }
    onMarkRecycled?.(itemId, quantity);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md mx-auto bg-background rounded-t-2xl p-5 pb-8 animate-slide-up max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{item.icon}</span>
          <div>
            <h2 className="font-heading text-lg font-bold">{item.name}</h2>
            <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
          </div>
        </div>

        {/* Local rule status */}
        <div className={`rounded-xl p-3 mb-4 ${
          rule === "accepted" ? "bg-success/10 text-success" :
          rule === "not_accepted" ? "bg-destructive/10 text-destructive" :
          "bg-warning/10 text-warning"
        }`}>
          <p className="text-sm font-bold flex items-center gap-2">
            {rule === "accepted" && "✅ Accepted in your program"}
            {rule === "not_accepted" && (
              <>
                <AlertTriangle className="w-4 h-4" /> Not accepted in your program
              </>
            )}
            {rule === "not_sure" && "❓ Check your local program"}
          </p>
          {rule === "not_sure" && (
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => upsertRule.mutate({ itemTypeId: itemId, rule: "accepted" })}>
                ✅ Accepted
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => upsertRule.mutate({ itemTypeId: itemId, rule: "not_accepted" })}>
                ❌ Not accepted
              </Button>
            </div>
          )}
        </div>

        {/* Bin guidance */}
        <div className="bg-card rounded-xl p-3 mb-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Put in</p>
          <p className="text-sm font-semibold">{binLabel}</p>
        </div>

        {/* Prep steps */}
        <div className="mb-6">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">How to prepare</p>
          <ul className="space-y-1.5">
            {item.default_prep_steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-primary mt-0.5 text-xs">●</span>
                {step}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {onMarkRecycled && (
            <>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-3 py-2">
                <span className="text-sm font-semibold">Number to mark:</span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="min-w-[2.5rem] text-center font-bold tabular-nums">{quantity}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleMarkRecycled}
                disabled={isLogging}
                className="w-full font-heading font-bold gap-2 bg-primary"
              >
                <CheckCircle className="w-4 h-4" />
                {isLogging ? "Saving…" : `Mark ${quantity} as recycled`}
              </Button>
            </>
          )}
          <div className="flex gap-2">
            <Button onClick={handleAdd} variant={onMarkRecycled ? "outline" : "default"} className="flex-1 font-heading font-bold gap-1">
              <Plus className="w-4 h-4" /> Add to Batch
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/setup")}
              title="Edit local rule"
              aria-label="Edit local rule"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
