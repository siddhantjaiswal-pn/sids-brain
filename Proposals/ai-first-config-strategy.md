# AI-First Vesta Configuration

**Date:** April 2026

---

> **I've personally stopped writing Jira tickets.**  
> I built an AI skill, gave it a file describing our Vesta configuration, and now it writes stories, bugs, and test cases — automatically, with full context. This document is about scaling that idea across Vesta Configuration and use it day to day.

---

## The Problem

Our LOS configuration — Objectives, Validations, Tasks, Facts, Loan Stages — lives inside Vesta's UI. Only a handful of trained people can read it. Every change means someone has to decode it, explain it, ticket it, test it, and ship it. Manually. Every time.

Worse, we have no source of truth. There's no document that says what's running on the system or why. The only way to know is to open the active Configuration Version and read it screen by screen.

**The bottleneck isn't effort. It's context trapped in a place AI can't reach.**

---

## The Proposal

Convert Vesta admin config into structured **Markdown files** — plain text, versioned, readable by both humans and AI — that live alongside the automation tools we've already built.

---

## What Changes


| Today                                          | With AI-First Config                                         |
| ---------------------------------------------- | ------------------------------------------------------------ |
| Config lives in a UI only specialists can read | Config is readable by anyone — and by AI                     |
| Jira tickets written manually from memory      | AI generates tickets with full config context attached       |
| QA test cases built from tribal knowledge      | AI drafts test cases straight from Validation and Task logic |
| Impact of a change figured out manually        | AI flags downstream effects before anyone touches the UI     |
| Onboarding takes weeks of shadowing            | New team members ask the AI and get accurate answers         |


---

## The Foundation Is Already Built

The Jira automation skill exists. QA generation exists. Sprint management exists. These tools are live and working today — but they're operating without the one thing that would make them dramatically more useful: **context about what our system actually does.**

They don't know what an Objective is. They don't know what a Validation blocks. They can't tell you how a Fact change ripples through a loan. That knowledge is locked in a UI.

Markdown config files are the missing layer. The moment they exist, everything we've already built gets smarter — no new infrastructure, no new engineering sprint required.

---

## What This Looks Like in Practice

*One sentence in. Everything else handled by AI.*

---

**The ask:** "We need a validation that blocks the Income Review objective from being completed if the borrower's income documents haven't been uploaded."

**Step 1 — AI reads the context.**
It pulls the Income Review Objective MD file, finds the relevant config that evaluate document upload status, and checks what other Validations are already linked to that Objective. It understands exactly what it's working with before writing a single line.

**Step 2 — AI writes the exact configuration.**
It produces the Validation definition — relevance logic scoped to the Income Review Objective, blocking target set to Objective Completion, the Fact condition it evaluates, and the message the user sees when blocked. Formatted and ready to implement.

**Step 3 — AI updates the documentation.**
It adds the new Validation to the right MD file, links it to the Income Review Objective, and documents what it blocks and under what conditions. Source of truth updated before anyone opens Vesta.

**Step 4 — AI creates the Jira ticket.**
Correct Epic. Story template filled in — background, the objective being protected, acceptance criteria, full config spec, affected components. No back-and-forth needed.

**Step 5 — AI writes the test cases.**
Positive case: docs not uploaded, Objective completion blocked, correct message displayed. Negative case: docs uploaded, Objective completes successfully. Edge cases: partial uploads, co-borrower doc requirements. Linked to the ticket. Ready for QA.

---

**Total human input:** one sentence.
**Total human output:** review and approve.

---

## Where to Start

Document **Objectives, Validations, and Tasks** first — the three sections that control how every loan moves through the system. Everything else builds from there.

---

---

> **Give AI the context to do the work — instead of manual tickets and configurations.**  
> **AI starts helping you with configurations.**

