# Highhill Pham — User Manual

A booking calendar application for managing appointments. Users sign in with Google, view a monthly calendar, create bookings, and track all reservations in a list view.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Calendar View](#2-calendar-view)
3. [Making a Booking](#3-making-a-booking)
4. [Viewing an Existing Booking](#4-viewing-an-existing-booking)
5. [Cancelling a Booking](#5-cancelling-a-booking)
6. [List View](#6-list-view)
7. [Profile Setup](#7-profile-setup)
8. [Booking Limits](#8-booking-limits)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Getting Started

### 1.1 Signing In

1. Open the application in your browser.
2. You will see a **"Sign in with Google"** button.
3. Click it and sign in with your Google account.
4. After signing in, the calendar will load with your email displayed at the top right.

> **Note:** You must be signed in to view the calendar, create bookings, or access any other page.

### 1.2 Signing Out

Click **"Sign out"** in the top-right corner of the calendar page.

---

## 2. Calendar View

The calendar is the main view of the application. It shows a monthly grid with the following features:

### 2.1 Navigation

- **Previous / Next month:** Use the arrow buttons (`<` and `>`) at the top of the calendar card.
- **Date range:** You can navigate from the current month up to **2 months ahead**.
- **Today highlight:** The current day is highlighted in **blue**.

### 2.2 Day Types

**Weekdays (Monday – Friday):**
- Each day shows a single **"Full day"** slot.
- **Available (no booking):** Grey background, clickable.
- **Your booking:** Green (emerald) background.
- **Another user's booking:** Red background.

**Weekends (Saturday – Sunday):**
- Each day is split into two slots: **AM** (morning) and **PM** (evening).
- Each slot is independently clickable and can be booked separately.
- Colour coding is the same as weekdays.

### 2.3 Colour Legend

| Colour | Meaning |
|---|---|
| Green (emerald) | Your own booking |
| Red | Another user's booking |
| Blue | Today's date (if unbooked) |
| Grey | Available (free to book) |

---

## 3. Making a Booking

### 3.1 Creating a New Booking

1. Click on an **available** day or slot in the calendar.
2. A modal window will appear with a form.
3. **On weekends:** Select **AM** or **PM** slot first.
4. Enter your **email address** (pre-filled from your Google account).
5. Click **"Confirm"** to create the booking.
6. The calendar will refresh and show the day as booked (green).

> **Note:** The email you enter must match a registered user in the system (i.e., you must have signed in at least once with that email).

### 3.2 Booking Limits

- You can book a maximum of **7 bookings per month** per user.
- If you exceed this limit, you will see: *"Maximum of 7 bookings per month reached."*

### 3.3 Duplicate Prevention

- You cannot book the same slot on the same date twice.
- If you try, you will see: *"A booking with this email already exists on this date for this slot."*

---

## 4. Viewing an Existing Booking

1. Click on any **booked** day or slot (green or red).
2. A modal will display the booking details:

| Field | Description |
|---|---|
| **Name** | The user's display name |
| **Email** | The user's email address |
| **Phone** | The user's phone number (if set) |
| **Slot** | The booked time slot (AM / PM / Full day) |

3. Click **"Close"** to dismiss the modal.

---

## 5. Cancelling a Booking

> **You can only cancel your own bookings.**

1. Click on your own **booked** day or slot (green).
2. In the booking details modal, click **"Cancel Booking"**.
3. Confirm the cancellation when prompted.
4. The slot will become available again.

> Bookings belonging to other users (red) cannot be cancelled by you.

---

## 6. List View

The List View shows all bookings grouped by user, then by month.

### 6.1 Accessing List View

- From the **Calendar view**, click **"List view"** (top-right).
- Or navigate directly to `/bookings`.

### 6.2 Understanding the List

Each user has their own card showing:

- **Name** (from profile settings)
- **Email address**
- **Phone number**
- **Total booking count**
- **Monthly breakdown:** Each month lists the date and slot for each booking.

Users are sorted alphabetically by name.

### 6.3 Returning to Calendar

Click **"Calendar view"** at the top of the List View page.

---

## 7. Profile Setup

Your profile stores your display name and phone number, which are used when creating bookings.

### 7.1 Accessing Profile

- From the **Calendar view**, click **"Profile"** (top-right).
- Or navigate directly to `/profile`.

### 7.2 Editing Your Profile

1. **Name:** Edit your display name.
2. **Phone Number:** Enter or update your phone number.
3. Click **"Save"** to store changes.
4. A green **"Saved!"** confirmation will appear.

> Your name and phone number will be pre-filled when you create new bookings.

### 7.3 Profile Fields

| Field | Source |
|---|---|
| **Email** | From your Google account (read-only) |
| **Name** | From your Google account (editable) |
| **Phone** | Manually entered (editable) |

---

## 8. Booking Limits

| Rule | Limit |
|---|---|
| Maximum bookings per user per month | 7 |
| Maximum look-ahead from current month | 2 months |
| Slots per weekday | 1 (Full day) |
| Slots per weekend day | 2 (AM, PM) |

---

## 9. Troubleshooting

### 9.1 Common Errors

| Error | Cause | Solution |
|---|---|---|
| *"Sign in to view and manage bookings"* | Not signed in | Click "Sign in with Google" |
| *"Failed to save booking"* | Server error or user not found | Check your email is correct and try again |
| *"A booking with this email already exists..."* | Duplicate slot | Choose a different date or slot |
| *"Maximum of 7 bookings per month reached"* | Monthly limit hit | Wait until next month or cancel an existing booking |
| *"User not found"* | Email doesn't match any user | Sign in with that email first |

### 9.2 Page Not Loading

- Refresh the page.
- Ensure you are signed in with Google.
- Check your internet connection.

### 9.3 Data Not Updating

- Try refreshing the page.
- Navigate away and back to the calendar.

---

*Last updated: July 2026*
