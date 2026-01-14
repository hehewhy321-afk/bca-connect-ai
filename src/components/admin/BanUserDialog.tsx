import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Ban, ShieldOff } from "lucide-react";

interface BanUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  isBanned: boolean;
  onConfirm: (duration: number | null, reason: string) => void;
}

export function BanUserDialog({
  open,
  onOpenChange,
  userName,
  isBanned,
  onConfirm,
}: BanUserDialogProps) {
  const [duration, setDuration] = useState<string>("permanent");
  const [customDays, setCustomDays] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const handleConfirm = () => {
    let durationInDays: number | null = null;

    if (duration === "1day") durationInDays = 1;
    else if (duration === "7days") durationInDays = 7;
    else if (duration === "30days") durationInDays = 30;
    else if (duration === "custom") durationInDays = parseInt(customDays) || 1;
    // permanent = null

    onConfirm(durationInDays, reason);
    setDuration("permanent");
    setCustomDays("");
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] glass-card border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black">
            {isBanned ? (
              <>
                <ShieldOff className="w-5 h-5 text-green-500" />
                Unban User
              </>
            ) : (
              <>
                <Ban className="w-5 h-5 text-destructive" />
                Ban User
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isBanned
              ? `Remove ban from ${userName}. They will regain access immediately.`
              : `Restrict ${userName}'s access to the platform.`}
          </DialogDescription>
        </DialogHeader>

        {!isBanned && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm font-bold">
                Ban Duration
              </Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent className="glass-card border-white/10">
                  <SelectItem value="1day">1 Day</SelectItem>
                  <SelectItem value="7days">7 Days</SelectItem>
                  <SelectItem value="30days">30 Days</SelectItem>
                  <SelectItem value="custom">Custom Duration</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {duration === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="customDays" className="text-sm font-bold">
                  Number of Days
                </Label>
                <Input
                  id="customDays"
                  type="number"
                  min="1"
                  placeholder="Enter number of days"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  className="bg-white/5 border-white/10"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-bold">
                Reason (Optional)
              </Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for ban..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="bg-white/5 border-white/10 min-h-[100px]"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className={
              isBanned
                ? "bg-green-600 hover:bg-green-700"
                : "bg-destructive hover:bg-destructive/90"
            }
          >
            {isBanned ? "Unban User" : "Confirm Ban"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
