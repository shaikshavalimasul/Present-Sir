// Token stored in localStorage — never changes, survives sessions
const TOKEN_KEY = "student_token";

export const saveTeacher = (d) => localStorage.setItem("teacher", JSON.stringify(d));
export const getTeacher = () => { try { return JSON.parse(localStorage.getItem("teacher")); } catch { return null; } };
export const clearTeacher = () => localStorage.removeItem("teacher");

export const saveStudent = (d) => localStorage.setItem("student", JSON.stringify(d));
export const getStudent = () => { try { return JSON.parse(localStorage.getItem("student")); } catch { return null; } };
export const clearStudent = () => localStorage.removeItem("student");

export const saveToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const getToken = () => localStorage.getItem(TOKEN_KEY) || "";
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);
