import { RequestHandler } from "express";
import { db, Tour } from "../database";

export const getTours: RequestHandler = (req, res) => {
  const tours = db.getTours();
  const search = (req.query.search as string)?.toLowerCase() || "";

  const filtered = search
    ? tours.filter(
        (tour) =>
          tour.date.toLowerCase().includes(search) ||
          tour.invoice.toLowerCase().includes(search) ||
          tour.name.toLowerCase().includes(search)
      )
    : tours;

  res.json(filtered);
};

export const createTour: RequestHandler = (req, res) => {
  const tour = req.body;
  const newTour = db.addTour(tour);
  res.status(201).json(newTour);
};

export const updateTour: RequestHandler = (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const tour = db.updateTour(id, updates);

  if (!tour) {
    res.status(404).json({ error: "Tour not found" });
    return;
  }

  res.json(tour);
};

export const deleteTour: RequestHandler = (req, res) => {
  const { id } = req.params;
  const success = db.deleteTour(id);

  if (!success) {
    res.status(404).json({ error: "Tour not found" });
    return;
  }

  res.json({ success: true });
};
