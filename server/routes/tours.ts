import { RequestHandler } from "express";
import { db } from "../database";
import { sendNotificationEmail, EmailNotification } from "../email";
import { getSessionFromRequest } from "./auth";

export const getTours: RequestHandler = (req, res) => {
  try {
    console.log("[getTours] Request received with query:", req.query);
    const dateFrom = (req.query.dateFrom as string) || "";
    const dateTo = (req.query.dateTo as string) || "";
    const invoice = (req.query.invoice as string) || "";
    const name = (req.query.name as string) || "";

    const tours = db.searchTours(
      dateFrom || undefined,
      dateTo || undefined,
      invoice || undefined,
      name || undefined
    );

    console.log(`[getTours] Returning ${tours.length} tours`);
    res.json(tours);
  } catch (error) {
    console.error("Error fetching tours:", error);
    res.status(500).json({ error: "Failed to fetch tours" });
  }
};

export const createTour: RequestHandler = async (req, res) => {
  try {
    const currentUser = getSessionFromRequest(req);
    const tour = req.body;
    const newTour = db.addTour({
      ...tour,
      start_date: tour.start_date,
    });

    // Send notification email if user is authenticated
    let emailResult = null;
    if (currentUser) {
      const changes: any = {};
      Object.entries(tour).forEach(([key, value]) => {
        changes[key] = { new: value };
      });

      const notification: EmailNotification = {
        action: "create",
        type: "tour",
        changes,
        changedBy: {
          id: currentUser.userId,
          name: currentUser.name,
          email: currentUser.email,
        },
        recordId: newTour.id,
        recordName: tour.name || tour.invoice,
        timestamp: new Date().toISOString(),
      };
      emailResult = await sendNotificationEmail(notification);
    }

    res.status(201).json({ ...newTour, emailSent: emailResult });
  } catch (error) {
    console.error("Error creating tour:", error);
    res.status(500).json({ error: "Failed to create tour" });
  }
};

export const updateTour: RequestHandler = async (req, res) => {
  try {
    const currentUser = getSessionFromRequest(req);
    const { id } = req.params;
    const updates = req.body;

    // Get the old tour data
    const oldTour = db.getTourById(id);
    if (!oldTour) {
      res.status(404).json({ error: "Tour not found" });
      return;
    }

    const updated = db.updateTour(id, {
      ...updates,
      start_date: updates.start_date,
    });

    if (!updated) {
      res.status(404).json({ error: "Tour not found" });
      return;
    }

    // Send notification email if user is authenticated
    let emailResult = null;
    if (currentUser) {
      const changes: any = {};
      Object.entries(updates).forEach(([key, value]) => {
        const oldValue = (oldTour as any)[key];
        if (oldValue !== value) {
          changes[key] = { old: oldValue, new: value };
        }
      });

      if (Object.keys(changes).length > 0) {
        const notification: EmailNotification = {
          action: "update",
          type: "tour",
          changes,
          changedBy: {
            id: currentUser.userId,
            name: currentUser.name,
            email: currentUser.email,
          },
          recordId: oldTour.id,
          recordName: oldTour.name || oldTour.invoice,
          timestamp: new Date().toISOString(),
        };
        emailResult = await sendNotificationEmail(notification);
      }
    }

    res.json({ ...updated, emailSent: emailResult });
  } catch (error) {
    console.error("Error updating tour:", error);
    res.status(500).json({ error: "Failed to update tour" });
  }
};

export const deleteTour: RequestHandler = async (req, res) => {
  try {
    const currentUser = getSessionFromRequest(req);
    const { id } = req.params;

    // Get the tour data before deletion
    const tour = db.getTourById(id);
    if (!tour) {
      res.status(404).json({ error: "Tour not found" });
      return;
    }

    const success = db.deleteTour(id);

    if (!success) {
      res.status(404).json({ error: "Tour not found" });
      return;
    }

    // Send notification email if user is authenticated
    let emailResult = null;
    if (currentUser) {
      const changes: any = {};
      Object.entries(tour).forEach(([key, value]) => {
        if (key !== "id" && key !== "activity_schedule") {
          changes[key] = { old: value };
        }
      });

      const notification: EmailNotification = {
        action: "delete",
        type: "tour",
        changes,
        changedBy: {
          id: currentUser.userId,
          name: currentUser.name,
          email: currentUser.email,
        },
        recordId: tour.id,
        recordName: tour.name || tour.invoice,
        timestamp: new Date().toISOString(),
      };
      emailResult = await sendNotificationEmail(notification);
    }

    res.json({ success: true, emailSent: emailResult });
  } catch (error) {
    console.error("Error deleting tour:", error);
    res.status(500).json({ error: "Failed to delete tour" });
  }
};

function analyzeScheduleChanges(oldScheduleJson: string | null, newSchedule: any): { [key: string]: { old: string; new: string } } {
  const changes: { [key: string]: { old: string; new: string } } = {};

  try {
    const oldSchedule = oldScheduleJson ? JSON.parse(oldScheduleJson) : {};

    for (const dayIndex in newSchedule) {
      const dayNum = parseInt(dayIndex);
      const oldDay = oldSchedule[dayNum] || { plannedActivities: [], arrivalActivities: [], hotelActivities: [], note: "" };
      const newDay = newSchedule[dayNum];

      if (!newDay) continue;

      // Check for activity changes
      const dayLabel = dayNum === 0 ? "Arrival Day" : dayNum === 1 ? "1st Day" : dayNum === 2 ? "2nd Day" : dayNum === 3 ? "3rd Day" : `Day ${dayNum}`;

      // Compare planned activities
      const oldPlanned = (oldDay.plannedActivities || []).map((a: any) => a.name).join(", ") || "None";
      const newPlanned = (newDay.plannedActivities || []).map((a: any) => a.name).join(", ") || "None";
      if (oldPlanned !== newPlanned) {
        changes[`${dayLabel} - Planned Activities`] = { old: oldPlanned, new: newPlanned };
      }

      // Compare arrival activities
      const oldArrival = (oldDay.arrivalActivities || []).map((a: any) => a.name).join(", ") || "None";
      const newArrival = (newDay.arrivalActivities || []).map((a: any) => a.name).join(", ") || "None";
      if (oldArrival !== newArrival) {
        changes[`${dayLabel} - Arrival Activities`] = { old: oldArrival, new: newArrival };
      }

      // Compare hotel activities
      const oldHotel = (oldDay.hotelActivities || []).map((a: any) => a.name).join(", ") || "None";
      const newHotel = (newDay.hotelActivities || []).map((a: any) => a.name).join(", ") || "None";
      if (oldHotel !== newHotel) {
        changes[`${dayLabel} - Hotel Activities`] = { old: oldHotel, new: newHotel };
      }

      // Compare notes
      const oldNote = oldDay.note || "";
      const newNote = newDay.note || "";
      if (oldNote !== newNote) {
        changes[`${dayLabel} - Note`] = { old: oldNote || "(empty)", new: newNote || "(empty)" };
      }
    }

    // If no changes detected, return a generic change
    if (Object.keys(changes).length === 0) {
      changes["schedule"] = { old: "Previous schedule", new: "Schedule updated" };
    }

    return changes;
  } catch {
    return {
      schedule: { old: "Previous schedule", new: "Schedule updated" },
    };
  }
}

export const saveTourSchedule: RequestHandler = async (req, res) => {
  try {
    const currentUser = getSessionFromRequest(req);
    const { id } = req.params;
    const schedule = req.body;

    if (!id || !schedule) {
      res.status(400).json({ error: "Missing tour ID or schedule data" });
      return;
    }

    const tour = db.getTourById(id);
    if (!tour) {
      res.status(404).json({ error: "Tour not found" });
      return;
    }

    const scheduleJson = JSON.stringify(schedule);
    const oldSchedule = tour.activity_schedule;

    const updated = db.updateTour(id, {
      ...tour,
      activity_schedule: scheduleJson,
    });

    if (!updated) {
      res.status(404).json({ error: "Failed to save schedule" });
      return;
    }

    // Send notification email if user is authenticated
    let emailResult = null;
    if (currentUser && oldSchedule !== scheduleJson) {
      const changes = analyzeScheduleChanges(oldSchedule, schedule);

      const notification: EmailNotification = {
        action: "update",
        type: "arrival",
        changes,
        changedBy: {
          id: currentUser.userId,
          name: currentUser.name,
          email: currentUser.email,
        },
        recordId: tour.id,
        recordName: `${tour.name} (Schedule Update)`,
        timestamp: new Date().toISOString(),
      };
      emailResult = await sendNotificationEmail(notification);
    }

    res.json({ success: true, data: updated, emailSent: emailResult });
  } catch (error) {
    console.error("Error saving tour schedule:", error);
    res.status(500).json({ error: "Failed to save schedule" });
  }
};

export const getTourSchedule: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: "Missing tour ID" });
      return;
    }

    const tour = db.getTourById(id);
    if (!tour) {
      res.status(404).json({ error: "Tour not found" });
      return;
    }

    if (!tour.activity_schedule) {
      res.status(404).json({ error: "No schedule found" });
      return;
    }

    try {
      const schedule = JSON.parse(tour.activity_schedule);
      res.json({ schedule });
    } catch {
      res.status(400).json({ error: "Invalid schedule data" });
    }
  } catch (error) {
    console.error("Error fetching tour schedule:", error);
    res.status(500).json({ error: "Failed to fetch schedule" });
  }
};
