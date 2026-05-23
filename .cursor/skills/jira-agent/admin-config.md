# Vesta Admin Configuration

Vesta is a **Loan Origination System (LoS)**. The Admin Configuration section is the central place where the system's behavior is defined and managed.

---

## Version Manager

Admin Config operates on a **Version Manager** — each version encapsulates a full set of configuration. A config version contains the following top-level sections:

| Section | Description |
|---|---|
| **Objectives** | Collections of tasks, automated actions, and validations |
| **Tasks** | Work items linked to objectives |
| **Automated Actions** | Automations that fire within objectives |
| **Scenario Changes** | *(detail TBD)* |
| **Validations** | Rules that block transitions or actions on the loan |
| **Loan Stages** | Stages a loan moves through (currently 18 configured) |
| **Document Types** | Types of documents required during origination |
| **Rule-Based Fields** | Fields driven by rules |
| **Custom Fields** | Fields displayed on the UI |
| **Computed Fields** | Fields calculated from other data points |
| **Facts** | Values used/referenced across other config areas |
| **Other Version Settings** | Additional settings (not covered here) |

---

## Objectives

An **Objective** is a collection of **Tasks**, **Automated Actions**, and **Validations** that block it. Objectives are the primary unit of work configuration on a loan.

### Relevance & Readiness

Every objective has two key pieces of logic:

- **Relevance** — Determines *when* the objective should apply to a specific loan. When relevance is met, the objective appears in **Upcoming** status.
- **Readiness** — Determines *when* the objective is ready to be worked. When readiness is met, the objective transitions from **Upcoming** → **Open**.

### Objective Statuses

An objective on a loan can be in one of the following statuses:

| Status | Description |
|---|---|
| **Upcoming** | Relevance met; waiting for readiness |
| **Open** | Ready to be worked |
| **In Progress** | Currently being worked |
| **Completed** | Finished |
| **Blocked** | Blocked by a validation or other condition |
| **Cancelled** | No longer needed |

### Assignment Logic & Skill Sets

Objectives have **assignment logic** tied to **skill sets**. Users are tagged with specific skill sets, and when an objective meets the configured skill set criteria, it is **automatically assigned** to matching users.

### Loan Stage Association

Each objective can be configured to open up in a **specific loan stage**.

---

## Tasks

Tasks are work items **linked to objectives**. They represent the individual steps or actions within an objective.

### Prerequisites for Working a Task

For any task to be started or worked on, **two conditions must be met**:

1. The parent **objective must be assigned** to the user.
2. The parent **objective must be in Open status**.

Once both conditions are satisfied, tasks will trigger under the objective. The user can then click on a task, click **Start**, work through it, and **complete** it.

> **Example:** To work on a "Review W-2s" task, the parent objective "Documents Review" must be in **Open** status and assigned to you. The task triggers under that objective — you click the task, start it, complete the work, and submit.

### Task Properties

| Property | Description |
|---|---|
| **Task Name** | Display name of the task |
| **Task Type** | Category of task (see types below) |
| **Entity** | The entity the task lives on (e.g., Loan, Borrower, etc.) |
| **Trigger Method** | `Manual`, `Automatic`, or `Both` |

### Task Types

| Type | Description |
|---|---|
| **Instruction Task** | Displays step-by-step instructions for the user. User reads the steps, performs actions on the loan, then submits the task to complete it. |
| **Document Required Task** | Requires a specific document to be collected/uploaded |
| **Document Processing Task** | Involves processing of a document |
| **Automated Action** | A task type that fires an automation (see Automated Actions below) |

### Task Relevance & Auto-Complete

- **Relevance** — Tasks open inside their parent objective when a specific configuration criteria is met.
- **Auto-Complete** — Tasks can be configured to automatically complete based on defined conditions.

### Task Entities

Tasks can live on different entity types:
- **Loan** entity
- **Borrower** entity
- Other entity types as configured

---

## Automated Actions

Automated Actions are **automations built inside an objective**. They are a special type of task.

### How They Work

1. The parent objective must be in **Open** status.
2. The automated action must meet its own **relevance** and **readiness** criteria.
3. When both conditions are met, the automated action **triggers automatically**.
4. It performs an action on the loan file — such as an API call or other configured operation.

---

## Validations

Validations are configured **outside** of objectives but can be **linked to** one or more objectives.

### Relevance

Validations have their own **relevance** logic that determines when they trigger.

### What Validations Can Block

When a validation fires, it displays a message to the user and can block one or more of the following:

| Blocking Target | Description |
|---|---|
| **Loan Stage Transition** | Prevents the loan from moving to the next stage |
| **Disclosure Packages** | Blocks sending disclosure packages |
| **Underwriting Actions** | Blocks underwriting decisions |
| **Objective Completion** | Prevents the linked objective from being completed |

---

## Loan Stages

The loan lifecycle is divided into **stages**. Currently there are **18 loan stages** configured. Objectives are tied to specific loan stages, determining when they become relevant in the loan lifecycle.

---

## Document Types

Loan origination requires many types of documents. Document types are configured in admin config for each required document.

### Examples

- W-2s
- Pay Stubs
- Assumptions Agreement
- Passport
- Original Note

### Entity Linking

Each document type is **linked to a specific entity** (e.g., Borrower, Loan). These entities can then be referenced by objectives and their child tasks.

---

## Rule-Based Fields

Fields whose values or behavior are driven by configured rules.

---

## Custom Fields

Fields that are displayed on the **UI** and are user-defined within the configuration.

---

## Computed Fields

Fields that are **calculated/derived** from other data points or items in the system.

---

## Facts

Facts are **statements that evaluate to true or false**. They act as reusable boolean conditions that can be referenced across the configuration — in objective logic, task logic, validations, and anywhere else that requires conditional evaluation. When referenced, a fact returns either `true` or `false`.
