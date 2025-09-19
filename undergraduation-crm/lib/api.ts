export async function createStudent(student: {
  name: string;
  email: string;
  country: string;
  status: string;
}) {
  const res = await fetch("/api/students", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(student),
  });

  if (!res.ok) {
    throw new Error("Failed to create student");
  }

  return await res.json();
}

export async function updateStudentApi(id: string, updates: Partial<any>) {
  const res = await fetch(`/api/students/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update student");
  return res.json();
}

export async function deleteStudentApi(id: string) {
  const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete student");
  return true;
}
