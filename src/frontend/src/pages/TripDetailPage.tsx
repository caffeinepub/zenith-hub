import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  CheckSquare,
  IndianRupee,
  MapPin,
  Navigation,
  Package,
  Plus,
  Route,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import LeafletRouteMap from "../components/LeafletRouteMap";
import {
  useAddChecklistItem,
  useAddTripExpense,
  useAddWaypoint,
  useDeleteTripExpense,
  useGetTrips,
  useRemoveChecklistItem,
  useRemoveWaypoint,
  useToggleChecklistItem,
} from "../hooks/useQueries";
import { formatINR } from "../utils/currency";

const EXPENSE_CATEGORIES = [
  "Transport",
  "Accommodation",
  "Food",
  "Activities",
  "Shopping",
  "Misc",
];

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

export default function TripDetailPage() {
  const { tripId } = useParams({ from: "/trip-manager/$tripId" });
  const navigate = useNavigate();
  const { data: trips = [], isLoading } = useGetTrips();

  const { mutateAsync: addWaypoint, isPending: addingWaypoint } =
    useAddWaypoint();
  const { mutateAsync: removeWaypoint } = useRemoveWaypoint();
  const { mutateAsync: addChecklistItem, isPending: addingItem } =
    useAddChecklistItem();
  const { mutateAsync: removeChecklistItem } = useRemoveChecklistItem();
  const { mutateAsync: toggleChecklistItem } = useToggleChecklistItem();
  const { mutateAsync: addTripExpense, isPending: addingExpense } =
    useAddTripExpense();
  const { mutateAsync: deleteTripExpense } = useDeleteTripExpense();

  const [waypointName, setWaypointName] = useState("");
  const [waypointNotes, setWaypointNotes] = useState("");
  const [checklistText, setChecklistText] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Transport");
  const [expenseNote, setExpenseNote] = useState("");

  const trip = trips.find((t) => t.id === tripId);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="p-4 md:p-6 flex flex-col items-center justify-center py-20 text-center">
        <Navigation className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <h3 className="font-display font-semibold text-lg mb-2">
          Trip not found
        </h3>
        <p className="text-muted-foreground text-sm mb-5">
          This trip may have been deleted.
        </p>
        <Button
          onClick={() => navigate({ to: "/trip-manager" })}
          className="rounded-xl gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Trips
        </Button>
      </div>
    );
  }

  const status = getTripStatus(trip.startDate, trip.endDate);
  const totalSpent = trip.expenses.reduce((a, e) => a + e.amount, 0);
  const remaining = trip.budget - totalSpent;
  const budgetPct =
    trip.budget > 0 ? Math.min(100, (totalSpent / trip.budget) * 100) : 0;
  const packedCount = trip.checklist.filter((c) => c.packed).length;
  const packingPct =
    trip.checklist.length > 0 ? (packedCount / trip.checklist.length) * 100 : 0;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const handleAddWaypoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waypointName.trim()) return;
    try {
      await addWaypoint({
        tripId: trip.id,
        name: waypointName.trim(),
        notes: waypointNotes.trim(),
      });
      setWaypointName("");
      setWaypointNotes("");
      toast.success("Waypoint added");
    } catch {
      toast.error("Failed to add waypoint");
    }
  };

  const handleRemoveWaypoint = async (waypointId: string) => {
    try {
      await removeWaypoint({ tripId: trip.id, waypointId });
      toast.success("Waypoint removed");
    } catch {
      toast.error("Failed to remove waypoint");
    }
  };

  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checklistText.trim()) return;
    try {
      await addChecklistItem({ tripId: trip.id, text: checklistText.trim() });
      setChecklistText("");
      toast.success("Item added");
    } catch {
      toast.error("Failed to add item");
    }
  };

  const handleToggle = async (itemId: string) => {
    try {
      await toggleChecklistItem({ tripId: trip.id, itemId });
    } catch {
      toast.error("Failed to update item");
    }
  };

  const handleRemoveChecklistItem = async (itemId: string) => {
    try {
      await removeChecklistItem({ tripId: trip.id, itemId });
    } catch {
      toast.error("Failed to remove item");
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number.parseFloat(expenseAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      await addTripExpense({
        tripId: trip.id,
        amount,
        category: expenseCategory,
        note: expenseNote.trim(),
      });
      setExpenseAmount("");
      setExpenseNote("");
      toast.success("Expense added");
    } catch {
      toast.error("Failed to add expense");
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await deleteTripExpense({ tripId: trip.id, expenseId });
      toast.success("Expense removed");
    } catch {
      toast.error("Failed to remove expense");
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      {/* Back + Header */}
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: "/trip-manager" })}
          className="rounded-xl shrink-0 mt-0.5"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-display font-bold truncate">
              {trip.title}
            </h1>
            <Badge
              className={`text-xs border ${STATUS_STYLES[status]}`}
              variant="outline"
            >
              {status}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {trip.destination}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
            </span>
          </div>
          {trip.description && (
            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
              {trip.description}
            </p>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-display font-bold text-primary">
              {trip.waypoints.length}
            </p>
            <p className="text-xs text-muted-foreground">Stops</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-display font-bold text-accent">
              {packedCount}/{trip.checklist.length}
            </p>
            <p className="text-xs text-muted-foreground">Packed</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-3 text-center">
            <p
              className={`text-lg font-display font-bold ${remaining < 0 ? "text-destructive" : "text-chart-3"}`}
            >
              {formatINR(remaining)}
            </p>
            <p className="text-xs text-muted-foreground">Remaining</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="itinerary" className="space-y-4">
        <TabsList className="grid grid-cols-4 rounded-xl h-10">
          <TabsTrigger value="itinerary" className="rounded-lg text-xs gap-1.5">
            <Route className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Itinerary</span>
          </TabsTrigger>
          <TabsTrigger value="route" className="rounded-lg text-xs gap-1.5">
            <Navigation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Route Map</span>
          </TabsTrigger>
          <TabsTrigger value="packing" className="rounded-lg text-xs gap-1.5">
            <Package className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Packing</span>
          </TabsTrigger>
          <TabsTrigger value="budget" className="rounded-lg text-xs gap-1.5">
            <IndianRupee className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Budget</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Itinerary Tab ── */}
        <TabsContent value="itinerary" className="space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <Route className="w-4 h-4 text-primary" />
                Waypoints
                <Badge variant="secondary" className="ml-auto text-xs">
                  {trip.waypoints.length} stops
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {trip.waypoints.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">
                    No waypoints yet. Add your first stop!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {trip.waypoints.map((wp, i) => (
                    <div
                      key={wp.id}
                      className="flex items-start gap-3 p-3 rounded-xl border border-border hover:border-primary/30 transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xs font-bold text-amber-500 shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{wp.name}</p>
                        {wp.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {wp.notes}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={() => handleRemoveWaypoint(wp.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Waypoint Form */}
              <form
                onSubmit={handleAddWaypoint}
                className="pt-2 border-t border-border space-y-2"
              >
                <div className="flex gap-2">
                  <Input
                    placeholder="Stop name (e.g. Baga Beach)"
                    value={waypointName}
                    onChange={(e) => setWaypointName(e.target.value)}
                    className="rounded-xl flex-1"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={addingWaypoint || !waypointName.trim()}
                    className="rounded-xl gap-1.5 shrink-0"
                  >
                    {addingWaypoint ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Add
                  </Button>
                </div>
                <Input
                  placeholder="Notes (optional)"
                  value={waypointNotes}
                  onChange={(e) => setWaypointNotes(e.target.value)}
                  className="rounded-xl"
                />
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Route Map Tab ── */}
        <TabsContent value="route" className="space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <Navigation className="w-4 h-4 text-primary" />
                Route Visualization
                <Badge variant="secondary" className="ml-auto text-xs">
                  {trip.waypoints.length} stops
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LeafletRouteMap waypoints={trip.waypoints} />
              {trip.waypoints.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {trip.waypoints.map((wp, i) => (
                    <div
                      key={wp.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[10px] font-bold text-amber-500 shrink-0">
                        {i + 1}
                      </div>
                      <span className="font-medium">{wp.name}</span>
                      {wp.notes && (
                        <span className="text-muted-foreground text-xs">
                          — {wp.notes}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Packing List Tab ── */}
        <TabsContent value="packing" className="space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                Packing List
                <Badge variant="secondary" className="ml-auto text-xs">
                  {packedCount}/{trip.checklist.length} packed
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {trip.checklist.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Packing progress</span>
                    <span>{packingPct.toFixed(0)}%</span>
                  </div>
                  <Progress value={packingPct} className="h-2 rounded-full" />
                </div>
              )}

              {trip.checklist.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No items yet. Add things to pack!</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {trip.checklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-border hover:border-primary/20 transition-colors group"
                    >
                      <Checkbox
                        id={item.id}
                        checked={item.packed}
                        onCheckedChange={() => handleToggle(item.id)}
                        className="shrink-0"
                      />
                      <label
                        htmlFor={item.id}
                        className={`flex-1 text-sm cursor-pointer select-none ${item.packed ? "line-through text-muted-foreground" : ""}`}
                      >
                        {item.text}
                      </label>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={() => handleRemoveChecklistItem(item.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Item Form */}
              <form
                onSubmit={handleAddChecklistItem}
                className="pt-2 border-t border-border flex gap-2"
              >
                <Input
                  placeholder="Add item (e.g. Sunscreen, Passport)"
                  value={checklistText}
                  onChange={(e) => setChecklistText(e.target.value)}
                  className="rounded-xl flex-1"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={addingItem || !checklistText.trim()}
                  className="rounded-xl gap-1.5 shrink-0"
                >
                  {addingItem ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Budget Tab ── */}
        <TabsContent value="budget" className="space-y-4">
          {/* Budget Overview */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-border">
              <CardContent className="p-3 text-center">
                <IndianRupee className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-base font-display font-bold">
                  {formatINR(trip.budget)}
                </p>
                <p className="text-xs text-muted-foreground">Total Budget</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-3 text-center">
                <IndianRupee className="w-4 h-4 text-destructive mx-auto mb-1" />
                <p className="text-base font-display font-bold text-destructive">
                  {formatINR(totalSpent)}
                </p>
                <p className="text-xs text-muted-foreground">Spent</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-3 text-center">
                <IndianRupee
                  className={`w-4 h-4 mx-auto mb-1 ${remaining < 0 ? "text-destructive" : "text-chart-3"}`}
                />
                <p
                  className={`text-base font-display font-bold ${remaining < 0 ? "text-destructive" : "text-chart-3"}`}
                >
                  {formatINR(remaining)}
                </p>
                <p className="text-xs text-muted-foreground">Remaining</p>
              </CardContent>
            </Card>
          </div>

          {trip.budget > 0 && (
            <Card className="border-border">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Budget used</span>
                  <span
                    className={`font-semibold ${budgetPct > 90 ? "text-destructive" : "text-primary"}`}
                  >
                    {budgetPct.toFixed(0)}%
                  </span>
                </div>
                <Progress value={budgetPct} className="h-3 rounded-full" />
              </CardContent>
            </Card>
          )}

          {/* Expenses List */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-primary" />
                Expenses
                <Badge variant="secondary" className="ml-auto text-xs">
                  {trip.expenses.length} items
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {trip.expenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <IndianRupee className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No expenses recorded yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {trip.expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/20 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="text-xs shrink-0"
                          >
                            {expense.category}
                          </Badge>
                          {expense.note && (
                            <span className="text-sm text-muted-foreground truncate">
                              {expense.note}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-semibold text-sm shrink-0">
                        {formatINR(expense.amount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={() => handleDeleteExpense(expense.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Expense Form */}
              <form
                onSubmit={handleAddExpense}
                className="pt-2 border-t border-border space-y-2"
              >
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Amount (₹)"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="rounded-xl flex-1"
                    min="0"
                  />
                  <Select
                    value={expenseCategory}
                    onValueChange={setExpenseCategory}
                  >
                    <SelectTrigger className="rounded-xl w-36 shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Note (optional)"
                    value={expenseNote}
                    onChange={(e) => setExpenseNote(e.target.value)}
                    className="rounded-xl flex-1"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={addingExpense || !expenseAmount}
                    className="rounded-xl gap-1.5 shrink-0"
                  >
                    {addingExpense ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Add
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
