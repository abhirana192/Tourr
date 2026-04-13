export interface ActivityAssignment {
  id: string;
  assignment_type: "arrival" | "departure" | "activity";
  assignment_key: string;
  activity_date: string;
  van: string;
  employees: string;
  created_at: string;
  updated_at: string;
}

// In-memory assignments storage
let assignments: Map<string, ActivityAssignment> = new Map();

export const inMemoryAssignmentsDb = {
  async getAssignments(): Promise<ActivityAssignment[]> {
    return Array.from(assignments.values()).sort((a, b) => {
      const dateA = new Date(a.activity_date).getTime();
      const dateB = new Date(b.activity_date).getTime();
      return dateA - dateB;
    });
  },

  async getAssignmentByKey(
    assignmentType: string,
    assignmentKey: string,
    activityDate: string
  ): Promise<ActivityAssignment | null> {
    for (const assignment of assignments.values()) {
      if (
        assignment.assignment_type === assignmentType &&
        assignment.assignment_key === assignmentKey &&
        assignment.activity_date === activityDate
      ) {
        return assignment;
      }
    }
    return null;
  },

  async saveAssignment(
    assignmentType: "arrival" | "departure" | "activity",
    assignmentKey: string,
    activityDate: string,
    van: string,
    employees: string
  ): Promise<ActivityAssignment> {
    const existing = await this.getAssignmentByKey(assignmentType, assignmentKey, activityDate);

    if (existing) {
      // Update existing
      const updated: ActivityAssignment = {
        ...existing,
        van,
        employees,
        updated_at: new Date().toISOString(),
      };
      assignments.set(existing.id, updated);
      console.log(`[InMemoryAssignmentsDB] Updated assignment: ${existing.id}`);
      return updated;
    } else {
      // Create new
      const id = `assignment-${Date.now()}`;
      const newAssignment: ActivityAssignment = {
        id,
        assignment_type: assignmentType,
        assignment_key: assignmentKey,
        activity_date: activityDate,
        van,
        employees,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      assignments.set(id, newAssignment);
      console.log(`[InMemoryAssignmentsDB] Created assignment: ${id}`);
      return newAssignment;
    }
  },

  async deleteAssignment(id: string): Promise<boolean> {
    const deleted = assignments.delete(id);
    if (deleted) {
      console.log(`[InMemoryAssignmentsDB] Deleted assignment: ${id}`);
    }
    return deleted;
  },
};
