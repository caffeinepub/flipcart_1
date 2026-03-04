import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Blob "mo:core/Blob";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import OutCall "http-outcalls/outcall";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Stripe "stripe/stripe";


// Use migration to extend admin setup logic

actor {
  include MixinStorage();

  // 1. User Management (via Authorization component)
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
    email : Text;
    address : Text;
    phone : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public type UserEntry = {
    principal : Principal;
    profile : ?UserProfile;
    role : Text;
  };

  public query ({ caller }) func getAllUsers() : async [UserEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    userProfiles.toArray().map(
      func((principal, profile)) {
        let role = if (AccessControl.isAdmin(accessControlState, principal)) {
          "admin";
        } else {
          "user";
        };
        {
          principal;
          profile = ?profile;
          role;
        };
      }
    );
  };

  public shared ({ caller }) func setUserRole(targetUser : Principal, newRole : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    if (newRole == "admin") {
      AccessControl.assignRole(accessControlState, caller, targetUser, #admin);
    } else {
      AccessControl.assignRole(accessControlState, caller, targetUser, #user);
    };
  };

  // 2. Product Management
  public type Product = {
    id : Text;
    name : Text;
    description : Text;
    price : Nat;
    discountedPrice : Nat;
    category : Text;
    stockQuantity : Nat;
    images : [Blob];
    rating : Float;
    reviewCount : Nat;
  };

  let products = Map.empty<Text, Product>();

  module Product {
    public func compareByCategory(product1 : Product, product2 : Product) : Order.Order {
      switch (Text.compare(product1.category, product2.category)) {
        case (#equal) { Text.compare(product1.name, product2.name) };
        case (order) { order };
      };
    };
  };

  public shared ({ caller }) func createProduct(product : Product) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    products.add(product.id, product);
  };

  public shared ({ caller }) func updateProduct(product : Product) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    products.add(product.id, product);
  };

  public shared ({ caller }) func deleteProduct(productId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    products.remove(productId);
  };

  public query func getProduct(productId : Text) : async ?Product {
    products.get(productId);
  };

  public query func getProductsByCategory(category : Text) : async [Product] {
    products.values().toArray().filter(func(p) { p.category == category }).sort(Product.compareByCategory);
  };

  public query func getAllProducts() : async [Product] {
    products.values().toArray();
  };

  // 3. Category Management
  public type Category = {
    id : Text;
    name : Text;
    description : Text;
  };

  let categories = Map.empty<Text, Category>();

  public shared ({ caller }) func createCategory(category : Category) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    categories.add(category.id, category);
  };

  public shared ({ caller }) func updateCategory(category : Category) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    categories.add(category.id, category);
  };

  public shared ({ caller }) func deleteCategory(categoryId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    categories.remove(categoryId);
  };

  public query func getCategories() : async [Category] {
    categories.values().toArray();
  };

  // 4. Shopping Cart
  public type CartItem = {
    productId : Text;
    quantity : Nat;
    price : Nat;
  };

  let carts = Map.empty<Principal, List.List<CartItem>>();

  public shared ({ caller }) func addToCart(productId : Text, quantity : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add to cart");
    };

    let cart = switch (carts.get(caller)) {
      case (null) { List.empty<CartItem>() };
      case (?existingCart) { existingCart };
    };

    let product = switch (products.get(productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?p) { p };
    };

    let newItem : CartItem = {
      productId;
      quantity;
      price = product.discountedPrice;
    };

    cart.add(newItem);
    carts.add(caller, cart);
  };

  public shared ({ caller }) func removeFromCart(productId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove from cart");
    };

    let cart = switch (carts.get(caller)) {
      case (null) { Runtime.trap("Cart not found") };
      case (?existingCart) { existingCart };
    };

    let updatedCart = cart.filter(func(item) { item.productId != productId });
    carts.add(caller, updatedCart);
  };

  public shared ({ caller }) func updateCartItemQuantity(productId : Text, quantity : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update cart");
    };

    let cart = switch (carts.get(caller)) {
      case (null) { Runtime.trap("Cart not found") };
      case (?existingCart) { existingCart };
    };

    let updatedCart = cart.map<CartItem, CartItem>(
      func(item) {
        if (item.productId == productId) {
          { productId = item.productId; quantity; price = item.price };
        } else {
          item;
        };
      }
    );

    carts.add(caller, updatedCart);
  };

  public query ({ caller }) func getCart() : async [CartItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cart");
    };
    switch (carts.get(caller)) {
      case (null) { [] };
      case (?cart) { cart.toArray() };
    };
  };

  public query ({ caller }) func getCartTotal() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cart total");
    };
    switch (carts.get(caller)) {
      case (null) { 0 };
      case (?cart) {
        cart.toArray().foldLeft(
          0,
          func(acc, item) { acc + (item.price * item.quantity) }
        );
      };
    };
  };

  // 5. Order Management
  public type OrderStatus = {
    #Pending;
    #Confirmed;
    #Processing;
    #Shipped;
    #OutForDelivery;
    #Delivered;
    #Cancelled;
  };

  public type StatusHistory = {
    status : OrderStatus;
    timestamp : Time.Time;
  };

  public type Order = {
    id : Text;
    userId : Principal;
    items : [CartItem];
    status : OrderStatus;
    statusHistory : [StatusHistory];
    createdAt : Time.Time;
  };

  let orders = Map.empty<Text, Order>();
  var orderCounter : Nat = 0;

  public shared ({ caller }) func placeOrder() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can place orders");
    };

    let cart = switch (carts.get(caller)) {
      case (null) { Runtime.trap("Cart is empty") };
      case (?c) { c };
    };

    if (cart.size() == 0) {
      Runtime.trap("Cart is empty");
    };

    orderCounter += 1;
    let orderId = "ORDER-" # orderCounter.toText();
    let now = Time.now();

    let order : Order = {
      id = orderId;
      userId = caller;
      items = cart.toArray();
      status = #Pending;
      statusHistory = [{
        status = #Pending;
        timestamp = now;
      }];
      createdAt = now;
    };

    orders.add(orderId, order);
    carts.remove(caller);

    orderId;
  };

  public query ({ caller }) func getOrdersForUser(userId : Principal) : async [Order] {
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own orders");
    };
    orders.values().toArray().filter(func(order) { order.userId == userId });
  };

  public query ({ caller }) func getAllOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    orders.values().toArray();
  };

  public shared ({ caller }) func updateOrderStatus(orderId : Text, newStatus : OrderStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let order = switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?o) { o };
    };

    let newHistoryEntry : StatusHistory = {
      status = newStatus;
      timestamp = Time.now();
    };

    let updatedOrder : Order = {
      id = order.id;
      userId = order.userId;
      items = order.items;
      status = newStatus;
      statusHistory = order.statusHistory.concat([newHistoryEntry]);
      createdAt = order.createdAt;
    };

    orders.add(orderId, updatedOrder);
  };

  public query ({ caller }) func getOrder(orderId : Text) : async ?Order {
    let order = switch (orders.get(orderId)) {
      case (null) { return null };
      case (?o) { o };
    };

    if (caller != order.userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own orders");
    };

    ?order;
  };

  // 6. Payment (via Stripe component)
  var stripeConfiguration : ?Stripe.StripeConfiguration = null;

  public query func isStripeConfigured() : async Bool {
    stripeConfiguration != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    stripeConfiguration := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (stripeConfiguration) {
      case (null) { Runtime.trap("Stripe must be first configured") };
      case (?value) { value };
    };
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create checkout sessions");
    };
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // 7. Reviews
  public type Review = {
    userId : Principal;
    rating : Nat;
    comment : Text;
  };

  let productReviews = Map.empty<Text, List.List<Review>>();

  public shared ({ caller }) func addReview(productId : Text, rating : Nat, comment : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add reviews");
    };

    if (rating < 1 or rating > 5) {
      Runtime.trap("Rating must be between 1 and 5");
    };

    let newReview : Review = {
      userId = caller;
      rating;
      comment;
    };

    let reviews = switch (productReviews.get(productId)) {
      case (null) { List.empty<Review>() };
      case (?existingReviews) { existingReviews };
    };

    reviews.add(newReview);
    productReviews.add(productId, reviews);
  };

  public query func getReviewsForProduct(productId : Text) : async [Review] {
    switch (productReviews.get(productId)) {
      case (null) { [] };
      case (?reviews) { reviews.toArray() };
    };
  };

  // 8. First Admin Setup (critical fix)
  let SETUP_PIN = "0078";
  var adminInitialized : Bool = false;

  public shared ({ caller }) func initializeFirstAdmin(pin : Text) : async Bool {
    // Check if caller is anonymous
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Cannot initialize admin for anonymous principal. Please log in with Internet Identity.");
    };

    // Check PIN
    if (pin != SETUP_PIN) {
      Runtime.trap("Unauthorized: Wrong PIN, try again. Please contact admin if you lost your PIN.");
    };

    // If caller is already admin, return true
    let isAlreadyAdmin = switch (accessControlState.userRoles.get(caller)) {
      case (? #admin) { true };
      case (_) { false };
    };

    if (isAlreadyAdmin) {
      return true;
    };

    // If admin is already initialized, return false gracefully
    if (adminInitialized) {
      return false;
    };

    // Set caller as admin and mark as initialized
    accessControlState.userRoles.add(caller, #admin);
    accessControlState.adminAssigned := true;
    adminInitialized := true;
    true;
  };
};
