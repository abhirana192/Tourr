import { RequestHandler } from "express";
import { assignmentDb } from "../supabase-db";

export const getAssignments: RequestHandler = async (req, res) => {
  try {
    const assignments = await assignmentDb.getAssignments();
    res.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
};

export const saveAssignment: RequestHandler = async (req, res) => {
  try {
    const {
      assignmentType,
      assignmentKey,
      activityDate,
      van,
      employees,
    } = req.body;

    if (!assignmentType || !assignmentKey || !activityDate) {
      res.status(400).json({
        error: "Missing required fields: assignmentType, assignmentKey, activityDate",
      });
      return;
    }

    const assignment = await assignmentDb.saveAssignment(
      assignmentType,
      assignmentKey,
      activityDate,
      van || "",
      employees || ""
    );

    res.json(assignment);
  } catch (error) {
    console.error("Error saving assignment:", error);
    res.status(500).json({ error: "Failed to save assignment" });
  }
};

export const deleteAssignment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: "Missing assignment ID" });
      return;
    }

    const success = await assignmentDb.deleteAssignment(id);

    if (!success) {
      res.status(404).json({ error: "Assignment not found" });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    res.status(500).json({ error: "Failed to delete assignment" });
  }
};
