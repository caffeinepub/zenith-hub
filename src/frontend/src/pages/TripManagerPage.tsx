import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  ChevronRight,
  Compass,
  IndianRupee,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type Trip,
  useCreateTrip,
  useDeleteTrip,
  useGetTrips,
} from "../hooks/useQueries";
import { formatINR } from "../utils/currency";

interface TripForm {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  description: string;
  budget: string;
}

const defaultForm: TripForm = {
  title: "",
  destination: "",
  startDate: "",
  endDate: "",
  description: "",
  budget: "",
};

function getTripStatus(
  startDate: string,
  endDate: string,
): "Upcoming" | "Ongoing" | "Completed" {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (now < start) return "Upcoming";
  if (now > end) return "Completed";
  return "Ongoing";
}

const STATUS_STYLES = {
  Upcoming: "bg-primary/15 text-primary border-primary/30",
  Ongoing: "bg-accent/15 text-accent border-accent/30",
  Completed: "bg-muted text-muted-foreground border-border",
};

function TripCard({
  trip,
  onDelete,
}: { trip: Trip; onDelete: (id: string) => void }) {
  const navigate = useNavigate();
  const status = getTripStatus(trip.startDate, trip.endDate);
  const totalSpent = trip.expenses.reduce((a, e) => a + e.amount, 0);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <Card
      className="border-border card-hover cursor-pointer group relative overflow-hidden"
      onClick={() =>
        navigate({ to: "/trip-manager/$tripId", params: { tripId: trip.id } })
      }
    >
      {/* Accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 gradient-teal opacity-60 group-hover:opacity-100 transition-opacity" />

      <CardContent className="p-4 pt-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-base truncate">
              {trip.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-muted-foreground text-sm">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{trip.destination}</span>
            </div>
          </div>
          <Badge
            className={`text-xs shrink-0 border ${STATUS_STYLES[status]}`}
            variant="outline"
          >
            {status}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>
            {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
          </span>
        </div>

        {trip.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {trip.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <IndianRupee className="w-3 h-3" />
              <span className="font-medium text-foreground">
                {formatINR(totalSpent)}
              </span>
              <span>/ {formatINR(trip.budget)}</span>
            </span>
            <span>{trip.waypoints.length} stops</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(trip.id);
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TripManagerPage() {
  const { data: trips = [], isLoading } = useGetTrips();
  const { mutateAsync: createTrip, isPending: creating } = useCreateTrip();
  const { mutateAsync: deleteTrip } = useDeleteTrip();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<TripForm>(defaultForm);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.title.trim() ||
      !form.destination.trim() ||
      !form.startDate ||
      !form.endDate
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast.error("End date must be after start date");
      return;
    }
    try {
      await createTrip({
        title: form.title.trim(),
        destination: form.destination.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        description: form.description.trim(),
        budget: Number.parseFloat(form.budget) || 0,
      });
      toast.success("Trip created!");
      setCreateOpen(false);
      setForm(defaultForm);
    } catch {
      toast.error("Failed to create trip");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTrip(deleteId);
      toast.success("Trip deleted");
    } catch {
      toast.error("Failed to delete trip");
    } finally {
      setDeleteId(null);
    }
  };

  const upcomingCount = trips.filter(
    (t) => getTripStatus(t.startDate, t.endDate) === "Upcoming",
  ).length;
  const ongoingCount = trips.filter(
    (t) => getTripStatus(t.startDate, t.endDate) === "Ongoing",
  ).length;
  const completedCount = trips.filter(
    (t) => getTripStatus(t.startDate, t.endDate) === "Completed",
  ).length;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Compass className="w-6 h-6 text-primary" />
            Trip Manager
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Plan your adventures with routes, packing lists, and budgets
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          size="sm"
          className="rounded-xl gap-2 gradient-teal text-white border-0"
        >
          <Plus className="w-4 h-4" /> New Trip
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-display font-bold text-primary">
              {upcomingCount}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Upcoming</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-display font-bold text-accent">
              {ongoingCount}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Ongoing</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-display font-bold text-muted-foreground">
              {completedCount}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Trip Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Compass className="w-10 h-10 text-primary/50" />
          </div>
          <h3 className="font-display font-semibold text-lg mb-2">
            No trips yet
          </h3>
          <p className="text-muted-foreground text-sm max-w-xs mb-5">
            Create your first trip to start planning routes, packing lists, and
            budgets.
          </p>
          <Button
            onClick={() => setCreateOpen(true)}
            className="rounded-xl gap-2 gradient-teal text-white border-0"
          >
            <Plus className="w-4 h-4" /> Create Your First Trip
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips
            .slice()
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((trip) => (
              <TripCard key={trip.id} trip={trip} onDelete={setDeleteId} />
            ))}
        </div>
      )}

      {/* Create Trip Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Compass className="w-5 h-5 text-primary" />
              Create New Trip
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Trip Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Goa Beach Getaway"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                className="rounded-xl"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="destination">Destination *</Label>
              <Input
                id="destination"
                placeholder="e.g. Goa, India"
                value={form.destination}
                onChange={(e) =>
                  setForm((f) => ({ ...f, destination: e.target.value }))
                }
                className="rounded-xl"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endDate: e.target.value }))
                  }
                  className="rounded-xl"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="budget">Budget (₹)</Label>
              <Input
                id="budget"
                type="number"
                placeholder="e.g. 25000"
                value={form.budget}
                onChange={(e) =>
                  setForm((f) => ({ ...f, budget: e.target.value }))
                }
                className="rounded-xl"
                min="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What's this trip about?"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateOpen(false);
                  setForm(defaultForm);
                }}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="rounded-xl gradient-teal text-white border-0"
              >
                {creating ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : (
                  "Create Trip"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trip?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the trip and all its data including
              waypoints, packing list, and expenses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
