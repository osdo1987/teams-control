import { api } from './api';

export const attendanceService = {
  registerBulkAttendance: async (groupId, records) => {
    return await api(`/attendance/group/${groupId}/bulk`, {
      method: 'POST',
      body: JSON.stringify(records)
    });
  },

  getAthleteAttendance: async (athleteId) => {
    return await api(`/attendance/athlete/${athleteId}`);
  },

  getGroupAttendance: async (groupId) => {
    return await api(`/attendance/group/${groupId}`);
  },

  checkAttendanceTaken: async (groupId, date) => {
    return await api(`/attendance/group/${groupId}/check/${date}`);
  },

  getGroupStats: async (groupId, startDate = null, endDate = null) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const qs = params.toString();
    return await api(`/attendance/group/${groupId}/stats${qs ? '?' + qs : ''}`);
  },

  getGroupAttendanceRange: async (groupId, startDate, endDate) => {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    });
    return await api(`/attendance/group/${groupId}/range?${params.toString()}`);
  }
};