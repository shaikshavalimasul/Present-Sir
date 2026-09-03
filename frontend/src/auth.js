export const saveTeacher = (d) => localStorage.setItem("teacher", JSON.stringify(d));
export const getTeacher = () => { try { return JSON.parse(localStorage.getItem("teacher")); } catch { return null; } };
export const clearTeacher = () => localStorage.removeItem("teacher");

export const saveStudent = (d) => localStorage.setItem("student", JSON.stringify(d));
export const getStudent = () => { try { return JSON.parse(localStorage.getItem("student")); } catch { return null; } };
export const clearStudent = () => localStorage.removeItem("student");
