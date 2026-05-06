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
  }
};
