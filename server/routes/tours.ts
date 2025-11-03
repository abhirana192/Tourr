import { RequestHandler } from "express";
import { db, Tour } from "../database";

export const getTours: RequestHandler = (req, res) => {
  const tours = db.getTours();
  const searchDateFrom = (req.query.dateFrom as string) || "";
  const searchDateTo = (req.query.dateTo as string) || "";
  const searchInvoice = (req.query.invoice as string)?.toLowerCase() || "";
  const searchName = (req.query.name as string)?.toLowerCase() || "";

  const filtered = tours.filter((tour) => {
    const dateFromMatch = searchDateFrom ? tour.date >= searchDateFrom : true;
    const dateToMatch = searchDateTo ? tour.date <= searchDateTo : true;
    const invoiceMatch = searchInvoice ? tour.invoice.toLowerCase().includes(searchInvoice) : true;
    const nameMatch = searchName ? tour.name.toLowerCase().includes(searchName) : true;

    return dateFromMatch && dateToMatch && invoiceMatch && nameMatch;
  });

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
