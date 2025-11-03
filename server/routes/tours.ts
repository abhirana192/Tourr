import { RequestHandler } from "express";
import { db } from "../database";

export const getTours: RequestHandler = (req, res) => {
  try {
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

    res.json(tours);
  } catch (error) {
    console.error("Error fetching tours:", error);
    res.status(500).json({ error: "Failed to fetch tours" });
  }
};

export const createTour: RequestHandler = (req, res) => {
  try {
    const tour = req.body;
    const newTour = db.addTour({
      ...tour,
      start_date: tour.start_date,
    });
    res.status(201).json(newTour);
  } catch (error) {
    console.error("Error creating tour:", error);
    res.status(500).json({ error: "Failed to create tour" });
  }
};

export const updateTour: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = db.updateTour(id, {
      ...updates,
      start_date: updates.start_date,
    });

    if (!updated) {
      res.status(404).json({ error: "Tour not found" });
      return;
    }

    res.json(updated);
  } catch (error) {
    console.error("Error updating tour:", error);
    res.status(500).json({ error: "Failed to update tour" });
  }
};

export const deleteTour: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const success = db.deleteTour(id);

    if (!success) {
      res.status(404).json({ error: "Tour not found" });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting tour:", error);
    res.status(500).json({ error: "Failed to delete tour" });
  }
};
