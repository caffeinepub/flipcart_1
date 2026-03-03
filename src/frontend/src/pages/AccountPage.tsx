import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  Edit3,
  Home,
  Info,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Package,
  Phone,
  Plus,
  Save,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetCallerUserProfile,
  useGetOrdersForUser,
  useIsCallerAdmin,
  useSaveCallerUserProfile,
} from "../hooks/useQueries";
import { formatPrice } from "../utils/staticData";

// Address Book types and helpers
const ADDRESS_BOOK_KEY = "shopexpo_addresses";

interface SavedAddress {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

function getSavedAddresses(): SavedAddress[] {
  try {
    const stored = localStorage.getItem(ADDRESS_BOOK_KEY);
    return stored ? (JSON.parse(stored) as SavedAddress[]) : [];
  } catch {
    return [];
  }
}

function saveSavedAddresses(addresses: SavedAddress[]): void {
  localStorage.setItem(ADDRESS_BOOK_KEY, JSON.stringify(addresses));
}

const EMPTY_ADDRESS: Omit<SavedAddress, "id"> = {
  name: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  pincode: "",
};

export function AccountPage() {
  const { identity, login, clear } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } =
    useGetCallerUserProfile();
  const principal = identity?.getPrincipal() ?? null;
  const { data: orders, isLoading: ordersLoading } =
    useGetOrdersForUser(principal);
  const { data: isAdmin } = useIsCallerAdmin();
  const saveProfile = useSaveCallerUserProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  // Address book state
  const [addresses, setAddresses] = useState<SavedAddress[]>(() =>
    getSavedAddresses(),
  );
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(
    null,
  );
  const [addressForm, setAddressForm] =
    useState<Omit<SavedAddress, "id">>(EMPTY_ADDRESS);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
      });
    }
  }, [profile]);

  if (!identity) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <User className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
        <h2 className="font-display font-bold text-xl mb-2">
          Login to view your account
        </h2>
        <p className="text-muted-foreground mb-6">
          Manage your profile and orders after logging in
        </p>
        <Button
          className="bg-brand-orange hover:bg-orange-600 text-white"
          onClick={login}
        >
          Login
        </Button>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      await saveProfile.mutateAsync(formData);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (
        isAdmin &&
        (message.toLowerCase().includes("unauthorized") ||
          message.toLowerCase().includes("not authorized") ||
          message.toLowerCase().includes("admin") ||
          message.toLowerCase().includes("role") ||
          message.toLowerCase().includes("user"))
      ) {
        toast.error(
          "Pehle ek regular user ke roop mein profile save karein -- admin profile saving mein error aa sakta hai.",
        );
      } else {
        toast.error("Profile save nahi ho saka. Dobara try karein.");
      }
    }
  };

  const handleSaveAddress = () => {
    if (
      !addressForm.name ||
      !addressForm.phone ||
      !addressForm.street ||
      !addressForm.city ||
      !addressForm.pincode
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    if (editingAddress) {
      const updated = addresses.map((a) =>
        a.id === editingAddress.id
          ? { ...addressForm, id: editingAddress.id }
          : a,
      );
      setAddresses(updated);
      saveSavedAddresses(updated);
      toast.success("Address updated!");
    } else {
      const newAddr: SavedAddress = {
        ...addressForm,
        id: crypto.randomUUID(),
      };
      const updated = [...addresses, newAddr];
      setAddresses(updated);
      saveSavedAddresses(updated);
      toast.success("Address saved!");
    }
    setAddressForm(EMPTY_ADDRESS);
    setEditingAddress(null);
    setShowAddressForm(false);
  };

  const handleDeleteAddress = (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    setAddresses(updated);
    saveSavedAddresses(updated);
    toast.success("Address removed");
  };

  const handleEditAddress = (addr: SavedAddress) => {
    setEditingAddress(addr);
    setAddressForm({
      name: addr.name,
      phone: addr.phone,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    });
    setShowAddressForm(true);
  };

  const principalId = identity.getPrincipal().toString();
  const recentOrders = (orders ?? []).slice(0, 3);

  return (
    <main className="container mx-auto px-4 py-6 max-w-4xl">
      <h1 className="font-display font-bold text-2xl mb-4 flex items-center gap-2">
        <User className="w-6 h-6 text-brand-orange" />
        My Account
        {isAdmin && (
          <Badge className="ml-2 bg-brand-orange text-white border-0">
            Admin
          </Badge>
        )}
      </h1>

      {/* Admin info note — shown only to non-admins */}
      {!isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3"
        >
          <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Admin access chahiye?</span> App
            owner se contact karein — woh aapko admin privileges de sakte hain.
          </p>
        </motion.div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-border p-5 text-center">
            <div className="w-16 h-16 bg-brand-navy rounded-full flex items-center justify-center mx-auto mb-3">
              <User className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-display font-bold text-base">
              {profile?.name || "Welcome!"}
            </h3>
            <p className="text-muted-foreground text-xs mt-1 font-mono">
              {principalId.slice(0, 20)}...
            </p>
            {isAdmin ? (
              <Badge className="mt-2 bg-brand-orange text-white border-0 text-xs">
                <Shield className="w-3 h-3 mr-1" /> Admin
              </Badge>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">Regular User</p>
            )}
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <nav>
              <Link
                to="/orders"
                className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors"
              >
                <Package className="w-4 h-4 text-brand-orange" />
                My Orders
              </Link>
              <Separator />
              {isAdmin ? (
                <Link
                  to="/admin"
                  className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors"
                >
                  <Shield className="w-4 h-4 text-brand-orange" />
                  Admin Dashboard
                </Link>
              ) : (
                <div
                  className="flex items-center gap-3 px-4 py-3 text-sm opacity-40 cursor-not-allowed select-none"
                  title="Pehle admin ban jao"
                >
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span>Admin Dashboard</span>
                  <span className="ml-auto text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                    Admin only
                  </span>
                </div>
              )}
            </nav>
          </div>

          <Button
            variant="outline"
            className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
            onClick={clear}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile info */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-lg">
                Personal Information
              </h2>
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="gap-2"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="bg-brand-orange hover:bg-orange-600 text-white gap-2"
                    onClick={() => void handleSave()}
                    disabled={saveProfile.isPending}
                  >
                    {saveProfile.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    Save
                  </Button>
                </div>
              )}
            </div>

            {profileLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Full Name
                  </Label>
                  {isEditing ? (
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Your full name"
                    />
                  ) : (
                    <p className="text-sm py-2 px-3 bg-muted rounded-lg">
                      {profile?.name || "Not set"}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="your@email.com"
                    />
                  ) : (
                    <p className="text-sm py-2 px-3 bg-muted rounded-lg">
                      {profile?.email || "Not set"}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Phone
                  </Label>
                  {isEditing ? (
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+91 98765 43210"
                    />
                  ) : (
                    <p className="text-sm py-2 px-3 bg-muted rounded-lg">
                      {profile?.phone || "Not set"}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Address
                  </Label>
                  {isEditing ? (
                    <Input
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      placeholder="Your delivery address"
                    />
                  ) : (
                    <p className="text-sm py-2 px-3 bg-muted rounded-lg">
                      {profile?.address || "Not set"}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Recent orders */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-brand-orange" />
                Recent Orders
              </h2>
              <Link
                to="/orders"
                className="text-brand-orange text-sm font-medium hover:underline"
              >
                View All
              </Link>
            </div>

            {ordersLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    to="/order/$orderId"
                    params={{ orderId: order.id }}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted hover:bg-accent transition-colors"
                  >
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">
                        #{order.id.slice(0, 16)}...
                      </p>
                      <p className="text-sm font-medium mt-0.5">
                        {order.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">
                        {formatPrice(
                          order.items.reduce(
                            (s, i) => s + i.price * i.quantity,
                            0n,
                          ),
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.items.length} item
                        {order.items.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Address Book */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg flex items-center gap-2">
                <Home className="w-5 h-5 text-brand-orange" />
                Saved Addresses
              </h2>
              <Button
                size="sm"
                className="bg-brand-orange hover:bg-orange-600 text-white gap-1.5 h-8 text-xs"
                onClick={() => {
                  setEditingAddress(null);
                  setAddressForm(EMPTY_ADDRESS);
                  setShowAddressForm(true);
                }}
                data-ocid="account.address.open_modal_button"
              >
                <Plus className="w-3.5 h-3.5" /> Add Address
              </Button>
            </div>

            {/* Address list */}
            {addresses.length === 0 && !showAddressForm ? (
              <div
                className="text-center py-8 text-muted-foreground"
                data-ocid="account.address.empty_state"
              >
                <MapPin className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No saved addresses</p>
                <p className="text-xs mt-1">Add addresses for quick checkout</p>
              </div>
            ) : (
              <div className="space-y-3 mb-4" data-ocid="account.address.list">
                {addresses.map((addr, i) => (
                  <div
                    key={addr.id}
                    className="border border-border rounded-xl p-3 flex items-start justify-between gap-3"
                    data-ocid={`account.address.item.${i + 1}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{addr.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {addr.phone}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {addr.street}, {addr.city}
                        {addr.state ? `, ${addr.state}` : ""} - {addr.pincode}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEditAddress(addr)}
                        data-ocid={`account.address.edit_button.${i + 1}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteAddress(addr.id)}
                        data-ocid={`account.address.delete_button.${i + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add/Edit Address Form */}
            {showAddressForm && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-brand-orange/30 rounded-xl p-4 bg-orange-50/30"
                data-ocid="account.address.modal"
              >
                <h3 className="font-semibold text-sm mb-3">
                  {editingAddress ? "Edit Address" : "New Address"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Full Name *</Label>
                    <Input
                      value={addressForm.name}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, name: e.target.value })
                      }
                      placeholder="John Doe"
                      className="h-9 text-sm"
                      data-ocid="account.address.name.input"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Phone *</Label>
                    <Input
                      value={addressForm.phone}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          phone: e.target.value,
                        })
                      }
                      placeholder="+91 98765 43210"
                      className="h-9 text-sm"
                      data-ocid="account.address.phone.input"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs">Street Address *</Label>
                    <Input
                      value={addressForm.street}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          street: e.target.value,
                        })
                      }
                      placeholder="House/Flat No, Street, Area"
                      className="h-9 text-sm"
                      data-ocid="account.address.street.input"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">City *</Label>
                    <Input
                      value={addressForm.city}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          city: e.target.value,
                        })
                      }
                      placeholder="Mumbai"
                      className="h-9 text-sm"
                      data-ocid="account.address.city.input"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">State</Label>
                    <Input
                      value={addressForm.state}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          state: e.target.value,
                        })
                      }
                      placeholder="Maharashtra"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Pincode *</Label>
                    <Input
                      value={addressForm.pincode}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          pincode: e.target.value,
                        })
                      }
                      placeholder="400001"
                      maxLength={6}
                      className="h-9 text-sm"
                      data-ocid="account.address.pincode.input"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    className="bg-brand-orange hover:bg-orange-600 text-white gap-1.5 h-8 text-xs"
                    onClick={handleSaveAddress}
                    data-ocid="account.address.save_button"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {editingAddress ? "Update Address" : "Save Address"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => {
                      setShowAddressForm(false);
                      setEditingAddress(null);
                      setAddressForm(EMPTY_ADDRESS);
                    }}
                    data-ocid="account.address.cancel_button"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
