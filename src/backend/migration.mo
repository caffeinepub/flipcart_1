import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Blob "mo:core/Blob";
import AccessControl "authorization/access-control";
import Stripe "stripe/stripe";

module {
  type OrderStatus = {
    #Pending;
    #Confirmed;
    #Processing;
    #Shipped;
    #OutForDelivery;
    #Delivered;
    #Cancelled;
  };

  type CartItem = {
    productId : Text;
    quantity : Nat;
    price : Nat;
  };

  type StatusHistory = {
    status : OrderStatus;
    timestamp : Int;
  };

  type Order = {
    id : Text;
    userId : Principal;
    items : [CartItem];
    status : OrderStatus;
    statusHistory : [StatusHistory];
    createdAt : Int;
  };

  type OldActor = {
    accessControlState : AccessControl.AccessControlState;
    adminInitialized : Bool;
    categories : Map.Map<Text, { id : Text; name : Text; description : Text }>;
    products : Map.Map<Text, {
      id : Text;
      name : Text;
      description : Text;
      price : Nat;
      discountedPrice : Nat;
      category : Text;
      stockQuantity : Nat;
      images : [Blob.Blob];
      rating : Float;
      reviewCount : Nat;
    }>;
    carts : Map.Map<Principal, List.List<CartItem>>;
    orders : Map.Map<Text, Order>;
    orderCounter : Nat;
    productReviews : Map.Map<Text, List.List<{ userId : Principal; rating : Nat; comment : Text }>>;
    stripeConfiguration : ?Stripe.StripeConfiguration;
    userProfiles : Map.Map<Principal, { name : Text; email : Text; address : Text; phone : Text }>;
  };

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    adminInitialized : Bool;
    categories : Map.Map<Text, { id : Text; name : Text; description : Text }>;
    products : Map.Map<Text, {
      id : Text;
      name : Text;
      description : Text;
      price : Nat;
      discountedPrice : Nat;
      category : Text;
      stockQuantity : Nat;
      images : [Blob.Blob];
      rating : Float;
      reviewCount : Nat;
    }>;
    carts : Map.Map<Principal, List.List<CartItem>>;
    orders : Map.Map<Text, Order>;
    orderCounter : Nat;
    productReviews : Map.Map<Text, List.List<{ userId : Principal; rating : Nat; comment : Text }>>;
    stripeConfiguration : ?Stripe.StripeConfiguration;
    userProfiles : Map.Map<Principal, { name : Text; email : Text; address : Text; phone : Text }>;
  };

  public func run(old : OldActor) : NewActor {
    old;
  };
};
