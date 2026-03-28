import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Float "mo:core/Float";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let persistentTrips = Map.empty<Principal, List.List<Trip>>();

  type Task = {
    id : Nat;
    title : Text;
    subject : Text;
    dueDate : Time.Time;
    isExam : Bool;
    completed : Bool;
    durationHours : Float;
    recurring : Bool;
    priority : Text;
    reminderMinutes : ?Nat;
  };

  type Expense = {
    id : Nat;
    amount : Float;
    category : Text;
    date : Time.Time;
    description : Text;
  };

  type AITask = {
    id : Nat;
    type_ : Text;
    input : Text;
    output : Text;
    timestamp : Time.Time;
  };

  type StudySession = {
    subject : Text;
    durationHours : Float;
    date : Time.Time;
  };

  type Profile = {
    name : Text;
    schoolClass : Text;
    passcode : ?Nat;
    monthlyBudget : Float;
    savingsGoal : Float;
  };

  type DayTasks = {
    date : Time.Time;
    tasks : [Task];
  };

  type Waypoint = {
    name : Text;
    notes : ?Text;
  };

  type ChecklistItem = {
    item : Text;
    checked : Bool;
  };

  type TripExpense = {
    amount : Float;
    category : Text;
    note : Text;
  };

  type Trip = {
    id : Nat;
    title : Text;
    destination : Text;
    startDate : Time.Time;
    endDate : Time.Time;
    description : Text;
    waypoints : List.List<Waypoint>;
    checklist : List.List<ChecklistItem>;
    budget : Float;
    expenses : List.List<TripExpense>;
  };

  type UserData = {
    profile : ?Profile;
    tasks : List.List<Task>;
    expenses : List.List<Expense>;
    aiTasks : List.List<AITask>;
    studySessions : List.List<StudySession>;
  };

  let userDataStore = Map.empty<Principal, UserData>();

  public query ({ caller }) func getCallerUserProfile() : async ?Profile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    switch (userDataStore.get(caller)) {
      case (null) { null };
      case (?data) { data.profile };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?Profile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    switch (userDataStore.get(user)) {
      case (null) { null };
      case (?data) { data.profile };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : Profile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    let existingData = switch (userDataStore.get(caller)) {
      case (null) {
        {
          profile = null;
          tasks = List.empty<Task>();
          expenses = List.empty<Expense>();
          aiTasks = List.empty<AITask>();
          studySessions = List.empty<StudySession>();
        };
      };
      case (?data) { data };
    };
    userDataStore.add(caller, { existingData with profile = ?profile });
  };

  public shared ({ caller }) func completeProfile(name : Text, schoolClass : Text, passcode : ?Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can complete profile");
    };
    let profile = {
      name;
      schoolClass;
      passcode;
      monthlyBudget = 0.0;
      savingsGoal = 0.0;
    };
    let initialUserData = {
      profile = ?profile;
      tasks = List.empty<Task>();
      expenses = List.empty<Expense>();
      aiTasks = List.empty<AITask>();
      studySessions = List.empty<StudySession>();
    };
    userDataStore.add(caller, initialUserData);
  };

  public shared ({ caller }) func addTask(
    title : Text,
    subject : Text,
    dueDate : Time.Time,
    isExam : Bool,
    durationHours : Float,
    recurring : Bool,
    priority : Text,
    reminderMinutes : ?Nat,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add tasks");
    };

    let userData = switch (userDataStore.get(caller)) {
      case (null) { Runtime.trap("User data not found") };
      case (?data) { data };
    };

    let taskId = userData.tasks.size();
    let task : Task = {
      id = taskId;
      title;
      subject;
      dueDate;
      isExam;
      completed = false;
      durationHours;
      recurring;
      priority;
      reminderMinutes;
    };

    userData.tasks.add(task);
    userDataStore.add(caller, userData);
  };

  public query ({ caller }) func getTasks() : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get tasks");
    };
    let userData = switch (userDataStore.get(caller)) {
      case (null) { Runtime.trap("User data not found") };
      case (?data) { data };
    };
    userData.tasks.toArray();
  };

  public shared ({ caller }) func addExpense(amount : Float, category : Text, date : Time.Time, description : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add expenses");
    };

    let userData = switch (userDataStore.get(caller)) {
      case (null) { Runtime.trap("User data not found") };
      case (?data) { data };
    };

    let expenseId = userData.expenses.size();
    let expense : Expense = {
      id = expenseId;
      amount;
      category;
      date;
      description;
    };

    userData.expenses.add(expense);
    userDataStore.add(caller, userData);
  };

  public shared ({ caller }) func logStudySession(subject : Text, durationHours : Float, date : Time.Time) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can log study sessions");
    };

    let userData = switch (userDataStore.get(caller)) {
      case (null) { Runtime.trap("User data not found") };
      case (?data) { data };
    };

    let newSession : StudySession = {
      subject;
      durationHours;
      date;
    };

    userData.studySessions.add(newSession);
    userDataStore.add(caller, userData);
  };

  public shared ({ caller }) func setMonthlyBudget(budget : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set budget");
    };
    let userData = switch (userDataStore.get(caller)) {
      case (null) { Runtime.trap("User data not found") };
      case (?data) { data };
    };

    let updatedProfile = switch (userData.profile) {
      case (null) { Runtime.trap("Profile not found") };
      case (?p) { { p with monthlyBudget = budget } };
    };

    userDataStore.add(
      caller,
      {
        userData with profile = ?updatedProfile;
      },
    );
  };

  public shared ({ caller }) func setSavingsGoal(goal : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set savings goal");
    };
    let userData = switch (userDataStore.get(caller)) {
      case (null) { Runtime.trap("User data not found") };
      case (?data) { data };
    };

    let updatedProfile = switch (userData.profile) {
      case (null) { Runtime.trap("Profile not found") };
      case (?p) { { p with savingsGoal = goal } };
    };

    userDataStore.add(
      caller,
      {
        userData with profile = ?updatedProfile;
      },
    );
  };

  public query ({ caller }) func getFinancialOverview() : async (Float, Float) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get financial overview");
    };
    let userData = switch (userDataStore.get(caller)) {
      case (null) { Runtime.trap("User data not found") };
      case (?data) { data };
    };

    let profile = switch (userData.profile) {
      case (null) { { name = ""; schoolClass = ""; passcode = null; monthlyBudget = 0.0; savingsGoal = 0.0 } };
      case (?p) { p };
    };

    let totalExpenses = userData.expenses.foldLeft(
      0.0,
      func(acc, expense) { acc + expense.amount },
    );

    let availableBalance = profile.monthlyBudget - totalExpenses;

    (availableBalance, profile.savingsGoal);
  };

  public shared ({ caller }) func addAITask(type_ : Text, input : Text, output : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add AI tasks");
    };

    let userData = switch (userDataStore.get(caller)) {
      case (null) { Runtime.trap("User data not found") };
      case (?data) { data };
    };

    let aiTaskId = userData.aiTasks.size();
    let newAITask : AITask = {
      id = aiTaskId;
      type_;
      input;
      output;
      timestamp = Time.now();
    };

    userData.aiTasks.add(newAITask);
    userDataStore.add(caller, userData);
  };

  public query ({ caller }) func getTaskCompletionBySubject(subject : Text) : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get subject performance");
    };

    let userData = switch (userDataStore.get(caller)) {
      case (null) { Runtime.trap("User data not found") };
      case (?data) { data };
    };

    let filteredTasks = userData.tasks.filter(func(task) { task.subject == subject });
    let totalTasks = filteredTasks.size();
    if (totalTasks == 0) {
      return 0.0;
    };

    let completedTasks = filteredTasks.filter(func(task) { task.completed }).size();
    completedTasks.toFloat() / totalTasks.toFloat();
  };

  public query ({ caller }) func getTask(_id : Nat) : async Task {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get tasks");
    };

    let userData = switch (userDataStore.get(caller)) {
      case (null) { Runtime.trap("User data not found") };
      case (?data) { data };
    };

    let foundTask = userData.tasks.values().find(func(task) { task.id == _id });
    switch (foundTask) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) { task };
    };
  };

  public shared ({ caller }) func updateTask(id : Nat, updatedTask : Task) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update tasks");
    };

    let userData = switch (userDataStore.get(caller)) {
      case (null) { Runtime.trap("User data not found") };
      case (?data) { data };
    };

    let taskIndex = userData.tasks.values().findIndex(func(task) { task.id == id });
    switch (taskIndex) {
      case (null) { Runtime.trap("Task not found") };
      case (?index) {
        userData.tasks.put(index, updatedTask);
        userDataStore.add(caller, userData);
      };
    };
  };

  public shared ({ caller }) func deleteTask(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete tasks");
    };

    let userData = switch (userDataStore.get(caller)) {
      case (null) { Runtime.trap("User data not found") };
      case (?data) { data };
    };

    let taskIndex = userData.tasks.values().findIndex(func(task) { task.id == id });
    switch (taskIndex) {
      case (null) { Runtime.trap("Task not found") };
      case (?index) {
        let tasksArray = userData.tasks.toArray();
        if (index < tasksArray.size()) {
          let newArray = Array.tabulate(
            tasksArray.size() - 1,
            func(i) { if (i < index) { tasksArray[i] } else { tasksArray[i + 1] } },
          );
          userDataStore.add(caller, { userData with tasks = List.fromArray<Task>(newArray) });
        };
      };
    };
  };

  public shared ({ caller }) func deleteExpense(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete expenses");
    };

    let userData = switch (userDataStore.get(caller)) {
      case (null) { Runtime.trap("User data not found") };
      case (?data) { data };
    };

    let expenseIndex = userData.expenses.values().findIndex(func(expense) { expense.id == id });
    switch (expenseIndex) {
      case (null) { Runtime.trap("Expense not found") };
      case (?index) {
        let expensesArray = userData.expenses.toArray();
        if (index < expensesArray.size()) {
          let newArray = Array.tabulate(
            expensesArray.size() - 1,
            func(i) { if (i < index) { expensesArray[i] } else { expensesArray[i + 1] } },
          );
          userDataStore.add(caller, { userData with expenses = List.fromArray<Expense>(newArray) });
        };
      };
    };
  };

  public query ({ caller }) func getExpensesByCategory(category : Text) : async [Expense] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get expenses");
    };

    let userData = switch (userDataStore.get(caller)) {
      case (null) { Runtime.trap("User data not found") };
      case (?data) { data };
    };

    userData.expenses.filter(func(expense) { expense.category == category }).toArray();
  };

  public query ({ caller }) func getWeekStudyHours() : async [Float] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get study hours");
    };

    let userData = switch (userDataStore.get(caller)) {
      case (null) { Runtime.trap("User data not found") };
      case (?data) { data };
    };

    let today = Time.now();

    let weekHoursArray = Array.tabulate(7, func(i) { 0.0 });

    for (session in userData.studySessions.values()) {
      let sessionDay = Int.abs((today - session.date) / 86400_000_000_000);
      if (sessionDay < 7) {
        let currentHours = weekHoursArray[sessionDay];
        let updatedArray = Array.tabulate(7, func(i) { if (i == sessionDay) { currentHours + session.durationHours } else { weekHoursArray[i] } });
      };
    };

    weekHoursArray;
  };

  public query ({ caller }) func getCompletedTasks() : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get completed tasks");
    };
    let userData = switch (userDataStore.get(caller)) {
      case (null) { Runtime.trap("User data not found") };
      case (?data) { data };
    };

    userData.tasks.filter(func(task) { task.completed }).toArray();
  };

  public query ({ caller }) func getUpcomingExams() : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get exams");
    };
    let userData = switch (userDataStore.get(caller)) {
      case (null) { Runtime.trap("User data not found") };
      case (?data) { data };
    };

    userData.tasks.filter(func(task) { task.isExam and not task.completed }).toArray();
  };
};
