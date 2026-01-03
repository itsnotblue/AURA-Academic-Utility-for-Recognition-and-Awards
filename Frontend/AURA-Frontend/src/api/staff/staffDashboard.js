import { authAPI } from "../auth.js";

export async function fetchStaffDashboard() {
  try {
    const response = await authAPI.apiRequest("/staff/dashboard");
    if (response.success) {
      return response.data;
    }

    throw new Error(response.error || "Failed to retrieve dashboard data");
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw error;
  }
}
