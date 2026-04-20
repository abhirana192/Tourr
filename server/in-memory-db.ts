import crypto from "crypto";

export interface StaffMember {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "admin" | "staff";
  password_hash?: string;
  availability_status?: string;
  created_at: string;
}

// In-memory staff storage
let staffMembers: Map<string, StaffMember> = new Map();

// Initialize with default admin user
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "salt").digest("hex");
}

export function initializeInMemoryDb() {
  // Create default admin user if it doesn't exist
  const adminId = "admin-default";

  // Check if admin already exists
  if (staffMembers.has(adminId)) {
    console.log("[InMemoryDB] Admin user already exists, skipping initialization");
    return;
  }

  const adminHash = hashPassword("admin123");

  staffMembers.set(adminId, {
    id: adminId,
    email: "admin@tourmanager.com",
    first_name: "Admin",
    last_name: "User",
    role: "admin",
    password_hash: adminHash,
    availability_status: "available",
    created_at: new Date().toISOString(),
  });

  console.log("[InMemoryDB] Initialized with default admin user");
}

export const inMemoryStaffDb = {
  async getAllStaff(): Promise<StaffMember[]> {
    return Array.from(staffMembers.values());
  },

  async getStaffById(id: string): Promise<StaffMember | null> {
    return staffMembers.get(id) || null;
  },

  async getStaffByEmail(email: string): Promise<StaffMember | null> {
    for (const staff of staffMembers.values()) {
      if (staff.email === email) {
        return staff;
      }
    }
    return null;
  },

  async getStaffByName(firstName: string): Promise<StaffMember | null> {
    const lowerName = firstName.toLowerCase();
    for (const staff of staffMembers.values()) {
      if (staff.first_name.toLowerCase() === lowerName) {
        return staff;
      }
    }
    return null;
  },

  async createStaff(staff: Omit<StaffMember, "id" | "created_at"> & { id?: string }): Promise<StaffMember> {
    const id = staff.id || `staff-${Date.now()}`;
    const newStaff: StaffMember = {
      ...staff,
      id,
      created_at: new Date().toISOString(),
    };
    staffMembers.set(id, newStaff);
    console.log(`[InMemoryDB] Created staff member: ${newStaff.first_name}`);
    return newStaff;
  },

  async updateStaff(id: string, updates: Partial<StaffMember>): Promise<StaffMember | null> {
    const existing = staffMembers.get(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...updates };
    staffMembers.set(id, updated);
    console.log(`[InMemoryDB] Updated staff member: ${id}`);
    return updated;
  },

  async deleteStaff(id: string): Promise<boolean> {
    const deleted = staffMembers.delete(id);
    if (deleted) {
      console.log(`[InMemoryDB] Deleted staff member: ${id}`);
    }
    return deleted;
  },
};
